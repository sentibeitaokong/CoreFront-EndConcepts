---
title: Tooltip | V-Element
description: Tooltip 组件的文档
---

# Tooltip 文字提示

常用于展示鼠标 `hover` 时的提示信息。

## 基础用法

在这里我们提供 4 种不同方向的展示方式，可以通过以下完整示例来理解，选择你要的效果。

使用 `content` 属性来决定 `hover` 时的提示信息。 由 `placement` 属性决定展示效果： `placement`属性值为：[方向]；四个方向：top、left、right、bottom；

<preview path="../../components/Tooltip/BasicTooltip.vue" title="基础用法" description="Tooltip 组件的基础用法"></preview>


## 更多内容的文字提示

展示多行文本或者是设置文本内容的格式

用具名 `slot content`，替代`tooltip`中的`content`属性。

<preview path="../../components/Tooltip/SlotTooltip.vue" title="Tooltip内容插槽用法" description="Tooltip 组件的内容插槽用法"></preview>

## 自定义动画

`Tooltip` 可以自定义动画，您可以使用 `transition` 设置所需的动画效果。

<preview path="../../components/Tooltip/TransitionTooltip.vue" title="自定义动画用法" description="Tooltip 组件的自定义动画用法"></preview>

## 受控模式

`Tooltip` 可以通过父组件使用 `manual` 属性手动来控制它的显示与关闭。

<preview path="../../components/Tooltip/ManualTooltip.vue" title="受控模式用法" description="Tooltip 组件的受控模式用法"></preview>


## 触发方式

`Tooltip` 可以通过父组件使用 `trigger` 属性手动来切换它的触发方式。

<preview path="../../components/Tooltip/TriggerTooltip.vue" title="触发方式用法" description="Tooltip 组件的触发方式用法"></preview>


## 延迟触发

`Tooltip` 可以通过父组件使用 `openDelay` 和 `closeDelay` 属性来延迟它的显示和隐藏

<preview path="../../components/Tooltip/DelayTooltip.vue" title="延迟触发用法" description="Tooltip 组件的延迟触发用法"></preview>


## Tooltip API

### Tooltip Attributes

| 属性名           | 说明                         | 类型                                             | 默认值   |
|---------------|----------------------------|------------------------------------------------|-------|
| content       | 显示的内容，也可被 `slot#content` 覆盖  | `string`                                       | ""    |
| placement     | `Tooltip` 组件出现的位置          | `enum` - `'left'\| 'top'\| 'right'\| 'bottom'` | right |
| trigger       | 		提示框的触发方式（用于显示），在受控模式下无效。 | `enum` - `'hover'\| 'click'`                   | hover |
| manual        | 	手动触发                      | `boolean`                                      | false |
| popperOptions | `popper.js` 参数               | `object`                                       | {}    |
| transition       | 动画名称                   | `string`                                       | -     |
| openDelay      | 延迟显示时间（以毫秒为单位），在受控模式下无效。 | `number`                                       | 0     |
| closeDelay          | 消失延迟时间（以毫秒为单位），在受控模式下无效。     | `number`             | 0     |

### Tooltip Events

| 事件名            | 说明                          | 类型                                                               |
|----------------|-----------------------------|------------------------------------------------------------------|
| visible-change | 切换提示框显示时和关闭时触发，将触发原因作为参数传入。 | `Function`                                     |
| click-outside  | 在提示框隐藏时触发。 将触发原因作为参数传入。     | `Function`                                     |
| show           | 在提示框显示时触发。 将触发原因作为参数传入。     | `Function`                                     |
| hide           | 在提示框隐藏时触发。 将触发原因作为参数传入。     | `Function`                                     |

### Tooltip Slots

|插槽名        | 描述                   |
|-------------|----------------------|
| default        | 提示框触发及参考元素，只接受单个根元素。 |
| content        | 自定义内容 |


### Tooltip Exposes

| 方法名  | 说明           | 类型      |
|------|--------------|---------|
| hide | 提供 `hide` 方法 | `Function` |
| show | 提供 `show` 方法 | `Function` |