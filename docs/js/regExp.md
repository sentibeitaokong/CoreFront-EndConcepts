# JavaScript **正则表达式 (RegExp)** 及其 **ES6+ 扩展**

正则表达式是一种强大的模式匹配工具，用于处理字符串，包括搜索、替换、验证等。ES6 (ECMAScript 2015) 及其后续版本为 RegExp 带来了显著的增强，使其在处理 Unicode、多行匹配和高级模式匹配方面更加灵活。

## **1. 正则表达式基础**

### **1.1 正则表达式的创建**

1.  **字面量**:
    ```js
    const regex1 = /pattern/flags;
    ```
    *   **优点**: 性能更好，因为在脚本加载时编译。
    *   **缺点**: 模式不能动态生成。

2.  **构造函数**:
    ```js
    const regex2 = new RegExp('pattern', 'flags');
    ```
    *   **优点**: 模式可以由字符串动态生成。
    *   **缺点**: 性能稍差，因为在运行时编译。

### **1.2 常用标志 (Flags)**

| 标志 | 描述 | 示例 |
| :--- | :--- | :--- |
| **`g`** | **全局匹配** (Global)。查找所有匹配，而不是在找到第一个后停止。 | `/a/g` |
| **`i`** | **不区分大小写** (Case-insensitive)。 | `/a/i` |
| **`m`** | **多行匹配** (Multiline)。`^` 和 `$` 匹配每行的开头和结尾，而不是整个字符串的开头和结尾。 | `/^a/m` |
| **`u`** | **Unicode 模式** (Unicode)。启用 Unicode 相关的特性，正确处理 4 字节 Unicode 字符。 | `/😂/u` |
| **`y`** | **粘性匹配** (Sticky)。从 `lastIndex` 属性指定的位置开始匹配。 | `/a/y` |
| **`s`** | **dotAll 模式** (dotAll)。`.` (点号) 匹配包括换行符在内的**所有**字符。 | `/a.b/s` |
| **`d`** | **索引匹配** (Indices)。(ES2022) 匹配结果包含匹配捕获组的开始和结束索引。 | `/a(b)/d` |

### **1.3 常用模式 (Patterns)**

*   **字面字符**: `a`, `1`, `$` (需转义)。
*   **字符类**: `[abc]`, `[a-z]`, `[0-9]`, `[^a-z]` (非)。
*   **预定义字符类**:
    *   `\d`: 数字 `[0-9]`。
    *   `\D`: 非数字 `[^0-9]`。
    *   `\w`: 单词字符 `[a-zA-Z0-9_]`。
    *   `\W`: 非单词字符。
    *   `\s`: 空白字符 (空格、tab、换行)。
    *   `\S`: 非空白字符。
*   **量词**:
    *   `?`: 0 或 1 次。
    *   `*`: 0 或多次。
    *   `+`: 1 或多次。
    *   `{n}`: 恰好 `n` 次。
    *   `{n,}`: 至少 `n` 次。
    *   `{n,m}`: `n` 到 `m` 次。
*   **边界**:
    *   `^`: 字符串或行的开头。
    *   `$`: 字符串或行的结尾。
    *   `\b`: 单词边界。
    *   `\B`: 非单词边界。
*   **分组与捕获**:
    *   `(pattern)`: 捕获组，同时分组。
    *   `(?:pattern)`: 非捕获组，只分组。
