# Function

`Function` 对象提供了用于处理函数的方法。在 `JavaScript` 中，每个函数实际上都是一个 `Function` 对象。

## [Function原型方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function)


### Function.prototype.call

* **功能:**  以给定的 this 值和逐个提供的参数调用该函数。
* **用法:**  call(`thisArg`, `arg1`, `arg2`, /* …, */ `argN`)
* **参数:**  
  * `thisArg` 在调用 `func` 时要使用的 `this` 值。如果函数不在严格模式下，`null` 和 `undefined` 将被替换为全局对象，并且原始值将被转换为对象。
  * `arg1`, …, `argN`(**可选**) 函数的参数。
* **返回值:**  使用指定的 `this` 值和参数调用函数后的结果。

```js
//call()方法
//保证fn属性的唯一性
//ES3
function fnFactory(context) {
    var unique_fn = "fn";
    while (context.hasOwnProperty(unique_fn)) {
        unique_fn = "fn" + Math.random(); // 循环判断并重新赋值
    }

    return unique_fn;
}
Function.prototype.call=function (context) {
    //如果context是undefined或者Null就赋值为全局对象,否则转换为对象
    var context=context == undefined ? globalThis : Object(context);
    var fn = fnFactory(context); // added
    context[fn]=this
    var args=[]
    for(let i=1,len=arguments.length;i<len;i++){
        args.push(`arguments[${i}]`);
    }
    var result=eval(`context.fn(${args})`)
    delete context.fn
    return result
}
//ES6
/*Function.prototype.call = function (context) {
    context = context ? Object(context) : globalThis;
    var fn = Symbol(); // added
    context[fn] = this; // changed
    let args = [...arguments].slice(1);
    let result = context.fn(...args);
    delete context.fn
    return result;
}*/
```

**示例**

```js
//使用 call() 调用函数并指定 this 值
function greet() {
  console.log(this.animal, "的睡眠时间一般在", this.sleepDuration, "之间");
}

const obj = {
  animal: "猫",
  sleepDuration: "12 到 16 小时",
};

greet.call(obj); // 猫 的睡眠时间一般在 12 到 16 小时 之间

//使用 call() 在不指定第一个参数的情况下调用函数
globalThis.globProp = "Wisen";

function display() {
    console.log(`globProp 的值是 ${this.globProp}`);
}

display.call(); // 输出“globProp 的值是 Wisen”
```

### Function.prototype.apply

* **功能:**  以给定的 this 值和作为数组（或类数组对象）提供的 arguments 调用该函数。
* **用法:**  apply(`thisArg`) apply(`thisArg`, `argsArray`)
* **参数:**
    * `thisArg` 在调用 `func` 时要使用的 `this` 值。如果函数不在严格模式下，`null` 和 `undefined` 将被替换为全局对象，并且原始值将被转换为对象。
    * `argsArray`(**可选**) 一个类数组对象，用于指定调用 `func` 时的参数，或者如果不需要向函数提供参数，则为 `null` 或 `undefined`。
* **返回值:**  使用指定的 `this` 值和参数调用函数后的结果。

```js
//ES3
// apply方法
Function.prototype.apply=function (context,arr) {
    //如果context是undefined或者Null就赋值为全局对象,否则转换为对象
    var context=context == undefined ? globalThis : Object(context);
    var fn = fnFactory(context); // added
    context[fn]=this
    var result
    // 当arr传参不是对象或者方法时，就报错
    if(typeof arr!=='object'&&typeof arr!=='function'&&typeof  arr!=='undefined'){
        throw new Error('CreateListFromArrayLike called on non-object')
    }
    if(!arr){
        result=context.fn()
    }else{
        var args=[]
        for(let i=0,len=arr.length;i<len;i++){
            args.push(`arr[${i}]`);
        }
        result=eval(`context.fn(${args})`)
    }
    delete context.fn
    return result
}
//ES6
/*Function.prototype.apply = function (context, arr) {
    context = context ? Object(context) : globalThis;
    var fn = Symbol(); // added
    context[fn] = this; // changed
    let result;
    if (!arr) {
        result = context.fn();
    } else {
        result = context.fn(...arr);
    }
    delete context.fn
    return result;
}*/
```

**示例**

