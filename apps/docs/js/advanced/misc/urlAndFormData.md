# URL、URLSearchParams 与 FormData

解析查询串、构造带参请求、上传文件是高频场景，靠的就是这三个原生接口。

**一句话理解**：**`URL` 解析地址、`URLSearchParams` 操作查询串、`FormData` 组装表单与文件。**

## 1. `URL`：解析与构造地址

`URL` 是构造函数，把地址字符串解析成结构化对象；传相对地址时必须给第二参数 `base`，否则抛 `TypeError`。

```javascript
const url = new URL('https://example.com:8080/path?page=2&kw=vue#top')

url.protocol // "https:"
url.host // "example.com:8080"
url.hostname // "example.com"
url.port // "8080"
url.pathname // "/path"
url.search // "?page=2&kw=vue"
url.hash // "#top"
url.origin // "https://example.com:8080"
```

### 1.1 八个常用属性

[width(18,38,33,11)]

| 属性       | 示例值                       | 含义                                         | 可写 |
| ---------- | ---------------------------- | -------------------------------------------- | ---- |
| `protocol` | `"https:"`                   | 协议，**带冒号**                             | 可写 |
| `hostname` | `"example.com"`              | 主机名，不含端口                             | 可写 |
| `port`     | `"8080"`                     | 端口；用默认端口时是空串                     | 可写 |
| `host`     | `"example.com:8080"`         | `hostname` + `port`，无端口时等于 `hostname` | 可写 |
| `pathname` | `"/path"`                    | 路径，**以 `/` 开头**                        | 可写 |
| `search`   | `"?page=2&kw=vue"`           | 查询串，**含 `?`**；没有查询串时是空串       | 可写 |
| `hash`     | `"#top"`                     | 锚点，**含 `#`**                             | 可写 |
| `origin`   | `"https://example.com:8080"` | 协议 + 主机 + 端口，**只读**                 | 只读 |

- `href` 即完整地址串（`JSON.stringify` 走 `toJSON()`）：

```javascript
const url = new URL('https://example.com/a?x=1#h')
url.href // "https://example.com/a?x=1#h"
String(url) === url.href // true
JSON.stringify({ url }) // {"url":"https://example.com/a?x=1#h"}
```

- 非特殊协议（如 `file:`）的 `origin` 是字符串 `"null"`，别当 base 用。

### 1.2 设置参数

```javascript
const url = new URL('https://example.com/path')
url.searchParams.set('page', '2') // 覆盖
url.searchParams.append('tag', 'a') // 追加
url.searchParams.append('tag', 'b') // 同名参数保留多个
url.toString() // "https://example.com/path?page=2&tag=a&tag=b"
```

`url.searchParams` 是**活对象**，改它等于改 URL 本身，不用手动 `toString()`。

```javascript
const url = new URL('https://example.com/path')
url.searchParams.set('page', '2')
url.href // "https://example.com/path?page=2"  已经同步
url.search // "?page=2"
```

反过来，给 `url.search`（或 `url.href`）赋值是**整串替换**，不是合并：

```javascript
const url = new URL('https://example.com/path?a=1')
const params = url.searchParams

params.append('b', '2')
url.href // "https://example.com/path?a=1&b=2"

url.search = '?c=9' // 整串替换：a、b 都没了
url.href // "https://example.com/path?c=9"

params.append('d', '4') // params 依然是 URL 上的那个活对象
url.href // "https://example.com/path?c=9&d=4"
```

**实践建议**：只改参数用 `searchParams`，换整个查询串才用 `url.search = ...`；置空同理（`url.search = ''` 不留 `?`，`url.hash = ''` 清锚点）。

### 1.3 拼接相对路径

```javascript
new URL('/detail', 'https://example.com/list')
// "https://example.com/detail"  —— 自动解析相对路径

new URL('../a', 'https://example.com/x/y')
// "https://example.com/a"
```

> 相比手写 `+` 拼接，`URL` 自动处理编码、协议与相对路径，不会漏掉 `?` 或 `&`。

第二参数 `base` 的解析规则与地址栏、`<a href>` 一致：

[width(21,49,30)]

| 相对地址        | 以 `https://example.com/x/y` 为 base 的结果 | 规则                               |
| --------------- | ------------------------------------------- | ---------------------------------- |
| `a`             | `https://example.com/x/a`                   | 替换 base 的最后一段               |
| `./a`           | `https://example.com/x/a`                   | 同上，显式写法                     |
| `../a`          | `https://example.com/a`                     | 回到上一级目录                     |
| `/a`            | `https://example.com/a`                     | 绝对路径，只保留 base 的协议与主机 |
| `//other.com/p` | `https://other.com/p`                       | 协议相对地址，换主机               |
| `?q=1`          | `https://example.com/x/y?q=1`               | 只换查询串                         |
| `#h`            | `https://example.com/x/y#h`                 | 只换锚点                           |
| 空串            | `https://example.com/x/y`                   | 等于 base 本身                     |

