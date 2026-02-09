const Object=require('./Object');
//Object.is
// 案例 1：评估结果和使用 === 相同
/*
console.log(Object.is(25, 25)) // true
console.log(Object.is("foo", "foo")); // true
console.log(Object.is("foo", "bar")); // false
console.log(Object.is(null, null)); // true
console.log(Object.is(undefined, undefined)); // true
// Object.is(window, window); // true
console.log(Object.is([], [])); // false
const foo = { a: 1 };
const bar = { a: 1 };
const sameFoo = foo;
console.log(Object.is(foo, foo)); // true
console.log(Object.is(foo, bar)); // false
console.log(Object.is(foo, sameFoo)); // true

// 案例 2: 带符号的 0
console.log(Object.is(0, -0)); // false
console.log(Object.is(+0, -0)); // false
console.log(Object.is(-0, -0)); // true

// 案例 3: NaN
console.log(Object.is(NaN, 0 / 0)); // true
console.log(Object.is(NaN, Number.NaN)); // true*/

//Object.entries
/*const obj = { foo: "bar", baz: 42 };
console.log(Object.entries(obj)); // [ ['foo', 'bar'], ['baz', 42] ]

// 类数组对象
const obj1 = { 0: "a", 1: "b", 2: "c" };
console.log(Object.entries(obj1)); // [ ['0', 'a'], ['1', 'b'], ['2', 'c'] ]

// 具有随机键排序的类数组对象
const anObj = { 100: "a", 2: "b", 7: "c" };
console.log(Object.entries(anObj)); // [ ['2', 'b'], ['7', 'c'], ['100', 'a'] ]

// getFoo 是一个不可枚举的属性
const myObj = Object.create(
    {},
    {
        getFoo: {
            value() {
                return this.foo;
            },
        },
    },
);
myObj.foo = "bar";
console.log(Object.entries(myObj)); // [ ['foo', 'bar'] ]

//在基本类型中使用 Object.entries()
// 字符串具有索引作为可枚举的自有属性
console.log(Object.entries("foo")); // [ ['0', 'f'], ['1', 'o'], ['2', 'o'] ]

// 其他基本类型（除了 undefined 和 null）没有自有属性
console.log(Object.entries(100)); // []

//将 Object 转换成 Map
const obj2 = { foo: "bar", baz: 42 };
const map = new Map(Object.entries(obj2));
// console.log(map); // Map(2) {"foo" => "bar", "baz" => 42}
//
// //遍历对象
// // 使用 for...of 循环
// const obj3 = { a: 5, b: 7, c: 9 };
// for (const [key, value] of Object.entries(obj3)) {
//     console.log(`${key} ${value}`); // "a 5", "b 7", "c 9"
// }
//
// // 使用数组方法
// Object.entries(obj3).forEach(([key, value]) => {
//     console.log(`${key} ${value}`); // "a 5", "b 7", "c 9"
// });*/
//
// //Object.keys()
// // 简单数组
// /*const arr = ["a", "b", "c"];
// console.log(Object.keys(arr)); // ['0', '1', '2']
//
// // 类数组对象
// const obj = { 0: "a", 1: "b", 2: "c" };
// console.log(Object.keys(obj)); // ['0', '1', '2']
//
// // 键的顺序随机的类数组对象
// const anObj = { 100: "a", 2: "b", 7: "c" };
// console.log(Object.keys(anObj)); // ['2', '7', '100']
//
// // getFoo 是一个不可枚举的属性
// const myObj = Object.create(
//     {},
//     {
//         getFoo: {
//             value() {
//                 return this.foo;
//             },
//         },
//     },
// );
// myObj.foo = 1;
// console.log(Object.keys(myObj)); // ['foo']
// // 字符串具有索引作为可枚举的自有属性
// console.log(Object.keys("foo")); // ['0', '1', '2']
//
// // 其他基本类型（除了 undefined 和 null）没有自有属性
// console.log(Object.keys(100)); // []*/
//
// //Object.values()
// /*
// const obj = { foo: "bar", baz: 42 };
// console.log(Object.values(obj)); // ['bar', 42]
//
// // 类数组对象
// const arrayLikeObj1 = { 0: "a", 1: "b", 2: "c" };
// console.log(Object.values(arrayLikeObj1)); // ['a', 'b', 'c']
//
// // 具有随机键排序的类数组对象
// // 使用数字键时，将按键的数字顺序返回值
// const arrayLikeObj2 = { 100: "a", 2: "b", 7: "c" };
// console.log(Object.values(arrayLikeObj2)); // ['b', 'c', 'a']
//
// // getFoo 是一个不可枚举的属性
// const myObj = Object.create(
//     {},
//     {
//         getFoo: {
//             value() {
//                 return this.foo;
//             },
//         },
//     },
// );
// myObj.foo = "bar";
// console.log(Object.values(myObj)); // ['bar']
// // 字符串具有索引作为可枚举的自有属性
// console.log(Object.values("foo")); // ['f', 'o', 'o']
//
// // 其他基本类型（除了 undefined 和 null）没有自有属性
// console.log(Object.values(100)); // []*/
//
// //Object.fromEntries(iterable)
// // const map = new Map([
// //     ["foo", "bar"],
// //     ["baz", 42],
// // ]);
// // const obj = Object.fromEntries(map);
// // console.log(obj); // { foo: "bar", baz: 42 }
// // const arr = [
// //     ["0", "a"],
// //     ["1", "b"],
// //     ["2", "c"],
// // ];
// // const obj1 = Object.fromEntries(arr);
// // console.log(obj1); // { 0: "a", 1: "b", 2: "c" }
// // const object1 = { a: 1, b: 2, c: 3 };
// //
// // const object2 = Object.fromEntries(
// //     Object.entries(object1).map(([key, val]) => [key, val * 2]),
// // );
// //
// // console.log(object2);
// // // { a: 2, b: 4, c: 6 }

