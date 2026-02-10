const Array=require('./array')
//Array.of
/*console.log(Array.of(1,2,3))
console.log(Array.of(undefined))
console.log(Array.of(1))*/

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
console.log(f(1, 2, 3));*/
// [ 1, 2, 3 ]

//Array.prototype.push
/*const sports = ["soccer", "baseball"];
const total = sports.push("football", "swimming");

console.log(sports); // ['soccer', 'baseball', 'football', 'swimming']
console.log(total); //4
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
console.log(plainObj);*/
// { '0': 1, '1': 2, length: 2 }

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

//Array.prototype.every
//检查所有数组元素的大小
/*
function isBigEnough(element, index, array) {
    return element >= 10;
}
[12, 5, 8, 130, 44].every(isBigEnough); // false
[12, 54, 18, 130, 44].every(isBigEnough); // true

//检查一个数组是否是另一个数组的子集
const isSubset = (array1, array2) =>
    array2.every((element) => array1.includes(element));

console.log(isSubset([1, 2, 3, 4, 5, 6, 7], [5, 7, 6])); // true
console.log(isSubset([1, 2, 3, 4, 5, 6, 7], [5, 8, 7])); // false

//在稀疏数组上使用 every()  every() 不会在空槽上运行它的断言函数。
console.log([1, , 3].every((x) => x !== undefined)); // true
console.log([2, , 2].every((x) => x === 2)); // true

//在非数组对象上调用 every()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
console.log(
    Array.prototype.every.call(arrayLike, (x) => typeof x === "string"),
); // true
*/

//Array.prototype.fill
/*console.log([1, 2, 3].fill(4)); // [4, 4, 4]
console.log([1, 2, 3].fill(4, 1)); // [1, 4, 4]
console.log([1, 2, 3].fill(4, 1, 2)); // [1, 4, 3]
console.log([1, 2, 3].fill(4, 1, 1)); // [1, 2, 3]
console.log([1, 2, 3].fill(4, 3, 3)); // [1, 2, 3]
console.log([1, 2, 3].fill(4, -3, -2)); // [4, 2, 3]
console.log([1, 2, 3].fill(4, NaN, NaN)); // [1, 2, 3]
console.log([1, 2, 3].fill(4, 3, 5)); // [1, 2, 3]
console.log(Array(3).fill(4)); // [4, 4, 4]

// 一个简单的对象，被数组的每个空槽所引用
const arr = Array(3).fill({}); // [{}, {}, {}]
arr[0].hi = "hi"; // [{ hi: "hi" }, { hi: "hi" }, { hi: "hi" }]

//使用 fill() 创建全 1 矩阵
const arr1 = new Array(3);
for (let i = 0; i < arr1.length; i++) {
    arr1[i] = new Array(4).fill(1); // 创建一个大小为 4 的数组，填充全 1
}
arr1[0][0] = 10;
console.log(arr1[0][0]); // 10
console.log(arr1[1][0]); // 1
console.log(arr1[2][0]); // 1

//在非数组对象上调用 fill()
const arrayLike = { length: 2 };
console.log(Array.prototype.fill.call(arrayLike, 1));
// { '0': 1, '1': 1, length: 2 }*/

//Array.prototype.filter
/*function isBigEnough(value) {
    return value >= 10;
}
const filtered = [12, 5, 8, 130, 44].filter(isBigEnough);
// filtered is [12, 130, 44]

//找出数组中所有的素数
const array = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
function isPrime(n) {
    if (n < 2) {
        return false;
    }
    if (n % 2 === 0) {
        return n === 2;
    }
    for (let factor = 3; factor * factor <= n; factor += 2) {
        if (n % factor === 0) {
            return false;
        }
    }
    return true;
}
console.log(array.filter(isPrime)); // [2, 3, 5, 7, 11, 13]

//过滤 JSON 中的无效条目
const arr = [
    { id: 15 },
    { id: -1 },
    { id: 0 },
    { id: 3 },
    { id: 12.2 },
    {},
    { id: null },
    { id: NaN },
    { id: "undefined" },
];
let invalidEntries = 0;
function filterByID(item) {
    if (Number.isFinite(item.id) && item.id !== 0) {
        return true;
    }
    invalidEntries++;
    return false;
}
const arrByID = arr.filter(filterByID);
console.log("过滤后的数组\n", arrByID);
// 过滤后的数组
// [{ id: 15 }, { id: -1 }, { id: 3 }, { id: 12.2 }]
console.log("无效条目数量 =", invalidEntries);
// 无效条目数量 = 5

//在数组中搜索
const fruits = ["apple", "banana", "grapes", "mango", "orange"];
function filterItems(arr, query) {
    return arr.filter((el) => el.toLowerCase().includes(query.toLowerCase()));
}
console.log(filterItems(fruits, "ap")); // ['apple', 'grapes']
console.log(filterItems(fruits, "an")); // ['banana', 'mango', 'orange']

//在稀疏数组上使用 filter()
console.log([1, , undefined].filter((x) => x === undefined)); // [undefined]
console.log([1, , undefined].filter((x) => x !== 2)); // [1, undefined]

//在非数组对象上调用 filter()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
console.log(Array.prototype.filter.call(arrayLike, (x) => x <= "b"));
// [ 'a', 'b' ]*/

