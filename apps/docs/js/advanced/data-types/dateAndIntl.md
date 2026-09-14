# Date 与 Intl：时间处理与国际化

时间处理是前端最容易「踩坑」的领域之一：时区、毫秒时间戳、格式化、夏令时，任何一个细节疏忽都会导致「订单时间差 8 小时」这类线上事故。`Date` 提供底层时间表示，`Intl` 提供专业的格式化与本地化能力。

**一句话理解**：**「`Date` 管『时间的本质』（时间戳），`Intl` 管『时间的表达』（按地区格式化成字符串）。」**

## 1. `Date` 基础

`Date` 对象内部其实只存了一个值——**从 1970-01-01 00:00:00 UTC 至今的毫秒数**（时间戳）。所有 `getFullYear()`、`getHours()` 之类的方法，都是在读取这个时间戳时**按本地时区换算**出来的。

### 1.1 创建日期

[width(41,11,48)]

| 写法                               | 时区     | 说明                                          |
| :--------------------------------- | :------- | :-------------------------------------------- |
| `new Date()`                       | 本地     | 当前时刻                                      |
| `new Date(1704067200000)`          | —        | 毫秒时间戳（10 位是秒级，需 `× 1000`）        |
| `new Date('2024-01-01T08:00:00Z')` | UTC      | ISO 字符串，带 `Z` 或 `+08:00` 最安全         |
| `new Date('2024-01-01T08:00:00')`  | 本地     | 无时区信息 → 按本地时区解析                   |
| `new Date(2024, 0, 1, 8, 0, 0, 0)` | 本地     | 年、月（**0 起**）、日、时、分、秒、毫秒      |
| `Date.UTC(2024, 0, 1, 0, 0, 0)`    | UTC      | 返回时间戳（不是 `Date` 对象），月份同样 0 起 |
| `Date.parse('2024-01-01T00:00Z')`  | 依字符串 | 字符串 → 时间戳，解析失败返回 `NaN`           |

```js
const now = new Date() // 当前时间
const d1 = new Date(1704067200000) // 通过时间戳
const d2 = new Date('2024-01-01T08:00:00Z') // 带时区，最安全
const d3 = new Date(2024, 0, 1, 8, 0, 0) // 年, 月(0-11), 日, 时, 分, 秒
const d4 = new Date(Date.UTC(2024, 0, 1)) // 明确按 UTC 构造
```

> 坑点：`new Date(year, month, ...)` 的**月份从 0 开始**（0 表示一月），而 `new Date('2024-01-01')` 的月份从 1 开始。

多传的参数不会报错，而是**向上溢出**：`new Date(2024, 12, 1)` 得到的是 2025 年 1 月 1 日，`new Date(2024, 0, 0)` 得到 2023 年 12 月 31 日——`setDate(0)` 也常被用来取「上个月最后一天」。

### 1.2 获取时间戳

[width(41,59)]

| 写法                               | 说明                                                           |
| :--------------------------------- | :------------------------------------------------------------- |
| `Date.now()`                       | 当前时间戳，最常用、性能最好（不需要创建对象）                 |
| `+new Date()`                      | 隐式调用 `valueOf()`，等价于 `getTime()`                       |
| `new Date('2024-01-01').getTime()` | 从已有对象上取                                                 |
| `Date.parse(str)`                  | 字符串 → 时间戳，解析失败返回 `NaN`                            |
| `performance.now()`                | 页面加载至今的**高精度**毫秒数（带小数），不受系统时间调整影响 |

```js
Date.now() + // 例如 1704067200000（当前时刻）
  new Date() // 同上（隐式转换）
new Date('2024-01-01T00:00:00Z').getTime() // 1704067200000
Date.parse('2024-01-01T00:00:00Z') // 1704067200000
```

> `Date.now()` 只有毫秒精度且随系统时钟调整；测量耗时用 `performance.now()`（单调递增）。

### 1.3 读取方法（getter）

[width(47,53)]

