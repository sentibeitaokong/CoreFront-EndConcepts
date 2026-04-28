# `createRenderer`(自定义渲染器)

`createRenderer` 是 Vue 3 渲染器（Renderer）体系的核心入口。它采用了一种极为优雅的**依赖注入（Dependency Injection）**与**闭包
**架构，将 Vue 的核心算法（虚拟 DOM、Diff 算法、组件生命周期）与具体的平台 API（如浏览器的 DOM 操作）彻底解耦，从而实现了真正的跨平台渲染能力。

## 1. `createRenderer` 的作用与设计动机

### 1.1 为什么需要 `createRenderer`？

- **平台无关性**：Vue 核心逻辑不应该绑定在 `document` 或 `window` 上。通过 `createRenderer`，我们可以传入自定义的节点操作方法，让
  Vue 运行在 Canvas、WebGL、Weex、小程序甚至 Node.js 终端。
- **依赖注入**：将“如何创建元素”、“如何插入节点”等具体实现作为 `options` 传入，渲染器内部只负责调用这些接口。
- **闭包封装**：通过闭包缓存平台特有的操作 API，并在内部定义 `patch` 等核心逻辑，避免了全局变量污染和上下文传递的开销。

### 1.2 与默认 DOM 渲染器的关系

| 特性   | 默认 DOM 渲染器                     | 自定义渲染器                                                 |
|------|--------------------------------|--------------------------------------------------------|
| 节点操作 | 基于浏览器 DOM API                  | 用户提供（如 Canvas 绘图命令）                                    |
| 创建方式 | 内部调用 `createRenderer(nodeOps)` | 显式调用 `createRenderer` 并传入**自定义平台相关的节点操作接口**(`nodeOps`) |
| 应用入口 | `createApp()` (从 `vue` 导入)     | `createRenderer(...).createApp()`                      |
| 适用场景 | 浏览器 Web 应用                     | 非浏览器环境、特殊渲染需求                                          |

## 2. 核心实现：渲染器工厂函数

### 2.1 `createRenderer` 函数入口

:::code-group

```typescript [renderer.ts]
// 核心入口：接收外部传入的渲染选项
export function createRenderer(options: RendererOptions) {
    // 本质上是调用 baseCreateRenderer
    return baseCreateRenderer(options)
}

//渲染器配置对象
export interface RendererOptions {
    //为指定 element 的 prop 打补丁
    patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
    //为指定的 Element 设置 text
    setElementText(node: Element, text: string): void
    //插入指定的 el 到 parent 中，anchor 表示插入的位置，即：锚点
    insert(el, parent: Element, anchor?): void
    //创建指定的 Element
    createElement(type: string)
    //卸载指定dom
    remove(el): void
    //创建 Text 节点
    createText(text: string)
    //设置 text
    setText(node, text): void
    //设置Commonent text
    createComment(text: string)
}
```
:::

### 2.2 `baseCreateRenderer` 核心骨架