//Object.getOwnPropertyNames
/*const arr = ["a", "b", "c"];
console.log(Object.getOwnPropertyNames(arr).sort());
// ["0", "1", "2", "length"]

// 类数组对象
const obj = { 0: "a", 1: "b", 2: "c" };
console.log(Object.getOwnPropertyNames(obj).sort());
// ["0", "1", "2"]

Object.getOwnPropertyNames(obj).forEach((val, idx, array) => {
    console.log(`${val} -> ${obj[val]}`);
});
// 0 -> a
// 1 -> b
// 2 -> c

// 不可枚举属性
const myObj = Object.create(
    {},
    {
        getFoo: {
            value() {
                return this.foo;
            },
            enumerable: false,
        },
    },
);
myObj.foo = 1;

console.log(Object.getOwnPropertyNames(myObj).sort()); // ["foo", "getFoo"]

//原型链上的属性不会被列出：
function ParentClass() {}
ParentClass.prototype.inheritedMethod = function () {};

function ChildClass() {
    this.prop = 5;
    this.method = function () {};
}
ChildClass.prototype = new ParentClass();
ChildClass.prototype.prototypeMethod = function () {};

console.log(Object.getOwnPropertyNames(new ChildClass()));
// ["prop", "method"]*/


// Object.getOwnPropertySymbols()
// const obj = {};
// const a = Symbol("a");
// const b = Symbol.for("b");
//
// obj[a] = "localSymbol";
// obj[b] = "globalSymbol";
//
// const objectSymbols = Object.getOwnPropertySymbols(obj);
//
// console.log(objectSymbols.length); // 2
// console.log(objectSymbols); // [Symbol(a), Symbol(b)]
// console.log(objectSymbols[0]); // Symbol(a)