| 方法                                                     | 说明                                                  |
| :------------------------------------------------------- | :---------------------------------------------------- |
| `getTime()` / `valueOf()`                                | 时间戳（毫秒）                                        |
| `getFullYear()`                                          | 年（4 位）。**勿用 `getYear()`**，它返回「年 - 1900」 |
| `getMonth()`                                             | 月（**0-11**）                                        |
| `getDate()`                                              | 日（1-31）                                            |
| `getDay()`                                               | 星期（0=周日，6=周六）                                |
| `getHours()/getMinutes()/getSeconds()/getMilliseconds()` | 时/分/秒/毫秒（本地时区）                             |
| `getTimezoneOffset()`                                    | 本地时区与 UTC 的分钟差，UTC+8 返回 `-480`            |
| `getUTCFullYear()` / `getUTCHours()` 等                  | 每个 getter 都有一份 UTC 版本，不受本地时区影响       |

> 命名很反直觉：`getDate()` 是「几号」，`getDay()` 是「星期几」，`getMonth()` 从 0 开始，`getTimezoneOffset()` 东八区是**负数**。

### 1.4 设置方法（setter）

[width(59,41)]

| 方法                                                  | 说明                                    |
| :---------------------------------------------------- | :-------------------------------------- |
| `setFullYear(y[, m[, d]])`                            | 设年，可顺带设月、日                    |
| `setMonth(m[, d])`                                    | 设月（0-11），溢出会进位                |
| `setDate(d)`                                          | 设日，`setDate(0)` 是**上个月最后一天** |
| `setHours(h[, m[, s[, ms]]])`                         | 设时，可级联设分/秒/毫秒                |
| `setMinutes()` / `setSeconds()` / `setMilliseconds()` | 同类，同样支持级联                      |
| `setTime(ts)`                                         | 直接设时间戳                            |
| `setUTCFullYear()` 等                                 | UTC 版本                                |

```js
const d = new Date('2024-01-31')
d.setDate(0) // 2023-12-31（上个月最后一天）
d.setHours(0, 0, 0, 0) // 时、分、秒、毫秒
d.setTime(1704067200000) // 直接设时间戳
```

> 所有 setter 都会**直接修改原对象**（`Date` 是可变对象），并返回新的时间戳；要做不可变更新得自己 `new Date(d)` 复制一份。

### 1.5 转成字符串：先看时区

[width(31,13,56)]

| 方法                                            | 输出时区 | 示例                                                   |
| :---------------------------------------------- | :------- | :----------------------------------------------------- |
| `toString()`                                    | 本地     | `Mon Jan 01 2024 08:00:00 GMT+0800 (中国标准时间)`     |
| `toDateString()` / `toTimeString()`             | 本地     | `Mon Jan 01 2024` / `08:00:00 GMT+0800 (中国标准时间)` |
| `toLocaleString()`                              | 本地     | `2024/1/1 08:00:00`（可传 `Intl` 选项）                |
| `toLocaleDateString()` / `toLocaleTimeString()` | 本地     | `2024/1/1` / `08:00:00`                                |
| `toISOString()`                                 | **UTC**  | `2024-01-01T00:00:00.000Z`（固定格式，适合存储）       |
| `toJSON()`                                      | UTC      | 与 `toISOString()` 相同，供 `JSON.stringify()` 调用    |
| `toUTCString()`                                 | UTC      | `Mon, 01 Jan 2024 00:00:00 GMT`（HTTP 头格式）         |
| `valueOf()` / `getTime()`                       | —        | 时间戳数字，不转字符串                                 |

```js
const t = new Date('2024-01-01T00:00:00Z') // UTC 零点

t.toString() // 本地时区："Mon Jan 01 2024 08:00:00 GMT+0800"
t.toISOString() // 统一 UTC："2024-01-01T00:00:00.000Z"
```

> `toISOString()` 遇到**无效日期**（`Invalid Date`）会抛 `RangeError`，格式化前先用 `Number.isNaN(d.getTime())` 判断。

### 1.6 日期字符串的解析规则

同样是「像日期的字符串」，带不带时间、带不带时区，解析结果完全不同：

[width(35,16,49)]

