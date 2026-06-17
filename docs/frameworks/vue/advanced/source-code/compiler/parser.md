# 解析阶段（Parser）

解析阶段是 Vue 3 模板编译的第一环，负责将 HTML 模板字符串解析为一棵抽象语法树（AST),它采用**有限状态机**与**递归下降**相结合的设计，能够高效地将字符流转换为结构化的 AST，同时具备错误容错和源码位置追踪能力。

## 1. 解析器概述

- **入口函数**：`baseParse(template, options)`
- **核心任务**：将模板字符串解析为 `RootNode` AST
- **技术特点**：
  - 有限状态机（通过字符模式判断状态转移）
  - 递归下降（`parseChildren` 与 `parseElement` 相互调用）
  - 祖先栈（`ancestors`）处理嵌套结构
  - 即时构造 AST 节点（无独立 Token 流）
  - 完善的错误恢复与源码位置记录

## 2. 核心数据结构

### 2.1 `ParserContext`：解析器上下文

解析过程的所有状态都保存在 `ParserContext` 对象中：

:::code-group

```typescript [parse.ts]
interface ParserContext {
  source: string // 剩余未解析的模板字符串
  options: Required<ParserOptions>
  offset: number // 已解析字符数
  line: number // 当前行号
  column: number // 当前列号
}
```

:::

### 2.2 AST 节点类型

所有节点都继承自基础 `Node` 接口，包含 `type` 和 `loc`。常用的节点类型：

:::code-group

```typescript [parse.ts]
export const enum NodeTypes {
  ROOT, // 根节点
  ELEMENT, // 元素节点
  TEXT, // 文本节点
  COMMENT, // 注释节点
  SIMPLE_EXPRESSION, // 简单表达式（插值内的内容）
  INTERPOLATION, // 插值节点
  ATTRIBUTE, // 静态属性
  DIRECTIVE, // 指令（v-bind / v-on 等）
  // ...
}
```

:::

## 3. `baseParse`函数入口

:::code-group

```typescript [parse.ts]
//解析器入口
export function baseParse(
  content: string,
  options: ParserOptions = {},
): RootNode {
  // 1. 创建解析上下文
  const context = createParserContext(content, options)

  // 2. 获取光标开始的位置信息
  const start = getCursor(context)

  // 3. 启动状态机，解析所有的子节点
  // 传入 ancestors 栈（初始为空数组 []）
  const children = parseChildren(context, TextModes.DATA, [])

  // 4. 返回根节点 (RootNode)
  return {
    type: NodeTypes.ROOT,
    children,
    loc: getSelection(context, start),
  }
}
```

:::

### 3.1 创建解析器上下文

:::code-group

```typescript [parse.ts]
//创建解析器上下文
function createParserContext(content: string): ParserContext {
  // 合成 context 上下文对象
  return {
    options,
    column: 1,
    line: 1,
    offset: 0,
    source: content,
  }
}
```

:::

### 3.2 获取光标位置信息

:::code-group

```typescript [parse.ts]
// 位置信息的标准接口
export interface Position {
  offset: number // 绝对偏移量 (从字符串开头计算的字符数)
  line: number // 行号
  column: number // 列号
}

// 获取当前游标位置
export function getCursor(context: ParserContext): Position {
  const { column, line, offset } = context
  return { column, line, offset } //// 返回一个新对象，防止后续被污染
}
```

:::

### 3.3 `parseChildren`:核心递归函数

`parseChildren` 是解析器的**主循环**，也是状态机的实现核心。

:::code-group