*   **选择**: `|` (或)。
*   **转义**: `\` (反斜杠)。

### **1.4 `RegExp` 实例方法**

| 方法 | 描述 | 返回值 |
| :--- | :--- | :--- |
| **`test(str)`** | 检查字符串中是否存在匹配项。 | `boolean` |
| **`exec(str)`** | 执行匹配，返回一个结果数组（包含匹配项、捕获组、索引等）或 `null`。**配合 `g` 标志可循环查找所有匹配**。 | `array` 或 `null` |

### **1.5 `String` 实例与正则相关方法**

| 方法 | 描述 | 返回值 |
| :--- | :--- | :--- |
| **`match(regexp)`** | 查找所有匹配项。如果 `regexp` 有 `g` 标志，返回所有匹配的字符串数组；否则，返回 `exec()` 类似的结果。 | `array` 或 `null` |
| **`matchAll(regexp)`** | (ES2020) 查找所有匹配项，返回一个**迭代器**，每个元素是 `exec()` 类似的结果。`regexp` **必须**带有 `g` 标志。 | `iterator` |
| **`search(regexp)`** | 返回第一个匹配项的索引，未找到返回 `-1`。`regexp` 的 `g` 标志会被忽略。 | `number` |
| **`replace(regexp, replacement)`** | 替换字符串中的匹配项。`replacement` 可以是字符串或函数。`regexp` 没有 `g` 标志时只替换第一个。 | `string` |
| **`replaceAll(regexp, replacement)`** | (ES2021) 替换字符串中**所有**匹配 `regexp` 的子串。`regexp` **必须**带有 `g` 标志。 | `string` |
| **`split(separator, limit)`** | 将字符串分割成数组。`separator` 可以是正则表达式。 | `array` |


## **2. ES6+ 正则表达式扩展**

### **2.1 `u` 标志 (Unicode 模式) - (ES6)**

*   **问题**: 在 ES6 之前，JavaScript 的正则表达式对 4 字节 Unicode 字符（如 emoji `😂`，`\uD83D\uDE02`）处理不当，会将其视为两个独立的 UTF-16 编码单元。
*   **作用**: 启用 `u` 标志后，正则表达式会正确处理 4 字节 Unicode 字符，将其视为一个完整的字符。
*   **影响**:
    *   **`.` 匹配**: 仍不匹配换行符，但正确匹配 4 字节字符。
    *   **`\u{xxxx}`**: 允许使用大括号表示 Unicode 码点。
    *   **`\p{...}`**: (ES2018) 引入 Unicode 属性类（见下）。
*   **示例**:
    ```js
    '😂'.length // 2 (UTF-16 编码单元数量)
    
    // 没有 u 标志，匹配失败
    /^.$/.test('😂') // false

    // 有 u 标志，匹配成功
    /^.$/u.test('😂') // true

    // 使用 Unicode 码点
    /\u{1F602}/u.test('😂') // true
    ```

### **2.2 `y` 标志 (粘性匹配 / Sticky) - (ES6)**

*   **作用**: 确保匹配从字符串的 `lastIndex` 属性指定的位置**精确开始**。如果 `lastIndex` 处没有匹配，则立即失败。
*   **与 `g` 标志的区别**: `g` 标志会从 `lastIndex` 处开始**搜索**匹配，如果 `lastIndex` 处没有，会继续向后搜索。`y` 标志则必须在 `lastIndex` 处**粘性匹配**。
*   **使用场景**: 逐字解析或分词。

```js
const str = '##abc##def';
const regex = /#(\w+)#/y; // 注意 y 标志

regex.lastIndex = 0;
console.log(regex.exec(str)); // ["#abc#", "abc"]
console.log(regex.lastIndex); // 5

// 下次匹配从 lastIndex (5) 开始，但 5 处是 #，不是 a
console.log(regex.exec(str)); // null (因为 5 处无法匹配 /#(\w+)#/)

// 如果没有 y 标志，g 标志会继续向后搜索
const regexG = /#(\w+)#/g;
regexG.lastIndex = 0;
console.log(regexG.exec(str)); // ["#abc#", "abc"] (lastIndex: 5)
console.log(regexG.exec(str)); // ["#def#", "def"] (lastIndex: 10)
```

### **2.3 `s` 标志 (dotAll 模式) - (ES9/ES2018)**

*   **问题**: 默认情况下，`.` (点号) 匹配除换行符 (`\n`, `\r`, `\u2028`, `\u2029`) 之外的所有字符。
*   **作用**: 启用 `s` 标志后，`.` (点号) 将匹配**包括换行符在内的所有字符**。
*   **别名**: `dotAll` 模式。

```js
/foo.bar/.test('foo\nbar') // false
/foo.bar/s.test('foo\nbar') // true
```

### **2.4 命名捕获组 (Named Capture Groups) - (ES9/ES2018)**

*   **问题**: 捕获组 (`()`) 只能通过数字索引 (`$1`, `$2` 或 `exec` 结果数组的 `[1]`, `[2]`) 访问，不直观。
*   **作用**: 允许为捕获组指定名称，通过名称访问。
*   **语法**: `(?<name>pattern)`
*   **访问**:
    *   `exec` 结果对象的 `groups` 属性。
    *   `String.prototype.replace()` 的 `replacement` 函数参数。

```js
const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = regex.exec('2023-10-26');

console.log(match.groups.year);  // "2023"
console.log(match.groups.month); // "10"

// 在 replace() 中使用
'2023-10-26'.replace(regex, '$<month>/$<day>/$<year>') // "10/26/2023"
```

### **2.5 后行断言 (Lookbehind Assertions) - (ES9/ES2018)**

*   **断言**: 匹配某个模式，但**不捕获**它，也不将其包含在最终匹配结果中。
*   **后行断言**: 匹配**紧接在**某个模式**后面**的字符。
    *   **肯定后行断言**: `(?<=pattern)` (Positive Lookbehind)
    *   **否定后行断言**: `(?<!pattern)` (Negative Lookbehind)
*   **区别于先行断言**: 先行断言 `(?=pattern)` 和 `(?!pattern)` 匹配的是**紧接在**某个模式**前面**的字符。

```js
// 肯定后行断言: 匹配 $ 符号后面的数字
/\d+(?=\$)/.exec('I paid 100$ for it.') // null (因为 $ 在数字后面)
/(?<=\$)\d+/.exec('I paid $100 for it.') // ["100"]

