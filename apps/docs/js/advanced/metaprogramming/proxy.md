# Proxy

Proxy 是 ES6 引入的特性，允许你创建一个对象的“**代理**”，从而拦截并自定义该对象上的基本操作（如属性查找、赋值、函数调用等）。Proxy 包装另一个对象（称为目标对象），并允许你定义一个包含“**陷阱**”（traps）的处理器对象（handler），这些陷阱就是拦截具体操作的函数。

## 1. Proxy概述

Proxy 用于修改某些操作的默认行为，等同于在语言层面做出修改，所以属于一种“**元编程**”（meta programming），即对编程语言进行编程。

Proxy 可以理解成在目标对象之前架设一层“**拦截**”，外界对该对象的访问都必须先通过这层拦截，从而提供了一种对外界访问进行过滤和改写的机制。Proxy 一词的原意是代理，用在这里表示由它来“**代理**”某些操作，可以译为“**代理器**”。

```js
var obj = new Proxy(
  {},
  {
    get: function (target, propKey, receiver) {
      console.log(`getting ${propKey}!`)
      return Reflect.get(target, propKey, receiver)
    },
    set: function (target, propKey, value, receiver) {
      console.log(`setting ${propKey}!`)
      return Reflect.set(target, propKey, value, receiver)
    },
  },
)
```

上面代码对一个空对象架设了一层拦截，重定义了属性的读取（`get`）和设置（`set`）行为。这里先不解释具体语法，只看运行结果：对设置了拦截行为的`obj`读写属性，会得到下面的结果。

```js
obj.count = 1
//  setting count!
++obj.count
//  getting count!
//  setting count!
//  2
```

上面代码说明，Proxy 实际上重载（overload）了点运算符，用自己的定义覆盖了语言的原始定义。

ES6 原生提供 Proxy 构造函数，用来生成 Proxy 实例。

```js
var proxy = new Proxy(target, handler)
```

Proxy 对象的所有用法都是上面这种形式，不同的只是`handler`参数的写法。其中`new Proxy()`生成一个`Proxy`实例，`target`是所要拦截的目标对象，`handler`也是一个对象，用来定制拦截行为。

下面是另一个拦截读取属性行为的例子。

```js
var proxy = new Proxy(
  {},
  {
    get: function (target, propKey) {
      return 35
    },
  },
)

proxy.time // 35
proxy.name // 35
proxy.title // 35
```

上面代码中，`Proxy`作为构造函数接受两个参数：第一个是所要代理的目标对象（上例是一个空对象）；第二个是配置对象，对于每一个被代理的操作，需要提供一个对应的处理函数，用来拦截该操作。比如上例的配置对象有一个`get`方法，用来拦截属性访问请求，它的两个参数分别是目标对象和所要访问的属性。由于拦截函数总是返回`35`，所以访问任何属性都得到`35`。

注意，要使得`Proxy`起作用，必须针对`Proxy`实例（上例是`proxy`对象）进行操作，而不是针对目标对象（上例是空对象）进行操作。

如果`handler`没有设置任何拦截，那就等同于直接通向原对象。

```js
var target = {}
var handler = {}
var proxy = new Proxy(target, handler)
proxy.a = 'b'
target.a // "b"
```

上面代码中，`handler`是一个空对象，没有任何拦截效果，访问`proxy`就等同于访问`target`。

一个技巧是将 Proxy 对象，设置到`object.proxy`属性，从而可以在`object`对象上调用。

```js
var object = { proxy: new Proxy(target, handler) }
```

Proxy 实例也可以作为其他对象的原型对象。

```js
var proxy = new Proxy(
  {},
  {
    get: function (target, propKey) {
      return 35
    },
  },
)

let obj = Object.create(proxy)
obj.time // 35
```

上面代码中，`proxy`是`obj`的原型，`obj`本身没有`time`属性，根据原型链会在`proxy`上读取该属性，导致被拦截。

同一个拦截器函数，可以设置拦截多个操作。

```js
var handler = {
  get: function (target, name) {
    if (name === 'prototype') {
      return Object.prototype
    }
    return 'Hello, ' + name
  },

  apply: function (target, thisBinding, args) {
    return args[0]
  },

  construct: function (target, args) {
    return { value: args[1] }
  },
}

var fproxy = new Proxy(function (x, y) {
  return x + y
}, handler)

fproxy(1, 2) // 1
new fproxy(1, 2) // {value: 2}
fproxy.prototype === Object.prototype // true
fproxy.foo === 'Hello, foo' // true
```

对于可以设置、但没有设置拦截的操作，则直接落在目标对象上，按照原先的方式产生结果。

下面是 Proxy 支持的拦截操作一览，一共 13 种。

[width(34,44,22)]

