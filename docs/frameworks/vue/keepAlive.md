---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vue 组件缓存 (`<KeepAlive>`)

## 1. 核心概念与应用边界

**`<KeepAlive>`** 是 Vue 官方提供的一个极具魔法色彩的内置抽象组件。它的核心使命是：**将那些被切走的组件实例“物理冷藏”在内存中，防止它们被销毁。当再次切回时，直接从内存中“唤醒”它们，实现瞬间渲染和状态绝对保留。**

| 典型应用场景 | 详细说明 |
| :--- | :--- |
| **多标签页 (Tabs) 切换** | 业务系统中最常见。用户在“订单列表”和“商品详情”Tab 之间来回切换，要求两边的搜索条件、翻页页码、表单输入内容绝对不能丢失。 |
| **复杂的长表单录入** | 分步骤的向导式表单（如：第一步 -> 第二步 -> 第三步）。用户填到第三步想返回第一步修改，第一步填过的内容必须被保留。 |
| **超长列表的滚动状态保留** | 从首页的新闻列表往下滚了很远，点击进入新闻详情，再返回首页时，要求依然停留在刚才滚动的像素位置。 |

## 2. 核心 API 与精准控制实战

`<KeepAlive>` 如果包住所有的组件，会导致浏览器内存被瞬间撑爆。因此，Vue 提供了极其精准的缓存控制手段。

### 2.1 基础包裹 (配合动态组件或路由)

最基础的用法就是直接包裹住想要产生切换效果的动态槽位。

```vue
<!-- 场景一：配合原生动态组件 -->
<!-- 只要在这个坑位里切换过的 component，都会被永久缓存 -->
<KeepAlive>
  <component :is="activeComponent" />
</KeepAlive>
```

**配合 Vue Router 4 的标准写法：**
🚨 *注意：在 Vue 3 (Vue Router 4) 中，路由组件缓存的写法发生了天翻地覆的结构性变化！*

```vue
<!-- 场景二：配合路由 (Vue 3 规范写法) -->
<router-view v-slot="{ Component }">
  <KeepAlive>
    <component :is="Component" />
  </KeepAlive>
</router-view>
```

### 2.2 终极控制权：`include` 与 `exclude` (按需缓存)

在真实业务中，我们通常只希望缓存特定的几个页面。`<KeepAlive>` 提供了 `include` (白名单，只缓存谁) 和 `exclude` (黑名单，除了谁都缓存) 属性。

它们接收三种类型的值：**逗号分隔的字符串、正则表达式 (Regex)、或一个数组**。

```vue
<script setup>
import { ref } from 'vue'
// 注意：数组里写的是组件的 name 属性！
const cachedViews = ref(['OrderList', 'UserForm'])
</script>

<template>
  <router-view v-slot="{ Component }">
    <!-- 只有 name 叫 OrderList 或 UserForm 的组件才会被藏进内存 -->
    <KeepAlive :include="cachedViews">
      <component :is="Component" />
    </KeepAlive>
  </router-view>
</template>
```

**🚨 避坑核心：组件的 `name` 是什么？**
`include` 和 `exclude` 匹配的**绝对不是路由的 name，而是 Vue 组件自身的 `name` 选项**！
在 Vue 3 `<script setup>` 时代，给组件命名是一个痛点：
1. 默认情况下，Vue 会以文件名为组件自动推导 name（如 `OrderList.vue` 的 name 就是 `OrderList`）。
2. **最稳妥的做法**：利用 Vue 3.3+ 新增的 `defineOptions` 显式声明：
   ```vue
   <script setup>
   defineOptions({ name: 'OrderList' }) // 强行指定名字，供 KeepAlive 抓取
   </script>
   ```

### 2.3 内存护城河：`max` (最大缓存实例数)

如果你的后台管理系统有 50 个菜单，用户一个个点过去，内存里就会囤积 50 个庞大的组件实例，会导致严重的内存泄漏和浏览器卡顿。

