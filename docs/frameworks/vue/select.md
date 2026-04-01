---
title: Select | V-Element
description: Select 组件的文档
---

# 选择器

当选项过多时，使用下拉菜单展示并选择内容。

## 基础用法

适用广泛的基础单选 `v-model` 的值为当前被选中的 `option` 的 value 属性值。

<preview path="../../components/Select/BasicSelect.vue" title="基础选择器" description="Select 基础选择器"></preview>

## 禁用状态

禁用整个选择器组件

为 `el-select` 设置 `disabled`属性，则整个选择器不可用。

<preview path="../../components/Select/DisabledSelect.vue" title="基础选择器禁用" description="Select 基础选择器禁用"></preview>


## 有禁用选项

禁用选择器组件的单个选项,为options数组选项里面设置`disabled`属性，则该选项不可用

<preview path="../../components/Select/DisabledSelectOption.vue" title="基础选择器禁用选项" description="Select 基础选择器禁用选项"></preview>


## 可清空单选

您可以使用清除图标来清除选择。

设置 `clearable` 属性，则可将选择器清空。

<preview path="../../components/Select/ClearSelect.vue" title="可清空单选" description="Select 可清空单选"></preview>

## 自定义模板

你可以自定义如何来渲染每一个选项, 使用 `renderLabel` 属性，它接受一个回调函数，返回 vNode 类型。

<preview path="../../components/Select/CustomRenderSelect.vue" title="自定义模板" description="Select 自定义模板"></preview>

## 筛选选项

可以利用筛选功能快速查找选项。

添加 `filterable` 属性即可启用搜索功能。 默认情况下，`Select` 会找出所有 `label` 属性包含输入值的选项。 如果希望使用其他的搜索逻辑，可以通过传入一个 `filter-method` 来实现。 `filter-method` 为一个 `Function`，它会在输入值发生变化时调用，参数为当前输入值。

<preview path="../../components/Select/FilterSelect.vue" title="筛选选项" description="Select 筛选选项"></preview>

## 远程搜索

输入关键字以从远程服务器中查找数据。

服务器搜索数据，输入关键字进行查找。为了启用远程搜索，需要将 `filterable` 和 `remote` 设置为true，同时传入一个`remote-method`。 `remote-method` 为一个返回 `Promise` 的`Function`，类型为 `(value: string) => Promise<SelectOption[]>` 。

<preview path="../../components/Select/RemoteSelect.vue" title="筛选选项" description="Select 筛选选项"></preview>


## Select API

### Select Attributes

| 属性名         | 说明                                    | 类型         | 默认值    |
|-------------|---------------------------------------|------------|--------|
| model-value / v-model       | 绑定值                                   | `'string'` | —      |
| options       | 选项的数据源,`value`,`label` 和 `disabled`属性. | `array`    | —      |
| placeholder       | 	占位符，默认为`Select`                      | `string`   | —      |
| clearable      | 是否可以清空选项                              | `boolean`  | false  |
| disabled    | 按钮是否为禁用状态                             | `boolean`  | false  |
| renderLabel  | 自定义模板                                 | `Function`   | —      |
| filterable   | `Select` 组件是否可筛选                        | `boolean`  | false  |
| filterMethod | 自定义筛选方法的第一个参数是当前输入的值。 只有当 `filterable` 设置为 `true` 时才会生效。  | `Function`  | —      |
| remote | 其中的选项是否从服务器远程加载      | `boolean`   | 	false |
| remoteMethod | 当输入值发生变化时触发的函数。 它的参数就是当前的输入值。 当`filterable`设置为 `true` 时才会生效    | `Function`| —    |


### Select Events

|事件名        | 说明       | 类型                                                               |
|-------------|----------|------------------------------------------------------------------|
| change        |选中值发生变化时触发  | `Function`                                     |
| blur        | 当 `input`失去焦点时触发  | `Function`                                     |
| focus        | 当 `input` 获得焦点时触发  | `Function`                                     |
| input        | 在 `input` 值改变时触发  | `Function`                                     |
| clear        | 可清空的单选模式下用户点击清空按钮时触发 | `Function`                                     |
| visible-change        | 下拉框出现/隐藏时触发 | `Function`                                     |


## Option Group API

### Option Group Attributes

| 属性名          | 说明                                                          | 类型         | 默认值    |
|--------------|-------------------------------------------------------------|------------|--------|
| label        | 	选项的名称                                                      | `string`   | —      |
| value        | 选项的值                                                        | `string`   | —  |
| disabled     | 是否将选项置为禁用                                                   | `boolean`  | false  |