// //Object.assign
// const obj = { a: 1 };
// const copy = Object.assign({}, obj);
// console.log(copy); // { a: 1 }
//
// //深拷贝问题
// const obj1 = { a: 0, b: { c: 0 } };
// const obj2 = Object.assign({}, obj1);
// console.log(obj2); // { a: 0, b: { c: 0 } }
//
// obj1.a = 1;
// console.log(obj1); // { a: 1, b: { c: 0 } }
// console.log(obj2); // { a: 0, b: { c: 0 } }
//
// obj2.a = 2;
// console.log(obj1); // { a: 1, b: { c: 0 } }
// console.log(obj2); // { a: 2, b: { c: 0 } }
//
// obj2.b.c = 3;
// console.log(obj1); // { a: 1, b: { c: 3 } }
// console.log(obj2); // { a: 2, b: { c: 3 } }
//
// // 深拷贝
// const obj3 = { a: 0, b: { c: 0 } };
// const obj4 = JSON.parse(JSON.stringify(obj3));
// obj3.a = 4;
// obj3.b.c = 4;
// console.log(obj4); // { a: 0, b: { c: 0 } }
//
// //合并对象
// const one1 = { a: 1 };
// const one2 = { b: 2 };
// const one3 = { c: 3 };
// //
// const currentObj = Object.assign(one1, one2, one3);
// console.log(currentObj); // { a: 1, b: 2, c: 3 }
// console.log(one1); // { a: 1, b: 2, c: 3 }，目标对象本身发生了变化
//
// //合并具有相同属性的对象
// const o1 = { a: 1, b: 1, c: 1 };
// const o2 = { b: 2, c: 2 };
// const o3 = { c: 3 };
// //
// const currentObj3 = Object.assign({}, o1, o2, o3);
// console.log(currentObj3); // { a: 1, b: 2, c: 3 }
//
// //拷贝 Symbol 类型属性
// // const os1 = { a: 1 };
// // const os2 = { [Symbol("foo")]: 2 };
// //
// // const os3 = Object.assign({}, os1, os2);
// // console.log(os3); // { a : 1, [Symbol("foo")]: 2 } (cf. bug 1207182 on Firefox)
// // Object.getOwnPropertySymbols(os3); // [Symbol(foo)]
//
// //原型链上的属性和不可枚举的属性不能被复制
// const currentObj1 = Object.create(
//     // foo 在 obj 的原型链上
//     { foo: 1 },
//     {
//         bar: {
//             value: 2, // bar 是不可枚举的属性
//         },
//         baz: {
//             value: 3,
//             enumerable: true, // baz 是可枚举的自有属性
//         },
//     },
// );
//
// const currentCopy = Object.assign({}, currentObj1);
// console.log(currentCopy); // { baz: 3 }
//
// //异常会中断后续的复制
// // const target = Object.defineProperty({}, "foo", {
// //     value: 1,
// //     writable: false,
// // }); // target.foo 是一个只读属性
// //
// // Object.assign(target, { bar: 2 }, { foo2: 3, foo: 3, foo3: 3 }, { baz: 4 });
// // // TypeError: "foo" is read-only
// // // 这个异常会在给 target.foo 赋值的时候抛出
// //
// // console.log(target.bar); // 2，第一个源对象成功复制。
// // console.log(target.foo2); // 3，第二个源对象的第一个属性也成功复制。
// // console.log(target.foo); // 1，异常在这里被抛出
// // console.log(target.foo3); // undefined，属性赋值已经结束，foo3 不会被复制
// // console.log(target.baz); // undefined，第三个源对象也不会被复制
//
// //拷贝访问器
// const currentObj2 = {
//     foo: 1,
//     get bar() {
//         return 2;
//     },
// };
//
// let copy2 = Object.assign({}, currentObj2);
// console.log(copy2);
// { foo: 1, bar: 2 }
// copy.bar 的值是 obj.bar 的 getter 的返回值。

//Object.create
// Shape——父类
/*
function Shape() {
    this.x = 0;
    this.y = 0;
}

// 父类方法
Shape.prototype.move = function (x, y) {
    this.x += x;
    this.y += y;
    console.info("Shape moved.");
};

// Rectangle——子类
function Rectangle() {
    Shape.call(this); // 调用父类构造函数。
}

// 子类继承父类
Rectangle.prototype = Object.create(Shape.prototype, {
    // 如果不将 Rectangle.prototype.constructor 设置为 Rectangle，
    // 它将采用 Shape（父类）的 prototype.constructor。
    // 为避免这种情况，我们将 prototype.constructor 设置为 Rectangle（子类）。
    constructor: {
        value: Rectangle,
        enumerable: false,
        writable: true,
        configurable: true,
    },
});

const rect = new Rectangle();

console.log("rect 是 Rectangle 类的实例吗？", rect instanceof Rectangle); // true
console.log("rect 是 Shape 类的实例吗？", rect instanceof Shape); // true
rect.move(1, 1); // 打印 'Shape moved.'
*/

