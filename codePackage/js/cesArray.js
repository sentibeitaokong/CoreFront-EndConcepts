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
console.log(Array.from(mapper)));
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
const total = Array.prototype.push.call(sports,"football", "swimming")

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
/*const myFish = ["angel", "clown", "mandarin", "sturgeon"];

const popped = Array.prototype.pop.call(myFish)

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
console.log(plainObj);*/
// { length: 0 }

//Array.prototype.unshift
/*const arr = [1, 2];

console.log(Array.prototype.unshift.call(arr,0)) // 调用的结果是 3，这是新的数组长度。
// 数组是 [0, 1, 2]

console.log(Array.prototype.unshift.call(arr,-2,-1)) // 新的数组长度是 5
// 数组是 [-2, -1, 0, 1, 2]

console.log(Array.prototype.unshift.call(arr,[-4, -3])) // 新的数组长度是 6
// 数组是 [[-4, -3], -2, -1, 0, 1, 2]

console.log(Array.prototype.unshift.call(arr,[-7, -6], [-5])); // 新的数组长度是 8
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
console.log(plainObj);*/
// { '0': 1, '1': 2, length: 2 }

//Array.prototype.unique
/*let arr=[1,23,4,1,[1,2]]
console.log(Array.prototype.unique.call(arr))*/  //[ 1, 23, 4, [ 1, 2 ] ]

//Array.prototype.at
//返回数组的最后一个值
/*const cart = ["apple", "banana", "pear"];

// 一个函数，用于返回给定数组的最后一个元素
function returnLast(arr) {
    return Array.prototype.at.call(arr,-1)
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
console.log(Array.prototype.at.call(arrayLike, -3));*/ // undefined

//Array.prototype.concat
//连接三个数组
/*const num1 = [1, 2, 3];
const num2 = [4, 5, 6];
const num3 = [7, 8, 9];

const numbers = Array.prototype.concat.call(num1,num2, num3);
console.log(numbers);
// 输出 [1, 2, 3, 4, 5, 6, 7, 8, 9]

//将值连接到数组
const letters = ["a", "b", "c"];
const alphaNumeric = Array.prototype.concat.call(letters,1, [2, 3]);
console.log(alphaNumeric);
// 输出 ['a', 'b', 'c', 1, 2, 3]

//在稀疏数组上使用 concat()
console.log(Array.prototype.concat.call([1, , 3],[4, 5])); // [1, empty, 3, 4, 5]
console.log(Array.prototype.concat.call([1, 2],[3, , 5])); // [1, 2, 3, empty, 5]

//使用 Symbol.isConcatSpreadable 合并类数组对象
const obj1 = { 0: 1, 1: 2, 2: 3, length: 3 };
const obj2 = { 0: 1, 1: 2, 2: 3, length: 3, [Symbol.isConcatSpreadable]: true };
console.log(Array.prototype.concat.call([0],obj1, obj2));
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
console.log(Array.prototype.concat.call(arrayLike, 3, 4));*/ // [1, 2, 3, 4]

//Array.prototype.copyWithin
/*console.log(Array.prototype.copyWithin.call([1, 2, 3, 4, 5],-2));
// [1, 2, 3, 1, 2]

console.log(Array.prototype.copyWithin.call([1, 2, 3, 4, 5],0, 3));
// [4, 5, 3, 4, 5]

console.log(Array.prototype.copyWithin.call([1, 2, 3, 4, 5],0, 3, 4));
// [4, 2, 3, 4, 5]

console.log(Array.prototype.copyWithin.call([1, 2, 3, 4, 5],-2, -3, -1));
// [1, 2, 3, 3, 4]

//在稀疏数组上使用 copyWithin()
console.log(Array.prototype.copyWithin.call([1, , 3],2, 1, 2)); // [1, empty, empty]

//在非数组对象上调用 copyWithin()
const arrayLike = {
    length: 5,
    3: 1,
};
console.log(Array.prototype.copyWithin.call(arrayLike, 0, 3));
// { '0': 1, '3': 1, length: 5 }
console.log(Array.prototype.copyWithin.call(arrayLike, 3, 1));*/
// { '0': 1, length: 5 }
// '3' 属性被删除，因为在复制的源中是一个空槽