```javascript
const base = 'https://example.com/x/y'

new URL('a', base) // "https://example.com/x/a"  base 的 /y 被丢掉
new URL('b', 'https://example.com/x/') // "https://example.com/x/b"  有尾斜杠时保留目录
new URL('//other.com/p', base) // "https://other.com/p"
new URL('', base) // "https://example.com/x/y"
```

最常用的 base 是 `location.origin`，站点部署在哪个域名或子路径下都能拼出正确地址：

```javascript
const url = new URL('/api/search', location.origin)
url.searchParams.set('kw', '中文')
url.href // "https://当前域名/api/search?kw=%E4%B8%AD%E6%96%87"
```

Service Worker 里常用 `new URL(request.url, location.origin)` 还原请求地址。

### 1.4 修改其他组成部分

其余属性也能直接赋值，格式会被自动规整：

```javascript
const url = new URL('https://example.com:8080/a/b?x=1#top')

url.port = '443' // https 的默认端口会被清空
url.port // ""
url.href // "https://example.com/a/b?x=1#top"

url.host = 'other.org:9000' // host 同时改 hostname 和 port
url.hostname // "other.org"
url.port // "9000"

url.pathname = 'c/d' // 缺少前导 / 会自动补上
url.pathname // "/c/d"

url.hash = 'end' // 缺少 # 会自动补上
url.hash // "#end"

url.hash = '' // 清空锚点，不会留下 #
url.search = '' // 清空查询串，不会留下 ?
url.href // "https://other.org:9000/c/d"
```

两个易错点：

- **非法值被静默忽略**，不抛错也不生效：`url.port = 'abc'` 后端口保持原样。
- `origin` **只读**，赋值不生效（严格模式下抛 `TypeError`）；换源要改 `protocol` / `host`。

### 1.5 解析失败与 `URL.canParse()`

`new URL()` 解析失败会**抛异常**，处理用户输入或后端下发的地址时不能盲目信任：

```javascript
new URL('/a') // TypeError（相对地址必须给 base）
new URL('://x') // TypeError

// 传统兜底写法：try...catch
function safeParse(input, base) {
  try {
    return new URL(input, base)
  } catch {
    return null
  }
}

// 更省事：先问一声能不能解析
URL.canParse('/a', 'https://example.com') // true
URL.canParse('/a') // false（没有 base）
URL.canParse('not a url') // false

const parsed = safeParse('/a', 'https://example.com')
parsed?.href // "https://example.com/a"
```

`URL.canParse()` 只回答“**能不能解析**”，拿结果还得再 `new URL()`；`URL.parse()` 返回 `URL` 或 `null`（较新）。

## 2. `URLSearchParams`：操作查询字符串

`URLSearchParams` 负责查询串的解析、读写与序列化：内部按 `application/x-www-form-urlencoded` 规则编解码，进出都自动编码/解码；可独立 `new`，也可取自 `url.searchParams`。

### 2.1 基本用法

```javascript
const params = new URLSearchParams('page=2&kw=vue')

params.get('page') // "2"
params.set('kw', 'react') // 覆盖
params.append('tag', 'x') // 追加
params.has('page') // true
params.delete('page') // 删除
params.toString() // "kw=react&tag=x"
```

[width(27,42,31)]

| 方法                  | 作用                                                    | 缺失 / 重复时的行为    |
| --------------------- | ------------------------------------------------------- | ---------------------- |
| `get(name)`           | 取**第一个**值                                          | 没有该 key 返回 `null` |
| `getAll(name)`        | 取**全部**值                                            | 没有该 key 返回 `[]`   |
| `has(name)`           | 是否存在该 key                                          | `false`                |
| `set(name, value)`    | 删掉所有同名值，再写入一个                              | —                      |
| `append(name, value)` | 追加一个同名值                                          | —                      |
| `delete(name)`        | 删除该 key 的**全部**值                                 | 删不存在的 key 不报错  |
| `sort()`              | 按 key 排序（**原地**，返回 `undefined`）               | —                      |
| `size`                | 键值对**总条数**（较新，旧环境用 `[...params].length`） | —                      |
| `toString()`          | 序列化成 `a=1&b=2`                                      | 结果**不带前导 `?`**   |

构造函数接受多种输入，按数据形状挑一个：

```javascript
new URLSearchParams('a=1&b=2') // 查询串
new URLSearchParams('?a=1') // 前导 ? 会被自动去掉
new URLSearchParams({ a: '1', b: '2' }) // 对象
new URLSearchParams([
  ['a', '1'],
  ['a', '2'],
]) // 键值对数组（可以有重复 key）
new URLSearchParams(new Map([['a', '1']])) // 任何可迭代的键值对
new URLSearchParams(location.search) // 当前页面的查询串
```

> 值一律是**字符串**：`{ a: 1 }` 得到 `"a=1"`，`{ a: undefined }` 得到 `"a=undefined"`——拼参数前先过滤 `undefined` / `null`。

### 2.2 数组与重复键

查询串没有数组类型，只有“**同名多值**”，关键是分清 `get`/`set` 与 `getAll`/`append`：

