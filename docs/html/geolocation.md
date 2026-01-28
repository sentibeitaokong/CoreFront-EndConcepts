# HTML5 Geolocation API(地理定位)

HTML5 Geolocation API 允许网页访问用户的当前地理位置（经纬度）。这项技术广泛应用于地图导航、本地生活服务（外卖/打车）、运动轨迹记录等场景。

## 1. 核心对象

所有功能都挂载在 `navigator.geolocation` 对象上。

**检测浏览器支持：**
```js
if ("geolocation" in navigator) {
  // 支持
} else {
  // 不支持
}
```

## 2. 三大核心方法

| 方法 | 描述 | 返回值 |
| :--- | :--- | :--- |
| **`getCurrentPosition(success, error, options)`** | **获取一次**当前位置。 | 无 (undefined) |
| **`watchPosition(success, error, options)`** | **持续监听**位置变化（像导航一样）。每当位置改变，回调就会执行。 | `watchID` (数字，用于取消监听) |
| **`clearWatch(watchID)`** | **停止监听**。 | 无 |

## 3. 参数详解

`getCurrentPosition` 和 `watchPosition` 接收相同的三个参数：

### 3.1 `success` 回调函数 (必填)
当获取位置成功时调用。接收一个 `GeolocationPosition` 对象。

**返回的数据结构 (`position`)：**

| 属性 | 说明 | 备注 |
| :--- | :--- | :--- |
| **`coords.latitude`** | **纬度** | 十进制，如 39.9042 |
| **`coords.longitude`** | **经度** | 十进制，如 116.4074 |
| `coords.accuracy` | **精度** (米) | 比如 50，表示真实位置在以坐标为圆心、50米为半径的圆内。 |
| `coords.altitude` | 海拔高度 (米) | 如果设备不支持，返回 `null`。 |
| `coords.altitudeAccuracy` | 海拔精度 (米) | 如果设备不支持，返回 `null`。 |
| `coords.heading` | 前进方向 (度) | 0~360度（0为北）。移动中才有效，静止可能为 `NaN` 或 `null`。 |
| `coords.speed` | 速度 (米/秒) | 移动中才有效。 |
| `timestamp` | 时间戳 | 获取到位置的时间。 |

### 3.2 `error` 回调函数 (选填)
当获取位置失败时调用。接收一个 `GeolocationPositionError` 对象。

**错误代码 (`error.code`)：**

| 代码 (Code) | 常量名 | 含义 |
| :--- | :--- | :--- |
| **1** | `PERMISSION_DENIED` | **用户拒绝**。用户点击了“禁止获取位置”。 |
| **2** | `POSITION_UNAVAILABLE` | **位置不可用**。GPS 信号弱、网络断开等导致无法定位。 |
| **3** | `TIMEOUT` | **超时**。在指定时间内未获取到位置。 |

### 3.3 `options` 配置对象 (选填)

| 属性 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| **`enableHighAccuracy`** | Boolean | `false` | 是否开启**高精度模式**（如 GPS）。`true` 会更费电、更慢，但更准；`false` 通常使用 WiFi/IP 定位。 |
| **`timeout`** | Number | `Infinity` | **超时时间** (毫秒)。如果超过这个时间没拿到位置，触发 Error (Code 3)。 |
| **`maximumAge`** | Number | `0` | **缓存时间** (毫秒)。允许返回多久以前的历史位置。`0` 表示强制获取最新位置。 |

## 4. 完整代码示例