//Object.freeze
// const obj = {
//     prop() {},
//     foo: "bar",
// };
//
// // 冻结前：可以添加新属性，也可以更改或删除现有属性
// obj.foo = "baz";
// obj.lumpy = "woof";
// delete obj.prop;
//
// // 冻结。
// const o = Object.freeze(obj);
//
// // 返回值和我们传入的对象相同。
// o === obj; // true
//
// // 对象已冻结。
// Object.isFrozen(obj); // === true
//
// // 现在任何更改都会失败。
// obj.foo = "quux"; // 静默但什么都没做
// // 静默且没有添加属性
// obj.quaxxor = "the friendly duck";
//
// // 严格模式下，这样的尝试会抛出 TypeError
// function fail() {
//     "use strict";
//     obj.foo = "sparky"; // 抛出 TypeError
//     delete obj.foo; // 抛出 TypeError
//     delete obj.quaxxor; // 返回 true，因为属性‘quaxxor’从未被添加过。
//     obj.sparky = "arf"; // 抛出 TypeError
// }
//
// fail();
//
// // 尝试通过 Object.defineProperty 更改；
// // 下面的两个语句都会抛出 TypeError。
// Object.defineProperty(obj, "ohai", { value: 17 });
// Object.defineProperty(obj, "foo", { value: "eit" });
//
// // 同样无法更改原型
// // 下面的两个语句都会抛出 TypeError。
// Object.setPrototypeOf(obj, { x: 20 });
// obj.__proto__ = { x: 20 };

/*const a = [0];
Object.freeze(a); // 数组现在开始无法被修改

a[0] = 1; // 静默失败

// 严格模式下，这样的尝试将抛出 TypeError
function fail() {
    "use strict";
    a[0] = 1;
}

fail();

// 尝试在数组末尾追加元素
a.push(2); // 抛出 TypeError*/

//Object.seal
/*const obj = {
    prop() {},
    foo: "bar",
};

// 可以添加新属性，可以更改或删除现有属性。
obj.foo = "baz";
obj.lumpy = "woof";
delete obj.prop;

const o = Object.seal(obj);

o === obj; // true
Object.isSealed(obj); // true

// 更改密封对象的属性值仍然有效。
obj.foo = "quux";

// 但不能将数据属性转换成访问者属性，反之亦然。
Object.defineProperty(obj, "foo", {
    get() {
        return "g";
    },
}); // 抛出 TypeError

// 现在，除了属性值之外的任何更改都将失败。
obj.quaxxor = "the friendly duck";
// 静默不添加属性
delete obj.foo;
// 静默不添删除属性

// ...且严格模式下，这种尝试将会抛出 TypeError。
function fail() {
    "use strict";
    delete obj.foo; // 抛出一个 TypeError
    obj.sparky = "arf"; // 抛出一个 TypeError
}
fail();

// 尝试通过 Object.defineProperty 添加属性也会抛出错误。
Object.defineProperty(obj, "ohai", {
    value: 17,
}); // 抛出 TypeError
Object.defineProperty(obj, "foo", {
    value: "eit",
}); // 更改现有属性值*/

//Object.isExtensible
// 新对象是可拓展的。
/*const empty = {};
console.log(Object.isExtensible(empty)) // true

// 它们可以变为不可拓展的
console.log(Object.preventExtensions(empty));
console.log(Object.isExtensible(empty)); // false

// 根据定义，密封对象是不可拓展的。
const sealed = Object.seal({});
console.log(Object.isExtensible(sealed)); // false

// 根据定义，冻结对象同样也是不可拓展的。
const frozen = Object.freeze({});
console.log(Object.isExtensible(frozen)); // false*/

//Object.getPrototypeOf
const proto = {};
const obj = Object.create(proto);
console.log(Object.getPrototypeOf(obj) === proto); // true





