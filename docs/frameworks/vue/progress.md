---
title: Progress | V-Element
description: Progress 组件的文档
---

# Progress 进度条
用于展示操作进度，告知用户当前状态和预期。

## 直线进度条

`Progress` 组件设置 `percent` 属性即可，表示进度条对应的百分比。 该属性必填，并且必须在 0-100 的范围内。

<preview path="../../components/Progress/BasicProgress.vue" title="基础进度条" description="Progress 基础进度条"></preview>

## 进度条内显示百分比标识

`Progress` 组件可通过 `stroke-height` 属性更改进度条的高度，并可通过 `show-text` 属性来显示百分比标识。

<preview path="../../components/Progress/ShowTextProgress.vue" title="进度条百分比标识" description="Progress 进度条百分比标识"></preview>

## Progress API

### Progress Attributes

| 属性名                     | 说明                               | 类型                                                             | 默认值  |
|-------------------------|----------------------------------|----------------------------------------------------------------|------|
| percent                 | percent                          | `number`         | 0    |
| stroke-height| 进度条的高度                           | `number` | 15   |
| show-text                    | 	是否显示进度条文字内容 | `boolean`     | true |
| type             | 	进度条类型                         | `enum` - `'primary'\| 'success'\| 'warning'\| 'danger'\| 'info'`                                   | info |

