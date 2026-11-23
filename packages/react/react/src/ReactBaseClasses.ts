/**
 * ReactBaseClasses.ts —— 类组件基类 Component 的实现
 *
 * 所有类组件（class Foo extends Component）都继承自这里导出的 Component。
 * 它只提供最基础的能力：接收 props 与 context，并在原型上挂一个
 * 用于「识别类组件」的标记。
 *
 * 本实现是极简版：真实 React 的 Component 还会提供 setState、forceUpdate、
 * 生命周期挂载等能力；这里仅保留「如何判断一个类是类组件」所需的最小结构。
 */

/**
 * Component 基类（构造函数）
 *
 * 初始化实例的两个字段：
 * - this.props   ：父组件传入的属性，可在 render() 中通过 this.props 读取
 * - this.context ：类组件声明的 static contextType 对应的当前值，
 *                  由 reconciler 在 updateClassComponent 中通过 readContext 写入
 *
 * @param props   - 组件属性（JSX 中写在标签上的属性集合）
 * @param context - 组件上下文（本简化实现中由 reconciler 另行赋值）
 */
export function Component(props: any, context: any) {
  this.props = props
  this.context = context
}

/**
 * isReactComponent 标记 —— 用于区分「类组件」和「函数组件」
 *
 * 关键点：这个标记挂在原型（prototype）上，而非实例上。
 * reconciler 在 createFiberFormTypeAndProps 中通过
 * `type.prototype.isReactComponent` 判断一个 function 是类组件还是函数组件：
 * - 类组件（extends Component）会沿原型链继承到该标记 → 标记为 ClassComponent
 * - 函数组件没有这个标记 → 标记为 FunctionComponent
 */
Component.prototype.isReactComponent = {}