```typescript [parse.ts]
function parseChildren(
  context: ParserContext,
  ancestors: ElementNode[],
): TemplateChildNode[] {
  const nodes: TemplateChildNode[] = []
  while (!isEnd(context, ancestors)) {
    const s = context.source
    let node: TemplateChildNode | undefined

    // 状态机分支：根据字符模式决定进入哪种解析状态
    if (startsWith(s, '{{')) {
      node = parseInterpolation(context) // → 插值状态
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors) // → 元素状态
      } else if (startsWith(s, '<!--')) {
        node = parseComment(context) // → 注释状态
      }
    }
    // 如果没有命中任何特殊模式，则进入文本状态
    if (!node) {
      node = parseText(context)
    }
    nodes.push(node)
  }
  return nodes
}
```

:::

### 3.4 获取位置范围

:::code-group

```typescript [parse.ts]
// 完整的位置范围：包含起点、终点和这段范围内的原始代码
export interface SourceLocation {
  start: Position
  end: Position
  source: string
}

// 根据开始游标、结束游标，生成完整的位置范围 (Location)
export function getSelection(
  context: ParserContext,
  start: Position,
  end?: Position,
): SourceLocation {
  // 如果没有传入 end，就默认当前 context 的位置就是 end
  end = end || getCursor(context)

  return {
    start,
    end,
    // 从原始完整字符串中，截取出这段 AST 节点对应的确切代码文本
    source: context.originalSource.slice(start.offset, end.offset),
  }
}
```

:::

## 4. 各解析函数实现细节

### 4.1 `parseElement`: 解析元素节点

:::code-group

```typescript [parse.ts]
//Element 标签类型
export const enum ElementTypes {
  ELEMENT, //element，例如：<div>
  COMPONENT, //组件
  SLOT, //插槽
  TEMPLATE, //模板
}
//解析元素节点
function parseElement(
  context: ParserContext,
  ancestors: ElementNode[],
): ElementNode | ComponentNode {
  // 解析开始标签
  const element = parseTag(context, TagType.Start)
  // 将当前元素压入祖先栈，以便子节点解析时知道父上下文
  ancestors.push(element)
  // 递归解析子节点
  element.children = parseChildren(context, ancestors)
  // 子节点解析完毕，弹出祖先栈
  ancestors.pop()
  // 解析闭合标签（验证标签名一致性）
  if (startsWith(context.source, `</${element.tag}`)) {
    parseTag(context, TagType.End)
  } else {
    // 缺少闭合标签的错误处理（开发模式下发出警告）
    emitError(context, ErrorCodes.X_MISSING_END_TAG, 0, element.loc.start)
  }
  return element
}
```

:::

#### 4.1.1 `parseTag`: 解析单个标签

:::code-group

```typescript [parse.ts]
//标签类型，包含：开始和结束
const enum TagType {
  Start,
  End,
}

/// 核心函数：解析标签
function parseTag(context, type: TagType) {
  // 1. 正则匹配：提取标签名 (例如从 "<div..." 或 "</div..." 中提取 "div")
  // 正则解释：^ 匹配开头，<\/? 匹配 < 或 </，然后捕获一段连续的字母数字作为标签名
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)

  // 提取出来的标签名
  const tag = match[1]

  // 2. 消费字符串：让解析器的游标前进，吃掉匹配到的 "<div" 或 "</div"
  advanceBy(context, match[0].length)

  // 3. 消费空白字符：吃掉标签名和属性之间的空格 (如 <div  id="app">)
  advanceSpaces(context)

  // 4. 解析属性：实际上这里会调用 parseAttributes(context) 提取 id="app"
  let props: (AttributeNode | DirectiveNode)[] = []
  if (type === TagType.Start) {
    props = parseAttributes(context, tag)
  }

  // 5. 判断是否是自闭合标签 (如 <img />)
  let isSelfClosing = false
  if (startsWith(context.source, '/>')) {
    isSelfClosing = true
    // 吃掉 "/>"
    advanceBy(context, 2)
  } else if (startsWith(context.source, '>')) {
    // 吃掉 ">"
    advanceBy(context, 1)
  }

  // 6. 如果当前解析的是结束标签 (</div >)，不需要创建 AST 节点，直接返回
  if (type === TagType.End) {
    return
  }

  // 7. 如果是开始标签，构建并返回初步的 AST 元素节点
  return {
    type: 1, // NodeTypes.ELEMENT 的枚举值
    tag,
    isSelfClosing,
    props,
    children: [], // 子节点数组此时为空，等待外部 parseChildren 递归填充
  }
}

// 消费空白字符
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}
```

