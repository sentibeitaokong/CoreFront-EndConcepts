# HTML5 地理定位 (Geolocation API)

HTML5 Geolocation API 允许网页获取用户设备的**当前地理位置（经纬度）**。它被广泛应用于地图导航、本地生活服务（外卖 / 打车 / 附近的店）、运动轨迹记录、签到打卡等场景。

## 1. 核心对象与兼容性检测

所有功能都挂载在全局对象 **`navigator.geolocation`** 上。

**检测浏览器是否支持：**

```js
if ('geolocation' in navigator) {
  console.log('✅ 支持地理定位')
} else {
  console.log('❌ 不支持，请提示用户或降级处理')
}
```

## 2. 核心方法

[width(32,43,25)]

| 方法                                              | 描述                                                                   | 返回值                              |
| :------------------------------------------------ | :--------------------------------------------------------------------- | :---------------------------------- |
| **`getCurrentPosition(success, error, options)`** | **获取一次**当前位置。调用一次，回调一次，之后不再更新。               | `undefined`（结果通过回调异步返回） |
| **`watchPosition(success, error, options)`**      | **持续监听**位置变化（像导航一样）。每次位置改变，`success` 都会执行。 | `watchId`（数字，用于取消监听）     |
| **`clearWatch(watchId)`**                         | **停止监听**。传入 `watchPosition` 返回的 `watchId`。                  | 无                                  |

## 3. 参数详解

`getCurrentPosition` 和 `watchPosition` 接收**完全相同**的三个参数：`(success, error, options)`。

### 3.1 `success` 回调（必填）

定位成功时调用，参数是一个 **`GeolocationPosition`** 对象。

**返回值结构：**

```js
{
  coords: {
    latitude: 39.9042,         // 纬度（十进制，WGS-84）
    longitude: 116.4074,       // 经度（十进制，WGS-84）
    altitude: 43.5,            // 海拔（米），不支持时为 null
    accuracy: 15.3,            // 水平精度（米）
    altitudeAccuracy: null,    // 海拔精度（米），不支持时为 null
    heading: NaN,              // 前进方向（度，0° = 正北），静止时可能是 NaN 或 null
    speed: null,               // 移动速度（米/秒），静止时可能是 null
  },
  timestamp: 1710000000000     // 定位时间戳（Unix 毫秒）
}
```

**`coords` 各属性详解：**

[width(24,23,53)]

| 属性               | 说明                   | 备注                                                          |
| :----------------- | :--------------------- | :------------------------------------------------------------ |
| **`latitude`**     | **纬度**（-90 ~ 90）   | 十进制，如 `39.9042`（北京）                                  |
| **`longitude`**    | **经度**（-180 ~ 180） | 十进制，如 `116.4074`                                         |
| **`accuracy`**     | **水平精度**（米）     | 真实位置在以坐标为中心、`accuracy` 为半径的圆内。值越小越准。 |
| `altitude`         | 海拔高度（米）         | 无气压计/不支持时返回 `null`                                  |
| `altitudeAccuracy` | 海拔精度（米）         | 不支持时返回 `null`                                           |
| `heading`          | 前进方向（度）         | 0~360（0 为正北），仅移动中有意义，静止可能是 `NaN` 或 `null` |
| `speed`            | 速度（米/秒）          | 仅移动中有意义，静止可能是 `null`                             |
| `timestamp`        | 定位时间戳             | Unix 毫秒，注意 `position.timestamp` 而非 `coords` 下的字段   |

### 3.2 `error` 回调（选填）

定位失败时调用，参数是一个 **`GeolocationPositionError`** 对象，含 `code`（错误码）和 `message`（人类可读描述）。

**错误码 `error.code`：**

[width(10,30,60)]

| 代码  | 常量名                 | 含义                                                                             |
| :---- | :--------------------- | :------------------------------------------------------------------------------- |
| **1** | `PERMISSION_DENIED`    | **用户拒绝**授权（或浏览器策略禁止）。用户点击了「禁止」，或页面被安全策略拦截。 |
| **2** | `POSITION_UNAVAILABLE` | **位置不可用**。GPS 信号弱、网络断开、定位服务异常等导致无法定位。               |
| **3** | `TIMEOUT`              | **超时**。在 `options.timeout` 指定时间内未获取到位置。                          |

### 3.3 `options` 配置对象（选填）

[width(18,10,16,56)]