```javascript
const params = new URLSearchParams('tag=a&tag=b')

params.get('tag') // "a"  只返回第一个
params.getAll('tag') // ["a", "b"]  全部
params.has('tag') // true

params.set('tag', 'c') // 覆盖：先删掉所有 tag，再写一个
params.toString() // "tag=c"

params.append('tag', 'd') // 追加：保留已有的，再加一个
params.toString() // "tag=c&tag=d"
```

### 2.3 遍历与迭代器

```javascript
const params = new URLSearchParams('a=1&b=2')

for (const [key, value] of params) {
  console.log(key, value)
}

params.keys() // 迭代器
params.values() // 迭代器
params.entries() // 迭代器

params.sort() // 按 key 字母序排序
```

迭代顺序是**插入顺序**，可随时转成数组或对象：

```javascript
const params = new URLSearchParams('b=2&a=1&b=1')

const pairs = [...params] // [["b","2"],["a","1"],["b","1"]]
const keys = [...params.keys()] // ["b","a","b"]

params.forEach((value, key, owner) => {
  console.log(key, value, owner === params) // 参数顺序是 value 在前，和 Map 一致
})

params.sort() // 原地排序
params.toString() // "a=1&b=2&b=1"  同名键保持原有相对顺序
```

### 2.4 与对象互转

```javascript
// 对象 -> 查询串
const params = new URLSearchParams({ a: '1', b: '2' })
params.toString() // "a=1&b=2"

// 查询串 -> 对象
const obj = Object.fromEntries(new URLSearchParams('a=1&b=2'))
// { a: "1", b: "2" }
```

`Object.fromEntries` 的坑：**重复键互相覆盖**，只留最后一个：

```javascript
Object.fromEntries(new URLSearchParams('a=1&a=2')) // { a: "2" }，第一个 a 丢了
```

要拿全量数据就按 key 归类：

```javascript
const grouped = {}
const params = new URLSearchParams('a=1&a=2&b=3')
for (const key of new Set(params.keys())) {
  grouped[key] = params.getAll(key)
}
// { a: ["1", "2"], b: ["3"] }
```

### 2.5 获取当前页面参数

```javascript
const params = new URLSearchParams(location.search)
const page = params.get('page')
```

配合 `history` 只改地址栏、不刷新页面：

```javascript
// 更新查询参数并同步到地址栏
const url = new URL(location.href)
url.searchParams.set('page', '2')
history.replaceState(null, '', url) // pushState 则会多出一条历史记录
```

> hash 路由（`#/list?page=2`）的参数在 `hash` 里而非 `search` 里，`location.search` 拿不到，得自己从 hash 切出查询串：

```javascript
const hashQuery = location.hash.split('?')[1] || ''
const params = new URLSearchParams(hashQuery)
const page = params.get('page')
```

### 2.6 `toString()` 与手写拼接的编码差异

同一个值三种拼法：

```javascript
const kw = 'a b&c'

'?kw=' + kw // "?kw=a b&c"        & 没编码，会被拆成两个参数
'?kw=' + encodeURIComponent(kw) // "?kw=a%20b%26c"  能用，但全靠自己记得编码

const params = new URLSearchParams({ kw })
params.toString() // "kw=a+b%26c"  自动编码，空格用 +
params.get('kw') // "a b&c"  读出来自动还原
```

空格是关键：`%20` 与 `+` 在 urlencoded 解析器里都表示空格，手写解析时 `+` 还原不回空格。

### 2.7 容易踩的坑

**（1）`JSON.stringify` 出来是空对象。** 参数不挂在自身属性上：

```javascript
const params = new URLSearchParams('a=1')
JSON.stringify(params) // "{}"
JSON.stringify({ params }) // {"params":{}} —— 传后端前记得先 toString()
```

**（2）不要二次编码。** `set` / `append` 内部已编码，再喂 `encodeURIComponent` 就是双重编码，后端读到 `%25...` 字面量：

```javascript
// 错：编码了两次
const bad = new URLSearchParams()
bad.set('kw', encodeURIComponent('中文'))
bad.toString() // "kw=%25E4%25B8%25AD%25E6%2596%2587"

// 对：原值直接交给它
const good = new URLSearchParams()
good.set('kw', '中文')
good.toString() // "kw=%E4%B8%AD%E6%96%87"
```

同理 `params.get('kw')` 已是**解码后**的值，别再 `decodeURIComponent`（原有的 `%xx` 会多解一层）。

**（3）`delete(name, value)` / `has(name, value)` 是较新的重载**，只删/判断指定的那一个值；旧环境先 `getAll` 再筛。

**（4）空串和 key 不存在是两回事。** `?kw=` 的 `get('kw')` 返回 `""`（不是 `null`）、`has('kw')` 为 `true`；`?kw` 这种没 `=` 的写法也算空串。

## 3. URL 编码

URL 里只能安全出现部分 ASCII 字符，中文、空格、`#`、`&` 都得转成 `%XX`；编码共有三种方式：两套手工函数加 `URLSearchParams`。

### 3.1 `encodeURIComponent` vs `encodeURI`