| 拦截方法                                    | 拦截的操作                                                                                                       | 返回值                                                                                                |
| :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `get(target, propKey, receiver)`            | 对象属性的读取，比如`proxy.foo`和`proxy['foo']`                                                                  | 任意值                                                                                                |
| `set(target, propKey, value, receiver)`     | 对象属性的设置，比如`proxy.foo = v`或`proxy['foo'] = v`                                                          | 布尔值                                                                                                |
| `has(target, propKey)`                      | `propKey in proxy`                                                                                               | 布尔值                                                                                                |
| `deleteProperty(target, propKey)`           | `delete proxy[propKey]`                                                                                          | 布尔值                                                                                                |
| `ownKeys(target)`                           | `Object.getOwnPropertyNames(proxy)`、`Object.getOwnPropertySymbols(proxy)`、`Object.keys(proxy)`、`for...in`循环 | 数组。返回目标对象所有自身的属性的属性名，而`Object.keys()`的返回结果仅包括目标对象自身的可遍历属性。 |
| `getOwnPropertyDescriptor(target, propKey)` | `Object.getOwnPropertyDescriptor(proxy, propKey)`                                                                | 属性的描述对象                                                                                        |
| `defineProperty(target, propKey, propDesc)` | `Object.defineProperty(proxy, propKey, propDesc)`、`Object.defineProperties(proxy, propDescs)`                   | 布尔值                                                                                                |
| `preventExtensions(target)`                 | `Object.preventExtensions(proxy)`                                                                                | 布尔值                                                                                                |
| `getPrototypeOf(target)`                    | `Object.getPrototypeOf(proxy)`                                                                                   | 对象                                                                                                  |
| `isExtensible(target)`                      | `Object.isExtensible(proxy)`                                                                                     | 布尔值                                                                                                |
| `setPrototypeOf(target, proto)`             | `Object.setPrototypeOf(proxy, proto)`                                                                            | 布尔值                                                                                                |
| `apply(target, object, args)`               | Proxy 实例作为函数调用的操作，比如`proxy(...args)`、`proxy.call(object, ...args)`、`proxy.apply(...)`            | 任意值                                                                                                |
| `construct(target, args)`                   | Proxy 实例作为构造函数调用的操作，比如`new proxy(...args)`                                                       | 对象                                                                                                  |

如果目标对象是函数，那么还有`apply`和`construct`两种额外操作可以拦截。

## 2. [Proxy 实例的方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

下面逐一介绍这些拦截方法。

### get()

`get`方法用于拦截某个属性的读取操作，可以接受三个参数，依次为目标对象、属性名和 proxy 实例本身（严格地说，是操作行为所针对的对象），其中最后一个参数可选。

下面看另一个拦截读取操作的例子。

```js
var person = {
  name: '张三',
}

var proxy = new Proxy(person, {
  get: function (target, propKey) {
    if (propKey in target) {
      return target[propKey]
    } else {
      throw new ReferenceError('Prop name "' + propKey + '" does not exist.')
    }
  },
})

proxy.name // "张三"
proxy.age // 抛出一个错误
```

上面代码表示，访问目标对象不存在的属性会抛出错误；如果没有这个拦截函数，访问不存在的属性只会返回`undefined`。

`get`方法可以继承。

```js
let proto = new Proxy(
  {},
  {
    get(target, propertyKey, receiver) {
      console.log('GET ' + propertyKey)
      return target[propertyKey]
    },
  },
)

let obj = Object.create(proto)
obj.foo // "GET foo"
```

上面代码中，拦截操作定义在`Prototype`对象上，所以读取`obj`继承的属性时拦截会生效。

下面的例子使用`get`拦截，实现数组读取负数的索引。

```js
function createArray(...elements) {
  let handler = {
    get(target, propKey, receiver) {
      let index = Number(propKey)
      if (index < 0) {
        propKey = String(target.length + index)
      }
      return Reflect.get(target, propKey, receiver)
    },
  }

  let target = []
  target.push(...elements)
  return new Proxy(target, handler)
}

let arr = createArray('a', 'b', 'c')
arr[-1] // c
```

利用 Proxy，可以将读取属性的操作（`get`），转变为执行某个函数，从而实现属性的链式操作。

```js
var pipe = function (value) {
  var funcStack = []
  var oproxy = new Proxy(
    {},
    {
      get: function (pipeObject, fnName) {
        if (fnName === 'get') {
          return funcStack.reduce(function (val, fn) {
            return fn(val)
          }, value)
        }
        funcStack.push(window[fnName])
        return oproxy
      },
    },
  )

  return oproxy
}

var double = n => n * 2
var pow = n => n * n
var reverseInt = n => n.toString().split('').reverse().join('') | 0

pipe(3).double.pow.reverseInt.get // 63
```

上面代码设置 Proxy 以后，达到了将函数名链式使用的效果。

下面的例子则是利用`get`拦截，实现一个生成各种 DOM 节点的通用函数`dom`。

```js
const dom = new Proxy(
  {},
  {
    get(target, property) {
      return function (attrs = {}, ...children) {
        const el = document.createElement(property)
        for (let prop of Object.keys(attrs)) {
          el.setAttribute(prop, attrs[prop])
        }
        for (let child of children) {
          if (typeof child === 'string') {
            child = document.createTextNode(child)
          }
          el.appendChild(child)
        }
        return el
      }
    },
  },
)

const el = dom.div(
  {},
  'Hello, my name is ',
  dom.a({ href: '//example.com' }, 'Mark'),
  '. I like:',
  dom.ul(
    {},
    dom.li({}, 'The web'),
    dom.li({}, 'Food'),
    dom.li({}, "…actually that's it"),
  ),
)

document.body.appendChild(el)
```

下面是一个`get`方法的第三个参数的例子，它总是指向原始的读操作所在的那个对象，一般情况下就是 Proxy 实例。

```js
const proxy = new Proxy(
  {},
  {
    get: function (target, key, receiver) {
      return receiver
    },
  },
)
proxy.getReceiver === proxy // true
```

```js
const proxy = new Proxy(
  {},
  {
    get: function (target, key, receiver) {
      return receiver
    },
  },
)

const d = Object.create(proxy)
d.a === d // true
```