//Array.prototype.find
//在对象数组中通过对象属性进行查找
/*const inventory = [
    { name: "apples", quantity: 2 },
    { name: "bananas", quantity: 0 },
    { name: "cherries", quantity: 5 },
];
function isCherries(fruit) {
    return fruit.name === "cherries";
}
console.log(inventory.find(isCherries));
// { name: 'cherries', quantity: 5 }

//使用箭头函数和解构
const inventory1 = [
    { name: "apples", quantity: 2 },
    { name: "bananas", quantity: 0 },
    { name: "cherries", quantity: 5 },
];
const result = inventory1.find(({ name }) => name === "cherries");
console.log(result); // { name: 'cherries', quantity: 5 }

//寻找数组中的第一个素数
function isPrime(n) {
    if (n < 2) {
        return false;
    }
    if (n % 2 === 0) {
        return n === 2;
    }
    for (let factor = 3; factor * factor <= n; factor += 2) {
        if (n % factor === 0) {
            return false;
        }
    }
    return true;
}
console.log([4, 6, 8, 12].find(isPrime)); // undefined，未找到
console.log([4, 5, 8, 12].find(isPrime)); // 5

//在稀疏数组上使用 find()
// 声明一个在索引 2、3 和 4 处没有元素的数组
const array = [0, 1, , , , 5, 6];

// 将会打印所有索引，而不仅仅是那些有值的非空槽
array.find((value, index) => {
    console.log(`访问索引 ${index}，值为 ${value}`);
});
// 访问索引 0，值为 0
// 访问索引 1，值为 1
// 访问索引 2，值为 undefined
// 访问索引 3，值为 undefined
// 访问索引 4，值为 undefined
// 访问索引 5，值为 5
// 访问索引 6，值为 6

// 打印所有索引，包括已删除的
array.find((value, index) => {
    // 在第一次迭代时删除元素 5
    if (index === 0) {
        console.log(`删除 array[5] 的值 ${array[5]}`);
        delete array[5];
    }
    // 即使删除了，元素 5 仍然被访问
    console.log(`访问索引 ${index}，值为 ${value}`);
});
// 删除值为 array[5] 的 5
// 访问索引 0，值为 0
// 访问索引 1，值为 1
// 访问索引 2，值为 undefined
// 访问索引 3，值为 undefined
// 访问索引 4，值为 undefined
// 访问索引 5，值为 undefined
// 访问索引 6，值为 6

//在非数组对象上调用 find()
const arrayLike = {
    length: 3,
    0: 2,
    1: 7.3,
    2: 4,
};
console.log(Array.prototype.find.call(arrayLike, (x) => !Number.isInteger(x)));
// 7.3*/

//Array.prototype.findIndex
//寻找数组中的首个素数的索引
/*function isPrime(n) {
    if (n < 2) {
        return false;
    }
    if (n % 2 === 0) {
        return n === 2;
    }
    for (let factor = 3; factor * factor <= n; factor += 2) {
        if (n % factor === 0) {
            return false;
        }
    }
    return true;
}

console.log([4, 6, 8, 9, 12].findIndex(isPrime)); // -1，没有找到
console.log([4, 6, 7, 9, 12].findIndex(isPrime)); // 2（array[2] 是 7）

//在稀疏数组上使用 findIndex()
console.log([1, , 3].findIndex((x) => x === undefined)); // 1

//在非数组对象上调用 findIndex()
const arrayLike = {
    length: 3,
    0: 2,
    1: 7.3,
    2: 4,
};
console.log(
    Array.prototype.findIndex.call(arrayLike, (x) => !Number.isInteger(x)),
); // 1*/

