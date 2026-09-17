# 装饰器

[说明] Decorator 提案仍处于第三阶段，定案前可能还有变化。本章属于草稿阶段：标注“新语法”的章节基于当前语法，未标注的“旧语法”章节是遗留稿子。保留旧内容有两个原因：TypeScript 装饰器会用到这些语法，且其中不少内容仍有价值。标准定案后本章将彻底重写。（2022年6月）

## 简介（新语法）

装饰器（Decorator）用来增强 JavaScript 类（class）的功能，许多面向对象语言都有这种语法，目前有一个[提案](https://github.com/tc39/proposal-decorators)将其引入 ECMAScript。

装饰器是一种函数，写成`@ + 函数名`，可以用来装饰四种类型的值。

- 类
- 类的属性
- 类的方法
- 属性存取器（accessor）

下面的例子把装饰器放在类名和类方法名之前。

```js
@frozen
class Foo {
  @configurable(false)
  @enumerable(true)
  method() {}

  @throttle(500)
  expensiveMethod() {}
}
```

上面共用了四个装饰器：一个装饰类本身（`@frozen`），三个装饰类方法（`@configurable()`、`@enumerable()`、`@throttle()`）。它们既让意图一目了然，也是增改类功能的便捷手段。

## 为什么需要装饰器

很多能力是“横切”在多个方法上的：日志、耗时统计、权限检查、缓存、参数校验、自动绑定`this`。它们与业务逻辑无关，却要挤进每个方法体。不用装饰器时有三种写法：

**（1）把逻辑抄进方法体**：重复，噪音大，业务代码被淹没。

```js
class OrderService {
  async cancel(id) {
    console.log('call cancel', id) // 日志
    if (!this.user.can('order:cancel')) throw new Error('forbidden') // 权限
    const result = await this.doCancel(id)
    console.log('done cancel') // 日志
    return result
  }
}
```

**（2）用继承**：一种能力只能沿一条继承链复用——`class A extends Logged`之后没法再`extends Permissioned`。

**（3）用高阶函数手工包装**：能力可任意叠加，但包装发生在类定义之外，看方法定义时不知道它已被包了两层。

```js
class OrderService {
  cancel(id) {
    return this.doCancel(id)
  }
}

OrderService.prototype.cancel = withLog(OrderService.prototype.cancel, 'cancel')
OrderService.prototype.cancel = withPermission(
  OrderService.prototype.cancel,
  'order:cancel',
)
```

装饰器把（3）的包装动作**搬到被包装的代码旁边**，且写法是声明式的：

```js
class OrderService {
  @log('cancel')
  @permission('order:cancel')
  cancel(id) {
    return this.doCancel(id)
  }
}
```

装饰器是一种**元编程**手段：不改变方法做什么，而改变它的“身份”——被谁包了一层、暴露成什么名字、是否登记进某个注册表。它把能力就近声明、可叠加、一眼可见，运行时只是一次普通函数调用。

## 装饰器 API（新语法）

装饰器是一个函数，API 类型描述如下（TypeScript 写法）。

```typescript
type Decorator = (
  value: Input,
  context: {
    kind: string
    name: string | symbol
    access: {
      get?(): unknown
      set?(value: unknown): void
    }
    private?: boolean
    static?: boolean
    addInitializer?(initializer: () => void): void
  },
) => Output | void
```

装饰器函数有两个参数，由 JavaScript 引擎在运行时提供。

- `value`：所要装饰的值，装饰属性时可能是`undefined`。
- `context`：上下文信息对象。

装饰器函数的返回值是新版本的装饰对象，也可以不返回任何值（void）。

`context`对象的属性如下。

- `kind`：字符串，装饰类型，取值为`class`、`method`、`getter`、`setter`、`field`、`accessor`。
- `name`：被装饰的值的名称；私有元素则是它的描述（如可读名）。
- `access`：对象，包含访问这个值的方法，即存值器和取值器。
- `static`: 布尔值，该值是否为静态元素。
- `private`：布尔值，该值是否为私有元素。
- `addInitializer`：函数，用于增加初始化逻辑。

执行步骤如下。

1. 按从左到右、从上到下的顺序计算各个装饰器的值。
1. 调用方法装饰器。
1. 调用类装饰器。

## 新旧语法对比：标准（stage 3）与 legacy

装饰器有过一次大改。早期提案（2015 年前后进入 stage 1）只支持类和类方法，签名是`(target, name, descriptor)`，直接改写属性描述符；为把字段、私有成员和`accessor`纳入进来，提案重新设计，2022 年 3 月进入 stage 3，签名统一成`(value, context)`。

两套语法至今并存。TypeScript 5.0 之前只有旧语法，靠`experimentalDecorators: true`打开；5.0 起默认实现新语法，旧语法仍由同一个开关保留。Babel 的装饰器插件也用`version`选项区分。旧提案的写法通常叫 **legacy 装饰器**，stage 3 的写法叫**标准装饰器**。

[width(20,40,40)]

| 对比维度       | legacy（旧提案）                                                                   | 标准（stage 3）                                             |
| -------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 装饰器签名     | 类：`(target)`；方法、存取器：`(target, name, descriptor)`；属性：`(target, name)` | 统一为`(value, context)`                                    |
| 能拿到什么     | 原型对象、属性名、属性描述符                                                       | 被装饰的值本身、上下文对象                                  |
| 修改方式       | 就地改写`descriptor`再返回                                                         | 返回新值取代原值，不返回则保持不变                          |
| 字段装饰器     | 只有`(target, name)`，拿不到初始值                                                 | 返回初始化函数`(initialValue) => newValue`                  |
| 初始化钩子     | 没有                                                                               | 上下文对象的`addInitializer()`                              |
| 参数装饰器     | 支持                                                                               | 不支持                                                      |
| 元数据         | `emitDecoratorMetadata`产出的`design:type`等，配合`reflect-metadata`               | `context.metadata`与`Symbol.metadata`，但**拿不到类型信息** |
| 私有成员       | 只能从外部按名字改原型                                                             | 可以装饰`#x`，此时`context.private`为`true`                 |
| 对象字面量成员 | 不支持                                                                             | 不支持（另有提案，尚未落地）                                |

下面是同一能力的两种写法：让方法始终绑定实例的`autobind`。

```ts
// legacy：就地改写描述符
function autobind(target: any, name: string, descriptor: PropertyDescriptor) {
  const fn = descriptor.value
  return {
    configurable: true,
    get() {
      const bound = fn.bind(this)
      Object.defineProperty(this, name, { value: bound, configurable: true })
      return bound
    },
  }
}
```

```ts
// 标准：用 addInitializer 做一次绑定
function autobind(
  value: Function,
  context: { name: string | symbol; addInitializer(fn: () => void): void },
) {
  context.addInitializer(function (this: any) {
    this[context.name] = value.bind(this)
  })
}
```

从 legacy 迁到标准主要是四处机械改写。

- `descriptor.value`换成第一个参数`value`；替换方法要**返回**新函数，而非改写`descriptor.value`。
- 把方法变成取值器（legacy 靠返回带`get`的描述符）不再适用，直接返回新函数即可；成员都不可枚举，`enumerable`这类描述符字段无对应写法。
- 字段装饰器不再只能旁观：返回`(initialValue) => newValue`即可改初始值，要对实例做事就用`addInitializer()`。
- 参数装饰器没有对应写法。依赖它的库（NestJS、TypeORM、class-validator 等）仍停在 legacy，这也是不少项目继续开着`experimentalDecorators`的原因。

两套语法**不能混用**：同一个类里混写会直接报错，配置也只能二选一。选择依据通常是“框架生态用哪套”，而非“哪套更新”。

## 装饰器的求值与执行顺序

装饰器有两件事容易混淆：**求值**（算出装饰器是谁）和**调用**（拿目标去跑装饰器）。

- **求值**：`@dec(1)`只是调用一次`dec(1)`，返回值才是真正的装饰器函数。表达式按源码顺序求值，同一目标上从上到下。
- **调用**：同一目标上的多个装饰器**从下往上**调用，最靠近目标的先执行；写成嵌套即`@a @b m() {}`等价于`a(b(m))`。
- **类装饰器在所有成员装饰器之后运行**。

下文“方法的装饰”一节用`dec(1)`/`dec(2)`打印了这个顺序。新语法的例子如下。

```js
const order = []

function trace(label) {
  return function (value, context) {
    order.push(`${label} -> ${String(context.name)}`)
  }
}

@trace('class')
class C {
  @trace('outer')
  @trace('inner')
  method() {}
}

console.log(order)
// ['inner -> method', 'outer -> method', 'class -> C']
```

这个顺序有三个实际影响。

- **叠在外层的能力看到的是内层处理过的结果。** 上面`outer`拿到的`value`已是`inner`包装后的函数，所以`@log`叠在`@memoize`外面时，被缓存挡掉的调用也会打日志；对调则不会。
- **方法装饰器先于类装饰器执行**，所以类装饰器里检查或登记方法时看到的是装饰完的版本；反过来它也无法干预成员装饰器。
- **不要假设类装饰器运行时类已完全就绪。** 想依赖“类定义完成”这一刻，用`context.addInitializer()`注册回调，别写在类装饰器函数体里（详见后文`addInitializer()`一节）。

## 类的装饰

装饰器可以装饰整个类。

```js
@testable
class MyTestableClass {
  // ...
}

function testable(target) {
  target.isTestable = true
}

MyTestableClass.isTestable // true
```

上面代码中，`@testable`为`MyTestableClass`加上了静态属性`isTestable`。

```js
@decorator
class A {}

// 等同于

class A {}
A = decorator(A) || A
```

装饰器是一个处理类的函数，第一个参数就是目标类。

```js
function testable(target) {
  // ...
}
```

一个参数不够用，可以在装饰器外面再封装一层函数。

```js
function testable(isTestable) {
  return function (target) {
    target.isTestable = isTestable
  }
}

@testable(true)
class MyTestableClass {}
MyTestableClass.isTestable // true

@testable(false)
class MyClass {}
MyClass.isTestable // false
```

`testable`接受参数，就等于可以修改装饰器的行为。

想加实例属性，可以通过目标类的`prototype`对象操作。

```js
function testable(target) {
  target.prototype.isTestable = true
}

@testable
class MyTestableClass {}

let obj = new MyTestableClass()
obj.isTestable // true
```

```js
// mixins.js
export function mixins(...list) {
  return function (target) {
    Object.assign(target.prototype, ...list)
  }
}

// main.js
import { mixins } from './mixins.js'

const Foo = {
  foo() {
    console.log('foo')
  },
}

@mixins(Foo)
class MyClass {}

let obj = new MyClass()
obj.foo() // 'foo'
```

`mixins`把`Foo`的方法加到`MyClass`实例上，用`Object.assign()`可以模拟。

```js
const Foo = {
  foo() {
    console.log('foo')
  },
}

class MyClass {}

Object.assign(MyClass.prototype, Foo)

let obj = new MyClass()
obj.foo() // 'foo'
```

React 与 Redux 结合使用时常常写成这样。

```js
class MyReactComponent extends React.Component {}

export default connect(mapStateToProps, mapDispatchToProps)(MyReactComponent)
```

用装饰器改写：

```js
@connect(mapStateToProps, mapDispatchToProps)
export default class MyReactComponent extends React.Component {}
```

## 类装饰器（新语法）

类装饰器的类型描述如下。

```typescript
type ClassDecorator = (
  value: Function,
  context: {
    kind: 'class'
    name: string | undefined
    addInitializer(initializer: () => void): void
  },
) => Function | void
```

第一个参数是被装饰的类，第二个是上下文对象；被装饰的是匿名类时，`name`为`undefined`。

类装饰器可以返回一个新类取代原来的类，也可以不返回值；返回的不是构造函数会报错。

下面是一个例子。

```js
function logged(value, { kind, name }) {
  if (kind === 'class') {
    return class extends value {
      constructor(...args) {
        super(...args)
        console.log(
          `constructing an instance of ${name} with arguments ${args.join(', ')}`,
        )
      }
    }
  }

  // ...
}

@logged
class C {}

new C(1)
// constructing an instance of C with arguments 1
```

不使用装饰器时，实际执行的是下面的语法。

```js
class C {}

C =
  logged(C, {
    kind: 'class',
    name: 'C',
  }) ?? C

new C(1)
```

## 方法装饰器（新语法）

方法装饰器修改类的方法。

```js
class C {
  @trace
  toString() {
    return 'C'
  }
}

// 相当于
C.prototype.toString = trace(C.prototype.toString)
```

类型描述如下。

```typescript
type ClassMethodDecorator = (
  value: Function,
  context: {
    kind: 'method'
    name: string | symbol
    access: { get(): unknown }
    static: boolean
    private: boolean
    addInitializer(initializer: () => void): void
  },
) => Function | void
```

第一个参数`value`就是所要装饰的方法。

可以返回一个新函数取代原方法，也可以不返回值（沿用原方法）；返回其他类型会报错。例子：

```js
function replaceMethod() {
  return function () {
    return `How are you, ${this.name}?`
  }
}

class Person {
  constructor(name) {
    this.name = name
  }
  @replaceMethod
  hello() {
    return `Hi ${this.name}!`
  }
}

const robin = new Person('Robin')

;(robin.hello(), 'How are you, Robin?')
```

```typescript
function logged(value, { kind, name }) {
  if (kind === 'method') {
    return function (...args) {
      console.log(`starting ${name} with arguments ${args.join(', ')}`)
      const ret = value.call(this, ...args)
      console.log(`ending ${name}`)
      return ret
    }
  }
}

class C {
  @logged
  m(arg) {}
}

new C().m(1)
// starting m with arguments 1
// ending m
```

真正的操作是改掉原型链上的`m()`方法。

```js
class C {
  m(arg) {}
}

C.prototype.m =
  logged(C.prototype.m, {
    kind: 'method',
    name: 'm',
    static: false,
    private: false,
  }) ?? C.prototype.m
```

## 方法的装饰

装饰器不仅可以装饰类，还可以装饰类的属性。

```js
class Person {
  @readonly
  name() {
    return `${this.first} ${this.last}`
  }
}
```

上面代码中，装饰器`readonly`用来装饰“类”的`name`方法。

`readonly`一共接受三个参数。

```js
function readonly(target, name, descriptor) {
  // descriptor对象原来的值如下
  // {
  //   value: specifiedFunction,
  //   enumerable: false,
  //   configurable: true,
  //   writable: true
  // };
  descriptor.writable = false
  return descriptor
}

readonly(Person.prototype, 'name', descriptor)
// 类似于
Object.defineProperty(Person.prototype, 'name', descriptor)
```

三个参数依次是：类的原型对象（上例的`Person.prototype`）、属性名、属性描述对象。装饰器的本意是要“装饰”类的实例，但此时实例尚未生成，只能装饰原型——这一点不同于类装饰，那里`target`指的是类本身。

装饰器修改`descriptor`，改后的描述对象用来定义属性。

下例修改`enumerable`，使属性不可遍历。

```js
class Person {
  @nonenumerable
  get kidCount() {
    return this.children.length
  }
}

function nonenumerable(target, name, descriptor) {
  descriptor.enumerable = false
  return descriptor
}
```

```js
class Math {
  @log
  add(a, b) {
    return a + b
  }
}

function log(target, name, descriptor) {
  var oldValue = descriptor.value

  descriptor.value = function () {
    console.log(`Calling ${name} with`, arguments)
    return oldValue.apply(this, arguments)
  }

  return descriptor
}

const math = new Math()

// passed parameters should get logged now
math.add(2, 4)
```

装饰器有注释的作用。

```js
@testable
class Person {
  @readonly
  @nonenumerable
  name() {
    return `${this.first} ${this.last}`
  }
}
```

一眼就能看出`Person`可测试，`name`只读且不可枚举。

下面是使用 Decorator 写法的[组件](https://github.com/ionic-team/stencil)。

```js
@Component({
  tag: 'my-component',
  styleUrl: 'my-component.scss'
})
export class MyComponent {
  @Prop() first: string;
  @Prop() last: string;
  @State() isVisible: boolean = true;

  render() {
    return (
      <p>Hello, my name is {this.first} {this.last}</p>
    );
  }
}
```

同一方法上的多个装饰器像剥洋葱：先从外到内进入，再由内向外执行。

```js
function dec(id) {
  console.log('evaluated', id)
  return (target, property, descriptor) => console.log('executed', id)
}

class Example {
  @dec(1)
  @dec(2)
  method() {}
}
// evaluated 1
// evaluated 2
// executed 2
// executed 1
```

除注释外，装饰器还能用于类型检查，是 JavaScript 静态分析的重要工具。

## 为什么装饰器不能用于函数？

装饰器只能用于类和类的方法，不能用于函数，因为存在函数提升。

```js
var counter = 0;

var add = function () {
  counter++;
};

@add
function foo() {
}
```

这段代码意图让`counter`等于 1，实际结果是 0——函数提升后实际执行的是：

```js
var counter;
var add;

@add
function foo() {
}

counter = 0;

add = function () {
  counter++;
};
```

```js
var readOnly = require("some-decorator");

@readOnly
function foo() {
}
```

这段代码同样有问题，实际执行的是：

```js
var readOnly;

@readOnly
function foo() {
}

readOnly = require("some-decorator");
```

因为函数提升，装饰器不能用于函数；类不提升，没有这个问题。

一定要装饰函数，用高阶函数直接包装即可。

```js
function doSomething(name) {
  console.log('Hello, ' + name)
}

function loggingDecorator(wrapped) {
  return function () {
    console.log('Starting')
    const result = wrapped.apply(this, arguments)
    console.log('Finished')
    return result
  }
}

const wrapped = loggingDecorator(doSomething)
```

## 存取器装饰器（新语法）

类型描述如下。

```typescript
type ClassGetterDecorator = (
  value: Function,
  context: {
    kind: 'getter'
    name: string | symbol
    access: { get(): unknown }
    static: boolean
    private: boolean
    addInitializer(initializer: () => void): void
  },
) => Function | void

type ClassSetterDecorator = (
  value: Function,
  context: {
    kind: 'setter'
    name: string | symbol
    access: { set(value: unknown): void }
    static: boolean
    private: boolean
    addInitializer(initializer: () => void): void
  },
) => Function | void
```

第一个参数是原始的存值器（setter）和取值器（getter）。

返回值如果是函数就取代原来的存取器，修改同样发生在类的原型对象上；不返回值则沿用原存取器，返回其他类型会报错。

存取器装饰器对 setter 和 getter 分开作用：下例中`@foo`只装饰`get x()`，不装饰`set x()`。

```js
class C {
  @foo
  get x() {
    // ...
  }

  set x(val) {
    // ...
  }
}
```

上一节的`@logged`稍加修改即可用于存取器。

```js
function logged(value, { kind, name }) {
  if (kind === 'method' || kind === 'getter' || kind === 'setter') {
    return function (...args) {
      console.log(`starting ${name} with arguments ${args.join(', ')}`)
      const ret = value.call(this, ...args)
      console.log(`ending ${name}`)
      return ret
    }
  }
}

class C {
  @logged
  set x(arg) {}
}

new C().x = 1
// starting x with arguments 1
// ending x
```

去掉语法糖，就是用传统语法改掉类的原型链。

```js
class C {
  set x(arg) {}
}

let { set } = Object.getOwnPropertyDescriptor(C.prototype, 'x')
set =
  logged(set, {
    kind: 'setter',
    name: 'x',
    static: false,
    private: false,
  }) ?? set

Object.defineProperty(C.prototype, 'x', { set })
```

## 属性装饰器（新语法）

类型描述如下。

```typescript
type ClassFieldDecorator = (
  value: undefined,
  context: {
    kind: 'field'
    name: string | symbol
    access: { get(): unknown; set(value: unknown): void }
    static: boolean
    private: boolean
  },
) => (initialValue: unknown) => unknown | void
```

第一个参数是`undefined`（不输入值）。可以返回一个初始化函数，属性被赋值时自动运行，它收到初始值并返回新的初始值；也可以不返回任何值。返回其他类型都会报错。

例子：

```js
function logged(value, { kind, name }) {
  if (kind === 'field') {
    return function (initialValue) {
      console.log(`initializing ${name} with value ${initialValue}`)
      return initialValue
    }
  }

  // ...
}

class C {
  @logged x = 1
}

new C()
// initializing x with value 1
```

不使用装饰器语法时，实际作用如下。

```js
let initializeX = logged(undefined, {
  kind: "field",
  name: "x",
  static: false,
  private: false,
}) ?? (initialValue) => initialValue;

class C {
  x = initializeX.call(this, 1);
}
```

## accessor 命令（新语法）

装饰器引入了一个新命令`accessor`，用作属性的前缀。

```js
class C {
  accessor x = 1
}
```

它是简写形式：声明`x`是私有属性`#x`的存取接口，等同于：

```js
class C {
  #x = 1

  get x() {
    return this.#x
  }

  set x(val) {
    this.#x = val
  }
}
```

`accessor`前面还可以加`static`和`private`命令。

```js
class C {
  static accessor x = 1
  accessor #y = 2
}
```

`accessor`前面还可以加属性装饰器。

```js
function logged(value, { kind, name }) {
  if (kind === 'accessor') {
    let { get, set } = value

    return {
      get() {
        console.log(`getting ${name}`)

        return get.call(this)
      },

      set(val) {
        console.log(`setting ${name} to ${val}`)

        return set.call(this, val)
      },

      init(initialValue) {
        console.log(`initializing ${name} with value ${initialValue}`)
        return initialValue
      },
    }
  }

  // ...
}

class C {
  @logged accessor x = 1
}

let c = new C()
// initializing x with value 1
c.x
// getting x
c.x = 123
// setting x to 123
```

用于`accessor`的属性装饰器类型描述如下。

```typescript
type ClassAutoAccessorDecorator = (
  value: {
    get: () => unknown;
    set(value: unknown) => void;
  },
  context: {
    kind: "accessor";
    name: string | symbol;
    access: { get(): unknown, set(value: unknown): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  }
) => {
  get?: () => unknown;
  set?: (value: unknown) => void;
  initialize?: (initialValue: unknown) => unknown;
} | void;
```

第一个参数是一个对象，包含该`accessor`属性的 get 和 set。装饰器可返回新对象，其中的新存取器取代原来的（相当于拦截）；返回对象还可含`initialize`函数，用来改私有属性的初始值。也可以不返回值；返回其他类型的值或含其他属性的对象会报错。

## addInitializer() 方法（新语法）

除属性装饰器外，其他装饰器的上下文对象都有`addInitializer()`方法，用来做初始化。

运行时间如下。

- 类装饰器：在类被完全定义之后。
- 方法装饰器：在类构造期间运行，在属性初始化之前。
- 静态方法装饰器：在类定义期间运行，早于静态属性定义，但晚于类方法的定义。

下面是一个例子。

```js
function customElement(name) {
  return (value, { addInitializer }) => {
    addInitializer(function () {
      customElements.define(name, this)
    })
  }
}

@customElement('my-element')
class MyElement extends HTMLElement {
  static get observedAttributes() {
    return ['some', 'attrs']
  }
}
```

等同于不使用装饰器的写法：

```js
class MyElement {
  static get observedAttributes() {
    return ['some', 'attrs']
  }
}

let initializersForMyElement = []

MyElement =
  customElement('my-element')(MyElement, {
    kind: 'class',
    name: 'MyElement',
    addInitializer(fn) {
      initializersForMyElement.push(fn)
    },
  }) ?? MyElement

for (let initializer of initializersForMyElement) {
  initializer.call(MyElement)
}
```

下面是方法装饰器的例子。

```js
function bound(value, { name, addInitializer }) {
  addInitializer(function () {
    this[name] = this[name].bind(this)
  })
}

class C {
  message = 'hello!'

  @bound
  m() {
    console.log(this.message)
  }
}

let { m } = new C()

m() // hello!
```

等同于不使用装饰器的写法：

```js
class C {
  constructor() {
    for (let initializer of initializersForM) {
      initializer.call(this)
    }

    this.message = 'hello!'
  }

  m() {}
}

let initializersForM = []

C.prototype.m =
  bound(C.prototype.m, {
    kind: 'method',
    name: 'm',
    static: false,
    private: false,
    addInitializer(fn) {
      initializersForM.push(fn)
    },
  }) ?? C.prototype.m
```

## core-decorators.js

[core-decorators.js](https://github.com/jayphelps/core-decorators.js)是一个第三方模块，提供几个常见装饰器，可以借此理解装饰器。

**（1）@autobind**

`autobind`装饰器让方法中的`this`绑定原始对象。

```js
import { autobind } from 'core-decorators'

class Person {
  @autobind
  getPerson() {
    return this
  }
}

let person = new Person()
let getPerson = person.getPerson

getPerson() === person
// true
```

**（2）@readonly**

`readonly`装饰器让属性或方法不可写。

```js
import { readonly } from 'core-decorators'

class Meal {
  @readonly
  entree = 'steak'
}

var dinner = new Meal()
dinner.entree = 'salmon'
// Cannot assign to read only property 'entree' of [object Object]
```

**（3）@override**

`override`装饰器检查子类方法是否正确覆盖了父类同名方法，不正确就报错。

```js
import { override } from 'core-decorators'

class Parent {
  speak(first, second) {}
}

class Child extends Parent {
  @override
  speak() {}
  // SyntaxError: Child#speak() does not properly override Parent#speak(first, second)
}

// or

class Child extends Parent {
  @override
  speaks() {}
  // SyntaxError: No descriptor matching Child#speaks() was found on the prototype chain.
  //
  //   Did you mean "speak"?
}
```

**（4）@deprecate (别名@deprecated)**

`deprecate`或`deprecated`装饰器在控制台显示一条警告，表示该方法将废除。

```js
import { deprecate } from 'core-decorators'

class Person {
  @deprecate
  facepalm() {}

  @deprecate('We stopped facepalming')
  facepalmHard() {}

  @deprecate('We stopped facepalming', {
    url: 'http://knowyourmeme.com/memes/facepalm',
  })
  facepalmHarder() {}
}

let person = new Person()

person.facepalm()
// DEPRECATION Person#facepalm: This function will be removed in future versions.

person.facepalmHard()
// DEPRECATION Person#facepalmHard: We stopped facepalming

person.facepalmHarder()
// DEPRECATION Person#facepalmHarder: We stopped facepalming
//
//     See http://knowyourmeme.com/memes/facepalm for more details.
//
```

**（5）@suppressWarnings**

`suppressWarnings`装饰器抑制`deprecated`导致的`console.warn()`调用，但异步代码发出的调用除外。

```js
import { suppressWarnings } from 'core-decorators'

class Person {
  @deprecated
  facepalm() {}

  @suppressWarnings
  facepalmWithoutWarning() {
    this.facepalm()
  }
}

let person = new Person()

person.facepalmWithoutWarning()
// no warning is logged
```

## 使用装饰器实现自动发布事件

用装饰器可以让对象的方法被调用时自动发出事件。

```js
const postal = require('postal/lib/postal.lodash')

export default function publish(topic, channel) {
  const channelName = channel || '/'
  const msgChannel = postal.channel(channelName)
  msgChannel.subscribe(topic, v => {
    console.log('频道: ', channelName)
    console.log('事件: ', topic)
    console.log('数据: ', v)
  })

  return function (target, name, descriptor) {
    const fn = descriptor.value

    descriptor.value = function () {
      let value = fn.apply(this, arguments)
      msgChannel.publish(topic, value)
    }
  }
}
```

`publish`装饰器改写`descriptor.value`，使原方法被调用时自动发出一个事件；它使用的“发布/订阅”库是 [Postal.js](https://github.com/postaljs/postal.js)。

它的用法如下。

```js
// index.js
import publish from './publish'

class FooComponent {
  @publish('foo.some.message', 'component')
  someMethod() {
    return { my: 'data' }
  }
  @publish('foo.some.other')
  anotherMethod() {
    // ...
  }
}

let foo = new FooComponent()

foo.someMethod()
foo.anotherMethod()
```

此后只要调用`someMethod`或`anotherMethod`，就会自动发出事件。

```bash
$ bash-node index.js
频道:  component
事件:  foo.some.message
数据:  { my: 'data' }

频道:  /
事件:  foo.some.other
数据:  undefined
```

## Mixin

在装饰器的基础上可以实现`Mixin`模式：对象继承的一种替代方案，中文译为“混入”（mix in），即在一个对象中混入另一个对象的方法。

例子：

```js
const Foo = {
  foo() {
    console.log('foo')
  },
}

class MyClass {}

Object.assign(MyClass.prototype, Foo)

let obj = new MyClass()
obj.foo() // 'foo'
```

`Foo`的`foo`方法经`Object.assign`“混入”`MyClass`，实例`obj`便有了`foo`方法——这就是“混入”的简单实现。

把 Mixin 写成一个装饰器：

```js
export function mixins(...list) {
  return function (target) {
    Object.assign(target.prototype, ...list)
  }
}
```

用它就能为类“混入”各种方法。

```js
import { mixins } from './mixins.js'

const Foo = {
  foo() {
    console.log('foo')
  },
}

@mixins(Foo)
class MyClass {}

let obj = new MyClass()
obj.foo() // "foo"
```

这样就在`MyClass`上“混入”了`Foo`的`foo`方法，但会改写`MyClass.prototype`；不想这样，也可以用类的继承实现 Mixin。

```js
class MyClass extends MyBaseClass {
  /* ... */
}
```

要在`MyClass`里“混入”一个`foo`方法，可以在它和`MyBaseClass`之间插入一个混入类：带`foo`方法，又继承`MyBaseClass`的全部方法，再由`MyClass`继承。

```js
let MyMixin = superclass =>
  class extends superclass {
    foo() {
      console.log('foo from MyMixin')
    }
  }
```

`MyMixin`是混入类生成器：接受`superclass`，返回一个带`foo`方法的子类。

目标类再继承它，就“混入”了`foo`方法。

```js
class MyClass extends MyMixin(MyBaseClass) {
  /* ... */
}

let c = new MyClass()
c.foo() // "foo from MyMixin"
```

如果需要“混入”多个方法，就生成多个混入类。

```js
class MyClass extends Mixin1(Mixin2(MyBaseClass)) {
  /* ... */
}
```

这种写法的好处是可以调用`super`，避免“混入”时覆盖父类的同名方法。

```js
let Mixin1 = superclass =>
  class extends superclass {
    foo() {
      console.log('foo from Mixin1')
      if (super.foo) super.foo()
    }
  }

let Mixin2 = superclass =>
  class extends superclass {
    foo() {
      console.log('foo from Mixin2')
      if (super.foo) super.foo()
    }
  }

class S {
  foo() {
    console.log('foo from S')
  }
}

class C extends Mixin1(Mixin2(S)) {
  foo() {
    console.log('foo from C')
    super.foo()
  }
}
```

```js
new C().foo()
// foo from C
// foo from Mixin1
// foo from Mixin2
// foo from S
```

## Trait

Trait 也是一种装饰器，效果与 Mixin 类似，但提供更多功能：防止同名方法冲突、排除混入某些方法、为混入的方法起别名。

以第三方模块 [traits-decorator](https://github.com/CocktailJS/traits-decorator) 为例，它的`traits`装饰器既接受对象，也接受 ES6 类。

```js
import { traits } from 'traits-decorator'

class TFoo {
  foo() {
    console.log('foo')
  }
}

const TBar = {
  bar() {
    console.log('bar')
  },
}

@traits(TFoo, TBar)
class MyClass {}

let obj = new MyClass()
obj.foo() // foo
obj.bar() // bar
```

`traits`装饰器把`TFoo`的`foo`和`TBar`的`bar`都“混入”了`MyClass`。

Trait 不允许“混入”同名方法。

```js
import { traits } from 'traits-decorator'

class TFoo {
  foo() {
    console.log('foo')
  }
}

const TBar = {
  bar() {
    console.log('bar')
  },
  foo() {
    console.log('foo')
  },
}

@traits(TFoo, TBar)
class MyClass {}
// 报错
// throw new Error('Method named: ' + methodName + ' is defined twice.');
//        ^
// Error: Method named: foo is defined twice.
```

一种解决方法是排除`TBar`的`foo`方法。

```js
import { traits, excludes } from 'traits-decorator'

class TFoo {
  foo() {
    console.log('foo')
  }
}

const TBar = {
  bar() {
    console.log('bar')
  },
  foo() {
    console.log('foo')
  },
}

@traits(TFoo, TBar::excludes('foo'))
class MyClass {}

let obj = new MyClass()
obj.foo() // foo
obj.bar() // bar
```

用绑定运算符（::）在`TBar`上排除`foo`，混入时就不会报错。

另一种方法是为`TBar`的`foo`方法起一个别名。

```js
import { traits, alias } from 'traits-decorator'

class TFoo {
  foo() {
    console.log('foo')
  }
}

const TBar = {
  bar() {
    console.log('bar')
  },
  foo() {
    console.log('foo')
  },
}

@traits(TFoo, TBar::alias({ foo: 'aliasFoo' }))
class MyClass {}

let obj = new MyClass()
obj.foo() // foo
obj.aliasFoo() // foo
obj.bar() // bar
```

给`TBar`的`foo`起别名`aliasFoo`后，`MyClass`也能混入它了。

`alias`和`excludes`方法，可以结合起来使用。

```js
@traits(TExample::excludes('foo', 'bar')::alias({ baz: 'exampleBaz' }))
class MyClass {}
```

排除了`TExample`的`foo`和`bar`，并把`baz`改名为`exampleBaz`。

`as`方法则为上面的代码提供了另一种写法。

```js
@traits(
  TExample::as({ excludes: ['foo', 'bar'], alias: { baz: 'exampleBaz' } }),
)
class MyClass {}
```

## 装饰器与 TypeScript 的配置

同一份代码在 TypeScript 里的行为由两个编译选项决定。

- **`experimentalDecorators`**：为`true`时用 legacy 语义；不写或为`false`时，TypeScript 5.0 及以上按 stage 3 标准实现。它决定装饰器函数收到的是`(target, name, descriptor)`还是`(value, context)`。
- **`emitDecoratorMetadata`**：只有配合`experimentalDecorators: true`才有意义，作用是给被装饰的声明额外产出`design:type`、`design:paramtypes`、`design:returntype`三条元数据，供`reflect-metadata`运行时读取。

下面是最常见的两个配置组合。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

这是 NestJS、TypeORM、Angular 一类框架的标配：只有 legacy 支持参数装饰器，也只有它提供运行时类型信息，依赖注入才做得起来。

```json
{
  "compilerOptions": {
    "target": "ES2022"
  }
}
```

这是新项目用标准装饰器的写法，无需额外开关。代价是拿不到类型元数据——标准装饰器**不产出**`design:type`，从 TypeScript 5.2 起改用`context.metadata`收集、通过`Symbol.metadata`暴露，读取前通常还要补一行 polyfill。

```ts
if (!Symbol.metadata) {
  Object.defineProperty(Symbol, 'metadata', { value: Symbol('metadata') })
}
```

其他工具链的对应关系如下。

[width(21,39,40)]

| 工具            | 使用 legacy                                              | 使用标准                                               |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| TypeScript 5.0+ | `"experimentalDecorators": true`                         | 默认（不开启该选项）                                   |
| Babel           | `@babel/plugin-proposal-decorators`加`version: "legacy"` | 同一插件，`version`指定较新的提案版本（如`"2023-11"`） |
| SWC、esbuild 等 | 跟随各自读取的`tsconfig`中的`experimentalDecorators`     | 同上                                                   |

两个选项不能同时生效，也不建议混用。库作者若同时服务两类使用者，通常靠条件导出提供两份实现。

## 装饰器与元数据、反射

装饰器除了包装行为，另一个主要用途是“贴标签”：把路由表、ORM 映射、依赖注入的 token 等数据挂到类上，运行时统一读出。常见做法有三种。

**（1）直接挂在类或原型上。** 前文`@testable`就是这种，简单直接，但要注意命名冲突；TypeScript 下还需声明合并才能让类型认识它。

**（2）集中登记到一个注册表。** 装饰器只往`Map`或数组里写，谁读谁遍历，互不污染目标的形状。

```js
const registry = new Map()

function service(name) {
  return function (value, context) {
    registry.set(name, value)
  }
}

@service('users')
class UserService {}

console.log(registry.get('users')) // [class UserService]
```

**（3）使用装饰器元数据。** 标准装饰器给每个类准备了一个元数据对象，同类上的装饰器共享它，类定义完成后可从`Class[Symbol.metadata]`读到——这是标准语法里替代`reflect-metadata`的方案。

```ts
function route(method: string, path: string) {
  return function (
    value: Function,
    context: {
      name: string | symbol
      metadata: Record<string | symbol, unknown>
    },
  ) {
    const routes = (context.metadata.routes ??= []) as unknown[]
    routes.push({ method, path, handler: context.name })
  }
}

class UserController {
  @route('GET', '/users/:id')
  findOne() {}
}

console.log((UserController as any)[Symbol.metadata].routes)
// [{ method: 'GET', path: '/users/:id', handler: 'findOne' }]
```

legacy 语法下，同样的能力由`reflect-metadata`提供。

```ts
import 'reflect-metadata'

function route(method: string, path: string) {
  return function (
    target: any,
    name: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const routes = Reflect.getMetadata('routes', target.constructor) ?? []
    routes.push({ method, path, handler: name })
    Reflect.defineMetadata('routes', routes, target.constructor)
  }
}
```

关于元数据有三点要记住。

- **写入的时机是类定义时，只写一次**，运行时读取只是一次普通的属性访问，不构成性能问题；开销在包体积（`reflect-metadata`的 polyfill 加上`emitDecoratorMetadata`产出的元数据表）。
- **存和取必须在同一个地方。** 挂在`target.prototype`上的数据从`Constructor`读不到，反之亦然。这类“读不到元数据”的 bug 几乎都是两边不对称造成的。
- **私有成员的访问方式不同。** 私有成员的`context.name`是`"#x"`这样的描述字符串，`context.private`为`true`，不能用方括号访问，需借助`context.access`。

## 装饰器与继承的相互作用

装饰器只在类定义时生效，与继承的关系取决于装饰的是谁。

**方法装饰器改的是原型上的方法**，子类通过原型链继承到的是装饰后的版本，但装饰器不会在子类上再跑一遍。

```js
function trace(value, context) {
  return function (...args) {
    console.log(`call ${String(context.name)}`)
    return value.apply(this, args)
  }
}

class Base {
  @trace
  greet() {
    return 'hello'
  }
}

class Child extends Base {
  greet() {
    return 'hi' // 覆写后不再有日志
  }
}

new Base().greet() // call greet
new Child().greet() // 没有日志
```

这是实践中最大的一个坑：**子类只要覆写同名方法，父类方法上的装饰器就全部失效**。要保住行为，有三种选择。

- 子类覆写时也加上同样的装饰器。
- 把装饰器包好的逻辑放在父类的方法里，子类调用`super`（模板方法）。
- 用类装饰器在类定义时遍历原型，统一处理（适合需要覆盖整个类的场景）。

**类装饰器返回新类时，继承关系需要重新理解。** 新类取代了原来的绑定，子类`extends`的是新类，因此也能拿到它添加的能力。

```js
function sealed(value) {
  return class extends value {
    version() {
      return 'sealed'
    }
  }
}

@sealed
class Base {}

class Child extends Base {}

console.log(new Child().version()) // sealed
console.log(new Child() instanceof Base) // true
```

因为新类继承了原类，`instanceof`的关系保住了。但若返回的是一个**全新**的、不继承原类的类，`instanceof`、静态成员、私有字段统统会断掉，极不推荐。

**私有成员不参与继承。** `#x`只在定义它的类里可见，子类拿不到，装饰器对私有成员的包装也不会传递。子类想复用，只能由父类提供公开的访问方法。

## 装饰器下 this 的指向

装饰器相关代码里有四种`this`，含义各不相同。

- **装饰器函数自身**：在类定义时执行，模块代码是严格模式，`this`是`undefined`。别想在装饰器里用`this`拿到类或实例，目标一律通过参数传进来。
- **包装函数**：它取代了原方法，调用时的`this`由调用方式决定（`obj.m()`里就是`obj`）。它**必须把`this`转交**给原方法，否则实例状态全丢，即写成`value.apply(this, args)`而非`value(...args)`。
- **字段装饰器返回的初始化函数**：以实例为`this`调用（静态字段则是类本身），因此能读到同一实例上已初始化过的其他字段。
- **`addInitializer()`的回调**：成员装饰器注册的在实例化时以实例为`this`运行（静态成员则是类）；类装饰器注册的在类定义完成后以类为`this`运行。

```js
function trace(value, context) {
  return function (...args) {
    console.log(`this is the instance: ${this instanceof Counter}`)
    return value.apply(this, args)
  }
}

class Counter {
  count = 0
  @trace
  add(n) {
    this.count += n
    return this.count
  }
}

const counter = new Counter()
counter.add(2) // this is the instance: true
```

字段装饰器返回的初始化函数，`this`同样是实例。

```js
function uppercase(value, context) {
  return function (initialValue) {
    console.log(this instanceof Person) // true
    return String(initialValue).toUpperCase()
  }
}

class Person {
  @uppercase
  name = 'robin'
}

console.log(new Person().name) // 'ROBIN'
```

最后是普通方法本身的老问题：方法一旦脱离对象使用，`this`就没了。

```js
class C {
  message = 'hello!'

  m() {
    console.log(this.message)
  }
}

const { m } = new C()
m() // TypeError: Cannot read properties of undefined
```

要让它随时可用，就得在绑定上想办法——这正是前文`@bound`和 core-decorators 的`@autobind`做的事。

## 装饰器的典型应用场景

### 日志与耗时统计

最常见的用法：给方法包一层，进入和离开时各打一条日志，或者记录耗时。

```js
function timed(value, context) {
  return function (...args) {
    const start = performance.now()
    try {
      return value.apply(this, args)
    } finally {
      console.log(`${String(context.name)} took ${performance.now() - start}ms`)
    }
  }
}

class Api {
  @timed
  fetchUser(id) {
    return { id }
  }
}
```

### 缓存（记忆化）

用闭包保存结果，纯函数上最有效。注意缓存**按方法**共享，实例间会复用结果；要按实例隔离，就把缓存挂到`this`上，或用`WeakMap`以实例为键。

```js
function memoize(value, context) {
  const cache = new Map()
  return function (...args) {
    const key = JSON.stringify(args)
    if (!cache.has(key)) {
      cache.set(key, value.apply(this, args))
    }
    return cache.get(key)
  }
}
```

### 权限校验

在方法执行前检查当前用户是否具备权限，检查逻辑只写一次。

```js
function permission(role) {
  return function (value, context) {
    return function (...args) {
      if (!currentUser.roles.includes(role)) {
        throw new Error(`需要 ${role} 权限`)
      }
      return value.apply(this, args)
    }
  }
}

class AdminPanel {
  @permission('admin')
  clearCache() {}
}
```

这类装饰器**改变了方法的失败方式**（多了几种抛错），调用方必须知道；团队里最好把它们收敛到一个目录，当成公共 API 管理。

### 依赖注入

框架通过装饰器收集“谁依赖谁”，启动时统一组装对象。legacy 配合`emitDecoratorMetadata`能拿到构造参数类型，这是 NestJS、Angular 依赖注入的基石；标准语法拿不到类型信息，只能显式传 token。

```ts
@injectable()
class UserService {
  @inject('db')
  db: Database

  findUser(id: string) {
    return this.db.find(id)
  }
}
```

### 路由与配置注册

把方法登记成路由，框架启动时读元数据批量注册，省掉手写的路由表。

```ts
@Controller('users')
class UserController {
  @Get(':id')
  findOne() {
    return 'user'
  }
}
```

### 数据校验与序列化

装饰器负责给字段贴校验规则，运行时统一读取并检查，业务代码里不再出现大段`if`判断。

```ts
class CreateUserDto {
  @IsEmail()
  email: string

  @MinLength(6)
  password: string
}
```

### 自动绑定 this

把方法绑定到实例，允许方法被解构、被当成回调传递，实现见前文`addInitializer()`和 core-decorators 的`@autobind`。

## 装饰器的性能与兼容性

**先看性能。** 装饰器是类定义时的一次性动作，每次方法调用只多一层函数调用（外加一层闭包），与手写高阶函数包装等价，没有额外的反射扫描。开销集中在三处。

- **用取值器拦截方法。** legacy 的`@autobind`会在原型上装 getter，首次访问时替换成绑定后的函数；每次属性读取都要过 getter，会破坏内联缓存，高频对象上要谨慎。
- **每个实例的初始化函数。** 字段装饰器的初始化函数与`addInitializer()`的回调都在实例化时执行；实例多、回调多时累加起来不可忽略。
- **元数据与 polyfill。** `reflect-metadata`和`emitDecoratorMetadata`产出的元数据表会增加包体积，并在启动阶段集中写入，这是 Angular、NestJS 一类框架冷启动较慢的原因之一。标准语法的`Symbol.metadata`省掉了 polyfill，前提是运行环境支持。

准备工作应放在装饰器函数体里（只跑一次），而不是包装函数体里（每次调用都跑）。

```js
// 不好：每次调用都重新准备
function slow(value, context) {
  return function (...args) {
    const options = buildExpensiveOptions()
    return value.apply(this, args)
  }
}

// 好：准备一次，之后复用
function fast(value, context) {
  const options = buildExpensiveOptions()
  return function (...args) {
    return value.apply(this, args)
  }
}
```

**再看兼容性。** 装饰器至今未进入正式的 ES 规范（提案长期停留在 stage 3），不能指望运行环境直接执行`@`语法——把带装饰器的源码交给 Node 或浏览器会报语法错误。线上代码必须经 TypeScript、Babel 或 SWC 转译，这意味着：

- 构建配置决定了装饰器语义（legacy 还是标准），换工具链等于换行为；
- 以源码形式分发的库，使用者没开对应配置就会在构建期报出`Unsupported decorator syntax`一类的错误；
- 产物比手写包装略大，转译后每个装饰器都会变成一次`__decorate`／辅助函数调用。

## 装饰器与其他方案的对比

装饰器不是唯一的横切方案，放回工具箱里看更清楚。

[width(18,13,15,22,32)]

| 方案                 | 生效时机             | 组合方式       | 典型场景                                   | 主要代价                                 |
| -------------------- | -------------------- | -------------- | ------------------------------------------ | ---------------------------------------- |
| 装饰器               | 类定义时             | 叠加多个装饰器 | 日志、权限、依赖注入、路由注册             | 需要转译；行为隐式，阅读代码看不到调用链 |
| 高阶函数手工包装     | 类定义之后，显式一行 | 手工串联       | 只有一两个方法需要增强，或团队不接受装饰器 | 包装代码离方法远，容易漏包、重复包       |
| 继承                 | 类定义时             | 单条继承链     | 共享实现、模板方法                         | 一种能力一条链，无法任意叠加             |
| Mixin                | 类定义时             | 多来源平铺     | 复用一组方法                               | 同名冲突；`Object.assign`会改写原型      |
| `Proxy`              | 运行时               | 任意拦截       | 动态代理、调试工具、全局拦截               | 性能开销大，语义不透明，类型信息丢失     |
| 显式注册表、配置对象 | 运行时               | 数据驱动       | 需要序列化、配置化、插件化的场景           | 样板代码多，定义与使用分离               |

选择依据可以简化成一句话：**需要就近声明、又要能任意叠加时选装饰器；只需要一次性的、显式的包装时，高阶函数更直白。**

## 小结

- 装饰器是`@ + 函数`的语法糖，本质是“用函数包装类或类的成员”，运行时没有额外魔法。
- 存在两套语法：标准（stage 3）的`(value, context)`与 legacy 的`(target, name, descriptor)`，由`experimentalDecorators`决定用哪套，不能混用。
- 装饰器表达式按源码顺序从上到下求值，同一目标上的装饰器从下往上调用，类装饰器最后运行。
- 装饰器可返回新值取代原值，也可不返回；返回其它类型会报错。属性装饰器另有约定：第一个参数是`undefined`，返回初始化函数。
- 装饰器不能用于函数（函数提升导致装饰器执行时函数还不存在），也不能用于对象字面量的成员。
- 标准装饰器里，`addInitializer()`是做“每实例一次性初始化”的正道，`context.metadata`用来收集元数据。
- 用得好，装饰器让横切关注点就近声明、可叠加；用得滥就成了隐式魔法——阅读时看不出实际执行路径，调试和类型推断都会变难。

## 常见问题 (FAQ)

### 1. 新语法和旧语法应该怎么选？

- **新项目、不依赖 DI 与校验框架**：直接用标准语法（TypeScript 5.0 起默认）。
- **用 NestJS、Angular、TypeORM、class-validator 这类框架**：只能用 legacy（`experimentalDecorators: true`），需要类型元数据时再加`emitDecoratorMetadata: true`。
- 判断依据是**生态**而非新旧：参数装饰器只有 legacy 有，而这些框架的依赖注入、参数校验都建立在它之上。
- 两套语法**不能混用**：同一个项目只能二选一，混写会直接报错。

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. 多个装饰器谁先执行？

- **表达式按源码顺序从上到下求值，调用从下往上**，最靠近目标的先执行：`@a @b m() {}`等价于`a(b(m))`。
- **类装饰器最后执行**，此时成员装饰器已经跑完。
- 想控制叠加效果就调整书写位置：日志写在缓存装饰器上面，缓存命中也会记日志；写在下面则不会。

```js
const order = []

function trace(label) {
  return function (value, context) {
    order.push(`${label} -> ${String(context.name)}`)
  }
}

@trace('class')
class C {
  @trace('outer')
  @trace('inner')
  method() {}
}

console.log(order)
// ['inner -> method', 'outer -> method', 'class -> C']
```

### 3. 为什么装饰器不能用于函数？

- 因为**函数提升**：函数声明先被提升，装饰器表达式却在原位置求值，求值时被装饰的函数还没赋值，拿到的是`undefined`。
- 类不会提升，其定义必须先求值才能使用，所以装饰器用在类上没问题。
- 一定要给函数加能力，直接用高阶函数：`const wrapped = withLog(fn)`。详见前文“为什么装饰器不能用于函数？”一节。

### 4. 装饰器返回`undefined`和返回一个新函数有什么区别？

- **不返回（`undefined`）表示保持原值**，方法、类等装饰器都是这个语义。
- **返回一个新值表示取代原值**，返回的不是函数（类装饰器返回的不是构造函数）会抛`TypeError`。
- 属性装饰器是例外：第一个参数是`undefined`，返回的必须是**初始化函数**`(initialValue) => newValue`，用来改初始值。

```js
function noop(value, context) {
  // 不返回：方法保持原样
}

function replace(value, context) {
  return function () {
    return 'replaced'
  }
}
```

### 5. 装饰器里的`this`指向谁？

- **装饰器函数自身**：类定义时执行，严格模式下是`undefined`，目标只能通过参数拿。
- **包装函数**：和原方法一样由调用方式决定，必须用`value.apply(this, args)`转交`this`，否则实例状态全丢。
- **字段装饰器返回的初始化函数、以及`addInitializer()`的回调**：以实例为`this`运行（静态成员则是类本身）。

### 6. 装饰器能拿到参数类型或返回值类型吗？

- **标准装饰器不能。** 规范里没有类型元数据，装饰器只有`value`和`context`，能拿到名字、种类、是否静态、是否私有这类信息。
- **legacy 可以。** 开启`emitDecoratorMetadata`后，配合`reflect-metadata`能读到`design:type`、`design:paramtypes`、`design:returntype`，依赖注入正是靠它工作。
- 想要类型安全，只能在编译期用 TypeScript 泛型约束装饰器签名；运行时拿不到类型，不要抱期望。

### 7. 什么时候不该用装饰器？

- **只有一处用到、不打算复用**：直接写高阶函数更直白，也不用引入语法和构建配置。
- **逻辑复杂、需要条件分支或异步协作**：装饰器里塞不下清晰的流程控制，写成显式代码或独立服务方法更好读。
- **会改变方法的对外语义**（改参数、吞异常、改返回结构）：调用方难以从方法签名看出实际行为，放在方法体里更安全。
- **高频热路径上的 getter 拦截**：性能和可读性都不划算。
- 一句话，装饰器适合**声明式的、可叠加的、语义单一的**横切逻辑；超出这个范围就是隐式魔法。

### 8. 静态成员、私有成员、箭头函数字段能装饰吗？

- **静态成员可以**，此时`context.static`为`true`；静态成员装饰器的`addInitializer`在类定义期间运行，`this`是类本身。
- **私有成员可以**，此时`context.private`为`true`，`context.name`是`"#x"`形式的描述，不能再用方括号访问，需要借助`context.access`。
- **类字段可以**（包括写成箭头函数的字段），但字段装饰器第一个参数是`undefined`，拿不到值，只能通过返回初始化函数介入。
- **函数声明、独立的箭头函数、对象字面量的成员都不行**：前两者受函数提升限制，最后一种是因为提案尚未纳入。