:::

#### 4.1.2 `parseAttributes`: 循环解析全部属性

:::code-group

```typescript [parse.ts]
// 入口函数：循环解析所有的属性
function parseAttributes(context, type: TagType) {
  const props = []

  // 只要字符串没被吃完，且下一个字符不是标签结束符 '>' 或 '/>'，就一直解析
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    // 1. 每次循环前，先吃掉属性之间的空格 (例如 <div  id="app"> 中的多余空格)
    advanceSpaces(context)

    // 2. 调用核心的 parseAttribute 解析单个属性
    const attr = parseAttribute(context)

    // 3. 只有在开始标签时才记录属性（结束标签如 </div class="x"> 里的属性是非法的）
    if (type === TagType.Start) {
      props.push(attr)
    }
  }

  return props
}
```

:::

#### 4.1.3 `parseAttribute`: 解析单个属性/指令

:::code-group

```typescript [parse.ts]
// 核心函数：解析单个属性/指令
function parseAttribute(context) {
  // --------- 阶段一：解析属性名 ---------
  // 正则含义：匹配一个非空格、非斜杠、非等号、非尖括号开头的连续字符串
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  const name = match[0]

  // 游标前进，吃掉属性名
  advanceBy(context, name.length)

  // --------- 阶段二：解析等号与值 ---------
  let value = undefined

  // 窥探紧接着的是不是等号 '='
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    // 此时匹配到了 `=`，可能还有前置空格（如 v-if = "ok"）
    advanceSpaces(context) // 吃掉等号前的空格
    advanceBy(context, 1) // 吃掉 '='
    advanceSpaces(context) // 吃掉等号后的空格

    // 获取值的包裹引号
    const quote = context.source[0]
    const isQuoted = quote === '"' || quote === "'"

    if (isQuoted) {
      // 场景 A：带引号的值 (如 class="wrap")
      advanceBy(context, 1) // 吃掉开头的引号

      const endQuoteIndex = context.source.indexOf(quote)
      const content = context.source.slice(0, endQuoteIndex) // 截取引号内部的值

      advanceBy(context, content.length + 1) // 一口气吃掉内容和结尾的闭合引号
      value = { type: 2, content } // 包装为纯文本节点
    } else {
      // 场景 B：不带引号的值 (如 class=wrap，合法但少见)
      // 截取到下一个空格、斜杠或尖括号前
      const valueMatch = /^[^\t\r\n\f />]+/.exec(context.source)
      const content = valueMatch[0]

      advanceBy(context, content.length)
      value = { type: 2, content }
    }
  }

  // --------- 阶段三：归类（普通属性 vs Vue指令） ---------
  // 如果属性名是以 v- 开头，或者是 : (v-bind), @ (v-on), # (v-slot)
  if (/^(v-[A-Za-z0-9-]|:|@|#)/.test(name)) {
    // 真实源码这里会极其复杂地解析出：指令名、参数、修饰符
    // 这里简化为返回指令 AST 节点 (NodeTypes.DIRECTIVE = 7)
    return {
      type: 7,
      name: name,
      exp: value ? { type: 4, content: value.content } : undefined,
    }
  }

  // 否则，返回普通属性 AST 节点 (NodeTypes.ATTRIBUTE = 6)
  return {
    type: 6,
    name,
    value,
  }
}
```

:::

### 4.2 `parseInterpolation`: 解析插值表达式

:::code-group

