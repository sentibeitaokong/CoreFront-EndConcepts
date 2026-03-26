---
title: Collapse | V-Element
description: Collapse 组件的文档
---

# Collapse 折叠面板
通过折叠面板收纳内容区域

## 基础用法
可同时展开多个面板，面板之间不影响

<preview path="../../components/Collapse/BasicCollapse.vue" title="基础用法" description="Collapse 组件的基础用法"></preview>


## 手风琴效果

每次只能展开一个面板

通过 `accordion` 属性来设置是否以手风琴模式显示。

<preview path="../../components/Collapse/AccordionCollapse.vue" title="按钮禁用用法" description="Button 组件的按钮禁用用法"></preview>


## Collapse API

### Collapse Attribute
| 属性名         | 详情       | 类型                                                               | 默认值  |
|-------------|----------|------------------------------------------------------------------|------|
| model-value / v-model       | 当前活动面板,其类型是`array`  | `array`                                     | []   |
| accordion       | 是否手风琴模式    | `boolean` | false    |

### Collapse Events

|事件名        | 说明       | 类型                                                               |
|-------------|----------|------------------------------------------------------------------|
| change        | 切换当前活动面板,其类型是`array`  | `Function`                                     |

### Collapse Slots

|插槽名        | 描述                   | 子标签           |
|-------------|----------------------|---------------|
| default        | 自定义默认内容 | `Collapse Item` |


### Collapse Exposes

|方法名        | 说明      | 类型      |
|-------------|---------|---------|
| activeNames        | 当前活动的面板 | `array` |
| handleItemClick        | 设置活动面板 | `Function` |

## Collapse Item API

### Collapse Item Attributes

| 属性名            | 详情       | 类型        | 默认值      |
|----------------|----------|-----------|----------|
| name  | 唯一标志符  | `string`| `number` | -   |
| title      | 面板标题    | `string` | ''    |
| disabled      | 是否禁用    | `boolean` | false    |

### Collapse Item Slot

| 名称              | 说明      | 类型         |
|-----------------|---------|------------|
| default     | Collapse Item 的内容 | -          |