| 字符串形式                   | 解析时区   | 说明                                      |
| :--------------------------- | :--------- | :---------------------------------------- |
| `2024-01-01`（仅日期）       | **UTC**    | 规范规定「只有日期」的形式按 UTC 解析     |
| `2024-01-01T00:00`（无时区） | **本地**   | 规范规定「日期+时间」的形式按本地时区解析 |
| `2024-01-01T00:00Z`          | UTC        | 带 `Z`，明确表示 UTC，最安全              |
| `2024-01-01T00:00+08:00`     | 指定偏移   | 显式声明偏移，推荐                        |
| `2024/01/01`、`Jan 1 2024`   | 实现自定义 | 非 ISO 格式**不要依赖**，各引擎结果不一   |

```js
new Date('2024-01-01').toISOString() // 按 UTC：2024-01-01T00:00:00.000Z
new Date('2024-01-01T00:00').toISOString() // 按本地（UTC+8）：2023-12-31T16:00:00.000Z
new Date('2024-01-01T00:00Z').toISOString() // 明确 UTC：2024-01-01T00:00:00.000Z
```

## 2. 时区陷阱

**时间戳是绝对的，显示是相对的。** 同一个时间戳，在 UTC+8 显示 08:00，在 UTC 显示 00:00：

```js
const t = new Date('2024-01-01T00:00:00Z')

t.getHours() // UTC+8 环境下是 8
t.getUTCHours() // 0（与运行环境无关）
t.toString() // "Mon Jan 01 2024 08:00:00 GMT+0800"
t.toISOString() // "2024-01-01T00:00:00.000Z"
```

### 2.1 避坑原则

- **存储/传输**一律用 **UTC 时间戳** 或 **带时区的 ISO 字符串**；不要存 `2024-01-01 00:00:00` 这种没有时区标识的字符串。
- **展示**时再转成本地时区，交给 `Intl` 格式化。
- 不要把「浏览器时区」当成「业务时区」：跨境电商、机票、直播等场景要显式指定 `timeZone`。
- 不要用无时区字符串做跨时区比较，它的含义在规范里就有两种。

### 2.2 显式指定时区格式化

```js
const d = new Date('2024-01-05T10:30:00Z')

// 无论用户在哪，都按「纽约时区」展示
new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'America/New_York',
  dateStyle: 'full',
  timeStyle: 'long',
}).format(d)

// 用户当前时区（用于显示「你的本地时间」）
Intl.DateTimeFormat().resolvedOptions().timeZone // "Asia/Shanghai"
```

> `timeZone` 只接受 IANA 时区名（`Asia/Shanghai`、`America/New_York`、`UTC`），`Asia/Beijing`、`GMT+8` 这类写法会抛 `RangeError`。可用 `Intl.supportedValuesOf('timeZone')` 查全部合法取值。

## 3. 日期计算

### 3.1 加减时间：基于时间戳

```js
const DAY = 24 * 60 * 60 * 1000

const d = new Date('2024-01-31T00:00:00Z')
const tomorrow = new Date(d.getTime() + DAY)
const lastWeek = new Date(d.getTime() - 7 * DAY)

d.setTime(d.getTime() + DAY) // 也可以原地修改
```

### 3.2 计算两个时间的差

```js
const diff = date2 - date1 // 毫秒差（隐式 valueOf()）
const seconds = diff / 1000
const days = diff / (1000 * 60 * 60 * 24)
```

> `diff` 可能是负数（`date2` 早于 `date1`）；展示天数时按业务决定取整方式——`Math.floor`（不满一天不算）、`Math.ceil`（不满一天算一天）还是 `Math.round`。**「日历上的天数差」不能简单用毫秒除法**（月份长度不一、有夏令时），要按日期字段算。

### 3.3 月末溢出陷阱

```js
const d = new Date('2024-01-31')

d.setMonth(d.getMonth() + 1) // 结果会是 2024-03-02，而不是 02-29！
```

`setMonth` 只是「月份 +1」，日仍保留 31，2 月装不下就继续往后溢出。稳妥做法是按时间戳加减，或先把「日」夹到目标月份的天数内：

