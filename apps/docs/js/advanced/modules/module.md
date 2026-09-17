# Module 的语法

JavaScript 模块（通常称为 ES Modules 或 ESM）是 ES6 (ES2015) 引入的官方、标准化的模块系统。它允许开发者将代码分割成独立的、可复用的文件（模块），然后按需导入或导出功能（如函数、类、变量）。

## 1. Module定义

模块化的核心优势：

- 封装 (Encapsulation): 每个模块都有自己的作用域，模块内的变量、函数默认是私有的，不会污染全局作用域。

- 可维护性 (Maintainability): 代码被组织成小的、功能单一的文件，更易于理解、修改和调试。

- 可复用性 (Reusability): 可以轻松地在不同项目中复用写好的模块。

- 依赖管理 (Dependency Management): 明确声明模块之间的依赖关系，使得代码结构更清晰。

ES6 模块的设计思想是尽量的静态化，使得编译时就能确定模块的依赖关系，以及输入和输出的变量。CommonJS 和 AMD 模块，都只能在运行时确定这些东西。比如，CommonJS 模块就是对象，输入时必须查找对象属性。

```js
// CommonJS模块
let { stat, exists, readfile } = require('fs')

// 等同于
let _fs = require('fs')
let stat = _fs.stat
let exists = _fs.exists
let readfile = _fs.readfile
```

上面代码的实质是整体加载`fs`模块（即加载`fs`的所有方法），生成一个对象（`_fs`），再从中读取 3 个方法。这种加载称为“**运行时加载**”，因为只有运行时才能拿到这个对象，也就无法在编译时做“**静态优化**”。

ES6 模块不是对象，而是通过`export`命令显式指定输出的代码，再通过`import`命令输入。

```js
// ES6模块
import { stat, exists, readFile } from 'fs'
```

上面代码的实质是从`fs`模块加载 3 个方法，其他方法不加载。这种加载称为“**编译时加载**”（静态加载），即 ES6 可以在编译时完成模块加载，效率高于 CommonJS。

此外，ES6 模块也让`UMD`等模块格式、以及用对象充当命名空间（比如`Math`）的做法不再必要：浏览器的新 API 可以直接以模块格式提供，不必做成全局变量或`navigator`对象的属性。

### 1.1 export 命令

模块功能主要由两个命令构成：`export`和`import`。`export`命令用于规定模块的对外接口，`import`命令用于输入其他模块提供的功能。

一个模块就是一个独立的文件。该文件内部的所有变量，外部无法获取。如果你希望外部能够读取模块内部的某个变量，就必须使用`export`关键字输出该变量。下面是一个 JS 文件，里面使用`export`命令输出变量。

```js
// profile.js
export var firstName = 'Michael'
export var lastName = 'Jackson'
export var year = 1958
```

`export`还有一种写法。

```js
// profile.js
var firstName = 'Michael'
var lastName = 'Jackson'
var year = 1958

export { firstName, lastName, year }
```

这种写法用大括号指定所要输出的一组变量，与前一种写法（直接放置在`var`语句前）是等价的，但应该优先使用——在脚本尾部一眼就能看清输出了哪些变量。

`export`命令除了输出变量，还可以输出函数或类（class）。

```js
export function multiply(x, y) {
  return x * y
}
```

通常情况下，`export`输出的变量就是本来的名字，但是可以使用`as`关键字重命名。

```js
function v1() { ... }
function v2() { ... }

export {
  v1 as streamV1,
  v2 as streamV2,
  v2 as streamLatestVersion
};
```

重命名后，`v2`可以用不同的名字输出两次。

需要特别注意的是，`export`命令规定的是对外的接口，必须与模块内部的变量建立一一对应关系。

```js
// 报错
export 1;

// 报错
var m = 1;
export m;
```

两种写法都会报错，因为没有提供对外的接口：`1`只是一个值，不是接口。正确写法如下。

```js
// 写法一
export var m = 1

// 写法二
var m = 1
export { m }

// 写法三
var n = 1
export { n as m }
```

三种写法都规定了对外的接口`m`，其他脚本可以通过它取到值`1`。其实质是在接口名与模块内部变量之间，建立一一对应的关系。