[width(32,46,22)]

| 函数                   | 编码范围                            | 用途               |
| ---------------------- | ----------------------------------- | ------------------ |
| `encodeURIComponent()` | 除字母数字及 `-_.!~*'()` 外全部编码 | 编码**单个参数值** |
| `encodeURI()`          | 保留 `:/?#[]@!$&'()*+,;=`           | 编码**完整 URL**   |

```javascript
encodeURIComponent('a b&c') // "a%20b%26c"
encodeURI('https://x.com/a b') // "https://x.com/a%20b"
```

> `URLSearchParams` 内部自动编码，**无需手动编码**。

它用的是 urlencoded 规则（空格编成 `+`、`!'()~` 也编码），结论不变：**交给它就别再自己编码**。

### 3.2 三种方式该怎么选

[width(23,28,28,21)]

| 方式                    | 编码范围                          | 空格 / `+`                 | 适用场景                                                  |
| ----------------------- | --------------------------------- | -------------------------- | --------------------------------------------------------- |
| `encodeURIComponent(v)` | 只保留字母数字和 `-_.!~*'()`      | 空格 → `%20`；`+` → `%2B`  | 编码**单个值**：参数值、路径片段、要放进另一个 URL 的地址 |
| `encodeURI(url)`        | 额外保留 `;/?:@&=+$,#` 等结构字符 | 空格 → `%20`；`+` 原样保留 | 编码**完整 URL**，保留它的结构                            |
| `URLSearchParams`       | 只保留字母数字和 `*-._`           | 空格 → `+`；`+` → `%2B`    | 构造 / 修改**查询串**                                     |

- 编码**值**用 `encodeURIComponent`，编码**整个 URL** 用 `encodeURI`。
- 拼查询串直接 `URLSearchParams`，别自己编码。
- `encodeURI` 不编码 `&` 和 `=`，**绝不能拿它编码参数值**。

```javascript
// 参数值里带 & ：用 encodeURI 会漏掉编码
encodeURI('a&b') // "a&b"（原样，等于没编）

// 对整个 URL 用 encodeURIComponent 会把结构字符也编码掉
encodeURIComponent('https://x.com/a') // "https%3A%2F%2Fx.com%2Fa"（已经不是 URL 了）
```

### 3.3 `+` 与空格的关系

urlencoded 规定空格可写作 `+`，两个方向都要留意：

```javascript
new URLSearchParams({ q: 'a b' }).toString() // "q=a+b"  输出用 +
new URLSearchParams('q=a+b').get('q') // "a b"  + 会被当成空格
new URLSearchParams('q=a%20b').get('q') // "a b"  %20 也认

// encodeURIComponent 只会产出 %20，不会产出 +
encodeURIComponent('a b') // "a%20b"
```

值里本来就有 `+` 时（base64、手机号 `+86`）更坑：

```javascript
new URLSearchParams('q=1+1').get('q') // "1 1"  + 被吃成了空格

// 交给 URLSearchParams / encodeURIComponent 都会自动转义成 %2B
new URLSearchParams({ q: '1+1' }).toString() // "q=1%2B1"
encodeURIComponent('1+1') // "1%2B1"
```

base64 结果（含 `+`、`/`、`=`）放进查询串务必经 `URLSearchParams` 或 `encodeURIComponent`。

### 3.4 中文与 emoji 的编码

编码过程是“按 **UTF-8** 转字节再写成 `%XX`”：汉字 3 字节，emoji 通常 4 字节。

```javascript
encodeURIComponent('中') // "%E4%B8%AD"  3 字节
encodeURIComponent('中文') // "%E4%B8%AD%E6%96%87"
encodeURIComponent('🚀') // "%F0%9F%9A%80"  4 字节
encodeURIComponent('🚀').length // 12  编码后长度按字节数算，不是字符数

const params = new URLSearchParams({ kw: '中文', emoji: '🚀' })
params.toString() // "kw=%E4%B8%AD%E6%96%87&emoji=%F0%9F%9A%80"
params.get('emoji') // "🚀"  读出来自动解码
```

```javascript
decodeURIComponent('%E4%B8%AD') // "中"

// 只要有不合法的 % 序列就整体抛 URIError，所以别拿它去解整个 location.search
decodeURIComponent('%') // 抛 URIError: URI malformed
```

- 解**整个 URL** 用 `URL` / `URLSearchParams`（对不合法序列宽容，`new URLSearchParams('q=%').get('q')` 返回 `"%"`）。
- 别重复解码：已解码的值再 `decodeURIComponent` 会多解一层。

## 4. `FormData`：组装表单与文件数据

`FormData` 表示 `multipart/form-data` 键值对，可同时携带文本字段与文件，是 `fetch`/XHR 上传的标准载体。

它与 `URLSearchParams` 最大的区别是**值可以是 `File` / `Blob`**，能承载二进制（后者只能存字符串）。

### 4.1 手动构造

```javascript
const fd = new FormData()
fd.append('username', 'xunbei')
fd.append('avatar', fileInput.files[0]) // 直接放 File 对象
fd.append('tags', 'a')
fd.append('tags', 'b') // 同名多值
```

