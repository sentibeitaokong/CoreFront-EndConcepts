# 模板解析器 (Parser)

Vue 3 的模板解析器（`Parser`）是编译器的第一步，负责将 HTML 模板字符串解析为一棵抽象语法树（AST),它采用**有限状态机**与**递归下降**相结合的设计，能够高效地将字符流转换为结构化的 AST，同时具备错误容错和源码位置追踪能力。

## 1. 解析器概述

- **入口函数**：`baseParse(template, options)`
- **核心任务**：将模板字符串解析为 `RootNode` AST
- **技术特点**：
  - 有限状态机（通过字符模式判断状态转移）
  - 递归下降（`parseChildren` 与 `parseElement` 相互调用）
  - 祖先栈（`ancestors`）处理嵌套结构
  - 即时构造 AST 节点（无独立 Token 流）
  - 完善的错误恢复与源码位置记录

## 2. 解析器的入口与上下文 (Context)

解析的起点是 `baseParse` 函数。在真正开始遍历字符串之前，Vue 会先创建一个“解析上下文（`ParserContext`）”。

这个上下文对象是贯穿整个解析过程的**全局状态机**，它记录了当前解析到了哪里。

:::code-group [parse.ts]

```typescript
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
//创建解析器上下文
function createParserContext(content: string): ParserContext {
  // 合成 context 上下文对象
  return {
    source: content,
  }
}

// 解析上下文的核心数据结构
export interface ParserContext {
  options: ParserOptions
  source: string // 当前还未解析的剩余模板字符串（极其重要）
  line: number // 当前所在行号
  column: number // 当前所在列号
  offset: number // 已经解析的字符总偏移量
}

//AST 节点类型
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

**核心设计：** Vue 并没有把整个字符串分割成数组来遍历，而是维护了一个 `context.source` 字符串。随着解析的推进，`source` 会不断地被从左向右**截断（消费）**，直到为空。

## 2. 核心引擎：`parseChildren` 状态机

`parseChildren` 是整个解析器的心脏。它是一个 `while` 循环，通过探测 `context.source` 前几个字符的特征，决定接下来调用哪个具体的解析函数。

```typescript
function parseChildren(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[],
): TemplateChildNode[] {
  const nodes: TemplateChildNode[] = []

  // 只要字符串没被消费完，且没有遇到闭合标签，就一直循环
  while (!isEnd(context, mode, ancestors)) {
    const s = context.source
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined

    // 状态机分支：判断当前字符串的首字符特征
    if (startsWith(s, context.options.delimiters[0])) {
      // 分支 1：如果以 '{{' 开头，解析插值表达式
      node = parseInterpolation(context, mode)
    } else if (s[0] === '<') {
      // 分支 2：如果以 '<' 开头
      if (/[a-z]/i.test(s[1])) {
        // 如果紧接着是字母，说明是元素的开始标签 (如 <div>)
        node = parseElement(context, ancestors)
      } else if (startsWith(s, '<!--')) {
        // 如果是注释
        node = parseComment(context)
      }
    }

    // 分支 3：如果上面的规则都没命中，说明它是纯文本
    if (!node) {
      node = parseText(context, mode)
    }

    // 将解析出的节点存入当前层级的数组中
    pushNode(nodes, node)
  }

  return nodes
}
```

## 3. 元素解析与递归栈：`parseElement`

当状态机遇到 `<div>` 这样的标签时，会调用 `parseElement`。这里体现了**递归下降**与**栈控制**的精髓。

```typescript
function parseElement(
  context: ParserContext,
  ancestors: ElementNode[],
): ElementNode | undefined {
  // 1. 解析开始标签 (例如：剥离出 <div>，截断字符串，返回 AST 节点初步信息)
  const element = parseTag(context, TagType.Start)

  // 2. 自闭合标签处理 (如 <img />)
  if (element.isSelfClosing) {
    return element
  }

  // 3. 核心机制：入栈
  // 将当前元素推入 ancestors 栈，表明接下来的解析都在这个元素的内部
  ancestors.push(element)

  // 4. 递归调用 parseChildren 解析子节点
  // 此时的 context.source 已经是 <div> 之后的内容了
  element.children = parseChildren(context, TextModes.DATA, ancestors)

  // 5. 核心机制：出栈
  // 子节点解析完毕，将当前元素从栈中弹出
  ancestors.pop()

  // 6. 解析结束标签 (匹配 </div>，并继续截断字符串)
  if (startsWith(context.source, `</${element.tag}`)) {
    parseTag(context, TagType.End)
  } else {
    // 如果找不到匹配的闭合标签，抛出编译错误 (缺少闭合标签)
    emitError(context, ErrorCodes.X_MISSING_END_TAG)
  }

  return element
}
```

## 4. 字符串的消费：`advanceBy`

在解析过程中（无论是提取标签、属性还是文本），Vue 解析器底层都在疯狂地调用一个基础函数：`advanceBy`。它的作用是**消费字符串并推进游标位置**。

```typescript
function advanceBy(context: ParserContext, numberOfCharacters: number) {
  const { source } = context

  // 1. 更新代码位置信息 (处理换行、列号等，用于生成精准的 Source Map 和报错信息)
  advancePositionWithMutation(context, source, numberOfCharacters)

  // 2. 截断字符串：将已经解析的部分直接砍掉
  context.source = source.slice(numberOfCharacters)
}
```

**示例说明：**
如果 `context.source` 是 `<div>Hello</div>`。
执行 `parseTag` 时，发现 `<div>` 长度为 5。
就会调用 `advanceBy(context, 5)`。
执行完毕后，`context.source` 变成了 `Hello</div>`，并且游标向前移动了 5 步。

## 5. 何时停止解析？`isEnd` 的安全机制

`parseChildren` 的 `while` 循环依赖 `isEnd` 来判断是否应该停止当前层级的解析并向上返回。

```typescript
function isEnd(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[],
): boolean {
  const s = context.source

  // 1. 字符串已经被彻底消费空了，自然结束
  if (s.length === 0) {
    return true
  }

  // 2. 遇到了结束标签
  if (startsWith(s, '</')) {
    // 逆序遍历 ancestors 栈，寻找匹配的标签
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }

  return false
}
```

这里遍历 `ancestors` 栈是从后往前找的。这保证了即使 HTML 结构存在一定的书写错误（例如 `<div><span></div>` 缺少了 `</span>`），解析器也能通过栈找到最近合法的父级边界强行闭合，并报告一个编译错误，而不是导致整个编译器死循环。

## 总结

Vue 3 Parser 的源码完美展示了如何编写一个高性能且具备强容错能力的解析器：

1. **字符串消费模式**：通过不断 `slice` 截断字符串驱动状态机向前流动。
2. **递归下降算法**：通过函数（`parseChildren` -> `parseElement` -> `parseChildren`）的互相调用自然形成树形结构。
3. **栈防御机制**：通过 `ancestors` 栈维护父子上下文，不仅用于检测标签闭合错误，还能为复杂的边界判断提供依据。