```typescript [parse.ts]
function parseInterpolation(
  context: ParserContext,
  mode: TextModes,
): InterpolationNode | undefined {
  // 1. 提取定界符 (默认是 ['{{', '}}'])
  const [open, close] = ['{{', '}}']

  // 2. 寻找结束定界符 '}}'
  const closeIndex = context.source.indexOf(close, open.length)
  if (closeIndex === -1) {
    // 真实源码会触发一个详细的编译错误
    emitError(context, ErrorCodes.X_MISSING_INTERPOLATION_END)
    return undefined
  }

  // 3. 拍下整个插值节点（INTERPOLATION）开始的位置快照
  const start = getCursor(context)

  // 4. 游标前进，吃掉 '{{'
  advanceBy(context, open.length)

  // 5. 拍下内部表达式（SIMPLE_EXPRESSION）的初始快照（此时游标刚好在 '{{' 后面）
  const innerStart = getCursor(context)
  const innerEnd = getCursor(context)

  // 6. 计算内部原始内容长度
  const rawContentLength = closeIndex - open.length

  // 7. 提取原始内容 (此时包含前后的空格)
  const rawContent = context.source.slice(0, rawContentLength)

  // 8. 解析文本数据并让全局游标吃掉内部内容
  const preTrimContent = parseTextData(context, rawContentLength)

  // 9. 去除首尾空格，拿到真正的变量名
  const content = preTrimContent.trim()

  // 计算内容前面的空格长度
  // 比如 `{{  msg  }}`，preTrimContent 是 `  msg  `，content 是 `msg`，startOffset 就是 2
  const startOffset = preTrimContent.indexOf(content)

  if (startOffset > 0) {
    // 修正 innerStart 快照：把内部节点的起点向右推移 2 个空格的距离
    advancePositionWithMutation(innerStart, rawContent, startOffset)
  }

  // 计算内容后面的真正结束位置
  // 原长度 - (原长 - 去空格长 - 前置空格长) = 实际结束位置的偏移量
  const endOffset =
    rawContentLength - (preTrimContent.length - content.length - startOffset)

  // 修正 innerEnd 快照：把内部节点的终点对齐到变量的最后一个字母
  advancePositionWithMutation(innerEnd, rawContent, endOffset)

  // 10. 游标再次前进，吃掉结束定界符 '}}'
  advanceBy(context, close.length)

  // 11. 构建并返回最终的 AST 节点
  return {
    type: NodeTypes.INTERPOLATION, // 5
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION, // 4
      isStatic: false,
      content, // 纯净的 'msg'
      // ✨ 内部节点的 loc 只包裹 'msg'
      loc: getSelection(context, innerStart, innerEnd),
    },
    // ✨ 外部节点的 loc 包裹 '{{  msg  }}'
    loc: getSelection(context, start),
  }
}
```

:::

### 4.3 `parseText`: 解析普通文本

:::code-group

```typescript [parse.ts]
function parseText(context: ParserContext, mode: TextModes): TextNode {
  // 1. 准备“探雷器”：文本什么时候结束？
  // 默认情况下，遇到 '<' (标签) 或者 '{{' (插值) 文本就结束了
  const endTokens = ['<', '{{']

  // 默认文本的结束位置是整个字符串的最后
  let endIndex = context.source.length

  // 2. 核心探测：寻找最近的边界
  for (let i = 0; i < endTokens.length; i++) {
    // 从索引 1 开始找，因为我们知道索引 0 肯定不是边界（否则一开始就进别的 parse 函数了）
    const index = context.source.indexOf(endTokens[i], 1)

    // 如果找到了边界，并且这个边界比之前找到的还要靠前，就更新 endIndex
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  // 3. 拍下起始游标快照
  const start = getCursor(context)

  // 4. 解析文本数据：提取内容并让游标吃掉这段字符串
  const content = parseTextData(context, endIndex, mode)

  // 5. 构建并返回文本 AST 节点
  return {
    type: 2, // NodeTypes.TEXT (纯文本节点枚举值)
    content,
    loc: getSelection(context, start),
  }
}
```