值不是 `File` / `Blob` 时会被转成字符串，容易出意外：

```javascript
const fd = new FormData()
fd.append('count', 42)
fd.get('count') // "42"  数字被转成字符串

fd.append('meta', { a: 1 })
fd.get('meta') // "[object Object]"  对象要自己 JSON.stringify 后再放

fd.append('note', undefined)
fd.get('note') // "undefined"  先过滤掉 undefined / null
```

### 4.2 从表单元素直接构建

```javascript
const form = document.querySelector('form')
const fd = new FormData(form) // 自动收集表单内所有带 name 的字段
```

[width(46,54)]

| 控件                                         | 是否被收集                                                    |
| -------------------------------------------- | ------------------------------------------------------------- |
| 带 `name` 的 `input` / `select` / `textarea` | 收集，值为 `value`                                            |
| **没有 `name`** 的控件                       | **不收集**（`name` 是它进入表单数据的唯一凭据）               |
| 带 `disabled` 的控件                         | **不收集**                                                    |
| 未勾选的 `checkbox` / `radio`                | **不收集**；勾选的收集其 `value`                              |
| `<input type="file">`                        | 收集为 `File`；**没选文件时给一个空 `File`**                  |
| `<select multiple>`                          | 每个选中项一个同名条目                                        |
| `<input type="submit">`                      | 默认不收集（可用 `new FormData(form, submitter)` 指定，较新） |

“**空文件**”这条最坑：没选文件时后端收到的是 `size` 为 `0`、`name` 为空串的 `File`，得自己判断后跳过：

```javascript
const form = document.querySelector('form')
const fd = new FormData(form)
const file = fd.get('avatar')

if (file instanceof File && file.size === 0) {
  console.log('用户没有选文件') // 常见 bug：后端收到一个空文件
}
```

> `new FormData(form)` 取的是**控件当前的值**，与表单 `enctype` 无关（永远是 multipart 结构）。

### 4.3 上传文件

```javascript
const fd = new FormData()
fd.append('file', fileInput.files[0])

await fetch('/api/upload', {
  method: 'POST',
  body: fd, // 无需手动设置 Content-Type，浏览器会自动带上 boundary
})
```

`fetch` 实发的 Content-Type 是 `multipart/form-data; boundary=----WebKitFormBoundary...`，`boundary` 每次随机生成。**手动设 `Content-Type` 一定坏事**：写死 `multipart/form-data` 就丢了 boundary，报文体分隔符与请求头对不上，后端解析直接失败。

### 4.4 读取内容

```javascript
fd.get('username') // 第一个值
fd.getAll('tags') // 所有值组成的数组
fd.has('avatar') // 是否存在
fd.delete('tags') // 删除
fd.set('username', 'new') // 覆盖（清除同名旧值后设置）

for (const [key, value] of fd) {
  console.log(key, value) // value 可能是 File
}
```

[width(39,61)]

| 方法                                | 说明                                               |
| ----------------------------------- | -------------------------------------------------- |
| `get(name)`                         | 第一个值，类型是 `string \| File`，缺失返回 `null` |
| `getAll(name)`                      | 全部值组成的数组，缺失返回 `[]`                    |
| `has(name)`                         | 是否存在                                           |
| `set(name, value, filename?)`       | 清掉同名旧值后写入一个                             |
| `append(name, value, filename?)`    | 追加一个同名条目                                   |
| `delete(name)`                      | 删除全部同名条目                                   |
| `entries()` / `keys()` / `values()` | 迭代器，`[...fd]` 等价于 `[...fd.entries()]`       |
| `forEach(cb)`                       | 回调参数顺序是 `(value, key, parent)`              |

`forEach` 的参数顺序和 `Map` 一致（**值在前**），别按 `(key, value)` 写：

```javascript
const fd = new FormData()
fd.append('a', '1')
fd.append('b', '2')

fd.forEach((value, key) => {
  console.log(key, value) // a 1 / b 2
})

const pairs = [...fd] // [["a","1"],["b","2"]]
```

### 4.5 一次上传多个文件

“**多文件**”就靠同名重复键表示：

```javascript
const input = document.querySelector('input[type=file][multiple]')
const fd = new FormData()

for (const file of input.files) {
  fd.append('files', file) // 同名多值，后端拿到多个 part
}

fd.getAll('files') // [File, File, ...]
await fetch('/api/upload', { method: 'POST', body: fd })
```

后端是 PHP / qs 风格、约定 `files[]=...` 时，把 key 写成 `files[]`：

```javascript
const fd = new FormData()
fd.append('files[]', fileA)
fd.append('files[]', fileB)
```

大文件分片可以把每个分片当成一次独立请求：

```javascript
const CHUNK_SIZE = 1024 * 1024
for (let i = 0; i < file.size; i += CHUNK_SIZE) {
  const fd = new FormData()
  fd.append('chunk', file.slice(i, i + CHUNK_SIZE))
  fd.append('index', String(i / CHUNK_SIZE))
  await fetch('/api/upload/chunk', { method: 'POST', body: fd })
}
```