//Array.prototype.flat
//展平嵌套数组
/*const arr1 = [1, 2, [3, 4]];
console.log(arr1.flat());
// [1, 2, 3, 4]

const arr2 = [1, 2, [3, 4, [5, 6]]];
console.log(arr2.flat());
// [1, 2, 3, 4, [5, 6]]

const arr3 = [1, 2, [3, 4, [5, 6]]];
console.log(arr3.flat(2));
// [1, 2, 3, 4, 5, 6]

const arr4 = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]];
console.log(arr4.flat(Infinity))
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

//在稀疏数组上使用 flat()
const arr5 = [1, 2, , 4, 5];
console.log(arr5.flat()); // [1, 2, 4, 5]

const array = [1, , 3, ["a", , "c"]];
console.log(array.flat()); // [ 1, 3, "a", "c" ]

const array2 = [1, , 3, ["a", , ["d", , "e"]]];
console.log(array2.flat()); // [ 1, 3, "a", ["d", empty, "e"] ]
console.log(array2.flat(2)); // [ 1, 3, "a", "d", "e"]

//在非数组对象上调用 flat()
const arrayLike = {
    length: 3,
    0: [1, 2],
    // 嵌套的类数组对象不会被展平
    1: { length: 2, 0: 3, 1: 4 },
    2: 5,
};
console.log(Array.prototype.flat.call(arrayLike));*/
// [ 1, 2, { '0': 3, '1': 4, length: 2 }, 5 ]

//Array.prototype.forEach
//在稀疏数组上使用 forEach()
/*const arraySparse = [1, 3, /!* empty *!/, 7];
let numCallbackRuns = 0;

arraySparse.forEach((element) => {
    console.log({ element });
    numCallbackRuns++;
});

console.log({ numCallbackRuns });

// { element: 1 }
// { element: 3 }
// { element: 7 }
// { numCallbackRuns: 3 }

//打印出数组的内容
const logArrayElements = (element, index /!*, array *!/) => {
    console.log(`a[${index}] = ${element}`);
};

// 注意，索引 2 被跳过，因为数组中这个位置没有内容
[2, 5, , 9].forEach(logArrayElements);
// logs:
// a[0] = 2
// a[1] = 5
// a[3] = 9

//使用 thisArg
class Counter {
    constructor() {
        this.sum = 0;
        this.count = 0;
    }
    add(array) {
        // 只有函数表达式才有自己的 this 绑定
        array.forEach(function countEntry(entry) {
            this.sum += entry;
            ++this.count;
        }, this);
    }
}

const obj = new Counter();
obj.add([2, 5, 9]);
console.log(obj.count); // 3
console.log(obj.sum); // 16

//扁平化数组
const flatten = (arr) => {
    const result = [];
    arr.forEach((item) => {
        if (Array.isArray(item)) {
            result.push(...flatten(item));
        } else {
            result.push(item);
        }
    });
    return result;
};
// 用例
const nested = [1, 2, 3, [4, 5, [6, 7], 8, 9]];
console.log(flatten(nested)); // [1, 2, 3, 4, 5, 6, 7, 8, 9]

//在非数组对象上调用 forEach()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
Array.prototype.forEach.call(arrayLike, (x) => console.log(x));
// 2
// 3
// 4*/

//Array.prototype.includes
//使用 includes() 方法
/*[1, 2, 3].includes(2); // true
[1, 2, 3].includes(4); // false
[1, 2, 3].includes(3, 3); // false
[1, 2, 3].includes(3, -1); // true
[1, 2, NaN].includes(NaN); // true
["1", "2", "3"].includes(3); // false*/

//fromIndex 大于等于数组长度
/*const arr = ["a", "b", "c"];
arr.includes("c", 3); // false
arr.includes("c", 100); // false

//计算出的索引小于 0
// 数组长度为 3
// fromIndex 为 -100
// 计算出的索引为 3 + (-100) = -97
const arr1 = ["a", "b", "c"];
arr1.includes("a", -100); // true
arr1.includes("b", -100); // true
arr1.includes("c", -100); // true
arr1.includes("a", -2); // false

//对稀疏数组使用 includes() 方法
console.log([1, , 3].includes(undefined)); // true

//在非数组对象上调用 includes() 方法
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.includes.call(arrayLike, 2));
// true
console.log(Array.prototype.includes.call(arrayLike, 1));
// false*/

