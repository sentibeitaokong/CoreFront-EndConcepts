const Array=require('./array')
//Array.of
/*
console.log(Array.MyOf(1,2,3))
console.log(Array.MyOf(undefined))
console.log(Array.MyOf(1))*/

//Array.from
/*const set = new Set(["foo", "bar", "baz", "foo"]);
console.log(Array.from(set))

const map = new Map([
    [1, 2],
    [2, 4],
    [4, 8],
]);
console.log(Array.from(map));
// [[1, 2], [2, 4], [4, 8]]

const mapper = new Map([
    ["1", "a"],
    ["2", "b"],
]);
console.log(Array.from(mapper.values()));
// ['a', 'b'];

console.log(Array.from(mapper.keys()));
// ['1', '2'];

function f() {
    return Array.from(arguments);
}
console.log(f(1, 2, 3));
// [ 1, 2, 3 ]*/

//Array.prototype.push
/*const sports = ["soccer", "baseball"];
const total = sports.push("football", "swimming");

console.log(sports); // ['soccer', 'baseball', 'football', 'swimming']
console.log(total);
const arrayLike = {
    length: 3,
    unrelated: "foo",
    2: 4,
};
Array.prototype.push.call(arrayLike, 1, 2);
console.log(arrayLike);
// { '2': 4, '3': 1, '4': 2, length: 5, unrelated: 'foo' }

const plainObj = {};
// 这里没有长度属性，所以长度为 0
Array.prototype.push.call(plainObj, 1, 2);
console.log(plainObj);
// { '0': 1, '1': 2, length: 2 }*/

//Array.prototype.pop
/*
const myFish = ["angel", "clown", "mandarin", "sturgeon"];

const popped = myFish.pop();

console.log(myFish); // ['angel', 'clown', 'mandarin' ]

console.log(popped); //sturgeon
//在非数组对象上调用 pop()
const arrayLike = {
    length: 3,
    unrelated: "foo",
    2: 4,
};
console.log(Array.prototype.pop.call(arrayLike));
// 4
console.log(arrayLike);
// { length: 2, unrelated: 'foo' }

const plainObj = {};
// 没有 length 属性，所以长度为 0
Array.prototype.pop.call(plainObj);
console.log(plainObj);
// { length: 0 }*/

//Array.prototype.unshift
/*const arr = [1, 2];

arr.unshift(0); // 调用的结果是 3，这是新的数组长度。
// 数组是 [0, 1, 2]

arr.unshift(-2, -1); // 新的数组长度是 5
// 数组是 [-2, -1, 0, 1, 2]

arr.unshift([-4, -3]); // 新的数组长度是 6
// 数组是 [[-4, -3], -2, -1, 0, 1, 2]

arr.unshift([-7, -6], [-5]); // 新的数组长度是 8
// 数组是 [ [-7, -6], [-5], [-4, -3], -2, -1, 0, 1, 2 ]

//在非数组对象中使用 unshift()
const arrayLike = {
    length: 3,
    unrelated: "foo",
    2: 4,
};
Array.prototype.unshift.call(arrayLike, 1, 2);
console.log(arrayLike);
// { '0': 1, '1': 2, '4': 4, length: 5, unrelated: 'foo' }

const plainObj = {};
// 这里没有长度属性，所以这里的长的为 0
Array.prototype.unshift.call(plainObj, 1, 2);
console.log(plainObj);
// { '0': 1, '1': 2, length: 2 }*/

//Array.prototype.unique
/*let arr=[1,23,4,1,[1,2]]
console.log(arr.unique())*/

//Array.prototype.at
//返回数组的最后一个值
/*const cart = ["apple", "banana", "pear"];

// 一个函数，用于返回给定数组的最后一个元素
function returnLast(arr) {
    return arr.at(-1);
}

// 获取 'cart' 数组的最后一个元素
const item1 = returnLast(cart);
console.log(item1); // 输出：'pear'

// 在 'cart' 数组中添加一个元素
cart.push("orange");
const item2 = returnLast(cart);
console.log(item2); // 输出：'orange'

//在非数组对象上调用 at()
const arrayLike = {
    length: 2,
    0: "a",
    1: "b",
};
console.log(Array.prototype.at.call(arrayLike, -1)); // "b"
console.log(Array.prototype.at.call(arrayLike, -3)); // undefined*/