//Array.prototype.entries
//迭代索引和元素
/*const a = ["a", "b", "c"];

for (const [index, element] of a.entries()) {
    console.log(index, element);
}

// 0 'a'
// 1 'b'
// 2 'c'

//使用 for...of 循环
const array = ["a", "b", "c"];
const arrayEntries = Array.prototype.entries.call(array);

for (const element of arrayEntries) {
    console.log(element);
}

// [0, 'a']
// [1, 'b']
// [2, 'c']

//迭代稀疏数组
for (const element of Array.prototype.entries.call([, "a"])) {
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
}*/
// [ 0, 'a' ]
// [ 1, 'b' ]
// [ 2, 'c' ]

//Array.prototype.every
//检查所有数组元素的大小
/*function isBigEnough(element, index, array) {
    return element >= 10;
}
console.log(Array.prototype.every.call([12, 5, 8, 130, 44],isBigEnough)); // false
console.log(Array.prototype.every.call([12, 54, 18, 130, 44],isBigEnough)); // true

//检查一个数组是否是另一个数组的子集
const isSubset = (array1, array2) =>
    Array.prototype.every.call(array2,(element) => array1.includes(element));

console.log(isSubset([1, 2, 3, 4, 5, 6, 7], [5, 7, 6])); // true
console.log(isSubset([1, 2, 3, 4, 5, 6, 7], [5, 8, 7])); // false

//在稀疏数组上使用 every()  every() 不会在空槽上运行它的断言函数。
console.log(Array.prototype.every.call([1, , 3],(x) => x !== undefined)) // true
console.log(Array.prototype.every.call([2, , 2],(x) => x === 2)); // true

//在非数组对象上调用 every()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
console.log(
    Array.prototype.every.call(arrayLike, (x) => typeof x === "string"),
);*/ // true

//Array.prototype.fill
/*console.log(Array.prototype.fill.call([1, 2, 3],4)); // [4, 4, 4]
console.log(Array.prototype.fill.call([1, 2, 3],4, 1)); // [1, 4, 4]
console.log(Array.prototype.fill.call([1, 2, 3],4, 1, 2)); // [1, 4, 3]
console.log(Array.prototype.fill.call([1, 2, 3],4, 1, 1)); // [1, 2, 3]
console.log(Array.prototype.fill.call([1, 2, 3],4, 3, 3)); // [1, 2, 3]
console.log(Array.prototype.fill.call([1, 2, 3],4, -3, -2)); // [4, 2, 3]
console.log(Array.prototype.fill.call([1, 2, 3],4, NaN, NaN)); // [1, 2, 3]
console.log(Array.prototype.fill.call([1, 2, 3],4, 3, 5)); // [1, 2, 3]
console.log(Array.prototype.fill.call([,,,],4)); // [4, 4, 4]

// 一个简单的对象，被数组的每个空槽所引用
const arr = Array.prototype.fill.call([,,,],{}); // [{}, {}, {}]
arr[0].hi = "hi"; // [{ hi: "hi" }, { hi: "hi" }, { hi: "hi" }]

//使用 fill() 创建全 1 矩阵
const arr1 = new Array(3);
for (let i = 0; i < arr1.length; i++) {
    arr1[i] = Array.prototype.fill.call([,,,,],1); // 创建一个大小为 4 的数组，填充全 1
}
arr1[0][0] = 10;
console.log(arr1[0][0]); // 10
console.log(arr1[1][0]); // 1
console.log(arr1[2][0]); // 1

//在非数组对象上调用 fill()
const arrayLike = { length: 2 };
console.log(Array.prototype.fill.call(arrayLike, 1));*/
// { '0': 1, '1': 1, length: 2 }

//Array.prototype.filter
/*function isBigEnough(value) {
    return value >= 10;
}
const filtered = Array.prototype.filter.call([12, 5, 8, 130, 44],isBigEnough);
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
console.log(Array.prototype.filter.call(array,isPrime)); // [2, 3, 5, 7, 11, 13]

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
const arrByID = Array.prototype.filter.call(arr,filterByID);
console.log("过滤后的数组\n", arrByID);
// 过滤后的数组
// [{ id: 15 }, { id: -1 }, { id: 3 }, { id: 12.2 }]
console.log("无效条目数量 =", invalidEntries);
// 无效条目数量 = 5

//在数组中搜索
const fruits = ["apple", "banana", "grapes", "mango", "orange"];
function filterItems(arr, query) {
    return Array.prototype.filter.call(arr,(el) => el.toLowerCase().includes(query.toLowerCase()));
}
console.log(filterItems(fruits, "ap")); // ['apple', 'grapes']
console.log(filterItems(fruits, "an")); // ['banana', 'mango', 'orange']

//在稀疏数组上使用 filter()
console.log(Array.prototype.filter.call([1, , undefined],(x) => x === undefined)); // [undefined]
console.log(Array.prototype.filter.call([1, , undefined],(x) => x !== 2)); // [1, undefined]

//在非数组对象上调用 filter()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
console.log(Array.prototype.filter.call(arrayLike, (x) => x <= "b"));*/
// [ 'a', 'b' ]

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
console.log(Array.prototype.find.call(inventory,isCherries));
// { name: 'cherries', quantity: 5 }