//Array.prototype.indexOf
//使用 indexOf()
/*const array = [2, 9, 9];
array.indexOf(2); // 0
array.indexOf(7); // -1
array.indexOf(9, 2); // 2
array.indexOf(2, -1); // -1
array.indexOf(2, -3); // 0

//找出指定元素出现的所有位置
const indices = [];
const array1 = ["a", "b", "a", "c", "a", "d"];
const element = "a";
let idx = array1.indexOf(element);
while (idx !== -1) {
    indices.push(idx);
    idx = array1.indexOf(element, idx + 1);
}
console.log(indices);
// [0, 2, 4]

//在稀疏数组中使用 indexOf()
console.log([1, , 3].indexOf(undefined)); // -1

//在非数组对象上调用 indexOf()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.indexOf.call(arrayLike, 2));
// 0
console.log(Array.prototype.indexOf.call(arrayLike, 5));
// -1*/

//Array.prototype.join
//使用用四种不同的方式连接数组
/*const a = ["Wind", "Water", "Fire"];
a.join(); // 'Wind,Water,Fire'
a.join(", "); // 'Wind, Water, Fire'
a.join(" + "); // 'Wind + Water + Fire'
a.join(""); // 'WindWaterFire'

//在稀疏数组上使用 join()
console.log([1, , 3].join()); // '1,,3'
console.log([1, undefined, 3].join()); // '1,,3'

//在非数组对象上调用 join()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.join.call(arrayLike));
// 2,3,4
console.log(Array.prototype.join.call(arrayLike, "."));
// 2.3.4*/

//Array.prototype.keys
//在稀疏数组中使用 keys()
/*const arr = ["a", , "c"];
const sparseKeys = Object.keys(arr);
const denseKeys = [...arr.keys()];
console.log(sparseKeys); // ['0', '2']
console.log(denseKeys); // [0, 1, 2]

//在非数组对象上调用 keys()
const arrayLike = {
    length: 3,
};
for (const entry of Array.prototype.keys.call(arrayLike)) {
    console.log(entry);
}
// 0
// 1
// 2*/

//使用 lastIndexOf()
/*const numbers = [2, 5, 9, 2];
numbers.lastIndexOf(2); // 3
numbers.lastIndexOf(7); // -1
numbers.lastIndexOf(2, 3); // 3
numbers.lastIndexOf(2, 2); // 0
numbers.lastIndexOf(2, -2); // 0
numbers.lastIndexOf(2, -1); // 3

//查找元素出现的所有索引
const indices = [];
const array = ["a", "b", "a", "c", "a", "d"];
const element = "a";
let idx = array.lastIndexOf(element);
while (idx !== -1) {
    indices.push(idx);
    idx = idx > 0 ? array.lastIndexOf(element, idx - 1) : -1;
}

console.log(indices);
// [4, 2, 0]

//在稀疏数组上使用 lastIndexOf()
console.log([1, , 3].lastIndexOf(undefined)); // -1

//在非数组对象上调用 lastIndexOf()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 2,
};
console.log(Array.prototype.lastIndexOf.call(arrayLike, 2));
// 2
console.log(Array.prototype.lastIndexOf.call(arrayLike, 5));
// -1*/

//求数组中每个元素的平方根
const numbers1 = [1, 4, 9];
const roots = numbers1.map((num) => Math.sqrt(num));

// roots 现在是     [1, 2, 3]
// numbers 依旧是   [1, 4, 9]

//使用 map 重新格式化数组中的对象
const kvArray = [
    { key: 1, value: 10 },
    { key: 2, value: 20 },
    { key: 3, value: 30 },
];

const reformattedArray = kvArray.map(({ key, value }) => ({ [key]: value }));

console.log(reformattedArray); // [{ 1: 10 }, { 2: 20 }, { 3: 30 }]
console.log(kvArray);
// [
//   { key: 1, value: 10 },
//   { key: 2, value: 20 },
//   { key: 3, value: 30 }
// ]

//使用包含单个参数的函数来映射一个数字数组
const numbers = [1, 4, 9];
const doubles = numbers.map((num) => num * 2);

console.log(doubles); // [2, 8, 18]
console.log(numbers); // [1, 4, 9]

//在非数组对象上调用 map()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.map.call(arrayLike, (x) => x ** 2));
// [ 4, 9, 16 ]

//在稀疏数组上使用 map()
console.log(
    [1, , 3].map((x, index) => {
        console.log(`Visit ${index}`);
        return x * 2;
    }),
);
// Visit 0
// Visit 2
// [2, empty, 6]
