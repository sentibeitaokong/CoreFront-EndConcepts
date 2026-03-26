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

<preview path="../../components/Tooltip/SlotTooltip.vue" title="按钮禁用用法" description="Button 组件的按钮禁用用法"></preview>