```js
// 稳妥做法 1：基于时间戳加减（简单，但「月长不一」时日期会有偏差）
const nextMonth = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000)

// 稳妥做法 2：先按目标月份的天数夹住「日」，再改月份（月末安全）
const daysIn = (year, month) => new Date(year, month + 1, 0).getDate() // month 从 0 起

const d2 = new Date('2024-01-31')
d2.setDate(Math.min(d2.getDate(), daysIn(d2.getFullYear(), d2.getMonth() + 1)))
d2.setMonth(d2.getMonth() + 1) // 2024-02-29
```

> 坑点：月份加减、月末、闰年、跨年这些「日历运算」用原生 `Date` 都很容易出错，业务里推荐 dayjs / date-fns，或等 **Temporal** 落地。

### 3.4 夏令时（DST）

夏令时切换当天的「本地一天」只有 23 小时或 25 小时。以纽约 2024-03-10 为例（本地 00:00 EST = 05:00Z，次日本地 00:00 EDT = 04:00Z）：

```js
const start = new Date('2024-03-10T05:00:00Z') // 纽约 3/10 本地零点
const end = new Date('2024-03-11T04:00:00Z') // 纽约 3/11 本地零点

;(end - start) / 3600000 // 23（不是 24）
;(end - start) / 86400000 // 0.958333...
```

所以用毫秒除法算「日历上的天数」会得到小数（或直接用本地时间构造日期时少算一天）。对「人类日历上的天数」要按日期字段计算，或直接交给 `Temporal` / 日期库。

## 4. `Intl`：专业格式化

`Intl` 是 ECMAScript 国际化 API，按「地区（locale）」自动套用对应的日期、数字、货币、单位格式，避免手写 `YYYY-MM-DD` 拼接。

所有构造器的签名统一为 `new Intl.Xxx(locales, options)`：

- `locales`：字符串或数组（如 `['zh-Hans-CN', 'en']`，按顺序回退），省略时用运行环境默认 locale。
- `options`：该构造器自己的配置对象。
- 实例通用方法：`format()`、`resolvedOptions()`、`supportedLocalesOf()`（静态方法）。

### 4.1 Intl 全家桶总览

[width(32,30,38)]

| 构造器                    | 用途                     | 示例输出                              |
| :------------------------ | :----------------------- | :------------------------------------ |
| `Intl.DateTimeFormat`     | 日期时间格式化           | `2024/1/5 10:30`                      |
| `Intl.NumberFormat`       | 数字、货币、百分比、单位 | `¥1,234.57`、`12%`、`100 km/h`        |
| `Intl.RelativeTimeFormat` | 相对时间                 | `3天前`、`昨天`                       |
| `Intl.ListFormat`         | 按语言习惯连接列表       | `HTML、CSS和JS`                       |
| `Intl.PluralRules`        | 复数规则（one/other…）   | 决定 `1 item` / `2 items`             |
| `Intl.Collator`           | 本地化字符串比较/排序    | `'a'.localeCompare('b', 'zh')` 的底层 |
| `Intl.DisplayNames`       | 语言、地区、货币的名称   | `美国`、`简体中文`                    |
| `Intl.Segmenter`          | 分词 / 分句 / 字素切分   | emoji 安全的按「字」计数              |
| `Intl.Locale`             | 解析与构造 locale        | `zh-Hans-CN` 各部分拆解               |
| `Intl.DurationFormat`     | 时长格式化（较新）       | `1小时30分钟`                         |
| `Intl.supportedValuesOf`  | 查询环境支持的全部取值   | 所有合法时区名                        |

```js
new Intl.ListFormat('zh-CN').format(['HTML', 'CSS', 'JS']) // "HTML、CSS和JS"

new Intl.DisplayNames('zh-CN', { type: 'region' }).of('US') // "美国"

const seg = new Intl.Segmenter('zh-CN', { granularity: 'word' })
const words = [...seg.segment('你好世界')].map(s => s.segment) // ["你好", "世界"]

const collator = new Intl.Collator('zh-CN', { numeric: true })
const nums = [10, 2, 1]
nums.sort(collator.compare) // [1, 2, 10]
```

