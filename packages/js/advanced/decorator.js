/*
 * 示例代码：decorator.md
 * 来源文档：apps/docs/js/advanced/misc/decorator.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 简介（新语法） =====
// @frozen
// class Foo {
//   @configurable(false)
//   @enumerable(true)
//   method() {}
//
//   @throttle(500)
//   expensiveMethod() {}
// }

// ===== 装饰器 API（新语法） [typescript] =====
// type Decorator = (
//   value: Input,
//   context: {
//     kind: string
//     name: string | symbol
//     access: {
//       get?(): unknown
//       set?(value: unknown): void
//     }
//     private?: boolean
//     static?: boolean
//     addInitializer?(initializer: () => void): void
//   },
// ) => Output | void

// ===== 类的装饰 =====
// @testable
// class MyTestableClass {
//   // ...
// }
//
// function testable(target) {
//   target.isTestable = true
// }
//
// MyTestableClass.isTestable // true

// ===== 类的装饰 =====
// @decorator
// class A {}
//
// // 等同于
//
// class A {}
// A = decorator(A) || A

// ===== 类的装饰 =====
// function testable(target) {
//   // ...
// }

// ===== 类的装饰 =====
// function testable(isTestable) {
//   return function (target) {
//     target.isTestable = isTestable
//   }
// }
//
// @testable(true)
// class MyTestableClass {}
// MyTestableClass.isTestable // true
//
// @testable(false)
// class MyClass {}
// MyClass.isTestable // false

// ===== 类的装饰 =====
// function testable(target) {
//   target.prototype.isTestable = true
// }
//
// @testable
// class MyTestableClass {}
//
// let obj = new MyTestableClass()
// obj.isTestable // true

// ===== 类的装饰 =====
// // mixins.js
// export function mixins(...list) {
//   return function (target) {
//     Object.assign(target.prototype, ...list)
//   }
// }
//
// // main.js
// import { mixins } from './mixins.js'
//
// const Foo = {
//   foo() {
//     console.log('foo')
//   },
// }
//
// @mixins(Foo)
// class MyClass {}
//
// let obj = new MyClass()
// obj.foo() // 'foo'

// ===== 类的装饰 =====
// const Foo = {
//   foo() {
//     console.log('foo')
//   },
// }
//
// class MyClass {}
//
// Object.assign(MyClass.prototype, Foo)
//
// let obj = new MyClass()
// obj.foo() // 'foo'

// ===== 类的装饰 =====
// class MyReactComponent extends React.Component {}
//
// export default connect(mapStateToProps, mapDispatchToProps)(MyReactComponent)

// ===== 类的装饰 =====
// @connect(mapStateToProps, mapDispatchToProps)
// export default class MyReactComponent extends React.Component {}

// ===== 类装饰器（新语法） [typescript] =====
// type ClassDecorator = (
//   value: Function,
//   context: {
//     kind: 'class'
//     name: string | undefined
//     addInitializer(initializer: () => void): void
//   },
// ) => Function | void

// ===== 类装饰器（新语法） =====
// function logged(value, { kind, name }) {
//   if (kind === 'class') {
//     return class extends value {
//       constructor(...args) {
//         super(...args)
//         console.log(
//           `constructing an instance of ${name} with arguments ${args.join(', ')}`,
//         )
//       }
//     }
//   }
//
//   // ...
// }
//
// @logged
// class C {}
//
// new C(1)
// // constructing an instance of C with arguments 1

// ===== 类装饰器（新语法） =====
// class C {}
//
// C =
//   logged(C, {
//     kind: 'class',
//     name: 'C',
//   }) ?? C
//
// new C(1)

// ===== 方法装饰器（新语法） =====
// class C {
//   @trace
//   toString() {
//     return 'C'
//   }
// }
//
// // 相当于
// C.prototype.toString = trace(C.prototype.toString)

// ===== 方法装饰器（新语法） [typescript] =====
// type ClassMethodDecorator = (
//   value: Function,
//   context: {
//     kind: 'method'
//     name: string | symbol
//     access: { get(): unknown }
//     static: boolean
//     private: boolean
//     addInitializer(initializer: () => void): void
//   },
// ) => Function | void

// ===== 方法装饰器（新语法） =====
// function replaceMethod() {
//   return function () {
//     return `How are you, ${this.name}?`
//   }
// }
//
// class Person {
//   constructor(name) {
//     this.name = name
//   }
//   @replaceMethod
//   hello() {
//     return `Hi ${this.name}!`
//   }
// }
//
// const robin = new Person('Robin')
//
// ;(robin.hello(), 'How are you, Robin?')

// ===== 方法装饰器（新语法） [typescript] =====
// function logged(value, { kind, name }) {
//   if (kind === 'method') {
//     return function (...args) {
//       console.log(`starting ${name} with arguments ${args.join(', ')}`)
//       const ret = value.call(this, ...args)
//       console.log(`ending ${name}`)
//       return ret
//     }
//   }
// }
//
// class C {
//   @logged
//   m(arg) {}
// }
//
// new C().m(1)
// // starting m with arguments 1
// // ending m

// ===== 方法装饰器（新语法） =====
// class C {
//   m(arg) {}
// }
//
// C.prototype.m =
//   logged(C.prototype.m, {
//     kind: 'method',
//     name: 'm',
//     static: false,
//     private: false,
//   }) ?? C.prototype.m

// ===== 方法的装饰 =====
// class Person {
//   @readonly
//   name() {
//     return `${this.first} ${this.last}`
//   }
// }

// ===== 方法的装饰 =====
// function readonly(target, name, descriptor) {
//   // descriptor对象原来的值如下
//   // {
//   //   value: specifiedFunction,
//   //   enumerable: false,
//   //   configurable: true,
//   //   writable: true
//   // };
//   descriptor.writable = false
//   return descriptor
// }
//
// readonly(Person.prototype, 'name', descriptor)
// // 类似于
// Object.defineProperty(Person.prototype, 'name', descriptor)

// ===== 方法的装饰 =====
// class Person {
//   @nonenumerable
//   get kidCount() {
//     return this.children.length
//   }
// }
//
// function nonenumerable(target, name, descriptor) {
//   descriptor.enumerable = false
//   return descriptor
// }

// ===== 方法的装饰 =====
// class Math {
//   @log
//   add(a, b) {
//     return a + b
//   }
// }
//
// function log(target, name, descriptor) {
//   var oldValue = descriptor.value
//
//   descriptor.value = function () {
//     console.log(`Calling ${name} with`, arguments)
//     return oldValue.apply(this, arguments)
//   }
//
//   return descriptor
// }
//
// const math = new Math()
//
// // passed parameters should get logged now
// math.add(2, 4)

// ===== 方法的装饰 =====
// @testable
// class Person {
//   @readonly
//   @nonenumerable
//   name() {
//     return `${this.first} ${this.last}`
//   }
// }

// ===== 方法的装饰 =====
// @Component({
//   tag: 'my-component',
//   styleUrl: 'my-component.scss'
// })
// export class MyComponent {
//   @Prop() first: string;
//   @Prop() last: string;
//   @State() isVisible: boolean = true;
//
//   render() {
//     return (
//       <p>Hello, my name is {this.first} {this.last}</p>
//     );
//   }
// }

// ===== 方法的装饰 =====
// function dec(id) {
//   console.log('evaluated', id)
//   return (target, property, descriptor) => console.log('executed', id)
// }
//
// class Example {
//   @dec(1)
//   @dec(2)
//   method() {}
// }
// // evaluated 1
// // evaluated 2
// // executed 2
// // executed 1

// ===== 为什么装饰器不能用于函数？ =====
// var counter = 0;
//
// var add = function () {
//   counter++;
// };
//
// @add
// function foo() {
// }

// ===== 为什么装饰器不能用于函数？ =====
// var counter;
// var add;
//
// @add
// function foo() {
// }
//
// counter = 0;
//
// add = function () {
//   counter++;
// };

// ===== 为什么装饰器不能用于函数？ =====
// var readOnly = require("some-decorator");
//
// @readOnly
// function foo() {
// }

// ===== 为什么装饰器不能用于函数？ =====
// var readOnly;
//
// @readOnly
// function foo() {
// }
//
// readOnly = require("some-decorator");

// ===== 为什么装饰器不能用于函数？ =====
// function doSomething(name) {
//   console.log('Hello, ' + name)
// }
//
// function loggingDecorator(wrapped) {
//   return function () {
//     console.log('Starting')
//     const result = wrapped.apply(this, arguments)
//     console.log('Finished')
//     return result
//   }
// }
//
// const wrapped = loggingDecorator(doSomething)

// ===== 存取器装饰器（新语法） [typescript] =====
// type ClassGetterDecorator = (
//   value: Function,
//   context: {
//     kind: 'getter'
//     name: string | symbol
//     access: { get(): unknown }
//     static: boolean
//     private: boolean
//     addInitializer(initializer: () => void): void
//   },
// ) => Function | void
//
// type ClassSetterDecorator = (
//   value: Function,
//   context: {
//     kind: 'setter'
//     name: string | symbol
//     access: { set(value: unknown): void }
//     static: boolean
//     private: boolean
//     addInitializer(initializer: () => void): void
//   },
// ) => Function | void

// ===== 存取器装饰器（新语法） =====
// class C {
//   @foo
//   get x() {
//     // ...
//   }
//
//   set x(val) {
//     // ...
//   }
// }

// ===== 存取器装饰器（新语法） =====
// function logged(value, { kind, name }) {
//   if (kind === 'method' || kind === 'getter' || kind === 'setter') {
//     return function (...args) {
//       console.log(`starting ${name} with arguments ${args.join(', ')}`)
//       const ret = value.call(this, ...args)
//       console.log(`ending ${name}`)
//       return ret
//     }
//   }
// }
//
// class C {
//   @logged
//   set x(arg) {}
// }
//
// new C().x = 1
// // starting x with arguments 1
// // ending x

// ===== 存取器装饰器（新语法） =====
// class C {
//   set x(arg) {}
// }
//
// let { set } = Object.getOwnPropertyDescriptor(C.prototype, 'x')
// set =
//   logged(set, {
//     kind: 'setter',
//     name: 'x',
//     static: false,
//     private: false,
//   }) ?? set
//
// Object.defineProperty(C.prototype, 'x', { set })

// ===== 属性装饰器（新语法） [typescript] =====
// type ClassFieldDecorator = (
//   value: undefined,
//   context: {
//     kind: 'field'
//     name: string | symbol
//     access: { get(): unknown; set(value: unknown): void }
//     static: boolean
//     private: boolean
//   },
// ) => (initialValue: unknown) => unknown | void

// ===== 属性装饰器（新语法） =====
// function logged(value, { kind, name }) {
//   if (kind === 'field') {
//     return function (initialValue) {
//       console.log(`initializing ${name} with value ${initialValue}`)
//       return initialValue
//     }
//   }
//
//   // ...
// }
//
// class C {
//   @logged x = 1
// }
//
// new C()
// // initializing x with value 1

// ===== 属性装饰器（新语法） =====
// let initializeX = logged(undefined, {
//   kind: "field",
//   name: "x",
//   static: false,
//   private: false,
// }) ?? (initialValue) => initialValue;
//
// class C {
//   x = initializeX.call(this, 1);
// }

// ===== accessor 命令（新语法） =====
// class C {
//   accessor x = 1
// }

// ===== accessor 命令（新语法） =====
// class C {
//   #x = 1
//
//   get x() {
//     return this.#x
//   }
//
//   set x(val) {
//     this.#x = val
//   }
// }

// ===== accessor 命令（新语法） =====
// class C {
//   static accessor x = 1
//   accessor #y = 2
// }

// ===== accessor 命令（新语法） =====
// function logged(value, { kind, name }) {
//   if (kind === 'accessor') {
//     let { get, set } = value
//
//     return {
//       get() {
//         console.log(`getting ${name}`)
//
//         return get.call(this)
//       },
//
//       set(val) {
//         console.log(`setting ${name} to ${val}`)
//
//         return set.call(this, val)
//       },
//
//       init(initialValue) {
//         console.log(`initializing ${name} with value ${initialValue}`)
//         return initialValue
//       },
//     }
//   }
//
//   // ...
// }
//
// class C {
//   @logged accessor x = 1
// }
//
// let c = new C()
// // initializing x with value 1
// c.x
// // getting x
// c.x = 123
// // setting x to 123

// ===== accessor 命令（新语法） [typescript] =====
// type ClassAutoAccessorDecorator = (
//   value: {
//     get: () => unknown;
//     set(value: unknown) => void;
//   },
//   context: {
//     kind: "accessor";
//     name: string | symbol;
//     access: { get(): unknown, set(value: unknown): void };
//     static: boolean;
//     private: boolean;
//     addInitializer(initializer: () => void): void;
//   }
// ) => {
//   get?: () => unknown;
//   set?: (value: unknown) => void;
//   initialize?: (initialValue: unknown) => unknown;
// } | void;

// ===== addInitializer() 方法（新语法） =====
// function customElement(name) {
//   return (value, { addInitializer }) => {
//     addInitializer(function () {
//       customElements.define(name, this)
//     })
//   }
// }
//
// @customElement('my-element')
// class MyElement extends HTMLElement {
//   static get observedAttributes() {
//     return ['some', 'attrs']
//   }
// }

// ===== addInitializer() 方法（新语法） =====
// class MyElement {
//   static get observedAttributes() {
//     return ['some', 'attrs']
//   }
// }
//
// let initializersForMyElement = []
//
// MyElement =
//   customElement('my-element')(MyElement, {
//     kind: 'class',
//     name: 'MyElement',
//     addInitializer(fn) {
//       initializersForMyElement.push(fn)
//     },
//   }) ?? MyElement
//
// for (let initializer of initializersForMyElement) {
//   initializer.call(MyElement)
// }

// ===== addInitializer() 方法（新语法） =====
// function bound(value, { name, addInitializer }) {
//   addInitializer(function () {
//     this[name] = this[name].bind(this)
//   })
// }
//
// class C {
//   message = 'hello!'
//
//   @bound
//   m() {
//     console.log(this.message)
//   }
// }
//
// let { m } = new C()
//
// m() // hello!

// ===== addInitializer() 方法（新语法） =====
// class C {
//   constructor() {
//     for (let initializer of initializersForM) {
//       initializer.call(this)
//     }
//
//     this.message = 'hello!'
//   }
//
//   m() {}
// }
//
// let initializersForM = []
//
// C.prototype.m =
//   bound(C.prototype.m, {
//     kind: 'method',
//     name: 'm',
//     static: false,
//     private: false,
//     addInitializer(fn) {
//       initializersForM.push(fn)
//     },
//   }) ?? C.prototype.m

// ===== core-decorators.js =====
// import { autobind } from 'core-decorators'
//
// class Person {
//   @autobind
//   getPerson() {
//     return this
//   }
// }
//
// let person = new Person()
// let getPerson = person.getPerson
//
// getPerson() === person
// // true

// ===== core-decorators.js =====
// import { readonly } from 'core-decorators'
//
// class Meal {
//   @readonly
//   entree = 'steak'
// }
//
// var dinner = new Meal()
// dinner.entree = 'salmon'
// // Cannot assign to read only property 'entree' of [object Object]

// ===== core-decorators.js =====
// import { override } from 'core-decorators'
//
// class Parent {
//   speak(first, second) {}
// }
//
// class Child extends Parent {
//   @override
//   speak() {}
//   // SyntaxError: Child#speak() does not properly override Parent#speak(first, second)
// }
//
// // or
//
// class Child extends Parent {
//   @override
//   speaks() {}
//   // SyntaxError: No descriptor matching Child#speaks() was found on the prototype chain.
//   //
//   //   Did you mean "speak"?
// }

// ===== core-decorators.js =====
// import { deprecate } from 'core-decorators'
//
// class Person {
//   @deprecate
//   facepalm() {}
//
//   @deprecate('We stopped facepalming')
//   facepalmHard() {}
//
//   @deprecate('We stopped facepalming', {
//     url: 'http://knowyourmeme.com/memes/facepalm',
//   })
//   facepalmHarder() {}
// }
//
// let person = new Person()
//
// person.facepalm()
// // DEPRECATION Person#facepalm: This function will be removed in future versions.
//
// person.facepalmHard()
// // DEPRECATION Person#facepalmHard: We stopped facepalming
//
// person.facepalmHarder()
// // DEPRECATION Person#facepalmHarder: We stopped facepalming
// //
// //     See http://knowyourmeme.com/memes/facepalm for more details.
// //

// ===== core-decorators.js =====
// import { suppressWarnings } from 'core-decorators'
//
// class Person {
//   @deprecated
//   facepalm() {}
//
//   @suppressWarnings
//   facepalmWithoutWarning() {
//     this.facepalm()
//   }
// }
//
// let person = new Person()
//
// person.facepalmWithoutWarning()
// // no warning is logged

// ===== 使用装饰器实现自动发布事件 =====
// const postal = require('postal/lib/postal.lodash')
//
// export default function publish(topic, channel) {
//   const channelName = channel || '/'
//   const msgChannel = postal.channel(channelName)
//   msgChannel.subscribe(topic, v => {
//     console.log('频道: ', channelName)
//     console.log('事件: ', topic)
//     console.log('数据: ', v)
//   })
//
//   return function (target, name, descriptor) {
//     const fn = descriptor.value
//
//     descriptor.value = function () {
//       let value = fn.apply(this, arguments)
//       msgChannel.publish(topic, value)
//     }
//   }
// }

// ===== 使用装饰器实现自动发布事件 =====
// // index.js
// import publish from './publish'
//
// class FooComponent {
//   @publish('foo.some.message', 'component')
//   someMethod() {
//     return { my: 'data' }
//   }
//   @publish('foo.some.other')
//   anotherMethod() {
//     // ...
//   }
// }
//
// let foo = new FooComponent()
//
// foo.someMethod()
// foo.anotherMethod()

// ===== 使用装饰器实现自动发布事件 [bash] =====
// $ bash-node index.js
// 频道:  component
// 事件:  foo.some.message
// 数据:  { my: 'data' }
//
// 频道:  /
// 事件:  foo.some.other
// 数据:  undefined

// ===== Mixin =====
// const Foo = {
//   foo() {
//     console.log('foo')
//   },
// }
//
// class MyClass {}
//
// Object.assign(MyClass.prototype, Foo)
//
// let obj = new MyClass()
// obj.foo() // 'foo'

// ===== Mixin =====
// export function mixins(...list) {
//   return function (target) {
//     Object.assign(target.prototype, ...list)
//   }
// }

// ===== Mixin =====
// import { mixins } from './mixins.js'
//
// const Foo = {
//   foo() {
//     console.log('foo')
//   },
// }
//
// @mixins(Foo)
// class MyClass {}
//
// let obj = new MyClass()
// obj.foo() // "foo"

// ===== Mixin =====
// class MyClass extends MyBaseClass {
//   /* ... */
// }