`max` 属性用来限制缓存的组件数量。底层采用了经典的 **LRU (Least Recently Used，最近最少使用)** 缓存淘汰算法。
当缓存数量达到上限时，**那个在内存里躺得最久、最长时间没被用户“临幸”过的组件，会被无情销毁**，为新组件腾出坑位。

```vue
<!-- 内存里最多只准缓存 10 个页面 -->
<KeepAlive :max="10">
  <component :is="activeComponent" />
</KeepAlive>
```

**LRU(缓存淘汰算法)**
```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity; // 最大容量 (对应 KeepAlive 的 max)
    this.cache = new Map();   // 缓存字典。Key=组件的唯一标识，Value=组件的VNode
  }

  // 模拟：用户试图打开一个组件
  get(key) {
    if (!this.cache.has(key)) {
      return null; // 没缓存过，返回空，让 Vue 去重新创建这个组件
    }
    
    // 如果缓存里有，拿到这个组件的虚拟节点 (VNode)
    const vnode = this.cache.get(key);
    
    // 🚨 LRU 的核心动作 1：【刷新鲜度】
    // 既然你刚刚用了它，我就先把它从字典里删掉，然后再重新塞进去。
    // 在 JS 的 Map 中，最新 set 进去的键值对会被排在队伍的最末尾！
    this.cache.delete(key);
    this.cache.set(key, vnode);
    
    return vnode;
  }

  // 模拟：用户刚看完一个新组件，Vue 准备把它塞进内存
  put(key, vnode) {
    // 如果本来就有，直接删掉旧的，为下面重新插到队尾做准备
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // 塞入新的组件（由于是最新插入，排在 Map 的最后面）
    this.cache.set(key, vnode);
    
    // 🚨 LRU 的核心动作 2：【容量超载淘汰】
    // 检查桌子是不是放满了
    if (this.cache.size > this.capacity) {
      // Map.prototype.keys() 会返回一个迭代器，按照插入顺序排列
      // 所以 keys().next().value 永远能拿到队伍最开头、最久没被碰过的那个 key！
      const oldestKey = this.cache.keys().next().value;
      
      // 无情地把它从缓存中抹杀
      this.cache.delete(oldestKey);
      console.log(`容量爆炸！已淘汰最旧的组件: ${oldestKey}`);
    }
  }
}

// --- 测试我们的 LRU 算法 ---
const keepAlive = new LRUCache(3); // 只能存 3 个页面
keepAlive.put('首页', 'VNode_Home');
keepAlive.put('列表页', 'VNode_List');
keepAlive.put('详情页', 'VNode_Detail');

console.log(keepAlive.cache.keys()); // 顺序: [首页, 列表页, 详情页]

// 用户又点回了“首页”！
keepAlive.get('首页'); 
console.log(keepAlive.cache.keys()); // 顺序被刷新: [列表页, 详情页, 首页]

// 用户点开了一个全新的“设置页”，容量炸了！
keepAlive.put('设置页', 'VNode_Setting');
// 触发淘汰：最久没用的“列表页”被踢出去了！
console.log(keepAlive.cache.keys()); // 结果: [详情页, 首页, 设置页]

```

## 3. 专属生命周期 (冬眠与唤醒)

当组件被包裹在 `<KeepAlive>` 中时，它的 `onMounted` (挂载) 和 `onUnmounted` (卸载) **只会在此生第一次被创建，和最终被 LRU 算法剔除时执行一次**。

当你在缓存的组件间来回切换时，你需要感知到“我被切进来了”和“我被切走了”，于是 Vue 注入了两个专属的生命周期：