> `Intl.DurationFormat` 较新，使用前判断 `typeof Intl.DurationFormat !== 'undefined'`；判断某个 locale 是否被支持用 `Intl.DateTimeFormat.supportedLocalesOf(['xx-YY'])`。

### 4.2 `Intl.DateTimeFormat`

**基础语法**: `new Intl.DateTimeFormat(locales?, options?)`

```js
const d = new Date('2024-01-05T10:30:00')

new Intl.DateTimeFormat('zh-CN').format(d)
// "2024/1/5"

new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(d)
// "2024/01/05 10:30"
```

[width(18,48,34)]

| 选项                     | 取值                                                                               | 说明                                              |
| :----------------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------ |
| `timeZone`               | IANA 时区名，如 `'Asia/Shanghai'`、`'UTC'`                                         | 输出时区，默认取运行环境时区                      |
| `dateStyle`              | `'full'`/`'long'`/`'medium'`/`'short'`                                             | 整套日期预置样式                                  |
| `timeStyle`              | 同上                                                                               | 整套时间预置样式                                  |
| `year`                   | `'numeric'`/`'2-digit'`                                                            | 年                                                |
| `month`                  | `'numeric'`/`'2-digit'`/`'long'`/`'short'`/`'narrow'`                              | 月，`long` 为「一月」                             |
| `day`                    | `'numeric'`/`'2-digit'`                                                            | 日                                                |
| `weekday`                | `'long'`/`'short'`/`'narrow'`                                                      | 星期，`long` 为「星期一」                         |
| `era`                    | `'long'`/`'short'`/`'narrow'`                                                      | 纪元（公元 / 公元前）                             |
| `hour`/`minute`/`second` | `'numeric'`/`'2-digit'`                                                            | 时 / 分 / 秒                                      |
| `fractionalSecondDigits` | `1`/`2`/`3`                                                                        | 秒后小数位数（毫秒）                              |
| `hour12`                 | `true`/`false`                                                                     | 12 / 24 小时制，与 `hourCycle` 同时给出时以它为准 |
| `hourCycle`              | `'h11'`/`'h12'`/`'h23'`/`'h24'`                                                    | 更细的小时制，`h23` 不会出现「24 点」             |
| `timeZoneName`           | `'short'`/`'long'`/`'shortOffset'`/`'longOffset'`/`'shortGeneric'`/`'longGeneric'` | 展示时区名，如 `GMT+8` 或 `中国标准时间`          |
| `calendar`               | `'gregory'`/`'chinese'`/`'islamic'` 等                                             | 历法                                              |
| `numberingSystem`        | `'latn'`/`'hanidec'`/`'hans'` 等                                                   | 数字系统，`'hanidec'` 输出「二〇二四年」          |
| `formatMatcher`          | `'basic'`/`'best fit'`                                                             | 选项无法完全满足时的匹配策略，极少用              |
| `localeMatcher`          | `'lookup'`/`'best fit'`                                                            | locale 协商策略，极少用                           |

> `dateStyle`/`timeStyle` **不能与 `year`、`month` 这类逐项选项同时使用**，同时给会抛 `TypeError`。

[width(39,61)]

| 方法                             | 说明                                                           |
| :------------------------------- | :------------------------------------------------------------- |
| `format(date)`                   | 格式化 `Date` 对象或时间戳 → 字符串（无效日期抛 `RangeError`） |
| `formatToParts(date)`            | 拆成 `{ type, value }` 数组，便于自定义拼接（如日期分段着色）  |
| `formatRange(start, end)`        | 格式化时间区间，如 `2024/1/1 – 2024/1/5`                       |
| `formatRangeToParts(start, end)` | 区间版的 `formatToParts`                                       |
| `resolvedOptions()`              | 查看实际生效的选项（时区、locale、日历等）                     |
| `supportedLocalesOf(locales)`    | 判断环境是否支持给定 locale（静态方法）                        |