| 属性                     | 类型    | 默认值     | 说明                                                                                                          |
| :----------------------- | :------ | :--------- | :------------------------------------------------------------------------------------------------------------ |
| **`enableHighAccuracy`** | Boolean | `false`    | 是否开启**高精度模式**（优先启用 GPS）。`true` 更准但**更费电、更慢**；`false` 通常用 WiFi / 基站 / IP 定位。 |
| **`timeout`**            | Number  | `Infinity` | **超时时间**（毫秒）。超过该时间未定位成功则触发 `error`（Code 3）。                                          |
| **`maximumAge`**         | Number  | `0`        | **允许返回的缓存时间**（毫秒）。`0` 表示强制获取最新位置；`Infinity` 表示接受任意旧的缓存位置。               |

一个推荐配置示例：

```js
const options = {
  enableHighAccuracy: false, // 非地图类应用建议关闭，省电又快
  timeout: 10000, // 10 秒超时，避免无限等待
  maximumAge: 60000, // 允许返回 1 分钟内的缓存，提升响应速度
}
```

## 4. 基础示例：获取一次位置

```html
<button id="btn">获取我的位置</button>
<div id="output"></div>

<script>
  const btn = document.getElementById('btn')
  const output = document.getElementById('output')

  btn.onclick = function () {
    if (!navigator.geolocation) {
      output.innerHTML = '您的浏览器不支持地理定位'
      return
    }

    output.innerHTML = '定位中...'

    navigator.geolocation.getCurrentPosition(
      // 1. 成功回调
      position => {
        const { latitude, longitude, accuracy } = position.coords
        output.innerHTML = `
          <p>纬度: ${latitude}</p>
          <p>经度: ${longitude}</p>
          <p>精度: ${accuracy} 米</p>
          <p>定位时间: ${new Date(position.timestamp).toLocaleString()}</p>
          <p>注意：这是 WGS84 坐标，在中国地图上显示需要转换。</p>
        `
      },
      // 2. 失败回调
      error => {
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            output.innerHTML = '用户拒绝了定位请求，请前往浏览器设置开启权限。'
            break
          case 2: // POSITION_UNAVAILABLE
            output.innerHTML = '位置信息不可用（可能信号差或定位服务被禁用）。'
            break
          case 3: // TIMEOUT
            output.innerHTML = '请求超时，请稍后重试。'
            break
          default:
            output.innerHTML = '未知错误: ' + error.message
        }
      },
      // 3. 配置项
      {
        enableHighAccuracy: true, // 尝试高精度
        timeout: 5000, // 5 秒超时
        maximumAge: 0, // 不读缓存，强制最新
      },
    )
  }
</script>
```

## 5. 持续定位：`watchPosition` + `clearWatch`

需要「实时追踪」（如跑步轨迹、车辆位置）时用 `watchPosition`。它会在位置变化时**反复调用** `success`。

```js
const path = [] // 记录轨迹
let watchId = null

function startTracking() {
  watchId = navigator.geolocation.watchPosition(
    position => {
      const { latitude, longitude, accuracy, speed } = position.coords
      path.push({ latitude, longitude, timestamp: position.timestamp })

      console.log(`当前位置: ${latitude}, ${longitude}`)
      console.log(`精度: ${accuracy} 米，速度: ${speed ?? '未知'} m/s`)
    },
    error => {
      console.error('定位失败', error.message)
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  )
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
    console.log('已停止监听，共记录', path.length, '个点')
  }
}
```

> **资源提示**：`watchPosition` 会持续占用 GPS / 网络模块，非常耗电。**务必**在不需要时（页面切后台、用户点停止）调用 `clearWatch` 释放资源。

## 6. 权限管理：Permissions API

在真正调用定位前，先查询授权状态，可以避免无谓的弹窗、提前做 UI 分支。现代浏览器通过 **`navigator.permissions`** 提供查询能力。

```js
async function checkGeolocationPermission() {
  // 1. 先判断 Permissions API 是否可用（老浏览器降级）
  if (!navigator.permissions) return 'unknown'

  const status = await navigator.permissions.query({ name: 'geolocation' })

  // 2. 读取当前状态
  switch (status.state) {
    case 'granted': // 已授权
      return 'granted'
    case 'prompt': // 尚未询问，可弹窗请求
      return 'prompt'
    case 'denied': // 已拒绝（只能引导用户去浏览器设置改）
      return 'denied'
  }
}
```