同样的，`function`和`class`的输出，也必须遵守这样的写法。

```js
// 报错
function f() {}
export f;

// 正确
export function f() {};

// 正确
function f() {}
export {f};
```

目前，export 命令能够对外输出的就是三种接口：函数（Functions）， 类（Classes），var、let、const 声明的变量（Variables）。

另外，`export`语句输出的接口，与其对应的值是动态绑定关系，即通过该接口，可以取到模块内部实时的值。

```js
export var foo = 'bar'
setTimeout(() => (foo = 'baz'), 500)
```

这一点与 CommonJS 规范完全不同。CommonJS 模块输出的是值的缓存，不存在动态更新，详见下文《Module 的加载实现》一节。

最后，`export`命令可以出现在模块的任何位置，只要处于模块顶层就可以。如果处于块级作用域内，就会报错，下一节的`import`命令也是如此。这是因为处于条件代码块之中，就没法做静态优化了，违背了 ES6 模块的设计初衷。

```js
function foo() {
  export default 'bar' // SyntaxError
}
foo()
```

### 1.2 import 命令

使用`export`命令定义了模块的对外接口以后，其他 JS 文件就可以通过`import`命令加载这个模块。

```js
// main.js
import { firstName, lastName, year } from './profile.js'

function setName(element) {
  element.textContent = firstName + ' ' + lastName
}
```

`import`命令接受一对大括号，里面指定要从其他模块导入的变量名，变量名必须与被导入模块（`profile.js`）对外接口的名称相同。

如果想为输入的变量重新取一个名字，`import`命令要使用`as`关键字，将输入的变量重命名。

```js
import { lastName as surname } from './profile.js'
```

`import`命令输入的变量都是只读的，因为它的本质是输入接口。也就是说，不允许在加载模块的脚本里面，改写接口。

```js
import { a } from './xxx.js'

a = {} // Syntax Error : 'a' is read-only;
```

`a`是一个只读的接口，对其重新赋值会报错；但如果`a`是一个对象，改写它的属性是允许的。

```js
import { a } from './xxx.js'

a.foo = 'hello' // 合法操作
```

`a`的属性可以成功改写，其他模块也能读到改写后的值。不过这种写法很难查错，建议凡是输入的变量都当作完全只读，不要轻易改变它的属性。

`import`后面的`from`指定模块文件的位置，可以是相对路径，也可以是绝对路径。如果不带有路径，只是一个模块名，那么必须有配置文件，告诉 JavaScript 引擎该模块的位置。

```js
import { myMethod } from 'util'
```

注意，`import`命令具有提升效果，会提升到整个模块的头部，首先执行。

```js
foo()

import { foo } from 'my_module'
```

上面的代码不会报错，因为`import`命令是编译阶段执行的，在代码运行之前，执行早于`foo`的调用。

由于`import`是静态执行，所以不能使用表达式和变量，这些只有在运行时才能得到结果的语法结构。

```js
// 报错
import { 'f' + 'oo' } from 'my_module';

// 报错
let module = 'my_module';
import { foo } from module;

// 报错
if (x === 1) {
  import { foo } from 'module1';
} else {
  import { foo } from 'module2';
}
```

三种写法都会报错，因为它们用到了表达式、变量和`if`结构，而在静态分析阶段这些语法都拿不到值。

最后，`import`语句会执行所加载的模块，因此可以有下面的写法。

```js
import 'lodash'
```

如果多次重复执行同一句`import`语句，那么只会执行一次，而不会执行多次。

```js
import 'lodash'
import 'lodash'
```

```js
import { foo } from 'my_module'
import { bar } from 'my_module'

// 等同于
import { foo, bar } from 'my_module'
```

虽然`foo`和`bar`在两个语句中加载，但它们对应的是同一个`my_module`模块。也就是说，`import`语句是 Singleton 模式。

目前通过 Babel 转码，CommonJS 模块的`require`命令和 ES6 模块的`import`命令可以写在同一个模块里面，但是最好不要这样做：`import`在静态解析阶段执行，是一个模块之中最早执行的。下面的代码可能不会得到预期结果。

```js
require('core-js/modules/es6.symbol')
require('core-js/modules/es6.promise')
import React from 'React'
```