```js
const dtf = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'full',
  timeStyle: 'long',
  timeZone: 'Asia/Shanghai',
})

dtf.format(Date.now()) // 完整日期 + 时区名
dtf.formatToParts(Date.now()) // [{ type: 'year', value: '2024' }, ...]
dtf.resolvedOptions().timeZone // "Asia/Shanghai"

// 区间格式化
new Intl.DateTimeFormat('zh-CN').formatRange(
  new Date('2024-01-01'),
  new Date('2024-01-05'),
)
// "2024/1/1 – 2024/1/5"
```

### 4.3 `Intl.NumberFormat`

[width(33,34,33)]

| 选项                              | 取值                                                      | 说明                                                                            |
| :-------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------ |
| `style`                           | `'decimal'`（默认）/`'percent'`/`'currency'`/`'unit'`     | 格式大类                                                                        |
| `currency`                        | ISO 4217 代码，如 `'CNY'`、`'USD'`                        | `style: 'currency'` 时**必需**，否则抛 `TypeError`                              |
| `currencyDisplay`                 | `'symbol'`/`'narrowSymbol'`/`'code'`/`'name'`             | `¥1,000.00` / `CNY 1,000.00` / `1,000.00人民币`                                 |
| `currencySign`                    | `'standard'`/`'accounting'`                               | `accounting` 下负数用括号：`(¥1,000.00)`                                        |
| `unit`                            | `'kilometer'`、`'kilometer-per-hour'` 等                  | `style: 'unit'` 时必需                                                          |
| `unitDisplay`                     | `'long'`/`'short'`/`'narrow'`                             | `每小时100公里` / `100 km/h` / `100km/h`                                        |
| `notation`                        | `'standard'`/`'scientific'`/`'engineering'`/`'compact'`   | 科学计数法、紧凑记法                                                            |
| `compactDisplay`                  | `'short'`/`'long'`                                        | 紧凑记法下的长短形式                                                            |
| `useGrouping`                     | `true`/`false`/`'always'`/`'auto'`/`'min2'`               | 千分位；`'min2'` 表示首位分组至少 2 位才分组（`1234` 不加，`12345` → `12,345`） |
| `signDisplay`                     | `'auto'`/`'never'`/`'always'`/`'exceptZero'`/`'negative'` | 是否显示正负号，适合涨跌幅                                                      |
| `minimumIntegerDigits`            | 1-21                                                      | 整数部分最少位数                                                                |
| `minimumFractionDigits`           | 0-100                                                     | 小数部分最少位数，默认 0                                                        |
| `maximumFractionDigits`           | 0-100                                                     | 小数部分最多位数，默认 3                                                        |
| `minimumSignificantDigits`        | 1-21                                                      | 有效数字下限（与小数位数组**互斥**）                                            |
| `maximumSignificantDigits`        | 1-21                                                      | 有效数字上限                                                                    |
| `roundingMode`                    | `'ceil'`/`'floor'`/`'expand'`/`'trunc'`/`'halfExpand'` 等 | 舍入策略，默认 `halfExpand`（四舍五入）                                         |
| `trailingZeroDisplay`             | `'auto'`/`'stripIfInteger'`                               | 整数时是否去掉 `.00`                                                            |
| `numberingSystem`/`localeMatcher` | 同 `DateTimeFormat`                                       |                                                                                 |

| 方法                             | 说明                                                      |
| :------------------------------- | :-------------------------------------------------------- |
| `format(number)`                 | 数字 → 字符串（按最大小数位**四舍五入**，默认保留 3 位）  |
| `formatToParts(number)`          | 拆成 `{ type, value }` 数组，可单独取「货币符号」「数值」 |
| `formatRange(start, end)`        | 格式化数值区间，如 `¥1.00 - ¥5.00`                        |
| `formatRangeToParts(start, end)` | 区间版的 `formatToParts`                                  |
| `resolvedOptions()`              | 查看实际生效的选项                                        |
| `supportedLocalesOf(locales)`    | 判断 locale 支持情况（静态方法）                          |