上面代码中，`d`本身没有`a`属性，读取`d.a`时会去原型`proxy`上找，这时`receiver`指向`d`，代表原始的读操作所在的那个对象。

如果一个属性不可配置（configurable）且不可写（writable），则 Proxy 不能修改该属性，否则通过 Proxy 对象访问该属性会报错。

```js
const target = Object.defineProperties(
  {},
  {
    foo: {
      value: 123,
      writable: false,
      configurable: false,
    },
  },
)

const handler = {
  get(target, propKey) {
    return 'abc'
  },
}

const proxy = new Proxy(target, handler)

proxy.foo
// TypeError: Invariant check failed
```

### set()

`set`方法用来拦截某个属性的赋值操作，可以接受四个参数，依次为目标对象、属性名、属性值和 Proxy 实例本身，其中最后一个参数可选。

假定`Person`对象有一个`age`属性，该属性应该是一个不大于 200 的整数，那么可以使用`Proxy`保证`age`的属性值符合要求。

```js
let validator = {
  set: function (obj, prop, value) {
    if (prop === 'age') {
      if (!Number.isInteger(value)) {
        throw new TypeError('The age is not an integer')
      }
      if (value > 200) {
        throw new RangeError('The age seems invalid')
      }
    }

    // 对于满足条件的 age 属性以及其他属性，直接保存
    obj[prop] = value
    return true
  },
}

let person = new Proxy({}, validator)

person.age = 100

person.age // 100
person.age = 'young' // 报错
person.age = 300 // 报错
```

上面代码中，由于设置了存值函数`set`，任何不符合要求的`age`赋值都会抛错，这是数据验证的一种实现方法。利用`set`方法还可以做数据绑定，即对象发生变化时自动更新 DOM。

有时，我们会在对象上面设置内部属性，属性名的第一个字符使用下划线开头，表示这些属性不应该被外部使用。结合`get`和`set`方法，就可以做到防止这些内部属性被外部读写。

```js
const handler = {
  get(target, key) {
    invariant(key, 'get')
    return target[key]
  },
  set(target, key, value) {
    invariant(key, 'set')
    target[key] = value
    return true
  },
}
function invariant(key, action) {
  if (key[0] === '_') {
    throw new Error(`Invalid attempt to ${action} private "${key}" property`)
  }
}
const target = {}
const proxy = new Proxy(target, handler)
proxy._prop
// Error: Invalid attempt to get private "_prop" property
proxy._prop = 'c'
// Error: Invalid attempt to set private "_prop" property
```

上面代码中，只要读写的属性名的第一个字符是下划线，一律抛错，从而达到禁止读写内部属性的目的。

下面是`set`方法第四个参数的例子。

```js
const handler = {
  set: function (obj, prop, value, receiver) {
    obj[prop] = receiver
    return true
  },
}
const proxy = new Proxy({}, handler)
proxy.foo = 'bar'
proxy.foo === proxy // true
```

上面代码中，`set`方法的第四个参数`receiver`指原始操作行为所在的那个对象，一般是`proxy`实例本身。看下面的例子。

```js
const handler = {
  set: function (obj, prop, value, receiver) {
    obj[prop] = receiver
    return true
  },
}
const proxy = new Proxy({}, handler)
const myObj = {}
Object.setPrototypeOf(myObj, proxy)

myObj.foo = 'bar'
myObj.foo === myObj // true
```

上面代码中，设置`myObj.foo`时`myObj`并没有`foo`属性，引擎会沿原型链去找。`myObj`的原型`proxy`是一个 Proxy 实例，设置它的`foo`属性会触发`set`方法，这时第四个参数`receiver`指向原始赋值行为所在的对象`myObj`。

注意，如果目标对象自身的某个属性不可写，那么`set`方法将不起作用。

```js
const obj = {}
Object.defineProperty(obj, 'foo', {
  value: 'bar',
  writable: false,
})

const handler = {
  set: function (obj, prop, value, receiver) {
    obj[prop] = 'baz'
    return true
  },
}

const proxy = new Proxy(obj, handler)
proxy.foo = 'baz'
proxy.foo // "bar"
```

上面代码中，`obj.foo`属性不可写，Proxy 对这个属性的`set`代理将不会生效。

注意，`set`代理应当返回一个布尔值。严格模式下，`set`代理如果没有返回`true`，就会报错。

```js
'use strict'
const handler = {
  set: function (obj, prop, value, receiver) {
    obj[prop] = receiver
    // 无论有没有下面这一行，都会报错
    return false
  },
}
const proxy = new Proxy({}, handler)
proxy.foo = 'bar'
// TypeError: 'set' on proxy: trap returned falsish for property 'foo'
```

上面代码中，严格模式下，`set`代理返回`false`或者`undefined`，都会报错。

### apply()

`apply`方法拦截函数的调用、`call`和`apply`操作。

`apply`方法可以接受三个参数，分别是目标对象、目标对象的上下文对象（`this`）和目标对象的参数数组。

```js
var handler = {
  apply(target, ctx, args) {
    return Reflect.apply(...arguments)
  },
}
```

下面是一个例子。

```js
var target = function () {
  return 'I am the target'
}
var handler = {
  apply: function () {
    return 'I am the proxy'
  },
}

var p = new Proxy(target, handler)

p()
// "I am the proxy"
```

上面代码中，`p`是 Proxy 实例，作为函数调用时（`p()`）会被`apply`方法拦截，返回一个字符串。