### 1.3 export default 命令

使用`import`命令的时候，用户需要知道所要加载的变量名或函数名，否则无法加载；而用户肯定希望快速上手，未必愿意阅读文档去了解模块有哪些属性和方法。

为了给用户提供方便，让他们不用阅读文档就能加载模块，就要用到`export default`命令，为模块指定默认输出。

```js
// export-default.js
export default function () {
  console.log('foo')
}
```

其他模块加载该模块时，`import`命令可以为该匿名函数指定任意名字。

```js
// import-default.js
import customName from './export-default'
customName() // 'foo'
```

`import`命令可以用任意名称指向`export-default.js`输出的方法，这时不需要知道原模块输出的函数名。需要注意的是，这时`import`命令后面不使用大括号。

`export default`命令用在非匿名函数前，也是可以的。

```js
// export-default.js
export default function foo() {
  console.log('foo');
}

// 或者写成

function foo() {
  console.log('foo');
}

export default foo;
```

`foo`函数的函数名`foo`，在模块外部是无效的，加载的时候视同匿名函数。

下面比较一下默认输出和正常输出。

```js
// 第一组
export default function crc32() {
  // 输出
  // ...
}

import crc32 from 'crc32' // 输入

// 第二组
export function crc32() {
  // 输出
  // ...
}

import { crc32 } from 'crc32' // 输入
```

`export default`命令用于指定模块的默认输出。显然，一个模块只能有一个默认输出，因此`export default`命令只能使用一次。所以，import命令后面才不用加大括号，因为只可能唯一对应`export default`命令。

本质上，`export default`就是输出一个叫做`default`的变量或方法，然后系统允许你为它取任意名字。所以，下面的写法是有效的。

```js
// modules.js
function add(x, y) {
  return x * y
}
export { add as default }
// 等同于
// export default add;

// app.js
import { default as foo } from 'modules'
// 等同于
// import foo from 'modules';
```

正是因为`export default`命令其实只是输出一个叫做`default`的变量，所以它后面不能跟变量声明语句。

```js
// 正确
export var a = 1;

// 正确
var a = 1;
export default a;

// 错误
export default var a = 1;
```

同样地，因为`export default`命令的本质是将后面的值，赋给`default`变量，所以可以直接将一个值写在`export default`之后。

```js
// 正确
export default 42;

// 报错
export 42;
```

有了`export default`命令，输入模块时就非常直观了，以输入 lodash 模块为例。

```js
import _ from 'lodash'
```

如果想在一条`import`语句中，同时输入默认方法和其他接口，可以写成下面这样。

```js
import _, { each, forEach } from 'lodash'
```

对应上面代码的`export`语句如下。

```js
export default function (obj) {
  // ···
}

export function each(obj, iterator, context) {
  // ···
}

export { each as forEach }
```

上面代码最后一行暴露出`forEach`接口，默认指向`each`接口，即`forEach`和`each`指向同一个方法。

`export default`也可以用来输出类。

```js
// MyClass.js
export default class { ... }

// main.js
import MyClass from 'MyClass';
let o = new MyClass();
```

### 1.4 export 与 import 的复合写法

如果在一个模块之中，先输入后输出同一个模块，`import`语句可以与`export`语句写在一起。

```js
export { foo, bar } from 'my_module'

// 可以简单理解为
import { foo, bar } from 'my_module'
export { foo, bar }
```

写成一行以后，`foo`和`bar`实际上并没有被导入当前模块，只是相当于对外转发了这两个接口，导致当前模块不能直接使用它们。

模块的接口改名和整体输出，也可以采用这种写法。

```js
// 接口改名
export { foo as myFoo } from 'my_module'

// 整体输出
export * from 'my_module'
```

默认接口的写法如下。

```js
export { default } from 'foo'
```

具名接口改为默认接口的写法如下。

```js
export { es6 as default } from './someModule';

// 等同于
import { es6 } from './someModule';
export default es6;
```

同样地，默认接口也可以改名为具名接口。

```js
export { default as es6 } from './someModule'
```

ES2020 之前，有一种`import`语句，没有对应的复合写法。

```js
import * as someIdentifier from 'someModule'
```