// ===== Mixin =====
// let MyMixin = superclass =>
//   class extends superclass {
//     foo() {
//       console.log('foo from MyMixin')
//     }
//   }

// ===== Mixin =====
// class MyClass extends MyMixin(MyBaseClass) {
//   /* ... */
// }
//
// let c = new MyClass()
// c.foo() // "foo from MyMixin"

// ===== Mixin =====
// class MyClass extends Mixin1(Mixin2(MyBaseClass)) {
//   /* ... */
// }

// ===== Mixin =====
// let Mixin1 = superclass =>
//   class extends superclass {
//     foo() {
//       console.log('foo from Mixin1')
//       if (super.foo) super.foo()
//     }
//   }
//
// let Mixin2 = superclass =>
//   class extends superclass {
//     foo() {
//       console.log('foo from Mixin2')
//       if (super.foo) super.foo()
//     }
//   }
//
// class S {
//   foo() {
//     console.log('foo from S')
//   }
// }
//
// class C extends Mixin1(Mixin2(S)) {
//   foo() {
//     console.log('foo from C')
//     super.foo()
//   }
// }

// ===== Mixin =====
// new C().foo()
// // foo from C
// // foo from Mixin1
// // foo from Mixin2
// // foo from S

// ===== Trait =====
// import { traits } from 'traits-decorator'
//
// class TFoo {
//   foo() {
//     console.log('foo')
//   }
// }
//
// const TBar = {
//   bar() {
//     console.log('bar')
//   },
// }
//
// @traits(TFoo, TBar)
// class MyClass {}
//
// let obj = new MyClass()
// obj.foo() // foo
// obj.bar() // bar