### 4.6 `File` / `Blob` 作为值

```javascript
const fd = new FormData()
fd.append('avatar', fileInput.files[0]) // File：文件名自动带上
fd.append('thumb', blob) // Blob 没有名字，默认文件名是 "blob"
fd.append('report', blob, 'report.pdf') // 第三个参数手动指定文件名
```

- `Blob` 放进去会**自动包装成 `File`**，`value instanceof File` 为 `true`，`name` / `lastModified` 都在。
- `Blob` 的 `type` 会成为该 part 的 `Content-Type`，构造时务必写对 `new Blob([...], { type: 'image/png' })`；不指定文件名时默认 `"blob"`，对象存储这类后端要补第三个参数。
- `File` / `Blob` 都支持 `slice()`（分片上传靠它），详见 [Blob、File 与 FileReader](/js/advanced/misc/blobFileFileReader)。

### 4.7 `multipart/form-data` 与 `x-www-form-urlencoded` 的区别

[width(18,42,40)]

| 维度         | `multipart/form-data`（`FormData`）                         | `application/x-www-form-urlencoded`（`URLSearchParams`） |
| ------------ | ----------------------------------------------------------- | -------------------------------------------------------- |
| 能否带文件   | 可以（`File` / `Blob`）                                     | 不行，值只能是字符串                                     |
| 编码方式     | 每段一个 part，段间用 `boundary` 分隔，内容基本**原样发送** | 全量转义：空格 → `+`，特殊字符 → `%XX`                   |
| 编码开销     | 低（文本几乎不转义）                                        | 高（中文等按字节膨胀）                                   |
| 体积         | 略大（每段都带 `Content-Disposition` 头和 boundary）        | 小，纯文本                                               |
| Content-Type | `multipart/form-data; boundary=...`                         | `application/x-www-form-urlencoded;charset=UTF-8`        |
| 典型场景     | 表单含文件、任意二进制                                      | 纯文本表单、GET 查询串                                   |

`fetch` 按 body 类型自动挑 Content-Type，但**字符串不是表单**：

```javascript
// 后端收到 Content-Type: text/plain;charset=UTF-8，不是表单！
await fetch('/api', { method: 'POST', body: 'a=1&b=2' })

// 想要 urlencoded，就把值交给 URLSearchParams
await fetch('/api', {
  method: 'POST',
  body: new URLSearchParams({ a: '1', b: '2' }),
})
```

实际发出的头：

- `FormData` → `multipart/form-data; boundary=...`（自动生成）
- `URLSearchParams` → `application/x-www-form-urlencoded;charset=UTF-8`
- 普通字符串（含 `JSON.stringify` 的结果）→ `text/plain;charset=UTF-8`，想发 JSON 要自己写 `Content-Type: application/json`

> `GET` / `HEAD` **不允许带 body**，用 `FormData` 发 GET 会抛 `TypeError`。

### 4.8 与对象互转

```javascript
// FormData -> 对象
const obj = Object.fromEntries(fd.entries())

// 对象 -> FormData
const fd = new FormData()
Object.entries(obj).forEach(([k, v]) => fd.append(k, v))
```

`Object.fromEntries` 同样会丢掉重复键；值还可能是 `File`，转对象再 `JSON.stringify` 会得到 `{}`，**只提取文本字段**要更小心：

```javascript
const fd = new FormData()
fd.append('title', '标题')
fd.append('cover', new Blob(['x'], { type: 'image/png' }), 'cover.png')

// 只取文本字段：先过滤掉 File
const textOnly = {}
for (const [key, value] of fd) {
  if (!(value instanceof File)) {
    textOnly[key] = value
  }
}
// { title: "标题" }
```

### 4.9 `fetch` 与 `Axios` 在 `FormData` 上的差异

[width(18,30,52)]

| 维度                     | `fetch`                                     | `Axios`                                                           |
| ------------------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| FormData 的 Content-Type | 自动设 `multipart/form-data; boundary=...`  | 浏览器端交给浏览器设（axios 会清掉这个头，好让浏览器补 boundary） |
| 手动设 Content-Type      | 覆盖自动值 → 丢 boundary，解析失败          | 同样会坏事，别手动设                                              |
| 上传进度                 | **不支持**（没有上传进度事件）              | `onUploadProgress`（内部用 XHR）                                  |
| 取消请求                 | `AbortController`                           | `AbortController`（v1+），旧版用 `CancelToken`                    |
| 响应体解析               | 手动 `await res.json()`                     | 自动按 Content-Type 解析                                          |
| 数组参数序列化           | 自己用 `URLSearchParams` 拼，得到 `a=1&a=2` | `params` 有默认 `paramsSerializer`，数组拼成 `a[]=1&a[]=2`        |

## 5. 实战场景与工程实践

### 5.1 典型场景

