---
title: DropDown | V-Element
description: DropDown 组件的文档
---

# DropDown 下拉菜单

将动作或菜单折叠到下拉菜单中。 

## 基础用法

悬停在下拉菜单上以展开更多操作。

通过组件 `slot` 来设置下拉触发的元素,默认情况下，只需要悬停在触发菜单的元素上即可，无需点击也会显示下拉菜单。

<preview path="../../components/DropDown/BasicDropDown.vue" title="基础用法" description="DropDown 组件的基础用法"></preview>

## 位置

设置 `placement` 属性，使下拉菜单出现在不同位置。

<preview path="../../components/DropDown/PlacementDropDown.vue" title="基础用法" description="DropDown 组件的placement属性用法"></preview>


## 受控模式

`DropDown` 可以通过父组件使用 `manual` 属性手动来控制它的显示与关闭。

<preview path="../../components/DropDown/ManualDropDown.vue" title="受控模式用法" description="DropDown 组件的受控模式用法"></preview>


## 触发方式

`DropDown` 可以通过父组件使用 `trigger` 属性手动来切换它的触发方式。

<preview path="../../components/DropDown/TriggerDropDown.vue" title="触发方式用法" description="DropDown 组件的触发方式用法"></preview>

## 菜单隐藏方式

可以通过 `hideAfterClick` 属性来配置。

下拉菜单默认在点击菜单项后会被隐藏，将 `hideAfterClick` 属性设置为 `false` 可以关闭此功能。

<preview path="../../components/DropDown/hideAfterClickDropDown.vue" title="hideAfterClick属性用法" description="DropDown 组件的hideAfterClick属性用法"></preview>


## 延迟触发

`DropDown` 可以通过父组件使用 `openDelay` 和 `closeDelay` 属性来 延迟它的显示和隐藏

<preview path="../../components/DropDown/DelayDropDown.vue" title="延迟触发用法" description="DropDown 组件的延迟触发用法"></preview>


## DropDown API

### DropDown Attributes

| 属性名           | 说明                       | 类型                                             | 默认值   |
|---------------|--------------------------|------------------------------------------------|-------|
| placement     | `Tooltip` 出现的位置          | `enum` - `'left'\| 'top'\| 'right'\| 'bottom'` | right |
| trigger       | 		下拉框的触发方式（用于显示），在受控模式下无效。 | `enum` - `'hover'\| 'click'`                   | hover |
| manual        | 	手动触发                    | `boolean`                                      | false |
| popperOptions | `popper.js` 参数             | `object`                                       | {}    |
| openDelay      | 延迟显示时间（以毫秒为单位），在受控模式下无效。 | `number`                                       | 0     |
| closeDelay          | 消失延迟时间（以毫秒为单位），在受控模式下无效。   | `number`             | 0     |

### DropDown Events

| 事件名            | 说明                          | 类型                                                               |
|----------------|-----------------------------|------------------------------------------------------------------|
| visible-change | 切换下拉框显示时和关闭时触发，将触发原因作为参数传入。 | `Function`                                     |
| select         | 在选择下拉框时触发。 将触发原因作为参数传入。     | `Function`                                     |
| show           | 在下拉框显示时触发。 将触发原因作为参数传入。     | `Function`                                     |
| hide           | 在下拉框隐藏时触发。 将触发原因作为参数传入。     | `Function`                                     |

### DropDown Slots

|插槽名        | 描述                   |
|-------------|----------------------|
| default        | 下拉框触发及参考元素，只接受单个根元素。 |

### DropDown Exposes

| 方法名  | 说明           | 类型      |
|------|--------------|---------|
| hide | 提供 `hide` 方法 | `Function` |
| show | 提供 `show` 方法 | `Function` |


## Dropdown-Item API

### Dropdown-Item Attributes

| 属性名           | 说明                         | 类型                                             | 默认值   |
|---------------|----------------------------|------------------------------------------------|-------|
| disabled        | 	是否禁用                      | `boolean`                                      | false |
| divided        | 	是否显示分隔符                      | `boolean`                                      | false |

