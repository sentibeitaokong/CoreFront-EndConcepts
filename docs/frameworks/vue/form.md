---
title: Form | V-Element
description: Form 组件的文档
---

# Form 表单   

使用表单，您可以收集、验证和提交数据。

##  典型表单

最基础的表单包括各种输入表单项，比如`input`、`select`、`switch`。

在每一个 `form` 组件中，你需要一个 `form-item` 字段作为输入项的容器，用于获取值与验证值。

<preview path="../../components/Form/BasicForm.vue" title="基础用法" description="Form 组件的基础用法"></preview>


## 表单校验

`Form` 组件允许你验证用户的输入是否符合规范，来帮助你找到和纠正错误。

`Form` 组件提供了表单验证的功能，只需为 `rules` 属性传入约定的验证规则，并将 `form-Item` 的 `prop` 属性设置为需要验证的特殊键值即可。 校验规则参见 `async-validator`

<preview path="../../components/Form/ValidateForm.vue" title="表单校验" description="Form 组件的表单校验用法"></preview>


## 自定义校验规则

这个例子中展示了如何使用自定义验证规则来完成密码的二次验证。

<preview path="../../components/Form/CustomValidateForm.vue" title="表单自定义校验" description="Form 组件的表单自定义校验用法"></preview>


## Form API

### Form Attribute
| 属性名         | 详情       | 类型                                                               | 默认值  |
|-------------|----------|------------------------------------------------------------------|------|
| model       | 表单数据对象  | `object`                                     | —  |
| rules       | 表单验证规则    | `object` | —    |

### Form Events

|事件名        | 说明       | 类型                                                               |
|-------------|----------|------------------------------------------------------------------|
| validate        | 任一表单项被校验后触发  | `Function`                                     |
| resetFields        | 重置该表单项，将其值重置为初始值，并移除校验结果  | `Function`                                     |
| clearValidate        | 清理某个字段的表单验证信息。  | `Function`                                     |

### Form Slots

|插槽名        | 描述                   | 子标签           |
|-------------|----------------------|---------------|
| default        | 自定义默认内容 | `FormItem` |


### Form Exposes

|方法名        | 说明      | 类型      |
|-------------|---------|---------|
| validate        | 对整个表单的内容进行验证。 接收一个回调函数，或返回 `Promise`。 | `Function` |
| resetFields        | 重置该表单项，将其值重置为初始值，并移除校验结果 | `Function` |
| clearValidate        | 清理某个字段的表单验证信息。 | `Function` |

## Form Item API

### Form Item Attributes

| 属性名            | 详情       | 类型        | 默认值   |
|----------------|----------|-----------|-------|
| prop  | `model` 的键名。  | `string`| — |
| label      | 标签文本    | `string` | —    |

### Form Item Slot

| 名称              | 说明      | 类型         |
|-----------------|---------|------------|
| label     | 标签位置显示的内容 | `object`          |

### FormItem Exposes

| 名称              | 说明      | 类型         |
|-----------------|---------|------------|
| clearValidate     | 移除该表单项的校验结果 | `Function`         |
| validateState     | 校验状态 | `Function`         |
| resetField     | 对该表单项进行重置，将其值重置为初始值并移除校验结果 | `Function`         |
| validate     | 验证表单项 | `Function`         |