**监听权限状态变化：**（例如用户手动在浏览器设置里改了权限）

```js
navigator.permissions.query({ name: 'geolocation' }).then(status => {
  status.onchange = () => {
    console.log('权限状态发生变化:', status.state)
    // 例如：权限被授予后，自动发起一次定位
    if (status.state === 'granted') {
      navigator.geolocation.getCurrentPosition(onSuccess, onError)
    }
  }
})
```

- 状态为 `prompt` 时调用定位，浏览器才会弹授权框。
- 状态为 `denied` 时，**JS 无法再次唤起弹窗**，只能提示用户去「浏览器设置 → 隐私 → 位置」手动开启。

### 6.1 iframe 与 `Permissions-Policy`

如果页面运行在 iframe 里，还需父页面额外授权，否则子页面调用定位会直接失败（Code 1）。

```html
<!-- 父页面必须给 iframe 显式开启 geolocation 权限 -->
<iframe src="https://maps.example.com" allow="geolocation"></iframe>
```

服务端也可通过响应头声明策略：

```http
Permissions-Policy: geolocation=(self "https://maps.example.com")
```

## 7. 坐标系转换

这是国内接入定位的**核心痛点**。HTML API 返回的是标准 **WGS-84** 坐标，而国内主流地图用的是加密坐标系，直接套用会**偏差几百米到几公里**。

[width(16,43,41)]

| 坐标系     | 使用方                           | 说明                         |
| :--------- | :------------------------------- | :--------------------------- |
| **WGS-84** | GPS / Geolocation API / 国际地图 | 国际通用原始坐标             |
| **GCJ-02** | 高德、腾讯地图（火星坐标）       | 对 WGS-84 做了加密偏移       |
| **BD-09**  | 百度地图                         | 在 GCJ-02 基础上再次加密偏移 |

**使用第三方库（推荐）**

```js
import gcoord from 'gcoord'

const wgs84 = [116.4074, 39.9042] // [经度, 纬度]

const gcj02 = gcoord.transform(wgs84, gcoord.WGS84, gcoord.GCJ02) // 高德/腾讯
const bd09 = gcoord.transform(wgs84, gcoord.WGS84, gcoord.BD09) // 百度

console.log('高德坐标:', gcj02)
console.log('百度坐标:', bd09)
```

> 若不想引库，也可调用各大地图厂商的**坐标转换 Web 服务 API**（如百度、高德开放平台提供的接口），但需注意：它们是把坐标发往第三方服务器，且通常有配额限制。

## 8. 计算两点距离（Haversine 公式）

判断「用户移动了多少」或「是否靠近某个目标」时，需要计算两个经纬度之间的距离。

```js
/**
 * 计算两个经纬度坐标之间的距离（单位：米）
 * @param {number} lat1 起点纬度
 * @param {number} lon1 起点经度
 * @param {number} lat2 终点纬度
 * @param {number} lon2 终点经度
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // 地球平均半径（米）
  const toRad = deg => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 示例：北京天安门 与 故宫 的距离
console.log(getDistance(39.9087, 116.3975, 39.9163, 116.3972), '米')
```

配合 `watchPosition`，即可实现「当用户走进目标 100 米内就提醒」这类 LBS 场景。

## 9. TypeScript 类型定义

Geolocation API 在 TypeScript 的 `lib.dom.d.ts` 中已内置类型，核心接口如下（供理解）：

```ts
interface GeolocationCoordinates {
  readonly accuracy: number
  readonly altitude: number | null
  readonly altitudeAccuracy: number | null
  readonly heading: number | null
  readonly latitude: number
  readonly longitude: number
  readonly speed: number | null
}

interface GeolocationPosition {
  readonly coords: GeolocationCoordinates
  readonly timestamp: number
}

interface GeolocationPositionError {
  readonly code: number
  readonly message: string
  readonly PERMISSION_DENIED: 1
  readonly POSITION_UNAVAILABLE: 2
  readonly TIMEOUT: 3
}

interface PositionOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}
```

因此你无需额外定义类型，直接为回调参数标注即可：

```ts
navigator.geolocation.getCurrentPosition(
  (position: GeolocationPosition) => {
    /* ... */
  },
  (error: GeolocationPositionError) => {
    /* ... */
  },
  { enableHighAccuracy: true } satisfies PositionOptions,
)
```