```html
<button id="btn">获取我的位置</button>
<div id="output"></div>

<script>
const btn = document.getElementById('btn');
const output = document.getElementById('output');

btn.onclick = function() {
  if (!navigator.geolocation) {
    output.innerHTML = "您的浏览器不支持地理定位";
    return;
  }

  output.innerHTML = "定位中...";

  navigator.geolocation.getCurrentPosition(
    // 1. 成功回调
    (position) => {
      const lat = position.coords.latitude; // 纬度
      const lng = position.coords.longitude; // 经度
      const acc = position.coords.accuracy;  // 精度
      
      output.innerHTML = `
        <p>纬度: ${lat}</p>
        <p>经度: ${lng}</p>
        <p>精度: ${acc} 米</p>
        <p>注意：这是 WGS84 坐标，在中国地图上显示需要转换。</p>
      `;
    },
    // 2. 失败回调
    (error) => {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          output.innerHTML = "用户拒绝了定位请求。";
          break;
        case error.POSITION_UNAVAILABLE:
          output.innerHTML = "位置信息不可用。";
          break;
        case error.TIMEOUT:
          output.innerHTML = "请求超时。";
          break;
        default:
          output.innerHTML = "未知错误: " + error.message;
      }
    },
    // 3. 配置项
    {
      enableHighAccuracy: true, // 尝试高精度
      timeout: 5000,            // 5秒超时
      maximumAge: 0             // 不读缓存
    }
  );
};
</script>
```

## 5. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么定位总是失败，或者没反应？
**最常见原因：HTTPS 限制**。
出于隐私安全考虑，现代浏览器（Chrome 50+）**强制要求**网站必须在 **HTTPS** 协议下才能使用 Geolocation API。
*   `http://localhost` (本地开发) 可以使用。
*   `http://www.example.com` (线上非安全域) **会被直接禁用**，浏览器甚至不会弹窗询问。

### Q2: 坐标在中国地图（百度/高德）上显示偏了？（坐标系偏移问题）
**这是中国开发者必须面对的核心问题。**
*   **HTML API 返回的坐标**：标准 **WGS-84** 坐标系统（国际通用）。
*   **高德/腾讯地图**：使用 **GCJ-02** 坐标系（火星坐标）。
*   **百度地图**：使用 **BD-09** 坐标系。

**后果**：直接把 HTML 获取的 WGS-84 坐标填入百度地图，会**偏差几百米甚至几公里**。

**解法**：必须使用第三方算法库（如 `gcoord`）或地图厂商提供的 API 接口进行**坐标转换**。
*   WGS84 -> GCJ02 (用于高德)
*   WGS84 -> BD09 (用于百度)

### Q3: 为什么 `getCurrentPosition` 很慢？
*   **硬件预热**：如果是冷启动，GPS 模块搜索卫星需要时间（几秒到几十秒）。
*   **精度权衡**：如果你设置了 `enableHighAccuracy: true`，手机会尝试开启 GPS，这比 WiFi/基站定位慢得多。如果不需要米级精度，建议设为 `false`。
*   **超时设置**：建议设置合理的 `timeout`（如 5000ms），避免一直傻等。

### Q4: 怎么判断用户是在室内还是室外？
API 本身不直接告诉你。但可以通过 **`accuracy` (精度)** 属性推断：
*   **精度 < 20米**：极大概率是 **GPS 定位**（通常在室外）。
*   **精度 > 100米**：极大概率是 **WiFi/基站定位**（通常在室内或信号差的地方）。

### Q5: 为什么 `watchPosition` 即使我不动也会一直触发？
GPS 信号由于大气层干扰和多路径效应，读数会在小范围内**漂移 (Drift)**。即使手机静止，坐标也会在几米范围内跳动。

**解法**：在回调中计算新坐标与旧坐标的距离，如果小于某个阈值（如 10米），则忽略这次更新。

### Q6: 手机锁屏后，定位停止更新了？
是的。为了省电，移动端操作系统（iOS/Android）通常会在浏览器切到后台或锁屏后，**挂起** Geolocation 服务。网页端很难实现完美的后台持续定位（这通常是 Native App 的特权）。

### Q7: 为什么 Error Code 是 2 (POSITION_UNAVAILABLE)？
*   在电脑端：通常是因为连不上 Google 的定位服务（国内网络环境问题），导致 WiFi 定位失败。
*   在手机端：可能是 GPS 信号被遮挡（地下室、电梯），或者用户在系统设置里关闭了浏览器的定位权限（不仅仅是网页弹窗权限，还有系统级的 App 权限）。