:::

### 4.4 `parseComment`: 解析注释

:::code-group

```typescript [parse.ts]
function parseComment(context: ParserContext): CommentNode {
  // 1. 拍下起始游标快照
  const start = getCursor(context)

  let content: string

  // 2. 匹配标准的 HTML 注释结束符 '-->'
  // 正则 /--!?>/ 的意思是：匹配 '-->'，同时也兼容一种少见的畸形闭合 '--!>'
  const match = /--!?>/.exec(context.source)

  if (match) {
    // 3. 如果找到了结束符
    // match.index 是结束符 '--' 开始的位置
    // 因为 '<!--' 长度为 4，所以截取从 4 到 match.index 的内容
    content = context.source.slice(4, match.index)

    // 4. 计算需要被吃掉的字符串总长度
    // 也就是 match.index (注释内容末尾位置) 加上匹配到的结束符长度 ('-->' 的长度是 3)
    const advanceLength = match.index + match[0].length

    // 5. 游标一口气跨过整个注释（包括 <!--、内容 和 -->）
    advanceBy(context, advanceLength)
  } else {
    // 6. 异常容错处理：如果一直到字符串结束都没找到 '-->'
    // 说明开发者写了 '<!--' 但是忘了闭合
    content = context.source.slice(4) // 把剩下的全当成注释内容
    advanceBy(context, context.source.length) // 吃掉剩下的所有字符串
    emitError(context, ErrorCodes.X_MISSING_COMMENT_END) // 抛出缺少闭合符的编译警告
  }

  // 7. 构建并返回注释 AST 节点
  return {
    type: 3, // NodeTypes.COMMENT (注释节点枚举值)
    content, // 提取出的注释文本
    loc: getSelection(context, start),
  }
}
```

:::

## 5. `isEnd`: 防死循环机制

`parseChildren` 的 `while` 循环依赖 `isEnd` 来判断是否应该停止当前层级的解析并向上返回。

:::code-group

```typescript [parse.ts]
// 判断当前解析是否应该结束
function isEnd(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[],
): boolean {
  const s = context.source
  // 1. 最基础的判断：如果字符串已经被吃光了，当然就结束了
  if (s.length === 0) {
    return true
  }
  // 2. 核心容错判断：检查是否遇到了闭合标签
  // 只有在解析普通 HTML 内容 (DATA) 或可包含实体的文本 (RCDATA) 时才做此检查
  if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
    // 如果当前剩余的字符串是以 '</' 开头的，说明遇到了一个闭合标签
    if (startsWith(s, '</')) {
      // ⚠️ 重点：从栈顶（倒序）往栈底遍历整个祖先节点栈
      for (let i = ancestors.length - 1; i >= 0; --i) {
        // 利用我们之前讲过的 startsWithEndTagOpen 去比对
        // 看看当前的闭合标签，是不是正好匹配栈里的某一个祖先标签
        if (startsWithEndTagOpen(s, ancestors[i].tag)) {
          return true
        }
      }
    }
  }
  // 如果上面都没命中，说明当前层级的子节点还没解析完，继续循环！
  return false
}
```

:::

## 6. 核心函数解析

### 6.1 `parseTextData`: 截取原始文本字符串

:::code-group

```typescript [parse.ts]
//从指定位置（length）获取给定长度的文本数据。
function parseTextData(context: ParserContext, length: number): string {
  // 获取指定的文本数据
  const rawText = context.source.slice(0, length)
  // 《继续》对模板进行解析处理
  advanceBy(context, length)
  // 返回获取到的文本
  return rawText
}
```

:::

### 6.2 `advanceBy`：字符串的消费

在解析过程中（无论是提取标签、属性还是文本），Vue 解析器底层都在疯狂地调用一个基础函数：`advanceBy`。它的作用是**消费字符串并推进游标位置**。

