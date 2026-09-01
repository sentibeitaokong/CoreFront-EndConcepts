/*
 * 示例代码：operator.md
 * 来源文档：apps/docs/js/advanced/data-types/operator.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. 指数运算符 =====
// 2 ** 2 // 4
// 2 ** 3 // 8

// ===== 1. 指数运算符 =====
// // 相当于 2 ** (3 ** 2)
// 2 ** (3 ** 2)
// // 512

// ===== 1. 指数运算符 =====
// let a = 1.5
// a **= 2
// // 等同于 a = a * a;
//
// let b = 4
// b **= 3
// // 等同于 b = b * b * b;

// ===== 2. 链判断运算符 =====
// // 错误的写法
// const firstName = message.body.user.firstName || 'default'
//
// // 正确的写法
// const firstName =
//   (message &&
//     message.body &&
//     message.body.user &&
//     message.body.user.firstName) ||
//   'default'

// ===== 2. 链判断运算符 =====
// const fooInput = myForm.querySelector('input[name=foo]')
// const fooValue = fooInput ? fooInput.value : undefined

// ===== 2. 链判断运算符 =====
// const firstName = message?.body?.user?.firstName || 'default'
// const fooValue = myForm.querySelector('input[name=foo]')?.value

// ===== 2. 链判断运算符 =====
// iterator.return?.()

// ===== 2. 链判断运算符 =====
// if (myForm.checkValidity?.() === false) {
//   // 表单校验失败
//   return
// }

// ===== 2. 链判断运算符 [bash] =====
// let hex = "#C0FFEE".match(/#([A-Z]+)/i)?.[1];

// ===== 2. 链判断运算符 =====
// a?.b
// // 等同于
// a == null ? undefined : a.b
//
// a?.[x]
// // 等同于
// a == null ? undefined : a[x]
//
// a?.b()
// // 等同于
// a == null ? undefined : a.b()
//
// a?.()
// // 等同于
// a == null ? undefined : a()

// ===== 2. 链判断运算符 =====
// a?.[++x]
// // 等同于
// a == null ? undefined : a[++x]

// ===== 2. 链判断运算符 =====
// ;(a?.b).c(
//   // 等价于
//   a == null ? undefined : a.b,
// ).c

// ===== 2. 链判断运算符 =====
// // 构造函数
// new a?.()
// new a?.b()
//
// // 链判断运算符的右侧有模板字符串
// a?.`{b}`
// a?.b`{c}`
//
// // 链判断运算符的左侧是 super
// super?.()
// super?.foo
//
// // 链运算符用于赋值运算符左侧
// a?.b = c

// ===== 3. Null 判断运算符 =====
// const headerText = response.settings.headerText || 'Hello, world!'
// const animationDuration = response.settings.animationDuration || 300
// const showSplashScreen = response.settings.showSplashScreen || true

// ===== 3. Null 判断运算符 =====
// const headerText = response.settings.headerText ?? 'Hello, world!'
// const animationDuration = response.settings.animationDuration ?? 300
// const showSplashScreen = response.settings.showSplashScreen ?? true

// ===== 3. Null 判断运算符 =====
// const animationDuration = response.settings?.animationDuration ?? 300

// ===== 3. Null 判断运算符 =====
// function Component(props) {
//   const enable = props.enabled ?? true
//   // …
// }

// ===== 3. Null 判断运算符 =====
// function Component(props) {
//   const { enabled: enable = true } = props
//   // …
// }

// ===== 3. Null 判断运算符 =====
// // 报错
// lhs && middle ?? rhs
// lhs ?? middle && rhs
// lhs || middle ?? rhs
// lhs ?? middle || rhs

// ===== 3. Null 判断运算符 =====
// ;(lhs && middle) ?? rhs
// lhs && (middle ?? rhs)
//
// ;(lhs ?? middle) && rhs
// lhs ?? (middle && rhs)
//
// ;(lhs || middle) ?? rhs
// lhs || (middle ?? rhs)
//
// ;(lhs ?? middle) || rhs
// lhs ?? (middle || rhs)

// ===== 4. 逻辑赋值运算符 =====
// // 或赋值运算符
// x ||= y
// // 等同于
// x || (x = y)
//
// // 与赋值运算符
// x &&= y
// // 等同于
// x && (x = y)
//
// // Null 赋值运算符
// x ??= y
// // 等同于
// x ?? (x = y)

// ===== 4. 逻辑赋值运算符 =====
// // 老的写法
// user.id = user.id || 1
//
// // 新的写法
// user.id ||= 1

// ===== 4. 逻辑赋值运算符 =====
// function example(opts) {
//   opts.foo = opts.foo ?? 'bar'
//   opts.baz ?? (opts.baz = 'qux')
// }

// ===== 4. 逻辑赋值运算符 =====
// function example(opts) {
//   opts.foo ??= 'bar'
//   opts.baz ??= 'qux'
// }

// ===== 5. #!命令 [bash] =====
// #!/bin/sh

// ===== 5. #!命令 [python] =====
// #!/usr/bin/env python

// ===== 5. #!命令 =====
// // 写在脚本文件第一行
// #!/usr/bin/env node
// 'use strict';
// console.log(1);
//
// // 写在模块文件第一行
// #!/usr/bin/env node
// export {};
// console.log(1);

// ===== 5. #!命令 [bash] =====
// # 以前执行脚本的方式
// $ node hello.js
//
// # hashbang 的方式
// $ ./hello.js

