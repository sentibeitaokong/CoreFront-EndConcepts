---
title: Message | V-Element
description: Message 组件的文档
---

# Message 消息提示

常用于主动操作后的反馈提示。 与 `Notification` 的区别是后者更多用于系统级通知的被动提醒。

## 基础用法

默认情况下在顶部显示并在 3 秒后消失。

`Message` 在配置上与 `Notification` 非常类似,注册了一个全局的 `createMessage`方法用于调用。 Message 可以接收一个字符串或一个 VNode 作为参数，它会被显示为正文内容。

<preview path="../../components/Message/BasicMessage.vue" title="基础用法" description="Message 组件的基础用法"></preview>

## 不同状态

用来显示「成功、警告、消息、错误」类的操作反馈。

当需要自定义更多属性时，`Message` 也可以接收一个对象为参数。 比如，设置 `type` 字段可以定义不同的状态，默认为`info`。 此时正文内容以 message 的值传入。

<preview path="../../components/Message/StateMessage.vue" title="不同状态用法" description="Message 组件的不同状态用法"></preview>


## 可关闭的消息提示

可以添加关闭按钮。

默认的 `Message` 是不可以被人工关闭的。 如果你需要手动关闭功能，你可以把 `showClose` 设置为 `true` 此外，和 `Notification` 一样，`Message` 拥有可控的 `duration`， 默认的关闭时间为 `3000` 毫秒，当把这个属性的值设置为0便表示该消息不会被自动关闭。

<preview path="../../components/Message/CanCloseMessage.vue" title="可关闭模式用法" description="DropDown 组件的可关闭模式用法"></preview>

## Message API

### Message  Attributes

| 属性名           | 说明                       | 类型                                                  | 默认值   |
|---------------|--------------------------|-----------------------------------------------------|-------|
| message     | 消息文字                     | `'string'\| 'VNode'`                                | ''    |
| type       | 		消息类型                   | `enum` - `'success'\| 'info'\| 'danger'\| 'warning'` | info  |
| showClose        | 	是否显示关闭按钮                | `boolean`                   | false |
| duration | 显示时间，单位为毫秒。 设为 0 则不会自动关闭 | `number`       | 3000  |
| offset      | 设置到视口顶部边缘的距离             | `number`                                            | 30    |
