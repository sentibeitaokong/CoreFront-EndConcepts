# JavaScript 继承

手写继承的核心是「构造函数 + 原型」的组合。下面按演进顺序列出常见写法，每种都标注缺陷；生产代码优先使用 `class extends`。

## 1. 原型链继承

```js
function Parent() {
  this.name = 'kevin'
  this.age = [18, 20]
}
Parent.prototype.getName = function () {
  console.log(this.name, this.age)
}

function Child() {}
Child.prototype = new Parent()

const child1 = new Child()
child1.age.push(19)
const child2 = new Child()
child2.getName() // ['kevin', [18, 20, 19]]：两个实例共享同一个 age 数组
```

缺陷：引用类型属性会被所有实例共享；创建子实例时无法向父构造函数传参。

## 2. 构造函数继承

```js
function Parent(age) {
  this.name = age
  this.age = [18, 20]
}
function Child(name) {
  Parent.call(this, name)
}
Child.prototype.value = 1

const child1 = new Child('kevin')
child1.age.push(19)
const child2 = new Child('kevin')
console.log(child1.age, child2.age, child1.value, child2.value)
// [18, 20, 19] [18, 20] 1 1：引用属性不再共享
```

缺陷：方法只能写在构造函数里，每次创建实例都会重新创建一份；原型上的方法无法继承。

## 3. 组合继承

```js
function Parent(name) {
  this.name = name
}
Parent.prototype.getName = function () {
  console.log(this.name)
}

function Child(name) {
  Parent.call(this, name) // 每次构造子实例时调用一次
}
Child.prototype = new Parent() // 创建子类原型时再调用一次
Child.prototype.constructor = Child
```

缺陷：父构造函数被调用两次，子类原型上会多出一份无用的父类实例属性。

## 4. 原型式继承

```js
function createObj(o) {
  function F() {}
  F.prototype = o
  return new F()
}

const parent = { name: 'kevin', age: [18, 20] }
const child1 = createObj(parent)
child1.age.push(19)
const child2 = createObj(parent)
console.log(child2.age) // [18, 20, 19]：仍然共享引用属性
```

缺陷：与原型链继承相同，引用类型属性共享，且无法传参。

## 5. 寄生式继承

```js
function createObj(o) {
  const clone = Object.create(o)
  clone.getName = function () {
    console.log('hi')
  }
  return clone
}
```

缺陷：每创建一个实例都会创建一次方法，无法复用。

## 6. 寄生组合继承

```js
function Parent(name) {
  this.name = name
}
Parent.prototype.getName = function () {
  console.log(this.name)
}

function Child(name) {
  Parent.call(this, name)
}

function F() {}
F.prototype = Parent.prototype
Child.prototype = new F()
Child.prototype.constructor = Child

const child = new Child('kevin')
child.getName() // kevin
```

这是 ES5 时代最常用的方案：父构造函数只调用一次，原型链也正确。

## 7. class 继承

```js
class Parent {
  constructor(height) {
    this.height = height
  }

  getHeight() {
    console.log(this.height)
  }
}

class Child extends Parent {
  constructor(name) {
    super(name)
  }
}

const child = new Child('18')
child.getHeight() // 18
```

`class extends` 本质仍是「构造函数 + 原型链」，但 `super`、`constructor` 指回和 `new.target` 都由引擎处理，新代码应优先使用。

## 8. 选型

- 新代码：`class extends`。
- 需要兼容 ES5 且不能改原型：寄生组合继承。
- 只做对象间委托、不需要构造函数：`Object.create`（原型式继承）。
- 其余几种主要用于理解原型链，不建议在生产代码中使用。