```vue
<script setup>
import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'

onMounted(() => {
  console.log('只在第一次打开时执行。适合拉取死数据（如省市区字典）。')
})

// --- 唤醒钩子 ---
onActivated(() => {
  console.log('每次切入这个页面都会执行！')
  // 最佳实践：
  // 1. 恢复之前记录的滚动条位置
  // 2. 静默拉取一次核心业务数据的接口（比如股票价格），确保用户切回来看到的是最新数据
  // 3. 重新开启之前暂停的定时器
})

// --- 冬眠钩子 ---
onDeactivated(() => {
  console.log('每次切出这个页面时执行！')
  // 最佳实践：
  // 1. 记录当前页面的滚动条像素位置
  // 2. 暂停视频/音频的播放
  // 3. 清理掉极其耗费性能的轮询定时器 (setInterval)
})

onUnmounted(() => {
  console.log('只有被 max 挤出去，或者从 include 数组中除名时，才会死透。')
})
</script>
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 我在 `<KeepAlive :include="cachedList">` 里写了要缓存 `UserList`，为什么根本没生效，一切换还是重置了？
*   **答**：这是使用 `<KeepAlive>` 时**排在第一位的致命坑点**。通常由以下两个原因导致：
    1.  **没有给组件声明正确的 `name`**：你在路由配置里写了 `name: 'UserList'`，但这没用。`include` 看的是**组件本身代码里声明的 `name`**。在使用 `<script setup>` 时很容易漏掉，必须使用 `defineOptions({ name: 'UserList' })` 显式加上，且与 `include` 数组里的字符串**大小写绝对一致**。
    2.  **组件发生了深层嵌套**：你的 `App.vue` 下面嵌套了 `<router-view>` (第一层)，加载了 `Layout.vue`，而 `Layout.vue` 里面又嵌套了一个 `<router-view>` (第二层)。你把 `<KeepAlive>` 写在了第一层，但却想去缓存第二层里深埋的 `UserList`。**这是绝对无效的！** `<KeepAlive>` 只能嗅探并缓存它**直接包裹的第一层直系子组件**。如果有多级路由，你必须把 `<KeepAlive>` 搬到最深层那个需要被缓存的 `<router-view>` 旁边。

### 4.2 业务需求：用户从“列表页”点击进入“详情页”，需要保留列表的页码缓存；但如果用户是从“左侧大菜单”点击进入“列表页”，必须清空缓存重置列表。怎么做？
*   **答**：这是企业级后台系统极其变态但也极常见的需求：**动态条件缓存**。
    *   **核心解法**：通过 Vuex/Pinia 动态维护那个传入 `:include` 的数组。
    *   **操作流**：
        1.  全局维护一个 `cachedViews = ['OrderList']`。
        2.  利用 Vue Router 的 `beforeEach` 路由守卫进行逻辑判断。
        3.  如果判断用户是点击“左侧大菜单”前往 `OrderList`，就在路由守卫中，强行用 JS 把 `OrderList` 从 Pinia 的 `cachedViews` 数组中 `splice` 剔除掉。
        4.  此时 `<KeepAlive>` 侦测到白名单里没它了，会**瞬间物理销毁**内存里的 `OrderList` 实例。
        5.  紧接着路由跳转完毕，用户看到了一个全新重置的列表。然后再偷偷把 `OrderList` push 塞回 `cachedViews` 里等待下一次缓存。

### 4.3 为什么缓存的页面切回来时，页面的滚动条总是自动跳回顶部，记录不住？
*   **答**：因为 `<KeepAlive>` **只负责缓存 Vue 实例的内存状态数据，它不管原生浏览器 DOM 滚动条的事。**
    *   **原因**：当你切走时，原来的 DOM 虽然没被销毁（被暂时移出文档流，挂在虚拟节点上），但浏览器的整个视口换成了新组件。当你再切回来时，DOM 重新插回文档流，浏览器会默认将其滚动高度重置为 0。
    *   **终极解法 (Vue Router 提供)**：不要自己手动在 `onActivated` 里去写丑陋的 `window.scrollTo`。应该在 Vue Router 初始化时，利用官方提供的 **`scrollBehavior`** 配置项。它会在背后自动为你接管所有历史页面的像素级精确滚动位置管理。
    ```js
    const router = createRouter({
      history: createWebHistory(),
      routes: [...],
      // 原生接管：返回上一个页面时，极其精准地还原滚动位置
      scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
          return savedPosition
        } else {
          return { top: 0 }
        }
      }
    })
    ```