```js
// 千分位
new Intl.NumberFormat('zh-CN').format(1234567.89) // "1,234,567.89"

// 货币
new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(
  1000,
) // "¥1,000.00"

// 百分比
new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(0.123) // "12%"

// 保留小数位
new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(3.14159) // "3.14"

// 紧凑记法（大数字看板常用）
new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(12345) // "1.2万"

// 单位
new Intl.NumberFormat('zh-CN', {
  style: 'unit',
  unit: 'kilometer-per-hour',
}).format(100)
// "100 km/h"

new Intl.NumberFormat('zh-CN', {
  style: 'unit',
  unit: 'kilometer-per-hour',
  unitDisplay: 'long',
}).format(100)
// "每小时100公里"

// 带正号的涨跌幅
new Intl.NumberFormat('zh-CN', { signDisplay: 'always' }).format(5) // "+5"
```

> 精度提醒：`Intl.NumberFormat` 只负责「排版」，不解决浮点误差。金额建议以「分」为单位用整数计算，超过 `2^53 - 1` 的整数用 `BigInt` 单独处理。

### 4.4 `Intl.RelativeTimeFormat`

```js
const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
rtf.format(-1, 'day') // "昨天"
rtf.format(2, 'day') // "后天"
rtf.format(-30, 'minute') // "30分钟前"
rtf.format(1, 'week') // "下周"
```

数值是**相对当前时刻的偏移**，负数表示过去；`unit` 取值与含义：

[width(28,21,51)]

| unit        | 含义 | `numeric: 'auto'` 时的惯用说法       |
| :---------- | :--- | :----------------------------------- |
| `'year'`    | 年   | 去年 / 今年 / 明年                   |
| `'quarter'` | 季度 | 上季度 / 本季度 / 下季度             |
| `'month'`   | 月   | 上个月 / 本月 / 下个月               |
| `'week'`    | 周   | 上周 / 本周 / 下周                   |
| `'day'`     | 日   | 昨天 / 今天 / 明天                   |
| `'hour'`    | 小时 | 只有数字形式（`3小时前`、`3小时后`） |
| `'minute'`  | 分钟 | 只有数字形式（`30分钟前`）           |
| `'second'`  | 秒   | 只有数字形式（`10秒钟前`）           |

[width(15,34,51)]

| 选项      | 取值                          | 说明                                                 |
| :-------- | :---------------------------- | :--------------------------------------------------- |
| `numeric` | `'always'`（默认）/`'auto'`   | `'auto'` 时才允许「昨天」「下周」这类惯用说法        |
| `style`   | `'long'`/`'short'`/`'narrow'` | 文案长度，中文里 `short`/`narrow` 与 `long` 差别很小 |

方法：`format(value, unit)`、`formatToParts(value, unit)`、`resolvedOptions()`、`supportedLocalesOf()`。

### 4.5 性能：复用格式化器实例

构造 `Intl` 对象**开销很大**（要查 locale、时区、ICU 数据），不要在循环或渲染函数里反复 `new`：

[width(55,45)]

| 写法                                            | 说明                                                   |
| :---------------------------------------------- | :----------------------------------------------------- |
| `new Intl.DateTimeFormat(...).format(d)`        | 每次都新建格式化器，循环中会明显变慢                   |
| `const dtf = new Intl.DateTimeFormat(...)` 复用 | 推荐；实例是**无状态**的，可以模块级缓存               |
| `d.toLocaleString('zh-CN', options)`            | 写法最短，但**内部同样要新建格式化器**，不适合高频调用 |
| `Intl.DateTimeFormat(...)`（省略 `new`）        | 等价写法，可读性更简洁                                 |

```js
// 模块级缓存（按 locale + options 维度缓存）
const cache = new Map()
function getFormatter(locale, options) {
  const key = locale + JSON.stringify(options)
  if (!cache.has(key)) cache.set(key, new Intl.DateTimeFormat(locale, options))
  return cache.get(key)
}
```

## 5. 实用封装