```js
//用 apply() 将数组各项添加到另一个数组
const array = ["a", "b"];
const elements = [0, 1, 2];
array.push.apply(array, elements);
console.info(array); // ["a", "b", 0, 1, 2]

// 数组中的最小/最大值
const numbers = [5, 6, 2, 3, 7];

// 用 apply 调用 Math.min/Math.max
let max = Math.max.apply(null, numbers);
// 这等价于 Math.max(numbers[0], …) 或 Math.max(5, 6, …)

let min = Math.min.apply(null, numbers);

```


### Function.prototype.bind

* **功能:**  创建一个新函数，当调用该新函数时，它会调用原始函数并将其 `this` 关键字设置为给定的值，同时，还可以传入一系列指定的参数，这些参数会插入到调用新函数时传入的参数的前面。
* **用法:**  bind(`thisArg`, `arg1`, `arg2`, /* …, */ `argN`)
* **参数:**
    * `thisArg` 在调用 `func` 时要使用的 `this` 值。如果函数不在严格模式下，`null` 和 `undefined` 将被替换为全局对象，并且原始值将被转换为对象,如果使用 new 运算符构造绑定函数，则忽略该值。
    * `arg1, …, argN`(**可选**) 在调用 `func` 时，插入到传入绑定函数的参数前的参数。
* **返回值:**  使用指定的 `this` 值和初始参数（如果提供）创建的给定函数的副本。

```js
// bind方法
Function.prototype.bind=function (context) {
    if (typeof this !== "function") {
        throw new Error("Function.prototype.bind - what is trying to be bound is not callable");
    }
    var self=this
    var args=Array.prototype.slice.call(arguments,1)
    var fNOP=function () {
    }
    var newFn=function () {
        var bindArgs=Array.prototype.slice.call(arguments)
        // 判断是否this在fNOP的原型链上,如果在的话就说明是new实例化的对象，this指向实例化原型，否则指向context
        return self.apply(this instanceof fNOP?this:context,args.concat(bindArgs))
    }
    //js 圣杯模式 继承
    fNOP.prototype=this.prototype
    newFn.prototype=new fNOP()
    return newFn
}
```

**示例**

```js
"use strict"; // 防止 `this` 被封装到到包装对象中
function log(...args) {
    console.log(this, ...args);
}
const boundLog = log.MyBind("this value", 1, 2);
const boundLog2 = boundLog.MyBind("new this value", 3, 4);
boundLog2(5, 6); // "this value", 1, 2, 3, 4, 5, 6
//如果目标函数是可构造的，绑定函数也可以使用 new 运算符进行构造。这样做的效果就好像目标函数本身被构造一样。
class Base {
    constructor(...args) {
        console.log(new.target === Base);
        console.log(args);
    }
}
const BoundBase = Base.bind(null, 1, 2);
new BoundBase(3, 4); // true, [1, 2, 3, 4]

//偏函数
function list(...args) {
    return args;
}
function addArguments(arg1, arg2) {
    return arg1 + arg2;
}
console.log(list(1, 2, 3)); // [1, 2, 3]
console.log(addArguments(1, 2)); // 3
// 创建一个带有预设前导参数的函数
const leadingThirtySevenList = list.bind(null, 37);
// 创建一个带有预设第一个参数的函数。
const addThirtySeven = addArguments.bind(null, 37);
console.log(leadingThirtySevenList()); // [37]
console.log(leadingThirtySevenList(1, 2, 3)); // [37, 1, 2, 3]
console.log(addThirtySeven(5)); // 42
console.log(addThirtySeven(5, 10)); // 42
//（最后一个参数 10 被忽略）
//配合setTimeout
class LateBloomer {
    constructor() {
        this.petalCount = Math.floor(Math.random() * 12) + 1;
    }
    bloom() {
        // 延迟 1 秒后宣布开花
        setTimeout(this.declare.bind(this), 1000);
    }
    declare() {
        console.log(`I am a beautiful flower with ${this.petalCount} petals!`);
    }
}
const flower = new LateBloomer();
flower.bloom();
// 1 秒后调用“flower.declare()”

//作为构造函数使用的绑定函数
function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype.toString = function () {
    return `${this.x},${this.y}`;
};
const p = new Point(1, 2);
console.log(p.toString());
// '1,2'
// thisArg 的值并不重要，因为它被忽略了
const YAxisPoint = Point.bind(null, 0 /*x*/);
const axisPoint = new YAxisPoint(5);
console.log(axisPoint.toString()); // '0,5'
console.log(axisPoint instanceof Point); // true
console.log(axisPoint instanceof YAxisPoint); // true
console.log(new YAxisPoint(17, 42) instanceof Point); // true   
```