:::code-group
```typescript [renderer.ts]
function baseCreateRenderer(options: RendererOptions):any {
    // 1. 从传入的 options 中解构出特定平台的操作 API（重命名以防止冲突）
    const {
        insert: hostInsert,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        setElementText: hostSetElementText,
        remove: hostRemove,
        createText: hostCreateText,
        setText: hostSetText,
        createComment: hostCreateComment
    } = options

    // 2. 核心调度：patch 函数 (对比新旧 VNode)  （n1旧节点,n2新节点,container容器,anchor锚地） 
    const patch = (oldVNode, newVNode, container, anchor = null) => {
        //如果新老节点相同直接返回
        if (oldVNode === newVNode) {
            return
        }
        //判断是否为相同类型节点
        if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
            //卸载旧节点
            unmount(oldVNode)
            oldVNode = null
        }
        //提取新节点的类型和标识
        const { type, shapeFlag } = newVNode
        switch (type) {
            case Text:
                // Text
                processText(oldVNode, newVNode, container, anchor)
                break
            case Comment:
                // Comment
                processCommentNode(oldVNode, newVNode, container, anchor)
                break
            case Fragment:
                // Fragment
                processFragment(oldVNode, newVNode, container, anchor)
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    //文本
                    processElement(oldVNode, newVNode, container, anchor)
                } else if (shapeFlag & ShapeFlags.COMPONENT) {
                    // 组件
                    processComponent(oldVNode, newVNode, container, anchor)
                }
        }
    }
    
    // 3. 对外暴露的 render 函数
    const render: RootRenderFunction = (vnode, container, isSVG) => {
        if (vnode == null) {
            // 如果新 vnode 为空且有旧 vnode，执行卸载
            if (container._vnode) {
                unmount(container._vnode, null, null, true)
            }
        } else {
            // 触发 patch 挂载或更新
            patch(container._vnode || null, vnode, container, null, null, null, isSVG)
        }
        // 缓存当前的 vnode
        container._vnode = vnode
    }
    //卸载
    const unmount = vnode => {
        hostRemove(vnode.el!)
    }
    // 4. 返回渲染器对象，包含 render 和 createApp
    return {
        render,
        createApp: createAppAPI(render)
    }
}
```

```typescript [apiCreateApp.ts]
import { createVNode } from './vnode'
// 通过 createAppAPI 将 render 函数与应用实例绑定,创建 app 实例
export function createAppAPI<HostElement>(render) {
    return function createApp(rootComponent, rootProps = null) {
        const app = {
            _component: rootComponent,
            _container: null,
            // 挂载方法
            mount(rootContainer: HostElement): any {
                // 直接通过 createVNode 方法构建 vnode
                const vnode = createVNode(rootComponent, rootProps)
                // 通过 render 函数进行挂载
                render(vnode, rootContainer)
            }
        }
        return app
    }
}
```

:::

## 4. 完整流程示例

### 4.1 基础使用示例 (自定义 Canvas 渲染器简写)

```ts
import {createRenderer,h} from '@vue/runtime-core'
const app = new PIXI.Application();
// 异步初始化
await app.init({
    width: 800,
    height: 600,
});
// 添加到页面
document.body.appendChild(app.canvas);

// 1. 自定义平台操作 API
const nodeOps = {
    createElement(type) {
        if (type === "rect") {
            const rect = new PIXI.Graphics();
            rect.fill(0xff0000);
            rect.rect(0, 0, 100, 100);
            rect.fill();
            return rect;
        }
    },
    patchProp(el, key, val) {
        el[key] = val;
    },
    insert(el, parent) {
        parent.addChild(el);
    },
    //...其他必选接口
}
// 2. 创建自定义渲染器
const {createApp} = createRenderer(nodeOps)

// 3. 挂载应用
export const App = {
    setup() {
        return {
            x: 100,
            y: 100,
        };
    },
    render() {
        return h("rect", { x: this.x, y: this.y });
    },
};

createApp(App).mount(app.stage)
```

### 4.2 完整流程图

![Logo](/createRenderer.png)

## 5. 总结

`createRenderer` 是 Vue 3 渲染系统的心脏，它体现了极其优秀的框架抽象能力。通过**将“变化检测与比对（Diff）”保留在核心，将“节点增删改（DOM
Ops）”开放给外部**，`createRenderer` 造就了 Vue 的繁荣生态。

- **设计亮点**：闭包配合依赖注入，让长达数千行的 VDOM 渲染逻辑变得纯粹且可复用。
- **性能优化**：在 `createBaseRenderer` 内部结合了块级树（Block Tree）和静态提升（Static Hoisting）的快速路径逻辑。
- **扩展性**：提供了 `createApp` 工厂，使得基于 Vue 语法的各种跨平台框架（如 Taro、UniApp 等基于 Vue 3
  的版本）能够轻松接入，极大地降低了框架底层的开发成本。