下面是另外一个例子。

```js
var twice = {
  apply(target, ctx, args) {
    return Reflect.apply(...arguments) * 2
  },
}
function sum(left, right) {
  return left + right
}
var proxy = new Proxy(sum, twice)
proxy(1, 2) // 6
proxy.call(null, 5, 6) // 22
proxy.apply(null, [7, 8]) // 30
```

上面代码中，每当执行`proxy`函数（直接调用或通过`call`、`apply`调用）都会被`apply`方法拦截。

另外，直接调用`Reflect.apply`方法，也会被拦截。

```js
Reflect.apply(proxy, null, [9, 10]) // 38
```

### has()

`has()`方法用来拦截`HasProperty`操作，即判断对象是否具有某个属性时，这个方法会生效。典型的操作就是`in`运算符。

`has()`方法可以接受两个参数，分别是目标对象、需查询的属性名。

下面的例子使用`has()`方法隐藏某些属性，不被`in`运算符发现。

```js
var handler = {
  has(target, key) {
    if (key[0] === '_') {
      return false
    }
    return key in target
  },
}
var target = { _prop: 'foo', prop: 'foo' }
var proxy = new Proxy(target, handler)
'_prop' in proxy // false
```

上面代码中，如果原对象的属性名的第一个字符是下划线，`proxy.has()`就会返回`false`，从而不会被`in`运算符发现。

如果原对象不可配置或者禁止扩展，这时`has()`拦截会报错。

```js
var obj = { a: 10 }
Object.preventExtensions(obj)

var p = new Proxy(obj, {
  has: function (target, prop) {
    return false
  },
})

'a' in p // TypeError is thrown
```

上面代码中，`obj`禁止扩展，使用`has`拦截就会报错。也就是说，如果某个属性不可配置（或目标对象不可扩展），`has()`方法就不得“**隐藏**”（即返回`false`）目标对象的该属性。

值得注意的是，`has()`方法拦截的是`HasProperty`操作，而不是`HasOwnProperty`操作，即`has()`方法不判断一个属性是对象自身的属性，还是继承的属性。

另外，虽然`for...in`循环也用到了`in`运算符，但是`has()`拦截对`for...in`循环不生效。

```js
let stu1 = { name: '张三', score: 59 }
let stu2 = { name: '李四', score: 99 }

let handler = {
  has(target, prop) {
    if (prop === 'score' && target[prop] < 60) {
      console.log(`${target.name} 不及格`)
      return false
    }
    return prop in target
  },
}

let oproxy1 = new Proxy(stu1, handler)
let oproxy2 = new Proxy(stu2, handler)

'score' in oproxy1
// 张三 不及格
// false

'score' in oproxy2
// true

for (let a in oproxy1) {
  console.log(oproxy1[a])
}
// 张三
// 59

for (let b in oproxy2) {
  console.log(oproxy2[b])
}
// 李四
// 99
```

上面代码中，`has()`拦截只对`in`运算符生效、对`for...in`循环不生效，导致不符合要求的属性没有被`for...in`排除。

### construct()

`construct()`方法用于拦截`new`命令，下面是拦截对象的写法。

```js
const handler = {
  construct(target, args, newTarget) {
    return new target(...args)
  },
}
```

`construct()`方法可以接受三个参数。

- `target`：目标对象。
- `args`：构造函数的参数数组。
- `newTarget`：创造实例对象时，`new`命令作用的构造函数（下面例子的`p`）。

```js
const p = new Proxy(function () {}, {
  construct: function (target, args) {
    console.log('called: ' + args.join(', '))
    return { value: args[0] * 10 }
  },
})

new p(1).value
// "called: 1"
// 10
```

`construct()`方法返回的必须是一个对象，否则会报错。

```js
const p = new Proxy(function () {}, {
  construct: function (target, argumentsList) {
    return 1
  },
})

new p() // 报错
// Uncaught TypeError: 'construct' on proxy: trap returned non-object ('1')
```

另外，由于`construct()`拦截的是构造函数，所以它的目标对象必须是函数，否则就会报错。

```js
const p = new Proxy(
  {},
  {
    construct: function (target, argumentsList) {
      return {}
    },
  },
)

new p() // 报错
// Uncaught TypeError: p is not a constructor
```

上面例子中，拦截的目标对象不是一个函数，而是一个对象（`new Proxy()`的第一个参数），导致报错。

注意，`construct()`方法中的`this`指向的是`handler`，而不是实例对象。

```js
const handler = {
  construct: function (target, args) {
    console.log(this === handler)
    return new target(...args)
  },
}

let p = new Proxy(function () {}, handler)
new p() // true
```

### deleteProperty()

`deleteProperty`方法用于拦截`delete`操作，如果这个方法抛出错误或者返回`false`，当前属性就无法被`delete`命令删除。

```js
var handler = {
  deleteProperty(target, key) {
    invariant(key, 'delete')
    delete target[key]
    return true
  },
}
function invariant(key, action) {
  if (key[0] === '_') {
    throw new Error(`Invalid attempt to ${action} private "${key}" property`)
  }
}

var target = { _prop: 'foo' }
var proxy = new Proxy(target, handler)
delete proxy._prop
// Error: Invalid attempt to delete private "_prop" property
```

上面代码中，`deleteProperty`方法拦截了`delete`操作符，删除第一个字符为下划线的属性会报错。

注意，目标对象自身的不可配置（configurable）的属性，不能被`deleteProperty`方法删除，否则报错。