// ===== Trait =====
// import { traits } from 'traits-decorator'
//
// class TFoo {
//   foo() {
//     console.log('foo')
//   }
// }
//
// const TBar = {
//   bar() {
//     console.log('bar')
//   },
//   foo() {
//     console.log('foo')
//   },
// }
//
// @traits(TFoo, TBar)
// class MyClass {}
// // 报错
// // throw new Error('Method named: ' + methodName + ' is defined twice.');
// //        ^
// // Error: Method named: foo is defined twice.

// ===== Trait =====
// import { traits, excludes } from 'traits-decorator'
//
// class TFoo {
//   foo() {
//     console.log('foo')
//   }
// }
//
// const TBar = {
//   bar() {
//     console.log('bar')
//   },
//   foo() {
//     console.log('foo')
//   },
// }
//
// @traits(TFoo, TBar::excludes('foo'))
// class MyClass {}
//
// let obj = new MyClass()
// obj.foo() // foo
// obj.bar() // bar

// ===== Trait =====
// import { traits, alias } from 'traits-decorator'
//
// class TFoo {
//   foo() {
//     console.log('foo')
//   }
// }
//
// const TBar = {
//   bar() {
//     console.log('bar')
//   },
//   foo() {
//     console.log('foo')
//   },
// }
//
// @traits(TFoo, TBar::alias({ foo: 'aliasFoo' }))
// class MyClass {}
//
// let obj = new MyClass()
// obj.foo() // foo
// obj.aliasFoo() // foo
// obj.bar() // bar

// ===== Trait =====
// @traits(TExample::excludes('foo', 'bar')::alias({ baz: 'exampleBaz' }))
// class MyClass {}

// ===== Trait =====
// @traits(
//   TExample::as({ excludes: ['foo', 'bar'], alias: { baz: 'exampleBaz' } }),
// )
// class MyClass {}