[ES2020](https://github.com/tc39/proposal-export-ns-from)补上了这个写法。

```js
export * as ns from 'mod'

// 等同于
import * as ns from 'mod'
export { ns }
```

## 2. Module的高级特性

### 2.1 模块的整体加载

除了指定加载某个输出值，还可以使用整体加载，即用星号（`*`）指定一个对象，所有输出值都加载在这个对象上面。

下面是一个`circle.js`文件，它输出两个方法`area`和`circumference`。

```js
// circle.js

export function area(radius) {
  return Math.PI * radius * radius
}

export function circumference(radius) {
  return 2 * Math.PI * radius
}
```

现在，加载这个模块。

```js
// main.js

import { area, circumference } from './circle'

console.log('圆面积：' + area(4))
console.log('圆周长：' + circumference(14))
```

上面写法是逐一指定要加载的方法，整体加载的写法如下。

```js
import * as circle from './circle'

console.log('圆面积：' + circle.area(4))
console.log('圆周长：' + circle.circumference(14))
```

注意，模块整体加载所在的那个对象（上例是`circle`），应该是可以静态分析的，所以不允许运行时改变。下面的写法都是不允许的。

```js
import * as circle from './circle'

// 下面两行都是不允许的
circle.foo = 'hello'
circle.area = function () {}
```

### 2.2 模块的继承

模块可以继承。

假设有一个`circleplus`模块，继承了`circle`模块。

```js
// circleplus.js

export * from 'circle'
export var e = 2.71828182846
export default function (x) {
  return Math.exp(x)
}
```

上面代码中的`export *`表示再输出`circle`模块的所有属性和方法，注意它会忽略`circle`模块的`default`方法；此外，代码又输出了自定义的`e`变量和默认方法。

这时，也可以将`circle`的属性或方法，改名后再输出。

```js
// circleplus.js

export { area as circleArea } from 'circle'
```

加载上面模块的写法如下。

```js
// main.js

import * as math from 'circleplus'
import exp from 'circleplus'
console.log(exp(math.e))
```

上面的`import exp`表示将`circleplus`模块的默认方法加载为`exp`方法。

### 2.3 跨模块常量

本书介绍`const`命令的时候说过，`const`声明的常量只在当前代码块有效。如果想设置跨模块的常量（即跨多个文件），或者说一个值要被多个模块共享，可以采用下面的写法。

```js
// constants.js 模块
export const A = 1
export const B = 3
export const C = 4

// test1.js 模块
import * as constants from './constants'
console.log(constants.A) // 1
console.log(constants.B) // 3

// test2.js 模块
import { A, B } from './constants'
console.log(A) // 1
console.log(B) // 3
```

如果要使用的常量非常多，可以建一个专门的`constants`目录，将各种常量写在不同的文件里面，保存在该目录下。

```js
// constants/db.js
export const db = {
  url: 'http://my.couchdbserver.local:5984',
  admin_username: 'admin',
  admin_password: 'admin password',
}

// constants/user.js
export const users = ['root', 'admin', 'staff', 'ceo', 'chief', 'moderator']
```

然后，将这些文件输出的常量，合并在`index.js`里面。

```js
// constants/index.js
export { db } from './db'
export { users } from './users'
```

使用的时候，直接加载`index.js`就可以了。

```js
// script.js
import { db, users } from './constants/index'
```

### 2.4 import 属性

ES2025 引入了“[import 属性](https://github.com/tc39/proposal-import-attributes)”（import attributes），允许为 import 命令设置属性，主要用于导入非模块的代码，比如 JSON 数据、WebAssembly 代码、CSS 代码。

目前，只支持导入 JSON 数据。

```js
// 静态导入
import configData from './config-data.json' with { type: 'json' }

// 动态导入
const configData = await import('./config-data.json', {
  with: { type: 'json' },
})
```

上面代码中，import 命令使用 with 子句指定一个属性对象。该对象目前只有一个 type 属性，值就是导入代码的类型，现在只能设置为`json`。

如果没有 import 属性，导入 JSON 数据只能使用 fetch 命令。

```js
const response = await fetch('./config.json')
const json = await response.json()
```

export 命令与 import 命令写在一起，形成一个再导出语句时，也可以使用 import 属性。

```js
export { default as config } from './config-data.json' with { type: 'json' }
```

### 2.5 Module严格模式

ES6 的模块自动采用严格模式，不管你有没有在模块头部加上`"use strict";`，严格模式主要有以下限制。

[width(11,41,48)]

| 类别   | 限制                                 | 说明                                                          |
| :----- | :----------------------------------- | :------------------------------------------------------------ |
| 变量   | 必须先声明后再使用                   | 未声明就赋值报 `ReferenceError`，不再隐式创建全局变量         |
| 变量   | 不能对只读属性赋值                   | 报 `TypeError`                                                |
| 变量   | 不能删除不可删除的属性               | 报 `TypeError`                                                |
| 变量   | 不能删除变量                         | `delete prop` 报语法错误，只能删除属性 `delete global[prop]`  |
| 语法   | 不能使用 `with` 语句                 | `with` 让作用域无法静态确定，直接报语法错误                   |
| 语法   | 不能用前缀 0 表示八进制数            | 如 `010` 报错，需写成 `0o10`                                  |
| 语法   | 新增保留字                           | `protected`、`static`、`interface` 等不能用作标识符           |
| 函数   | 参数不能有同名属性                   | 重复的参数名报语法错误                                        |
| 函数   | `arguments` 不自动反映参数变化       | 在函数内改写参数，不会同步到 `arguments`                      |
| 函数   | 不能用 `arguments.callee`            | 禁止在函数内部引用当前函数自身                                |
| 函数   | 不能用 `arguments.caller`            | 禁止通过它访问调用者                                          |
| 函数   | 不能用 `fn.caller` / `fn.arguments`  | 无法借此获取函数调用的堆栈                                    |
| `eval` | 不在外层作用域引入变量               | `eval` 中声明的变量留在它自己的作用域内                       |
| `eval` | `eval` 和 `arguments` 不能被重新赋值 | 二者不是普通标识符                                            |
| `this` | 禁止 `this` 指向全局对象             | 模块顶层的 `this` 是 `undefined`，不要在顶层代码中使用 `this` |

## 3. 动态导入import()

标准的 import 语句是静态的，必须写在模块的顶层。但有时，我们需要根据条件或在代码执行过程中按需加载模块。这时就可以使用动态导入 import()。

import() 是一种类似函数的语法，它返回一个 Promise，该 Promise 在模块加载成功后会 resolve 为模块的命名空间对象。

### 3.1 定义

前面介绍过，`import`命令会被 JavaScript 引擎静态分析，先于模块内的其他语句执行（`import`命令叫做“**连接**”binding 其实更合适）。所以，下面的代码会报错。

```js
// 报错
if (x === 2) {
  import MyModual from './myModual'
}
```

引擎处理`import`语句是在编译时，这时不会去分析或执行`if`语句，所以`import`语句放在`if`代码块之中毫无意义，会报句法错误而不是执行时错误。也就是说，`import`和`export`命令只能在模块的顶层，不能在代码块之中（比如在`if`代码块或函数之中）。

这样的设计固然有利于编译器提高效率，但也导致无法在运行时加载模块，在语法上条件加载就不可能实现。如果`import`命令要取代 Node 的`require`方法，这就形成了一个障碍，因为`require`是运行时加载模块，`import`命令无法取代它的动态加载功能。

```js
const path = './' + fileName
const myModual = require(path)
```

上面的语句就是动态加载，`require`到底加载哪一个模块，只有运行时才知道，`import`命令做不到这一点。

[ES2020提案](https://github.com/tc39/proposal-dynamic-import) 引入`import()`函数，支持动态加载模块。

```js
import(specifier)
```

上面代码中，`import()`函数的参数`specifier`指定所要加载的模块的位置。`import`命令能够接受什么参数，`import()`函数就能接受什么参数，两者的区别主要是后者为动态加载。

`import()`返回一个 Promise 对象。下面是一个例子。

```js
const main = document.querySelector('main')

import(`./section-modules/${someVariable}.js`)
  .then(module => {
    module.loadPageInto(main)
  })
  .catch(err => {
    main.textContent = err.message
  })
```

`import()`函数可以用在任何地方，不仅仅是模块，非模块的脚本也可以使用。它是运行时执行，什么时候运行到这一句，就会加载指定的模块。另外，`import()`函数与所加载的模块没有静态连接关系，这点也与`import`语句不同。`import()`类似于 Node.js 的`require()`方法，区别主要是前者异步加载、后者同步加载。

由于`import()`返回 Promise 对象，需要使用`then()`方法指定处理函数。考虑到代码的清晰，更推荐使用`await`命令。

```js
async function renderWidget() {
  const container = document.getElementById('widget')
  if (container !== null) {
    // 等同于
    // import("./widget").then(widget => {
    //   widget.render(container);
    // });
    const widget = await import('./widget.js')
    widget.render(container)
  }
}

renderWidget()
```

### 3.2 应用场景

下面是`import()`的一些应用场景。

（1）按需加载。

`import()`可以在需要的时候，再加载某个模块。

```js
button.addEventListener('click', event => {
  import('./dialogBox.js')
    .then(dialogBox => {
      dialogBox.open()
    })
    .catch(error => {
      /* Error handling */
    })
})
```

（2）条件加载

`import()`可以放在`if`代码块，根据不同的情况，加载不同的模块。

```js
if (condition) {
  import('moduleA').then(...);
} else {
  import('moduleB').then(...);
}
```

（3）动态的模块路径

`import()`允许模块路径动态生成。

```js
import(f())
.then(...);
```

### 3.3 注意点

`import()`加载模块成功以后，这个模块会作为一个对象，当作`then`方法的参数。因此，可以使用对象解构赋值的语法，获取输出接口。

```js
import('./myModule.js').then(({ export1, export2 }) => {
  // ...·
})
```

如果模块有`default`输出接口，可以用参数直接获得。

```js
import('./myModule.js').then(myModule => {
  console.log(myModule.default)
})
```

上面的代码也可以使用具名输入的形式。

```js
import('./myModule.js').then(({ default: theDefault }) => {
  console.log(theDefault)
})
```

如果想同时加载多个模块，可以采用下面的写法。

```js
Promise.all([
  import('./module1.js'),
  import('./module2.js'),
  import('./module3.js'),
]).then(([module1, module2, module3]) => {})
```

`import()`也可以用在 async 函数之中。

```js
async function main() {
  const myModule = await import('./myModule.js')
  const { export1, export2 } = await import('./myModule.js')
  const [module1, module2, module3] = await Promise.all([
    import('./module1.js'),
    import('./module2.js'),
    import('./module3.js'),
  ])
}
main()
```

## 4. `import.meta`

开发者使用一个模块时，有时需要知道模板本身的一些信息（比如模块的路径）。[ES2020](https://github.com/tc39/proposal-import-meta) 为 `import` 命令添加了一个元属性`import.meta`，返回当前模块的元信息。

`import.meta`只能在模块内部使用，如果在模块外部使用会报错。

这个属性返回一个对象，该对象的各种属性就是当前运行的脚本的元信息。具体包含哪些属性，标准没有规定，由各个运行环境自行决定。一般来说，`import.meta`至少会有下面两个属性。

### **4.1 `import.meta.url`**

`import.meta.url`返回当前模块的 `URL` 路径。举例来说，当前模块主文件的路径是`https://foo.com/main.js`，`import.meta.url`就返回这个路径。如果模块里面还有一个数据文件`data.txt`，那么就可以用下面的代码，获取这个数据文件的路径。

```js
new URL('data.txt', import.meta.url)
```

注意，`Node.js` 环境中，`import.meta.url`返回的总是本地路径，即`file:URL`协议的字符串，比如`file:///home/user/foo.js`。

### **4.2 `import.meta.scriptElement`**

`import.meta.scriptElement`是浏览器特有的元属性，返回加载模块的那个`script标签`元素，相当于`document.currentScript`属性。

```js
// HTML 代码为
// <script type="module" src="my-module.js" data-foo="abc"></script>

// my-module.js 内部执行下面的代码
import.meta.scriptElement.dataset.foo
// "abc"
```

### **4.3 其他**

`Deno` 现在还支持`import.meta.filename`和`import.meta.dirname`属性，对应 `CommonJS` 模块系统的`__filename`和`__dirname`属性。

- `import.meta.filename`：当前模块文件的绝对路径。
- `import.meta.dirname`：当前模块文件的目录的绝对路径。

这两个属性都提供当前平台的正确的路径分隔符，比如 Linux 系统返回`/dev/my_module.ts`，Windows 系统返回`C:\dev\my_module.ts`。

## 5. 常见问题 (FAQ)

### 5.1 `export` 为什么不能直接输出一个值？

- `export` 规定的是对外的**接口**，必须与模块内部的变量建立一一对应关系。`export 1`、`var m = 1; export m` 输出的都只是一个值，没有接口名，所以报语法错误。
- 正确写法有三种:`export var m = 1`、`var m = 1; export { m }`、`var n = 1;export { n as m }`。

```js
// 接口名 m 与模块内部变量 n 一一对应
var n = 1
export { n as m }
```

### 5.2 `export default` 和 `export` 有什么区别，该怎么选？

- `export default` 输出的是一个叫 `default` 的接口，一个模块只能有一个；导入时不用大括号，且可以随便起名。`export` 可以输出多个具名接口，导入时必须用大括号，名字要和接口对上。
- 本质上 `export default add` 等同于 `export { add as default }`，`import foo from 'mod'` 等同于 `import { default as foo } from 'mod'`。
- 注意 `export default` 后面不能跟变量声明语句，`export default var a = 1` 是错的；但可以直接写一个值（`export default 42`），因为它相当于把值赋给 `default` 变量。
- 实践中，库的默认入口用 `export default` 方便使用者，其余功能用具名导出，便于按需引入和 tree-shaking。

### 5.3 为什么不能在 `if` 或函数里写 `import` / `export`？

- 因为 `import` 和 `export` 在**编译阶段**处理，此时引擎不会去分析 `if` 的条件，无法静态确定依赖关系，所以写在代码块里报的是**语法错误**，而不是运行时报错。
- 这是 ES6 模块“**静态化**”设计的直接后果，也是它没法做条件加载的原因；需要条件加载就用 `import()`。

### 5.4 `import()` 和 `import` 有什么区别？

- **位置**：`import` 只能写在模块顶层；`import()` 可以写在任何地方，非模块脚本也能用。
- **时机**：`import` 在编译阶段执行，早于模块内其他语句；`import()` 在运行时执行，执行到这一句才去加载。
- **返回值**：`import` 得到的是接口的只读引用，与所加载模块有静态连接；`import()` 返回一个 Promise，resolve 为模块的命名空间对象，没有静态连接关系。
- **能否条件加载**：`import` 不能；`import()` 能，因此适合做按需加载、条件加载和动态路径。

```js
// 运行时才知道加载哪个模块，只有 import() 能做到
const name = await getModuleName()
const mod = await import(`./section-modules/${name}.js`)
```

### 5.5 `import` 进来的变量为什么不能重新赋值，改属性却可以？

- `import` 引入的是**只读的接口绑定**，相当于指向原模块变量的“**符号连接**”，对它重新赋值会报 `TypeError`（不能改写接口）。
- 但绑定是活的引用：如果它指向一个对象，改写对象的属性是允许的，而且其他模块也能读到改写后的值。
- 这种做法很难排查，建议把 `import` 进来的变量当作完全只读，不要轻易改其属性。

### 5.6 `import.meta` 在浏览器和 Node.js 里有什么不同？

- `import.meta` 只能在模块内部使用，返回当前模块的元信息，具体包含哪些属性由运行环境决定。
- `import.meta.url` 两个环境都有：浏览器返回模块的 URL（如 `https://foo.com/main.js`），Node.js 返回 `file:` 协议的本地路径（如 `file:///home/user/foo.js`）。用它拼同级资源是常见写法：

```js
// 无论模块部署在哪里，都能定位到同目录下的数据文件
const dataUrl = new URL('data.txt', import.meta.url)
```

- `import.meta.scriptElement` 只有浏览器有，等价于 `document.currentScript`；`import.meta.filename` 和 `import.meta.dirname` 目前只有 Deno 支持，对应 CommonJS 的 `__filename` 和 `__dirname`。
