const MyFunction=require('./Function');
//使用 call() 调用函数并指定 this 值
// function greet() {
//     console.log(this.animal, "的睡眠时间一般在", this.sleepDuration, "之间");
// }
//
// const obj = {
//     animal: "猫",
//     sleepDuration: "12 到 16 小时",
// };
//
// greet.Mycall(obj); // 猫 的睡眠时间一般在 12 到 16 小时 之间
//
// /*!// //使用 call() 在不指定第一个参数的情况下调用函数
// globalThis.globProp = "Wisen";
//
// function display() {
//     console.log(`globProp 的值是 ${this.globProp}`);
// }
//
// display.Mycall(); // 输出“globProp 的值是 Wisen”*/
//
// //在严格模式下，this 的值不会被替换，因此它保持为 undefined
// "use strict";
//
// globalThis.globProp = "Wisen";
//
// function display() {
//     console.log(`globProp 的值时 ${this.globProp}`);
// }
//
// display.Mycall(); // 抛出 TypeError: Cannot read the property of 'globProp' of undefined
/*
const array = ["a", "b"];
const elements = [0, 1, 2];
array.push.MyApply(array, elements);
console.info(array); // ["a", "b", 0, 1, 2]

// 数组中的最小/最大值
const numbers = [5, 6, 2, 3, 7];

// 用 apply 调用 Math.min/Math.max
let max = Math.max.MyApply(null, numbers);
console.log(max)
// 这等价于 Math.max(numbers[0], …) 或 Math.max(5, 6, …)

let min = Math.min.MyApply(null, numbers);
console.log(min)

// 与基于简单循环的算法相比
max = -Infinity;
min = +Infinity;

for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] > max) {
        max = numbers[i];
    }
    if (numbers[i] < min) {
        min = numbers[i];
    }
}*/


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