// 否定后行断言: 匹配不是 $ 符号后面的数字
/\d+(?<!\$)/.exec('I paid $100 for it.') // null (因为 100 后面没有 $ 符号)
/(?<!\$)\d+/.exec('I paid 100 for it.') // ["100"]
```

### **2.6 Unicode 属性类 (Unicode Property Escapes) `\p{...}` 和 `\P{...}` - (ES9/ES2018)**

*   **作用**: 在 `u` 标志下，通过 Unicode 属性来匹配字符，比 `\w`, `\d` 更强大。
*   **语法**:
    *   `\p{UnicodePropertyName=UnicodePropertyValue}`: 匹配具有指定 Unicode 属性的字符。
    *   `\P{UnicodePropertyName=UnicodePropertyValue}`: 匹配不具有指定 Unicode 属性的字符。
    *   `\p{Binary_Property}`: 匹配具有指定二进制属性的字符。
*   **示例**:
    ```js
    // 匹配所有 Unicode 字母
    /\p{Alphabetic}/u.test('你好') // true
    /\p{L}/u.test('A') // true (L 是 Alphabetic 的简写)

    // 匹配所有 Unicode 数字
    /\p{Number}/u.test('123') // true
    /\p{N}/u.test('١٢٣') // true (匹配阿拉伯语数字)

    // 匹配所有 Unicode 货币符号
    /\p{Currency_Symbol}/u.test('$€¥') // true

    // 匹配 emoji
    /\p{Emoji}/u.test('😂') // true
    ```

### **2.7 索引匹配 (`d` 标志 / HasIndices) - (ES2022)**

*   **作用**: 启用 `d` 标志后，`exec()` 方法返回的匹配结果对象会多一个 `indices` 属性，提供捕获组的开始和结束索引。
*   **示例**:
    ```js
    const regex = /(a)(b)/d;
    const match = regex.exec('xaby');

    console.log(match);
    /*
    [
      "ab",
      "a",
      "b",
      index: 1,
      input: "xaby",
      groups: undefined,
      indices: [ // 新增的 indices 属性
        [1, 3], // 整个匹配 'ab' 的索引
        [1, 2], // 捕获组 'a' 的索引
        [2, 3]  // 捕获组 'b' 的索引
      ]
    ]
    */
    ```

## **3. 常见问题与最佳实践**

*   **Q1: 为什么 `RegExp` 构造函数中 `\` 需要双重转义？**
    *   因为构造函数的第一个参数是**字符串**。字符串内部的 `\` 已经被 JS 引擎解释为转义字符。如果要将 `\` 传递给正则表达式引擎，就需要 `\\`。
    ```js
    /\d+/.test('123') // 字面量
    new RegExp('\\d+').test('123') // 构造函数，需要双斜杠
    ```

*   **Q2: 循环使用 `exec()` 查找所有匹配时，为什么有时会无限循环？**

    *   如果正则表达式有 `g` 标志，`exec()` 会在每次匹配成功后更新 `regex.lastIndex`。如果你的循环条件或模式没有正确更新 `lastIndex`，或者模式不能匹配到空字符串，可能会导致无限循环。
    *   **解决方案**: 确保 `lastIndex` 被正确管理。`String.prototype.matchAll()` 是一个更现代、更安全的替代方案。

*   **Q3: `^` 和 `$` 在 `m` 标志下和没有 `m` 标志下有什么区别？**
    *   **无 `m`**: `^` 匹配整个字符串的开头，`$` 匹配整个字符串的结尾。
    *   **有 `m`**: `^` 匹配整个字符串的开头**或**每行的开头，`$` 匹配整个字符串的结尾**或**每行的结尾。

*   **Q4: 正则表达式的性能优化有哪些？**

    1.  **预编译**: 优先使用字面量创建正则表达式，因为它在脚本加载时编译，而不是每次运行时。
    2.  **避免不必要的回溯**: 编写更精确的模式，避免 `(a|b|c)*` 这种过于宽泛的量词。
    3.  **使用非捕获组 `(?:...)`**: 如果你不需要捕获组的内容，使用非捕获组可以提高少量性能。
    4.  **先判断后匹配**: 如果只是检查是否存在，`test()` 通常比 `exec()` 或 `match()` 更快。
    5.  **减少量词的贪婪性**: 默认量词是贪婪的（`*`, `+`, `{n,m}`），会尽可能多地匹配。使用 `?` 使其变为非贪婪（`*?`, `+?`, `{n,m}?`）。

*   **Q5: 什么时候用 `String.prototype.match()`，什么时候用 `RegExp.prototype.exec()`？**

    *   **`match()`**:
        *   **无 `g` 标志**: 返回 `exec()` 类似的结果。
        *   **有 `g` 标志**: 返回一个包含所有匹配字符串的数组。
    *   **`exec()`**:
        *   **无论是否有 `g` 标志**: 每次只返回一个匹配。**配合 `g` 标志**，可以通过循环迭代所有匹配，同时还能获取捕获组信息和 `lastIndex`。
    *   **`matchAll()`**: (ES2020) **推荐**，如果你需要所有匹配以及捕获组信息，并且 `g` 标志是强制的。它返回一个迭代器，避免了 `exec` 循环的繁琐。

**结语**: ES6+ 为 JavaScript 正则表达式带来了巨大的进步，尤其是在 Unicode 处理、可读性和高级模式匹配方面。掌握这些新特性，将使你在处理字符串时更加得心应手。