## 10. 常见问题 (FAQ) 与避坑指南

### 10.1 为什么定位总是失败，或者根本没有任何反应？

**最常见原因：HTTPS 限制。**

出于隐私安全考虑，现代浏览器（Chrome 50+、Firefox、Safari、Edge）**强制要求**网站在 **HTTPS** 协议下才能使用 Geolocation API。

- `http://localhost` / `http://127.0.0.1`（本地开发）✅ 可用。
- `http://www.example.com`（线上非安全域）❌ **直接被禁用**，浏览器连弹窗都不会给。

### 10.2 用户拒绝过一次授权后，还能再次弹出授权框吗？

**不能。** 一旦用户选择「禁止」且浏览器记下了该决定，页面 JS 再调用定位也不会重新弹窗，只会立刻回调 `error`（Code 1）。

**解法：** 通过 `navigator.permissions` 检测到 `denied` 状态后，**引导用户手动去浏览器设置开启**（每个浏览器路径不同，无法用代码一键恢复）。

### 10.3 坐标在中国地图（百度/高德）上显示偏了？

这是中国开发者必须面对的**坐标系偏移问题**。

核心结论：API 返回 WGS-84，高德/腾讯用 GCJ-02，百度用 BD-09，必须转换后再上地图。

### 10.4 为什么 `getCurrentPosition` 很慢？

- **硬件预热**：冷启动时 GPS 模块搜星需要时间（几秒到几十秒）。
- **精度权衡**：设置 `enableHighAccuracy: true` 会优先启动 GPS，比 WiFi / 基站定位慢得多。非地图类应用建议设为 `false`。
- **超时设置**：务必设置合理的 `timeout`（如 5000~10000ms），避免无限等待。
- **缓存加速**：`maximumAge` 设一个非 0 值（如 60000），允许返回近期缓存，能显著提升首屏定位速度。

### 10.5 怎么判断用户是在室内还是室外？

API 不直接告诉，但可通过 **`accuracy`（精度）** 推断：

[width(31,33,36)]

| 精度范围      | 大概率定位方式   | 场景推测         |
| :------------ | :--------------- | :--------------- |
| `< 20 米`     | GPS 定位         | 通常室外         |
| `20 ~ 100 米` | WiFi / 基站混合  | 室内外过渡       |
| `> 100 米`    | WiFi / 基站 / IP | 通常室内或信号差 |

### 10.6 为什么 `watchPosition` 即使我不动也会一直触发？

GPS 信号受大气层干扰、多路径效应影响，读数会在小范围内**漂移（Drift）**。即使设备静止，坐标也会在几米范围内跳动。

**解法：** 在回调中计算新旧坐标的距离，小于阈值（如 10 米）就忽略本次更新：

```js
let last = null

navigator.geolocation.watchPosition(position => {
  const { latitude, longitude } = position.coords

  if (last) {
    const moved = getDistance(last.lat, last.lng, latitude, longitude)
    if (moved < 10) return // 位移不足 10 米，忽略
  }

  last = { lat: latitude, lng: longitude }
  console.log('发生实际位移:', latitude, longitude)
})
```

### 10.7 手机锁屏 / 切后台后，定位停止更新了？

是的。为省电，移动端操作系统（iOS/Android）通常会在浏览器切到后台或锁屏后**挂起** Geolocation 服务，`watchPosition` 不再触发。

网页端很难实现完美的后台持续定位——这通常是 **Native App 的特权**（需申请「后台定位」权限）。

### 10.8 为什么 Error Code 是 2 (POSITION_UNAVAILABLE)？

- **电脑端**：通常是连不上 Google 定位服务（国内网络环境问题），导致 WiFi 定位失败。
- **手机端**：GPS 信号被遮挡（地下室、电梯、隧道），或用户在**系统设置**里关闭了定位服务（这比网页弹窗权限更底层）。

### 10.9 iOS Safari 有哪些特殊坑？

- **必须 HTTPS**：iOS Safari 对安全上下文要求更严格。
- **需要用户手势**：建议把定位调用放在用户点击等手势事件里触发，直接页面加载时就调用可能被拦截。
- **首次授权弹窗只有一次机会**：用户拒绝后需去「设置 → Safari → 位置」重置。

### 10.10 iframe 内嵌页面无法定位？

如果定位代码运行在 iframe 里，需要父页面显式放行，否则会直接报 Code 1。