### defineProperty()

`defineProperty()`方法拦截了`Object.defineProperty()`操作。

```js
var handler = {
  defineProperty(target, key, descriptor) {
    return false
  },
}
var target = {}
var proxy = new Proxy(target, handler)
proxy.foo = 'bar' // 不会生效
```

上面代码中，`defineProperty()`方法内部没有任何操作，只返回`false`，导致添加新属性总是无效。注意，这里的`false`只是用来提示操作失败，本身并不能阻止添加新属性。

注意，如果目标对象不可扩展（non-extensible），则`defineProperty()`不能增加目标对象上不存在的属性，否则会报错。另外，如果目标对象的某个属性不可写（writable）或不可配置（configurable），则`defineProperty()`方法不得改变这两个设置。

### getOwnPropertyDescriptor()

`getOwnPropertyDescriptor()`方法拦截`Object.getOwnPropertyDescriptor()`，返回一个属性描述对象或者`undefined`。

```js
var handler = {
  getOwnPropertyDescriptor(target, key) {
    if (key[0] === '_') {
      return
    }
    return Object.getOwnPropertyDescriptor(target, key)
  },
}
var target = { _foo: 'bar', baz: 'tar' }
var proxy = new Proxy(target, handler)
Object.getOwnPropertyDescriptor(proxy, 'wat')
// undefined
Object.getOwnPropertyDescriptor(proxy, '_foo')
// undefined
Object.getOwnPropertyDescriptor(proxy, 'baz')
// { value: 'tar', writable: true, enumerable: true, configurable: true }
```

上面代码中，`handler.getOwnPropertyDescriptor()`方法对于第一个字符为下划线的属性名会返回`undefined`。

### getPrototypeOf()

`getPrototypeOf()`方法主要用来拦截获取对象原型的操作，包括 `Object.prototype.__proto__`、`Object.prototype.isPrototypeOf()`、`Object.getPrototypeOf()`、`Reflect.getPrototypeOf()` 和 `instanceof`。

```js
var proto = {}
var p = new Proxy(
  {},
  {
    getPrototypeOf(target) {
      return proto
    },
  },
)
Object.getPrototypeOf(p) === proto // true
```

注意，`getPrototypeOf()`方法的返回值必须是对象或者`null`，否则报错。另外，如果目标对象不可扩展（non-extensible）， `getPrototypeOf()`方法必须返回目标对象的原型对象。

### isExtensible()

`isExtensible()`方法拦截`Object.isExtensible()`操作。

```js
var p = new Proxy(
  {},
  {
    isExtensible: function (target) {
      console.log('called')
      return true
    },
  },
)

Object.isExtensible(p)
// "called"
// true
```

注意，该方法只能返回布尔值，否则返回值会被自动转为布尔值。

这个方法有一个强限制，它的返回值必须与目标对象的`isExtensible`属性保持一致，否则就会抛出错误。

```js
Object.isExtensible(proxy) === Object.isExtensible(target)
```

下面是一个例子。

```js
var p = new Proxy(
  {},
  {
    isExtensible: function (target) {
      return false
    },
  },
)

Object.isExtensible(p)
// Uncaught TypeError: 'isExtensible' on proxy: trap result does not reflect extensibility of proxy target (which is 'true')
```

### ownKeys()

`ownKeys()`方法用来拦截对象自身属性的读取操作，包括 `Object.getOwnPropertyNames()`、`Object.getOwnPropertySymbols()`、`Object.keys()` 和 `for...in` 循环。

下面是拦截`Object.keys()`的例子。

```js
let target = {
  a: 1,
  b: 2,
  c: 3,
}

let handler = {
  ownKeys(target) {
    return ['a']
  },
}

let proxy = new Proxy(target, handler)

Object.keys(proxy)
// [ 'a' ]
```

下面的例子是拦截第一个字符为下划线的属性名。

```js
let target = {
  _bar: 'foo',
  _prop: 'bar',
  prop: 'baz',
}

let handler = {
  ownKeys(target) {
    return Reflect.ownKeys(target).filter(key => key[0] !== '_')
  },
}

let proxy = new Proxy(target, handler)
for (let key of Object.keys(proxy)) {
  console.log(target[key])
}
// "baz"
```

注意，使用`Object.keys()`方法时，有三类属性会被`ownKeys()`方法自动过滤，不会返回。

- 目标对象上不存在的属性
- 属性名为 Symbol 值
- 不可遍历（`enumerable`）的属性

```js
let target = {
  a: 1,
  b: 2,
  c: 3,
  [Symbol.for('secret')]: '4',
}

Object.defineProperty(target, 'key', {
  enumerable: false,
  configurable: true,
  writable: true,
  value: 'static',
})

let handler = {
  ownKeys(target) {
    return ['a', 'd', Symbol.for('secret'), 'key']
  },
}

let proxy = new Proxy(target, handler)

Object.keys(proxy)
// ['a']
```

上面代码中，`ownKeys()`方法之中，显式返回不存在的属性（`d`）、Symbol 值（`Symbol.for('secret')`）、不可遍历的属性（`key`），结果都被自动过滤掉。

`ownKeys()`方法还可以拦截`Object.getOwnPropertyNames()`。

```js
var p = new Proxy(
  {},
  {
    ownKeys: function (target) {
      return ['a', 'b', 'c']
    },
  },
)

Object.getOwnPropertyNames(p)
// [ 'a', 'b', 'c' ]
```