```javascript
// 场景：带查询参数的 GET 请求
const url = new URL('/api/search', location.origin)
url.searchParams.set('kw', keyword)
url.searchParams.set('page', '1')

fetch(url) // 自动编码中文与特殊字符

// 场景：混合文本 + 文件的表单提交
const fd = new FormData()
fd.append('title', title)
fd.append('cover', coverFile)
await fetch('/api/publish', { method: 'POST', body: fd })
```

### 5.2 把筛选 / 分页状态同步到地址栏

列表页筛选条件放进 URL，刷新后状态还在，也能直接分享：

```javascript
function syncQuery(patch) {
  const url = new URL(location.href)

  for (const [key, value] of Object.entries(patch)) {
    if (value === '' || value == null) {
      url.searchParams.delete(key) // 空值不留在地址栏，URL 更干净
    } else {
      url.searchParams.set(key, value)
    }
  }

  url.searchParams.sort() // 顺序稳定，便于缓存与比较
  history.replaceState(null, '', url) // 换页用 pushState，筛选用 replaceState
}
```

### 5.3 表单 + 文件一起提交（带进度）

`fetch` 没有上传进度，要进度条就换 XHR：

```javascript
const form = document.querySelector('form')
const fd = new FormData(form)

const xhr = new XMLHttpRequest()
xhr.open('POST', '/api/publish')

xhr.upload.onprogress = e => {
  if (e.lengthComputable) {
    const percent = Math.round((e.loaded / e.total) * 100)
    console.log(`已上传 ${percent}%`)
  }
}

xhr.onload = () => console.log('完成', xhr.status)
xhr.send(fd) // 同样不要手动设 Content-Type
```

### 5.4 性能注意点

- **`new URL()` 解析成本高于字符串拼接**（要做完整解析与编码校验），但相对一次请求可忽略；循环里把 `new URL(location.href)` 提到循环外。
- **`URLSearchParams` 内部是有序列表**，`get` / `has` 顺序查找；几十个参数无感，上万才成瓶颈。
- **`Object.fromEntries(new URLSearchParams(...))`** 会先造键值对数组再造对象，只读一两个参数用 `get()` 更省。
- **`FormData` 上传大文件不占 JS 内存**（浏览器按流发送），转 base64（`readAsDataURL`）会膨胀约 33% 并整块占内存。
- 同一 `FormData` 可重复 `fetch`（不是一次性流）；**上传进度只能用 XHR / axios**，`fetch` 至今没有上传进度事件。

### 5.5 兼容性

[width(36,35,29)]

| 接口 / 特性                                                      | 支持情况                                                                                                                     | 兼容建议                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `FormData`                                                       | 2011 年（IE10）就有，现代浏览器全支持                                                                                        | 基本不用担心                                                        |
| `URL`、`URLSearchParams`                                         | 2016–2017 年前后的版本开始支持；**IE 全系不支持**                                                                            | 只面向现代浏览器可直接用；要兼容老环境需引 polyfill（如 `core-js`） |
| `url.searchParams` 活对象                                        | 与 `URL` 同期                                                                                                                | —                                                                   |
| `FormData` 的迭代器（`entries` / `keys` / `values` / `forEach`） | 2016 年左右的版本起                                                                                                          | 更早的版本只有 `get` / `getAll` / `append`                          |
| `URLSearchParams.prototype.sort()`                               | 现代浏览器均支持                                                                                                             | —                                                                   |
| `URLSearchParams.size`                                           | 2023 年前后的版本起                                                                                                          | 旧环境用 `[...params].length`                                       |
| `delete(name, value)`、`has(name, value)`                        | 较新的两参数重载                                                                                                             | 旧环境先 `getAll` 再自行判断                                        |
| `URL.canParse()`                                                 | 2023 年前后的版本起（Chrome 120+ / Firefox 115+ / Safari 17+）                                                               | 旧环境用 `try...catch` 包 `new URL()`                               |
| Node.js                                                          | `URL` / `URLSearchParams` 自 Node 10 起是全局；`fetch` / `FormData` / `Blob` 自 Node 18 起是全局，`File` 到 Node 20 才有全局 | 老项目要么升 Node，要么继续用 `form-data` 等包                      |

### 5.6 与其他方案的对比

[width(27,25,24,24)]

| 方案                      | 优点                                               | 缺点                                                  | 适用场景                              |
| ------------------------- | -------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| 手写 `+` 拼字符串         | 最快、零依赖                                       | 编码和分隔符全靠自己，极易出 bug                      | 参数固定且都是数字 / ASCII 的简单场景 |
| `URL` + `URLSearchParams` | 原生、自动编码、能读能写能改                       | 不支持嵌套结构，数组要自己约定                        | **绝大多数场景的首选**                |
| `qs` / `query-string`     | 支持嵌套对象，数组格式可配置（`a[]=1` / `a[0]=1`） | 多一个依赖和体积                                      | 参数结构复杂、要和老后端约定格式      |
| `axios` 的 `params`       | 自动拼查询串，支持数组与进度回调                   | 只在 axios 请求里可用，格式受 `paramsSerializer` 影响 | 项目本来就用 axios                    |
| Node 的 `querystring`     | —                                                  | **已废弃**，行为与 `URLSearchParams` 也不完全一致     | 只应出现在老代码里                    |

