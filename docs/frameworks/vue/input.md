---
title: Input | V-Element
description: Input 组件的文档
---

# Input 输入框
通过鼠标或键盘输入字符

## 基础文本框

<preview path="../../components/Input/BasicInput.vue" title="基础文本框" description="Input 基础文本框"></preview>

## 禁用文本框

通过 **disabled** 属性指定是否禁用 input 组件


<preview path="../../components/Input/DisableInput.vue" title="禁用文本框" description="Input 禁用文本框"></preview>

## 尺寸
使用 size 属性改变输入框大小。 除了默认大小外，还有另外两个选项： **large**, **small**。

<preview path="../../components/Input/SizeInput.vue" title="不同尺寸文本框" description="不同尺寸文本框"></preview>


## 复合型输入框

可以在输入框前置或后置一个元素，通常是标签或按钮。可以使用 **prepend** 和 **append** 插槽。
要在输入框中添加前后元素，可以使用 **prefix** 和 **suffix** 插槽。

<preview path="../../components/Input/ComboInput.vue" title="复合型输入框" description="Input 复合型输入框"></preview>

## Textarea

用于输入多行文本信息可缩放的输入框。 添加 **type="textarea"** 属性来将 input 元素转换为原生的 textarea 元素。

<preview path="../../components/Input/TextareaInput.vue" title="Textarea" description="Textarea"></preview>

## 密码文本框

使用 **show-password** 属性即可得到一个可切换显示隐藏的密码框

<preview path="../../components/Input/PasswordInput.vue" title="密码文本框" description="Input 密码文本框"></preview>

## 清空文本框

使用 **clearable** 属性即可得到一个可一键清空的输入框


<preview path="../../components/Input/ClearInput.vue" title="清空文本框" description="Input 清空文本框"></preview>

## Input API

### Input Attributes

| 属性名         | 说明                            | 类型                                                               | 默认值    |
|-------------|-------------------------------|------------------------------------------------------------------|--------|
| type        | 输入类型                            | `enum` - `'text'\| 'textarea'\| 'password'`          | text      |
| model-value / v-model       | 绑定值            | `'string' \/ 'number'` | —      |
| size       | 	输入框尺寸，只在 type 不为 'textarea' 时有效    | `enum` - `'large'\| 'small'`       | — |
| placeholder       | 	输入框占位文本                      | `string`                                      | —  |
| clearable      | 是否显示清除按钮，只有当 type 不是 textarea时生效      | `boolean`                      | false  |
| disabled    | 按钮是否为禁用状态                     | `boolean`                                      | false  |
| showPassword  | 是否显示切换密码图标         | `boolean`                                          | false      |
| autofocus   | 原生 `autofocus` 属性               | `boolean`                                        | false  |
| readonly | 原生 readonly 属性，是否只读| `boolean`         | false |
| form | 原生属性| `string`         | 	— |
| autocomplete | 原生 autocomplete 属性| `string`         | off |


### Input Events

|事件名        | 说明       | 类型                                                               |
|-------------|----------|------------------------------------------------------------------|
| change        | 仅当 modelValue 改变时，当输入框失去焦点或用户按Enter时触发  | `Function`                                     |
| blur        | 当选择器的输入框失去焦点时触发  | `Function`                                     |
| focus        | 当选择器的输入框获得焦点时触发  | `Function`                                     |
| input        | 在 Input 值改变时触发  | `Function`                                     |
| clear        | 在点击由 clearable 属性生成的清空按钮时触发  | `Function`                                     |


### Input Exposes
|方法名        | 说明      | 类型     |
|-------------|---------|--------|
| ref        | HTML元素 `input` 或 `textarea`| object |