`for...in`循环也受到`ownKeys()`方法的拦截。

```js
const obj = { hello: 'world' }
const proxy = new Proxy(obj, {
  ownKeys: function () {
    return ['a', 'b']
  },
})

for (let key in proxy) {
  console.log(key) // 没有任何输出
}
```

上面代码中，`ownkeys()`指定只返回`a`和`b`属性，由于`obj`没有这两个属性，因此`for...in`循环不会有任何输出。

`ownKeys()`方法返回的数组成员，只能是字符串或 Symbol 值。如果有其他类型的值，或者返回的根本不是数组，就会报错。

```js
var obj = {}

var p = new Proxy(obj, {
  ownKeys: function (target) {
    return [123, true, undefined, null, {}, []]
  },
})

Object.getOwnPropertyNames(p)
// Uncaught TypeError: 123 is not a valid property name
```

上面代码中，`ownKeys()`方法虽然返回一个数组，但是每一个数组成员都不是字符串或 Symbol 值，因此就报错了。

如果目标对象自身包含不可配置的属性，则该属性必须被`ownKeys()`方法返回，否则报错。

```js
var obj = {}
Object.defineProperty(obj, 'a', {
  configurable: false,
  enumerable: true,
  value: 10,
})

var p = new Proxy(obj, {
  ownKeys: function (target) {
    return ['b']
  },
})

Object.getOwnPropertyNames(p)
// Uncaught TypeError: 'ownKeys' on proxy: trap result did not include 'a'
```

上面代码中，`obj`对象的`a`属性是不可配置的，这时`ownKeys()`方法返回的数组之中，必须包含`a`，否则会报错。

另外，如果目标对象是不可扩展的（non-extensible），这时`ownKeys()`方法返回的数组之中，必须包含原对象的所有属性，且不能包含多余的属性，否则报错。

```js
var obj = {
  a: 1,
}

Object.preventExtensions(obj)

var p = new Proxy(obj, {
  ownKeys: function (target) {
    return ['a', 'b']
  },
})

Object.getOwnPropertyNames(p)
// Uncaught TypeError: 'ownKeys' on proxy: trap returned extra keys but proxy target is non-extensible
```

上面代码中，`obj`对象是不可扩展的，这时`ownKeys()`方法返回的数组之中，包含了`obj`对象的多余属性`b`，所以导致了报错。

### preventExtensions()

`preventExtensions()`方法拦截`Object.preventExtensions()`。该方法必须返回一个布尔值，否则会被自动转为布尔值。

这个方法有一个限制，只有目标对象不可扩展时（即`Object.isExtensible(proxy)`为`false`），`proxy.preventExtensions`才能返回`true`，否则会报错。

```js
var proxy = new Proxy(
  {},
  {
    preventExtensions: function (target) {
      return true
    },
  },
)

Object.preventExtensions(proxy)
// Uncaught TypeError: 'preventExtensions' on proxy: trap returned truish but the proxy target is extensible
```

上面代码中，`proxy.preventExtensions()`方法返回`true`，但这时`Object.isExtensible(proxy)`会返回`true`，因此报错。

为了防止出现这个问题，通常要在`proxy.preventExtensions()`方法里面，调用一次`Object.preventExtensions()`。

```js
var proxy = new Proxy(
  {},
  {
    preventExtensions: function (target) {
      console.log('called')
      Object.preventExtensions(target)
      return true
    },
  },
)

Object.preventExtensions(proxy)
// "called"
// Proxy {}
```

### setPrototypeOf()

`setPrototypeOf()`方法主要用来拦截`Object.setPrototypeOf()`方法。

下面是一个例子。

```js
var handler = {
  setPrototypeOf(target, proto) {
    throw new Error('Changing the prototype is forbidden')
  },
}
var proto = {}
var target = function () {}
var proxy = new Proxy(target, handler)
Object.setPrototypeOf(proxy, proto)
// Error: Changing the prototype is forbidden
```

注意，该方法只能返回布尔值，否则会被自动转为布尔值。另外，如果目标对象不可扩展（non-extensible），`setPrototypeOf()`方法不得改变目标对象的原型。

## 3. Proxy的可撤销性

`Proxy.revocable()`方法返回一个可取消的 Proxy 实例。

```js
let target = {}
let handler = {}

let { proxy, revoke } = Proxy.revocable(target, handler)

proxy.foo = 123
proxy.foo // 123

revoke()
proxy.foo // TypeError: Revoked
```

`Proxy.revocable()`返回一个对象，其`proxy`属性是`Proxy`实例，`revoke`属性是一个可以取消该实例的函数。执行`revoke`之后，再访问`Proxy`实例就会抛出错误。

`Proxy.revocable()`的一个使用场景是，目标对象不允许直接访问，必须通过代理访问，一旦访问结束，就收回代理权，不允许再次访问。

## 4. Proxy的this 问题

虽然 Proxy 可以代理针对目标对象的访问，但它不是目标对象的透明代理：即使不做任何拦截，也无法保证行为与目标对象一致。主要原因是 Proxy 代理时，目标对象内部的`this`关键字会指向 Proxy 代理。

```js
const target = {
  m: function () {
    console.log(this === proxy)
  },
}
const handler = {}

const proxy = new Proxy(target, handler)

target.m() // false
proxy.m() // true
```

上面代码中，一旦`proxy`代理`target`，`target.m()`内部的`this`就指向`proxy`而非`target`。所以即使`proxy`没有做任何拦截，`target.m()`和`proxy.m()`的结果也不一样。