:::code-group

```typescript [parse.ts]
// 消费字符串
function advanceBy(context: ParserContext, numberOfCharacters: number) {
  // 1. 遍历被消费的字符，更新 line (行) 和 column (列)
  advancePositionWithMutation(context, context.source, numberOfCharacters)
  // 2. 截断已经解析完毕的字符串
  context.source = context.source.slice(numberOfCharacters)
}
```

:::

### 6.3 `advancePositionWithMutation`: 推进位置游标

:::code-group

```typescript [parse.ts]
export function advancePositionWithMutation(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length,
): Position {
  let linesCount = 0 // 统计遇到了几个换行符
  let lastNewLinePos = -1 // 记录最后一个换行符在字符串中的索引位置

  // 1. 遍历这段被吃掉的字符串
  for (let i = 0; i < numberOfCharacters; i++) {
    // 10 是换行符 '\n' 的 ASCII 码
    if (source.charCodeAt(i) === 10) {
      linesCount++
      lastNewLinePos = i
    }
  }

  // 2. 更新绝对偏移量 (不管有没有换行，偏移量直接加上吃掉的字符数)
  pos.offset += numberOfCharacters

  // 3. 更新行号
  pos.line += linesCount

  // 4. 更新列号 (最巧妙的一步)
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters // 如果没遇到换行，列号直接往后加
      : numberOfCharacters - lastNewLinePos // 如果遇到了换行，列号从换行符之后重新算起

  return pos
}
```

:::

### 6.4 `advanceSpaces`: 消费空白字符

:::code-group

```typescript [parse.ts]
// 消费空白字符
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}
```

:::

### 6.5 `startsWith`: 是否指定文本开头

:::code-group

```typescript [parse.ts]
//检查字符串 s 是否以 search 开头（兼容不提供 position 参数的情况）
export const startsWith = (
  s: string,
  search: string,
  position?: number,
): boolean => {
  return s.startsWith(search, position)
}
```

:::

### 6.6 `startsWithEndTagOpen`: 结束标签的边界防御

:::code-group

```typescript [parse.ts]
//判断当前剩余的字符串是否正好是一个匹配的闭合标签
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    // 1. 短路运算：必须以 '</' 开头
    startsWith(source, '</') &&
    // 2. 名称全等比对（忽略大小写）
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    // 3. 边界字符防御：防止 </div 匹配到 </divider>
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}
```

:::

## 7. 完整流程示例

### 7.1 基础代码示例

**输入模板:**

```js
<div v-if="ok" class="wrap">
  {' '}
  <span>hello</span> <p>{{ message }}</p>
</div>
```

**生成的 AST:**

