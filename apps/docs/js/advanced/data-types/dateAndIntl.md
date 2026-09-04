# Date 与 Intl：时间处理与国际化

时间处理是前端最容易「踩坑」的领域之一：时区、毫秒时间戳、格式化、夏令时，任何一个细节疏忽都会导致「订单时间差 8 小时」这类线上事故。`Date` 提供底层时间表示，`Intl` 提供专业的格式化与本地化能力。

**一句话理解**：**「`Date` 管『时间的本质』（时间戳），`Intl` 管『时间的表达』（按地区格式化成字符串）。」**

## 1. `Date` 基础

`Date` 对象内部其实只存了一个值——**从 1970-01-01 00:00:00 UTC 至今的毫秒数**（时间戳）。

### 1.1 创建日期

```javascript
const now = new Date() // 当前时间
const d1 = new Date(1700000000000) // 通过时间戳
const d2 = new Date('2024-01-01T08:00:00') // 通过字符串（推荐用 ISO 格式）
const d3 = new Date(2024, 0, 1, 8, 0, 0) // 年, 月(0-11), 日, 时, 分, 秒
```

> 坑点：`new Date(year, month, ...)` 的**月份从 0 开始**（0 表示一月），而 `new Date('2024-01-01')` 的月份从 1 开始。

### 1.2 获取时间戳

```javascript
Date.now() + // 当前时间戳（最常用，性能好）
  new Date() // 隐式转数值
new Date('2024-01-01').getTime()
```

### 1.3 常用 getter 方法

| 方法                                            | 说明                      |
| ----------------------------------------------- | ------------------------- |
| `getTime()`                                     | 返回时间戳                |
| `getFullYear()`                                 | 年（4 位，勿用 getYear）  |
| `getMonth()`                                    | 月（0-11）                |
| `getDate()`                                     | 日（1-31）                |
| `getDay()`                                      | 星期（0=周日）            |
| `getHours()/Minutes()/Seconds()/Milliseconds()` | 时/分/秒/毫秒（本地时区） |
| `getUTCHours()` 等                              | 对应 UTC 时区的值         |

### 1.4 常用 setter 方法

```javascript
const d = new Date()
d.setFullYear(2025)
d.setMonth(5) // 6 月（0 起）
d.setDate(15)
d.setHours(0, 0, 0, 0) // 时、分、秒、毫秒
d.setTime(1700000000000) // 直接设时间戳
```

## 2. 时区陷阱

`Date` 默认按**运行环境（浏览器）的本地时区**显示，但内部是绝对时间戳。同一时间戳在不同时区显示不同：

```javascript
const t = new Date('2024-01-01T00:00:00Z') // Z 表示 UTC 时间

t.toString() // 本地时区：如 "Mon Jan 01 2024 08:00:00 GMT+0800"
t.toISOString() // 统一 UTC：  "2024-01-01T00:00:00.000Z"
```

### 2.1 各输出方法的时区差异

| 方法               | 输出时区 | 示例                                |
| ------------------ | -------- | ----------------------------------- |
| `toString()`       | 本地时区 | `Mon Jan 01 2024 08:00:00 GMT+0800` |
| `toISOString()`    | **UTC**  | `2024-01-01T00:00:00.000Z`          |
| `toLocaleString()` | 本地时区 | `2024/1/1 08:00:00`                 |
| `getHours()`       | 本地时区 | `8`                                 |
| `getUTCHours()`    | UTC      | `0`                                 |

### 2.2 避坑原则

- **存储/传输**一律用 **UTC 时间戳** 或 **ISO 字符串（带时区）**。
- **展示**时再转成本地时区，交给 `Intl` 格式化。
- 不要用 `new Date('2024-01-01')` 这种**无时区**字符串做跨时区判断，它会被解析为 UTC 还是本地因引擎而异。

### 2.3 时区字符串解析的差异

```javascript
new Date('2024-01-01') // 多数引擎按 UTC 解析（有争议）
new Date('2024-01-01T00:00') // 按本地时区解析
new Date('2024-01-01T00:00Z') // 明确 UTC（最安全）
```

## 3. 日期计算

```javascript
const d = new Date('2024-01-31')

d.setMonth(d.getMonth() + 1) // 结果会是 2024-03-02，而不是 02-29！

// 稳妥做法：基于时间戳加减
const nextMonth = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000)
```

> 坑点：`setMonth` 会「溢出」到后续月份（1 月 31 日 + 1 个月 = 3 月 2 日）。跨月/跨年计算推荐用时间戳，或引入 dayjs / date-fns 等库。

### 3.1 计算两个时间差

```javascript
const diff = date2 - date1 // 毫秒差
const days = diff / (1000 * 60 * 60 * 24)
const hours = diff / (1000 * 60 * 60)
```

## 4. `Intl`：专业格式化

`Intl` 是 ECMAScript 国际化 API，按「地区 (locale)」自动套用对应的日期、数字、货币格式，避免手写 `YYYY-MM-DD` 拼接。

### 4.1 `Intl.DateTimeFormat`

```javascript
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

### 4.2 指定时区格式化

```javascript
// 无论用户在哪，都按「纽约时区」展示
new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'America/New_York',
  dateStyle: 'full',
  timeStyle: 'long',
}).format(d)
```

### 4.3 `Intl.NumberFormat`

```javascript
// 千分位
new Intl.NumberFormat('zh-CN').format(1234567.89) // "1,234,567.89"

// 货币
new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(
  1000,
)
// "¥1,000.00"

// 百分比
new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(0.123)
// "12%"

// 保留小数位
new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(3.14159) // "3.14"
```

### 4.4 `Intl.RelativeTimeFormat`

```javascript
const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
rtf.format(-1, 'day') // "昨天"
rtf.format(2, 'day') // "后天"
rtf.format(-30, 'minute') // "30分钟前"
rtf.format(1, 'week') // "下周"
```

## 5. 实用封装

```javascript
// 时间戳转 'YYYY-MM-DD HH:mm:ss'（本地时区）
function formatDate(timestamp) {
  const d = new Date(timestamp)
  const pad = n => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}
```

### 5.1 相对时间（多久之前）

```javascript
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const minute = 60 * 1000,
    hour = 60 * minute,
    day = 24 * hour

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

### 6.3 如何做倒计时，避免 `setInterval` 漂移？

`setInterval` 会因事件循环阻塞而累积误差，倒计时应基于**目标时间戳与当前时间戳的差值**计算，而非简单递减：

```javascript
const end = Date.now() + 60_000
const timer = setInterval(() => {
  const remain = end - Date.now()
  if (remain <= 0) return clearInterval(timer)
  console.log(Math.ceil(remain / 1000))
}, 1000)
```

### 6.4 为什么 `new Date('2024-01-01')` 的时间是 08:00 而不是 00:00？

因为该字符串没有时区信息，不同引擎解析规则不同（有的按 UTC、有的按本地）。若在 UTC+8 地区按本地解析，就是当天 00:00；若按 UTC 解析再转本地，就是 08:00。**始终使用带时区的 ISO 字符串**（如 `2024-01-01T00:00:00Z` 或明确本地偏移）。

## 7. 总结

- `Date` 存的是**时间戳**，月份从 0 开始，跨月计算防溢出。
- 存储/传输用 **UTC**，展示用本地时区 + `Intl`。
- `Intl` 覆盖日期、数字、货币、相对时间、指定时区，别再手写格式化。
- 复杂场景（时区、闰年、相对时间）优先用 dayjs / date-fns。