下面是一个例子，由于`this`指向的变化，导致 Proxy 无法代理目标对象。

```js
const _name = new WeakMap()

class Person {
  constructor(name) {
    _name.set(this, name)
  }
  get name() {
    return _name.get(this)
  }
}

const jane = new Person('Jane')
jane.name // 'Jane'

const proxy = new Proxy(jane, {})
proxy.name // undefined
```

上面代码中，`jane`的`name`属性实际保存在外部`WeakMap`对象`_name`上，通过`this`键区分。`proxy.name`访问时`this`指向`proxy`，取不到值，所以返回`undefined`。

此外，有些原生对象的内部属性，只有通过正确的`this`才能拿到，所以 Proxy 也无法代理这些原生对象的属性。

```js
const target = new Date()
const handler = {}
const proxy = new Proxy(target, handler)

proxy.getDate()
// TypeError: this is not a Date object.
```

上面代码中，`getDate()`只能在`Date`对象实例上拿到，`this`不是`Date`对象实例就会报错。把`this`绑定到原始对象即可解决。

```js
const target = new Date('2015-01-01')
const handler = {
  get(target, prop) {
    if (prop === 'getDate') {
      return target.getDate.bind(target)
    }
    return Reflect.get(target, prop)
  },
}
const proxy = new Proxy(target, handler)

proxy.getDate() // 1
```

另外，Proxy 拦截函数内部的`this`，指向的是`handler`对象。

```js
const handler = {
  get: function (target, key, receiver) {
    console.log(this === handler)
    return 'Hello, ' + key
  },
  set: function (target, key, value) {
    console.log(this === handler)
    target[key] = value
    return true
  },
}

const proxy = new Proxy({}, handler)

proxy.foo
// true
// Hello, foo

proxy.foo = 1
// true
```

上面的几种情形可以总结如下。

[width(20,16,34,30)]

| 场景                                    | `this` 指向             | 表现                                                            | 解决方式                                                                 |
| :-------------------------------------- | :---------------------- | :-------------------------------------------------------------- | :----------------------------------------------------------------------- |
| 目标对象的方法内部                      | `proxy`，而不是`target` | 即使没有设置任何拦截，`target.m()`和`proxy.m()`的结果也可能不同 | 无法避免，方法内部不要依赖`this === target`                              |
| 用`this`作键存放的私有数据（`WeakMap`） | `proxy`，而不是`target` | 查不到对应的键，取值返回`undefined`，如`proxy.name`             | 没有通用解法，需要在陷阱里把`this`绑回`target`，或改用不依赖`this`的存储 |
| 原生对象的内部槽（如`Date`）            | `proxy`，而不是`target` | 报`TypeError: this is not a Date object`                        | 在陷阱里把方法绑定回原始对象，如`target.getDate.bind(target)`            |
| 拦截函数（陷阱）内部                    | `handler`对象本身       | `this === handler`为`true`，`get`和`set`中都是如此              | 无需处理，只需记住它不是`proxy`                                          |

## 5. 常见应用场景

- **数据绑定与观察者模式**: 现代前端框架（如 Vue 3）的核心响应式系统就是基于 `Proxy` 实现的。通过 `get` 陷阱收集依赖，通过 `set` 陷阱触发更新。
- **数据验证**: 如 `set` 示例所示，确保赋给对象属性的值符合预设的格式或范围。
- **API 增强与兼容性**: 为现有 API 提供更友好的接口，例如给属性不存在时提供默认值，或者将旧 API 的方法名映射为新名称。
- **安全沙箱**: 创建一个代理来限制对某些敏感对象或 API 的访问，防止未经授权的修改或读取。
- **日志与性能监控**: 在 `apply`、`get`、`set` 等陷阱中加入日志记录或性能计时器，用于调试和分析代码。
- **实现负索引**: 通过 `get` 陷阱，让数组支持类似 `array[-1]` 的负索引访问。

## 6. 常见问题 (FAQ)

### 6.1 为什么 `this` 指向会出问题？

**问题描述**:
当代理一个包含方法的对象时，方法内部使用的 `this` 会指向代理对象 `proxy` 而不是原始对象 `target`。对于某些依赖内部 `[[this]]` 值的原生对象（如 DOM 元素），这可能导致错误。

```javascript
const target = {
  name: 'target',
  getName() {
    return this.name
  },
}

const proxy = new Proxy(target, {})

console.log(proxy.getName()) // 输出 'target' (因为this指向proxy，proxy上没有name，会转发到target)

// 棘手的情况
const date = new Date()
const proxyDate = new Proxy(date, {})

// proxyDate.getDate(); // TypeError: this is not a Date object.
```

**解决方案**:
在 `get` 陷阱中，如果发现被访问的属性是一个函数，应该用 `Reflect.get` 并明确把 `target` 作为 `receiver`（接收者），或者手动把 `this` 绑定到原始的 `target` 对象。

```javascript
const handler = {
  get(target, property, receiver) {
    // 解决方法：将 this 绑定回原始对象
    const value = Reflect.get(target, property, receiver)
    if (typeof value === 'function') {
      return value.bind(target)
    }
    return value
  },
}
```

**最佳实践**: 始终在陷阱函数中使用 `Reflect` 对象。`Reflect` 上的方法与 `Proxy` 的陷阱一一对应，能正确处理 `this` 的指向，确保操作的默认行为得以保留。

### 6.2 Proxy 的性能如何？为什么会比原生对象慢？