```json
{
  "type": 1, // NodeTypes.ELEMENT (根节点 div)
  "tag": "div",
  "isSelfClosing": false,
  "props": [
    {
      "type": 7, // NodeTypes.DIRECTIVE (v-if 指令)
      "name": "if",
      "exp": {
        "type": 4, // NodeTypes.SIMPLE_EXPRESSION (表达式)
        "content": "ok",
        "isStatic": false,
        "loc": {
          "start": { "line": 1, "column": 12, "offset": 11 },
          "end": { "line": 1, "column": 14, "offset": 13 },
          "source": "ok"
        }
      },
      "loc": {
        "start": { "line": 1, "column": 6, "offset": 5 },
        "end": { "line": 1, "column": 15, "offset": 14 },
        "source": "v-if=\"ok\""
      }
    },
    {
      "type": 6, // NodeTypes.ATTRIBUTE (普通属性 class)
      "name": "class",
      "value": {
        "type": 2,
        "content": "wrap",
        "loc": {
          "start": { "line": 1, "column": 23, "offset": 22 },
          "end": { "line": 1, "column": 27, "offset": 26 },
          "source": "wrap"
        }
      },
      "loc": {
        "start": { "line": 1, "column": 16, "offset": 15 },
        "end": { "line": 1, "column": 29, "offset": 28 },
        "source": "class=\"wrap\""
      }
    }
  ],
  "children": [
    {
      "type": 2, // NodeTypes.TEXT (div 和 span 之间的空白字符)
      "content": " ",
      "loc": {
        "start": { "line": 1, "column": 29, "offset": 28 },
        "end": { "line": 1, "column": 30, "offset": 29 },
        "source": " "
      }
    },
    {
      "type": 1, // NodeTypes.ELEMENT (span 节点)
      "tag": "span",
      "isSelfClosing": false,
      "props": [],
      "children": [
        {
          "type": 2, // NodeTypes.TEXT (文本节点 'hello')
          "content": "hello",
          "loc": {
            "start": { "line": 1, "column": 36, "offset": 35 },
            "end": { "line": 1, "column": 41, "offset": 40 },
            "source": "hello"
          }
        }
      ],
      "loc": {
        "start": { "line": 1, "column": 30, "offset": 29 },
        "end": { "line": 1, "column": 48, "offset": 47 },
        "source": "<span>hello</span>"
      }
    },
    {
      "type": 2, // NodeTypes.TEXT (span 和 p 之间的空白字符)
      "content": " ",
      "loc": {
        "start": { "line": 1, "column": 48, "offset": 47 },
        "end": { "line": 1, "column": 49, "offset": 48 },
        "source": " "
      }
    },
    {
      "type": 1, // NodeTypes.ELEMENT (p 节点)
      "tag": "p",
      "isSelfClosing": false,
      "props": [],
      "children": [
        {
          "type": 5, // NodeTypes.INTERPOLATION (插值节点 {{ message }})
          "content": {
            "type": 4, // NodeTypes.SIMPLE_EXPRESSION
            "isStatic": false,
            "content": "message",
            "loc": {
              // 注意：内部表达式的 loc 只精准包裹 'message' 这 7 个字母，去除了前后的空格
              "start": { "line": 1, "column": 55, "offset": 54 },
              "end": { "line": 1, "column": 62, "offset": 61 },
              "source": "message"
            }
          },
          "loc": {
            // 外部插值节点的 loc 包裹了包括大括号在内的所有字符
            "start": { "line": 1, "column": 52, "offset": 51 },
            "end": { "line": 1, "column": 66, "offset": 65 },
            "source": "{{ message }}"
          }
        }
      ],
      "loc": {
        "start": { "line": 1, "column": 49, "offset": 48 },
        "end": { "line": 1, "column": 70, "offset": 69 },
        "source": "<p>{{ message }}</p>"
      }
    }
  ],
  "loc": {
    // 根节点包裹整个字符串
    "start": { "line": 1, "column": 1, "offset": 0 },
    "end": { "line": 1, "column": 76, "offset": 75 },
    "source": "<div v-if=\"ok\" class=\"wrap\"> <span>hello</span> <p>{{ message }}</p></div>"
  }
}
```

### 7.2 完整流程图

![Logo](/img/parseExample.png)

## 8. 总结

Vue 3 的解析器通过以下设计实现了高性能、可维护的模板解析：

- **有限状态机 + 递归下降**：以 `parseChildren` 循环为骨架，根据字符模式动态切换解析函数，自然实现状态转移。
- **祖先栈**：完美解决嵌套元素的上下文匹配问题，使递归结构正确无误。
- **即时 AST 构建**：没有独立的 Token 生成阶段，解析函数直接产出 AST 节点，减少内存与性能开销。
- **递归下降算法**：通过函数（`parseChildren` -> `parseElement` -> `parseChildren`）的互相调用自然形成树形结构。
- **生产级容错**：对常见模板错误进行优雅降级，保证开发过程中的可用性。
- **精确的位置信息**：为开发工具和错误提示提供强大的支撑。