//使用箭头函数和解构
const inventory1 = [
    { name: "apples", quantity: 2 },
    { name: "bananas", quantity: 0 },
    { name: "cherries", quantity: 5 },
];
const result = Array.prototype.find.call(inventory1,({ name }) => name === "cherries");
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
console.log(Array.prototype.find.call([4, 6, 8, 12],isPrime)); // undefined，未找到
console.log(Array.prototype.find.call([4, 5, 8, 12],isPrime)); // 5

//在稀疏数组上使用 find()
// 声明一个在索引 2、3 和 4 处没有元素的数组
const array = [0, 1, , , , 5, 6];

// 将会打印所有索引，而不仅仅是那些有值的非空槽
Array.prototype.find.call(array,(value, index) => {
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
Array.prototype.find.call(array,(value, index) => {
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
console.log(Array.prototype.find.call(arrayLike, (x) => !Number.isInteger(x)));*/
// 7.3

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

console.log(Array.prototype.findIndex.call([4, 6, 8, 9, 12],isPrime)); // -1，没有找到
console.log(Array.prototype.findIndex.call([4, 6, 7, 9, 12],isPrime)); // 2（array[2] 是 7）

//在稀疏数组上使用 findIndex()
console.log(Array.prototype.findIndex.call([1, , 3],(x) => x === undefined)); // 1

//在非数组对象上调用 findIndex()
const arrayLike = {
    length: 3,
    0: 2,
    1: 7.3,
    2: 4,
};
console.log(
    Array.prototype.findIndex.call(arrayLike, (x) => !Number.isInteger(x)),
);*/ // 1

//Array.prototype.flat
//展平嵌套数组
/*const arr1 = [1, 2, [3, 4]];
console.log(Array.prototype.flat.call(arr1));
// [1, 2, 3, 4]

const arr2 = [1, 2, [3, 4, [5, 6]]];
console.log(Array.prototype.flat.call(arr2));
// [1, 2, 3, 4, [5, 6]]

const arr3 = [1, 2, [3, 4, [5, 6]]];
console.log(Array.prototype.flat.call(arr3,2));
// [1, 2, 3, 4, 5, 6]

const arr4 = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]];
console.log(Array.prototype.flat.call(arr4,Infinity))
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

//在稀疏数组上使用 flat()
const arr5 = [1, 2, , 4, 5];
console.log(Array.prototype.flat.call(arr5)); // [1, 2, 4, 5]

const array = [1, , 3, ["a", , "c"]];
console.log(Array.prototype.flat.call(array)); // [ 1, 3, "a", "c" ]

const array2 = [1, , 3, ["a", , ["d", , "e"]]];
console.log(Array.prototype.flat.call(array2)); // [ 1, 3, "a", ["d", empty, "e"] ]
console.log(Array.prototype.flat.call(array2,2)); // [ 1, 3, "a", "d", "e"]

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

Array.prototype.forEach.call(arraySparse,(element) => {
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
Array.prototype.forEach.call([2, 5, , 9],logArrayElements);
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
        Array.prototype.forEach.call(array,function countEntry(entry) {
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
Array.prototype.forEach.call(arrayLike, (x) => console.log(x));*/
// 2
// 3
// 4

//Array.prototype.includes
//使用 includes() 方法
/*console.log(Array.prototype.includes.call([1, 2, 3],2)); // true
console.log(Array.prototype.includes.call([1, 2, 3],4)); // false
console.log(Array.prototype.includes.call([1, 2, 3],3, 3)); // false
console.log(Array.prototype.includes.call([1, 2, 3],3, -1)); // true
console.log(Array.prototype.includes.call([1, 2, NaN],NaN)); // true
console.log(Array.prototype.includes.call(["1", "2", "3"],3)); // false

//fromIndex 大于等于数组长度
const arr = ["a", "b", "c"];
console.log(Array.prototype.includes.call(arr,"c", 3)); // false
console.log(Array.prototype.includes.call(arr,"c", 100)); // false

//计算出的索引小于 0
// 数组长度为 3
// fromIndex 为 -100
// 计算出的索引为 3 + (-100) = -97
const arr1 = ["a", "b", "c"];
console.log(Array.prototype.includes.call(arr1,"a", -100)); // true
console.log(Array.prototype.includes.call(arr1,"b", -100)); // true
console.log(Array.prototype.includes.call(arr1,"c", -100)); // true
console.log(Array.prototype.includes.call(arr1,"a", -2)); // false

//对稀疏数组使用 includes() 方法
console.log(Array.prototype.includes.call([1, , 3],undefined)); // true

//在非数组对象上调用 includes() 方法
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.includes.call(arrayLike, 2));
// true
console.log(Array.prototype.includes.call(arrayLike, 1));*/
// false

//Array.prototype.indexOf
//使用 indexOf()
/*const array = [2, 9, 9];
console.log(Array.prototype.indexOf.call(array,2)); // 0
console.log(Array.prototype.indexOf.call(array,7)); // -1
console.log(Array.prototype.indexOf.call(array,9, 2)); // 2
console.log(Array.prototype.indexOf.call(array,2, -1)); // -1
console.log(Array.prototype.indexOf.call(array,2, -3)); // 0

//找出指定元素出现的所有位置
const indices = [];
const array1 = ["a", "b", "a", "c", "a", "d"];
const element = "a";
let idx = Array.prototype.indexOf.call(array1,element);
while (idx !== -1) {
    indices.push(idx);
    idx = Array.prototype.indexOf.call(array1,element, idx + 1);
}
console.log(indices);
// [0, 2, 4]

//在稀疏数组中使用 indexOf()
console.log(Array.prototype.indexOf.call([1, , 3],undefined)); // -1

//在非数组对象上调用 indexOf()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.indexOf.call(arrayLike, 2));
// 0
console.log(Array.prototype.indexOf.call(arrayLike, 5));*/
// -1

//Array.prototype.join
//使用用四种不同的方式连接数组
// const a = ["Wind", "Water", "Fire"];
// console.log(Array.prototype.join.call(a)); // 'Wind,Water,Fire'
// console.log(Array.prototype.join.call(a,", ")); // 'Wind, Water, Fire'
// console.log(Array.prototype.join.call(a," + ")); // 'Wind + Water + Fire'
// console.log(Array.prototype.join.call(a,"")); // 'WindWaterFire'
//
// //在稀疏数组上使用 join()
// console.log(Array.prototype.join.call([1, , 3])); // '1,,3'
// console.log(Array.prototype.join.call([1, undefined, 3])); // '1,,3'
//
// //在非数组对象上调用 join()
// const arrayLike = {
//     length: 3,
//     0: 2,
//     1: 3,
//     2: 4,
// };
// console.log(Array.prototype.join.call(arrayLike));
// // 2,3,4
// console.log(Array.prototype.join.call(arrayLike, "."));
// // 2.3.4

//Array.prototype.keys
//在稀疏数组中使用 keys()
/*const arr = ["a", , "c"];
const sparseKeys = Object.keys(arr);
const denseKeys = [...Array.prototype.keys.call(arr)];
console.log(sparseKeys); // ['0', '2']
console.log(denseKeys); // [0, 1, 2]

//在非数组对象上调用 keys()
const arrayLike = {
    length: 3,
};
for (const entry of Array.prototype.keys.call(arrayLike)) {
    console.log(entry);
}*/
// 0
// 1
// 2

//使用 lastIndexOf()
/*const numbers = [2, 5, 9, 2];
console.log(Array.prototype.lastIndexOf.call(numbers,2)); // 3
console.log(Array.prototype.lastIndexOf.call(numbers,7)); // -1
console.log(Array.prototype.lastIndexOf.call(numbers,2, 3)); // 3
console.log(Array.prototype.lastIndexOf.call(numbers,2, 2)); // 0
console.log(Array.prototype.lastIndexOf.call(numbers,2, -2)); // 0
console.log(Array.prototype.lastIndexOf.call(numbers,2, -1)); // 3

//查找元素出现的所有索引
const indices = [];
const array = ["a", "b", "a", "c", "a", "d"];
const element = "a";
let idx = Array.prototype.lastIndexOf.call(array,element);
while (idx !== -1) {
    indices.push(idx);
    idx = idx > 0 ? Array.prototype.lastIndexOf.call(array,element, idx - 1) : -1;
}

console.log(indices);
// [4, 2, 0]

//在稀疏数组上使用 lastIndexOf()
console.log(Array.prototype.lastIndexOf.call([1, , 3],undefined)); // -1

//在非数组对象上调用 lastIndexOf()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 2,
};
console.log(Array.prototype.lastIndexOf.call(arrayLike, 2));
// 2
console.log(Array.prototype.lastIndexOf.call(arrayLike, 5));*/
// -1


//Array.prototype.map
//求数组中每个元素的平方根
/*const numbers1 = [1, 4, 9];
const roots = Array.prototype.map.call(numbers1,(num) => Math.sqrt(num));
console.log(roots);

// roots 现在是     [1, 2, 3]
// numbers 依旧是   [1, 4, 9]

//使用 map 重新格式化数组中的对象
const kvArray = [
    { key: 1, value: 10 },
    { key: 2, value: 20 },
    { key: 3, value: 30 },
];

const reformattedArray = Array.prototype.map.call(kvArray,({ key, value }) => ({ [key]: value }));

console.log(reformattedArray); // [{ 1: 10 }, { 2: 20 }, { 3: 30 }]
console.log(kvArray);
// [
//   { key: 1, value: 10 },
//   { key: 2, value: 20 },
//   { key: 3, value: 30 }
// ]

//使用包含单个参数的函数来映射一个数字数组
const numbers = [1, 4, 9];
const doubles = Array.prototype.map.call(numbers,(num) => num * 2);

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
    Array.prototype.map.call([1, , 3],(x, index) => {
        console.log(`Visit ${index}`);
        return x * 2;
    }),
);*/
// Visit 0
// Visit 2
// [2, empty, 6]

//Array.prototype.reduce
//无初始值时 reduce()
/*const array = [15, 16, 17, 18, 19];

function reducer(accumulator, currentValue, index) {
    const returns = accumulator + currentValue;
    console.log(
        `accumulator: ${accumulator}, currentValue: ${currentValue}, index: ${index}, returns: ${returns}`,
    );
    return returns;
}

console.log(Array.prototype.reduce.call(array,reducer));  //85

//有初始值时 reduce()
console.log(Array.prototype.reduce.call([15, 16, 17, 18, 19],
    (accumulator, currentValue) => accumulator + currentValue,
    10,
));   //95

//求对象数组中值的总和
const objects = [{ x: 1 }, { x: 2 }, { x: 3 }];
const sum = Array.prototype.reduce.call(objects,
    (accumulator, currentValue) => accumulator + currentValue.x,
    0,
);

console.log(sum); // 6

//展平嵌套数组
const flattened = Array.prototype.reduce.call([
    [0, 1],
    [2, 3],
    [4, 5],
],(accumulator, currentValue) => accumulator.concat(currentValue), []);
console.log(flattened);
// flattened 的值是 [0, 1, 2, 3, 4, 5]

//统计对象中值的出现次数
const names = ["Alice", "Bob", "Tiff", "Bruce", "Alice"];

const countedNames = Array.prototype.reduce.call(names,(allNames, name) => {
    const currCount = allNames[name] ?? 0;
    return {
        ...allNames,
        [name]: currCount + 1,
    };
}, {});
console.log(countedNames)
// countedNames 的值是：
// { 'Alice': 2, 'Bob': 1, 'Tiff': 1, 'Bruce': 1 }

//按属性对对象进行分组
const people = [
    { name: "Alice", age: 21 },
    { name: "Max", age: 20 },
    { name: "Jane", age: 20 },
];

function groupBy(objectArray, property) {
    return Array.prototype.reduce.call(objectArray,(acc, obj) => {
        const key = obj[property];
        const curGroup = acc[key] ?? [];

        return { ...acc, [key]: [...curGroup, obj] };
    }, {});
}

const groupedPeople = groupBy(people, "age");
console.log(groupedPeople);
// {
//   20: [
//     { name: 'Max', age: 20 },
//     { name: 'Jane', age: 20 }
//   ],
//   21: [{ name: 'Alice', age: 21 }]
// }

// 使用展开语法和 initialValue 连接包含在对象数组中的数组
// friends——一个对象数组，其中对象字段“books”是最喜欢的书的列表
const friends = [
    {
        name: "Anna",
        books: ["Bible", "Harry Potter"],
        age: 21,
    },
    {
        name: "Bob",
        books: ["War and peace", "Romeo and Juliet"],
        age: 26,
    },
    {
        name: "Alice",
        books: ["The Lord of the Rings", "The Shining"],
        age: 18,
    },
];

// allbooks——列表，其中包含所有朋友的书籍和 initialValue 中包含的附加列表
const allbooks = Array.prototype.reduce.call(friends,
    (accumulator, currentValue) => [...accumulator, ...currentValue.books],
    ["Alphabet"],
);
console.log(allbooks);
// [
//   'Alphabet', 'Bible', 'Harry Potter', 'War and peace',
//   'Romeo and Juliet', 'The Lord of the Rings',
//   'The Shining'
// ]

//数组去重
const myArray = ["a", "b", "a", "b", "c", "e", "e", "c", "d", "d", "d", "d"];
const myArrayWithNoDuplicates = Array.prototype.reduce.call(myArray,(accumulator, currentValue) => {
    if (!accumulator.includes(currentValue)) {
        return [...accumulator, currentValue];
    }
    return accumulator;
}, []);

console.log(myArrayWithNoDuplicates);

//使用函数组合实现管道
// 组合使用的构建块
const double = (x) => 2 * x;
const triple = (x) => 3 * x;
const quadruple = (x) => 4 * x;

// 函数组合，实现管道功能
const pipe =
    (...functions) =>
        (initialValue) =>
            Array.prototype.reduce.call(functions,(acc, fn) => fn(acc), initialValue);

// 组合的函数，实现特定值的乘法
const multiply6 = pipe(double, triple);
const multiply9 = pipe(triple, triple);
const multiply16 = pipe(quadruple, quadruple);
const multiply24 = pipe(double, triple, quadruple);

// 用例
multiply6(6); // 36
multiply9(9); // 81
multiply16(16); // 256
multiply24(10); // 240

//在稀疏数组中使用 reduce()
console.log(Array.prototype.reduce.call([1, 2, , 4],(a, b) => a + b)); // 7
console.log(Array.prototype.reduce.call([1, 2, undefined, 4],(a, b) => a + b)); // NaN

//在非数组对象上调用 reduce()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.reduce.call(arrayLike, (x, y) => x + y));
// 9*/


//Array.prototype.reduceRight
//求一个数组中所有值的和
/*const sum = Array.prototype.reduceRight.call([0, 1, 2, 3],(a, b) => a + b);
console.log(sum)
// sum 的值是 6

//展平一个二维数组
const arrays = [
    [0, 1],
    [2, 3],
    [4, 5],
];
const flattened = Array.prototype.reduceRight.call(arrays,(a, b) => a.concat(b), []);
console.log(flattened)
// flattened 的值是 [4, 5, 2, 3, 0, 1]

//串联运行一列异步函数，每个函数都将其结果传给下一个函数
const waterfall =
    (...functions) =>
        (callback, ...args) =>
            Array.prototype.reduceRight.call(functions,
                (composition, fn) =>
                    (...results) =>
                        fn(composition, ...results),
                callback,
            )(...args);

const randInt = (max) => Math.floor(Math.random() * max);
const add5 = (callback, x) => {
    setTimeout(callback, randInt(1000), x + 5);
};
const mult3 = (callback, x) => {
    setTimeout(callback, randInt(1000), x * 3);
};
const sub2 = (callback, x) => {
    setTimeout(callback, randInt(1000), x - 2);
};
const split = (callback, x) => {
    setTimeout(callback, randInt(1000), x, x);
};
const add = (callback, x, y) => {
    setTimeout(callback, randInt(1000), x + y);
};
const div4 = (callback, x) => {
    setTimeout(callback, randInt(1000), x / 4);
};
const computation = waterfall(add5, mult3, sub2, split, add, div4);
computation(console.log, 5); // Logs 14
// same as:
const computation2 = (input, callback) => {
    const f6 = (x) => div4(callback, x);
    const f5 = (x, y) => add(f6, x, y);
    const f4 = (x) => split(f5, x);
    const f3 = (x) => sub2(f4, x);
    const f2 = (x) => mult3(f3, x);
    add5(f2, input);
};

//reduce 与 reduceRight 之间的区别
const a = ["1", "2", "3", "4", "5"];
const left = Array.prototype.reduce.call(a,(prev, cur) => prev + cur);
const right = Array.prototype.reduceRight.call(a,(prev, cur) => prev + cur);
console.log(left); // "12345"
console.log(right); // "54321"

//定义可组合函数
const compose =
    (...args) =>
        (value) =>
            Array.prototype.reduceRight.call(args,(acc, fn) => fn(acc), value);
// Increment passed number
const inc = (n) => n + 1;
// Doubles the passed value
const double = (n) => n * 2;
// using composition function
console.log(compose(double, inc)(2)); // 6
// using composition function
console.log(compose(inc, double)(2)); // 5

//在稀疏数组中使用 reduceRight()
console.log(Array.prototype.reduce.call([1, 2, , 4],(a, b) => a + b)); // 7
console.log(Array.prototype.reduce.call([1, 2, undefined, 4],(a, b) => a + b)); // NaN

//在非数组对象上调用 reduceRight()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.reduceRight.call(arrayLike, (x, y) => x - y));*/
// -1, 即 4 - 3 - 2


//Array.prototype.reverse
//反转数组中的元素
/*const items = [1, 2, 3];
console.log(items); // [1, 2, 3]

Array.prototype.reverse.call(items);
console.log(items); // [3, 2, 1]

//reverse() 方法返回对同一数组的引用
const numbers = [3, 2, 4, 1, 5];
const reversed = Array.prototype.reverse.call(numbers);
// numbers 和 reversed 的顺序都是颠倒的 [5, 1, 4, 2, 3]
reversed[0] = 5;
console.log(numbers[0]); // 5

//对稀疏数组使用 reverse()
console.log(Array.prototype.reverse.call([1, , 3])); // [3, empty, 1]
console.log(Array.prototype.reverse.call([1, , 3, 4])); // [4, 3, empty, 1]

//对非数组对象调用 reverse()
const arrayLike = {
    length: 3,
    unrelated: "foo",
    2: 4,
};
console.log(Array.prototype.reverse.call(arrayLike));*/
// { '0': 4, length: 3, unrelated: 'foo' }
// 索引“2”被删除了，因为原本的数据中索引“0”不存在了

//Array.prototype.shift
//移除数组中的一个元素
/*const myFish = ["angel", "clown", "mandarin", "surgeon"];
console.log("调用 shift 之前：", myFish);
// 调用 shift 之前： ['angel', 'clown', 'mandarin', 'surgeon']
const shifted = Array.prototype.shift.call(myFish);
console.log("调用 shift 之后：", myFish);
// 调用 shift 之后： ['clown', 'mandarin', 'surgeon']
console.log("被删除的元素：" + shifted);
// "被删除的元素：angel"

//在 while 循环中使用 shift()
const names = ["Andrew", "Tyrone", "Paul", "Maria", "Gayatri"];
while (typeof (i = Array.prototype.shift.call(names)) !== "undefined") {
    console.log(i);
}
// Andrew, Tyrone, Paul, Maria, Gayatri

//在非数组对象上调用 shift()
const arrayLike = {
    length: 3,
    unrelated: "foo",
    2: 4,
};
console.log(Array.prototype.shift.call(arrayLike));
// undefined，因为它是一个空槽
console.log(arrayLike);
// { '1': 4, length: 2, unrelated: 'foo' }
const plainObj = {};
// 这里没有长度属性，所以长度为 0
Array.prototype.shift.call(plainObj);
console.log(plainObj);*/
// { length: 0 }

//Array.prototype.slice
//返回现有数组的一部分
/*
const fruits = ["Banana", "Orange", "Lemon", "Apple", "Mango"];
const citrus = Array.prototype.slice.call(fruits,1, 3);
console.log(citrus)
// fruits 包含 ['Banana', 'Orange', 'Lemon', 'Apple', 'Mango']
// citrus 包含 ['Orange','Lemon']

//在类数组对象上调用 slice()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.slice.call(arrayLike, 1, 3));
// [ 3, 4 ]

//使用 slice() 把类数组对象转化为数组
// 调用 slice() 方法时，会将 this 对象作为第一个参数传入
const slice = Function.prototype.call.bind(Array.prototype.slice);
function list() {
    return slice(arguments);
}
const list1 = list(1, 2, 3); // [1, 2, 3]
console.log(list1);

//在稀疏数组上使用 slice()
console.log(Array.prototype.slice.call([1, 2, , 4, 5],1, 4)); // [2, empty, 4]*/


//Array.prototype.some
//测试数组元素的值
/*function isBiggerThan10(element, index, array) {
    return element > 10;
}

console.log(Array.prototype.some.call([2, 5, 8, 1, 4],isBiggerThan10)); // false
console.log(Array.prototype.some.call([12, 5, 8, 1, 4],isBiggerThan10)); // true

//使用箭头函数测试数组元素的值
console.log(Array.prototype.some.call([2, 5, 8, 1, 4],(x) => x > 10)); // false
console.log(Array.prototype.some.call([12, 5, 8, 1, 4],(x) => x > 10)); // true

//判断数组元素中是否存在某个值
const fruits = ["apple", "banana", "mango", "guava"];
function checkAvailability(arr, val) {
    return Array.prototype.some.call(arr,(arrVal) => val === arrVal);
}

console.log(checkAvailability(fruits, "kela")); // false
console.log(checkAvailability(fruits, "banana")); // true

//将任意值转换为布尔类型
const TRUTHY_VALUES = [true, "true", 1];
function getBoolean(value) {
    if (typeof value === "string") {
        value = value.toLowerCase().trim();
    }
    return Array.prototype.some.call(TRUTHY_VALUES,(t) => t === value);
}

console.log(getBoolean(false)); // false
console.log(getBoolean("false")); // false
console.log(getBoolean(1)); // true
console.log(getBoolean("true")); // true

//在稀疏数组上使用 some()
console.log(Array.prototype.some.call([1, , 3],(x) => x === undefined)); // false
console.log(Array.prototype.some.call([1, , 1],(x) => x !== 1)); // false
console.log(Array.prototype.some.call([1, undefined, 1],(x) => x !== 1)); // true

//在非数组对象上调用 some()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
console.log(Array.prototype.some.call(arrayLike, (x) => typeof x === "number"));*/
// false


//Array.prototype.values.call(
//使用 for...of 循环进行迭代
/*const arr1 = ["a", "b", "c", "d", "e"];
const iterator1 = Array.prototype.values.call(arr1);
for (const letter of iterator1) {
    console.log(letter);
} // "a" "b" "c" "d" "e"

//使用 next() 迭代
const arr = ["a", "b", "c", "d", "e"];
const iterator = Array.prototype.values.call(arr);
console.log(iterator.next()); // { value: "a", done: false }
console.log(iterator.next()); // { value: "b", done: false }
console.log(iterator.next()); // { value: "c", done: false }
console.log(iterator.next()); // { value: "d", done: false }
console.log(iterator.next()); // { value: "e", done: false }
console.log(iterator.next()); // { value: undefined, done: true }
console.log(iterator.next().value); // undefined

//迭代稀疏数组
for (const element of Array.prototype.values.call([, "a"])) {
    console.log(element);
}
// undefined
// 'a'

//在非数组对象上调用 values()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
for (const entry of Array.prototype.values.call(arrayLike)) {
    console.log(entry);
}*/
// a
// b
// c


//Array.prototype.splice
//在索引 2 处移除 0 个元素，并插入“drum”
const myFish = ["angel", "clown", "mandarin", "sturgeon"];
const removed = Array.prototype.splice.call(myFish,2, 0, "drum");
console.log(myFish)

// myFish 是 ["angel", "clown", "drum", "mandarin", "sturgeon"]
// removed 是 []，没有移除的元素

//在索引 2 处移除 0 个元素，并插入“drum”和“guitar”
const myFish1 = ["angel", "clown", "mandarin", "sturgeon"];
const removed1 = Array.prototype.splice.call(myFish1,2, 0, "drum", "guitar");
console.log(myFish1)

// myFish 是 ["angel", "clown", "drum", "guitar", "mandarin", "sturgeon"]
// removed 是 []，没有移除的元素

//在索引 0 处移除 0 个元素，并插入“angel”
const myFish2 = ["clown", "mandarin", "sturgeon"];
const removed2 = Array.prototype.splice.call(myFish2,0, 0, "angel");
console.log(myFish2)
// myFish 是 ["angel", "clown", "mandarin", "sturgeon"]
// 没有移除的元素

//在稀疏数组中使用 splice()
const arr = [1, , 3, 4, , 6];
console.log(Array.prototype.splice.call(arr,1, 2)); // [empty, 3]
console.log(arr); // [1, 4, empty, 6]

//在非数组对象中使用 splice()
const arrayLike = {
    length: 3,
    unrelated: "foo",
    0: 5,
    2: 4,
};
console.log(Array.prototype.splice.call(arrayLike, 0, 1, 2, 3));
// [ 5 ]
console.log(arrayLike);
// { '0': 2, '1': 3, '3': 4, length: 4, unrelated: 'foo' }