**问题描述**:
相比直接操作原生对象，Proxy 有明显的性能开销，高频操作场景（如循环）下尤其明显。

**原因**:

- **破坏引擎优化**: 现代 JavaScript 引擎（如 V8）对普通对象的属性访问做了高度优化（内联缓存、隐藏类），Proxy 增加了一个中间层，使这些优化无法生效。
- **函数调用开销**: 每次操作代理对象都要调用 `handler` 中的陷阱函数，比直接的内存访问慢得多。
- **内部复杂性**: 引擎需要维护额外的内部状态来管理代理。

**建议**:

- **避免在性能热点使用**: 性能要求极高的代码路径（如游戏循环、大数据处理）应避免使用 Proxy。
- **权衡利弊**: 使用前必须权衡 Proxy 的元编程能力带来的好处与潜在的性能损失。

### 6.3 Proxy 是否存在兼容性问题？

**问题描述**:
Proxy 是 ES6 (ECMAScript 2015) 的特性，在非常老旧的浏览器（如 IE11）中不受支持。

**解决方案**:

- **没有 Polyfill**: Proxy 的底层机制无法通过 Polyfill（代码垫片）模拟。
- **检查环境**: 使用前应检查目标运行环境的兼容性；现代浏览器和 Node.js 对 Proxy 已有很好的支持。

### 6.4 为什么我需要 `Reflect`？

**问题描述**:
在 `handler` 陷阱中可以直接操作 `target`（如 `target[prop] = value`），为什么推荐用 `Reflect`（如 `Reflect.set(target, prop, value)`）？

**原因**:

- **确保正确的 `this` 指向**：当被访问的属性是访问器（getter/setter）时，`this` 取的就是 `receiver`。不用 `Reflect` 就传不进 `receiver`，getter 里的 `this` 会变成原始对象，代理对属性的改写也就被绕过了。

  ```javascript
  const person = {
    firstName: '张',
    lastName: '三',
    get fullName() {
      return `${this.firstName}${this.lastName}`
    },
  }

  // ❌ 不用 Reflect：直接取 target[prop]，getter 里的 this 是原始对象
  const bad = new Proxy(person, {
    get(target, prop) {
      if (prop === 'firstName') return '李' // 代理改写了 firstName
      return target[prop]
    },
  })

  console.log(bad.firstName) // 输出 '李'（直接读，改写生效）
  console.log(bad.fullName) // 输出 '张三'（getter 读的是原始对象上的 firstName）

  // ✅ 用 Reflect：receiver 传下去，getter 里的 this 是代理对象
  const good = new Proxy(person, {
    get(target, prop, receiver) {
      if (prop === 'firstName') return '李'
      return Reflect.get(target, prop, receiver)
    },
  })

  console.log(good.firstName) // 输出 '李'
  console.log(good.fullName) // 输出 '李三'（getter 读到了代理改写后的值）
  ```

- **提供操作的默认行为**: `Reflect` 上的每个方法都对应一个陷阱，并给出该操作的默认、标准行为，可以在自定义逻辑之后调用它执行原始操作。

  ```javascript
  const target = { count: 1, name: 'foo' }

  // ❌ 不用 Reflect：自定义逻辑之外的属性没人管，一律返回 undefined
  const bad = new Proxy(target, {
    get(target, prop) {
      if (prop === 'count') return target[prop] * 100
    },
  })

  console.log(bad.count) // 输出 100（自定义逻辑生效）
  console.log(bad.name) // 输出 undefined（原始读取丢了）

  // ✅ 用 Reflect：自定义逻辑执行完，再调用 Reflect 执行该操作的默认行为
  const good = new Proxy(target, {
    get(target, prop, receiver) {
      if (prop === 'count') return target[prop] * 100
      return Reflect.get(target, prop, receiver)
    },
  })

  console.log(good.count) // 输出 100
  console.log(good.name) // 输出 'foo'
  ```

- **提供布尔值反馈**: `Reflect.set`、`Reflect.deleteProperty` 等操作会返回布尔值表示是否成功，而对应的运算符/旧方法（如 `t[prop] = value`、`Object.defineProperty`）要么返回别的值，要么失败时直接抛错。`Proxy` 的 `set`、`deleteProperty`、`defineProperty` 等陷阱要求返回布尔值，`Reflect` 正好契合。

  ```javascript
  const target = Object.defineProperty({}, 'count', {
    value: 0,
    writable: false, // 只读属性：写入必然失败
    configurable: true,
  })

  // ❌ 不用 Reflect：拿不到写入结果，这个布尔值只能自己写
  const bad = new Proxy(target, {
    set(target, prop, value) {
      if (prop === 'count') return true // 写入失败了，却照样报“成功”
      target[prop] = value
      return true
    },
  })

  // ✅ 用 Reflect：返回值本身就是“写入是否成功”
  const good = new Proxy(target, {
    set(target, prop, value, receiver) {
      return Reflect.set(target, prop, value, receiver)
    },
  })

  console.log(Reflect.set(bad, 'count', 1)) // 输出 true（谎报成功）
  console.log(Reflect.set(good, 'count', 1)) // 输出 false（如实上报）
  console.log(target.count) // 输出 0：两次都没写进去

  // 若调用方用的是赋值写法（good.count = 1），陷阱返回 false 时，
  // 严格模式（ES Module、class 内部等）下会抛出：
  // TypeError: 'set' on proxy: trap returned falsish for property 'count'
  ```