### 5.1 时间戳转 `YYYY-MM-DD HH:mm:ss`

```js
// 本地时区
function formatDate(timestamp) {
  const d = new Date(timestamp)
  const pad = n => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}
```

### 5.2 用 `Intl` 输出本地化时间

```js
const dtf = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
dtf.format(Date.now()) // 例："2024年1月5日 10:30"
```

### 5.3 相对时间（多久之前）

`Intl` 版本，自动处理单复数与惯用说法：

```js
const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

function timeAgo(timestamp) {
  const diff = (timestamp - Date.now()) / 1000 // 负数为过去
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diff) >= seconds || unit === 'second') {
      return rtf.format(Math.round(diff / seconds), unit)
    }
  }
}
```

手写版本，便于自定义文案（如「刚刚」）：

```js
function timeAgoText(timestamp) {
  const diff = Date.now() - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  return formatDate(timestamp)
}
```

## 6. 常见问题 (FAQ)

### 6.1 为什么后台时间戳前端显示差 8 小时？

后台返回的通常是 UTC 时间，前端用 `new Date()` 会按本地时区显示。**这不是 bug，而是时区转换**。展示前确认业务预期是「本地时区」还是「统一 UTC」，并用 `Intl` 或指定时区格式化。

### 6.2 为什么 `getYear()` 返回 124？

`getYear()` 是废弃方法，返回「年份 - 1900」。永远使用 `getFullYear()`。

### 6.3 为什么 `new Date('2024-01-01')` 的时间是 08:00 而不是 00:00？

因为**只有日期**的字符串按规范用 UTC 解析：`2024-01-01` → `2024-01-01T00:00:00Z`，转到 UTC+8 就是当天 08:00。想表示「本地零点」要写 `new Date(2024, 0, 1)` 或带偏移的 `2024-01-01T00:00:00+08:00`。

### 6.4 时间戳是 10 位还是 13 位？

10 位是**秒级**（如 `1704067200`），13 位是**毫秒级**（如 `1704067200000`），两者差 1000 倍。后端返回秒时，前端必须 `× 1000`；经验判断：`时间戳 > 1e12` 一般是毫秒。

### 6.5 两个日期怎么比较大小？怎么判断是同一天？

比较用 `>`、`<` 或做差（会隐式调用 `valueOf()`）：`date2 - date1 > 0`。**不能用 `==`/`===`**，那比较的是对象引用；判断同一天要按日期字段比较：

```js
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

// 或借用本地化的日期字符串
a.toDateString() === b.toDateString()
```

### 6.6 `Invalid Date` 怎么判断？

```js
const d = new Date('不是日期')
Number.isNaN(d.getTime()) // true
```

`Invalid Date` 参与任何计算都得到 `NaN`，`toISOString()` 会抛 `RangeError`，渲染前应做兜底。

### 6.7 `Intl` 和 `toLocaleString()` 用哪个？

一次性格式化用 `toLocaleString('zh-CN', options)` 更简洁；循环、列表、高频渲染要用缓存的 `Intl` 实例——每次 `toLocaleString` 都会在内部重新构造格式化器。

### 6.8 夏令时那天为什么少了一小时？

DST 切换当天只有 23（或 25）小时，`(end - start) / 86400000` 会得到小数。要算「日历上的天数」应按日期字段计算，或交给 `Temporal` / dayjs 这类库。

### 6.9 `Intl.NumberFormat` 格式化大数为什么会失真？

`format()` 接收的是 `Number`，整数超过 `2^53 - 1` 就无法精确表示。金额用「分」为单位的整数运算，超大数用 `BigInt` 计算、再自行格式化。

### 6.10 如何做倒计时，避免 `setInterval` 漂移？

`setInterval` 会因事件循环阻塞而累积误差，倒计时应基于**目标时间戳与当前时间戳的差值**计算，而非简单递减：

```js
const end = Date.now() + 60_000
const timer = setInterval(() => {
  const remain = end - Date.now()
  if (remain <= 0) return clearInterval(timer)
  console.log(Math.ceil(remain / 1000))
}, 1000)
```