## 6. 总结

- `URL` 解析构造地址，`URLSearchParams` 读写查询串，`FormData` 承载表单与文件；三者组合即可告别手写拼接。
- `base` 让相对地址拼接可靠，`location.origin` 最常用；`url.searchParams` 是**活对象**，给 `url.search` / `url.href` 赋值则是**整串替换**。
- 重复键用 `append` / `getAll`，覆盖用 `set`；`Object.fromEntries` 会丢掉重复键。
- 编码三条结论：空格在 `URLSearchParams` 里是 `+`、`+` 要转成 `%2B`；它比 `encodeURIComponent` 多编码 `!'()~`；**交给它就别再编码**。
- 上传用 `FormData` + `fetch`，别手动设 `Content-Type`（交给浏览器）；要进度条就换 XHR / axios。

## 7. 常见问题 (FAQ)

### 7.1 手写 `?a=1&b=2` 和用 `URLSearchParams` 有什么区别？

- 它**自动编码**中文、空格、`&` 等（读出时自动解码），并管住 `?` / `&` 的位置，不会拼出 `...?&a=1`；手写拼接极易漏编码。
- 反过来，**已经交给它的值不要再自己编码**，否则双重编码（`中` → `%25E4%25B8%25AD`）。

### 7.2 `FormData` 上传时要不要手动设置 `Content-Type`？

- **不要**。`fetch`/XHR 会自动设 `multipart/form-data` 并生成随机 `boundary`；写死 `multipart/form-data` 就丢了 boundary，报文体分隔符与请求头对不上，解析必然失败。
- axios 在浏览器端也会把这个头交给浏览器处理，不要在实例或请求级覆盖它。

### 7.3 `URLSearchParams` 能处理数组吗？

- 它没有数组约定，常见做法是“**同名多值**” `?tag=a&tag=b` + `getAll('tag')`；或与后端约定 JSON 字符串放进单个参数。
- 要 `tag[]=a&tag[]=b` 就把 key 写成 `tag[]`（`params.append('tag[]', 'a')`）。
- axios 的 `params: { tag: ['a', 'b'] }` 默认拼 `tag[]=a&tag[]=b`，与 `URLSearchParams` 的 `tag=a&tag=b` **不一样**，对接前先确认。

### 7.4 `append` 和 `set` 有什么区别？

- `append`：**追加**，保留已有同名值。
- `set`：**覆盖**，先清除该 key 的所有旧值再写入。

### 7.5 `url.searchParams` 改了之后，URL 会跟着变吗？

- **会**。`url.searchParams` 是**活对象**，改它立刻反映到 `url.href` / `url.search`。
- 给 `url.search` / `url.href` **赋值是整串替换**，已加的参数会全丢，所以只改参数要用 `searchParams`。

```javascript
const url = new URL('https://example.com/?a=1')
url.searchParams.append('b', '2')
url.href // "https://example.com/?a=1&b=2"

url.search = '?c=9' // 整串替换，a、b 都不见了
url.href // "https://example.com/?c=9"
```

### 7.6 `encodeURIComponent`、`encodeURI` 和 `URLSearchParams` 该用哪个？

- 编码**一个值**（参数值、路径片段）用 `encodeURIComponent`：它把 `:`、`/`、`&`、`=` 一起编码，**不能**用于整个 URL。
- 编码**整个 URL** 用 `encodeURI`；它**不编码 `&` 和 `=`**，绝不能用于参数值。
- 构造 / 修改**查询串**直接用 `URLSearchParams`（自动编解码）；三者别叠加，已编码的值不要再 `encodeURIComponent`。

### 7.7 为什么参数里的 `+` 变成了空格（或空格变成了 `+`）？

- urlencoded 里 `+` 就是空格：`new URLSearchParams('q=a+b').get('q')` 得到 `"a b"`，`%20` 也认。
- 所以 `?q=1+1` 解析成 `"1 1"`；值里有 `+`（手机号 `+86`、base64）必须转义成 `%2B`，交给 `URLSearchParams` 或 `encodeURIComponent` 会自动做。
- 输出也一样：`toString()` 把空格写成 `+` 而非 `%20`；自己 `split('&')` 再 `decodeURIComponent` 时 `+` 还原不回空格。

### 7.8 `FormData` 上传后，后端收到空文件或文件名是 `blob` 怎么办？

- `<input type="file">` **没选文件**时，`new FormData(form)` 依然给一个 `size` 为 `0`、`name` 为空串的空 `File`，要自己跳过。
- `Blob` 没有文件名，`append` 时默认叫 `"blob"`，用第三个参数指定。
- 别忘了给 `Blob` 设 `type`（决定该 part 的 `Content-Type`），为空时后端拿不到 MIME。

```javascript
const fd = new FormData()
const file = fileInput.files[0]

if (file) {
  fd.append('avatar', file) // 有文件才 append，避免后端收到空文件
}

fd.append('cover', coverBlob, 'cover.png') // Blob 必须手动给文件名
```