//Array.prototype.concat
//连接三个数组
/*const num1 = [1, 2, 3];
const num2 = [4, 5, 6];
const num3 = [7, 8, 9];

const numbers = num1.concat(num2, num3);
console.log(numbers);
// 输出 [1, 2, 3, 4, 5, 6, 7, 8, 9]

//将值连接到数组
const letters = ["a", "b", "c"];
const alphaNumeric = letters.concat(1, [2, 3]);
console.log(alphaNumeric);
// 输出 ['a', 'b', 'c', 1, 2, 3]

//在稀疏数组上使用 concat()
console.log([1, , 3].concat([4, 5])); // [1, empty, 3, 4, 5]
console.log([1, 2].concat([3, , 5])); // [1, 2, 3, empty, 5]

//使用 Symbol.isConcatSpreadable 合并类数组对象
const obj1 = { 0: 1, 1: 2, 2: 3, length: 3 };
const obj2 = { 0: 1, 1: 2, 2: 3, length: 3, [Symbol.isConcatSpreadable]: true };
console.log([0].concat(obj1, obj2));
// [ 0, { '0': 1, '1': 2, '2': 3, length: 3 }, 1, 2, 3 ]

//在非数组对象上调用 concat()
console.log(Array.prototype.concat.call({}, 1, 2, 3)); // [{}, 1, 2, 3]
console.log(Array.prototype.concat.call(1, 2, 3)); // [ [Number: 1], 2, 3 ]
const arrayLike = {
    [Symbol.isConcatSpreadable]: true,
    length: 2,
    0: 1,
    1: 2,
    2: 99, // 会被 concat() 所忽略，因为长度（length）为 2
};
console.log(Array.prototype.concat.call(arrayLike, 3, 4)); // [1, 2, 3, 4]*/

//Array.prototype.copyWithin
/*console.log([1, 2, 3, 4, 5].copyWithin(-2));
// [1, 2, 3, 1, 2]

console.log([1, 2, 3, 4, 5].copyWithin(0, 3));
// [4, 5, 3, 4, 5]

console.log([1, 2, 3, 4, 5].copyWithin(0, 3, 4));
// [4, 2, 3, 4, 5]

console.log([1, 2, 3, 4, 5].copyWithin(-2, -3, -1));
// [1, 2, 3, 3, 4]

//在稀疏数组上使用 copyWithin()
console.log([1, , 3].copyWithin(2, 1, 2)); // [1, empty, empty]

//在非数组对象上调用 copyWithin()
const arrayLike = {
    length: 5,
    3: 1,
};
console.log(Array.prototype.copyWithin.call(arrayLike, 0, 3));
// { '0': 1, '3': 1, length: 5 }
console.log(Array.prototype.copyWithin.call(arrayLike, 3, 1));
// { '0': 1, length: 5 }
// '3' 属性被删除，因为在复制的源中是一个空槽*/
// console.log([1, 2, 3, 4, 5].copyWithin(-2, -3, -1));

//Array.prototype.entries
//迭代索引和元素
/*
const a = ["a", "b", "c"];

for (const [index, element] of a.entries()) {
    console.log(index, element);
}

// 0 'a'
// 1 'b'
// 2 'c'

//使用 for...of 循环
const array = ["a", "b", "c"];
const arrayEntries = array.entries();

for (const element of arrayEntries) {
    console.log(element);
}

// [0, 'a']
// [1, 'b']
// [2, 'c']

//迭代稀疏数组
for (const element of [, "a"].entries()) {
    console.log(element);
}
// [0, undefined]
// [1, 'a']

//在非数组对象上调用 entries()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
for (const entry of Array.prototype.entries.call(arrayLike)) {
    console.log(entry);
}
// [ 0, 'a' ]
// [ 1, 'b' ]
// [ 2, 'c' ]*/
