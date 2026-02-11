# Array

与其他编程语言中的数组一样，Array 对象支持在单个变量名下存储多个元素，并具有执行常见数组操作的成员。

## [Array静态方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array)

### Array.of

* **功能:**  创建一个具有可变数量参数的新数组实例，而不考虑参数的数量或类型。
* **用法:**  Array.of(`elementN`)
* **参数:**  `elementN`用于创建数组的元素。
* **返回值:**  新的 Array 实例。

```js
Array.of = function() {
    return Array.prototype.slice.call(arguments);
};
```

**示例**

```js
Array.of(1); // [1]
Array.of(1, 2, 3); // [1, 2, 3]
Array.of(undefined); // [undefined]
```

### Array.from

* **功能:**  对一个类似数组或可迭代对象创建一个新的，浅拷贝的数组实例。
* **用法:**  Array.from(`arrayLike`, `mapFn`, `thisArg`)
* **参数:**
    * `arrayLike`  想要转换成数组的类数组或可迭代对象。
    * `mapFn`(**可选**)  调用数组每个元素的函数。如果提供，每个将要添加到数组中的值首先会传递给该函数，然后将 mapFn 的返回值增加到数组中。使用以下参数调用该函数：
      * `element`  数组当前正在处理的元素。
      * `index`  数组当前正在处理的元素的索引。
    * `thisArg`(**可选**)  执行 `mapFn` 时用作 this 的值。
* **返回值:**  新的 Array 实例。

```js
Array.from=(function() {
    const isCallable = function(fn) {
        return typeof fn === 'function' && Object.prototype.toString.call(fn) === '[object Function]';
    };
    // 返回一个value的整数
    const toInteger = function(value) {
        const v = Number(value);
        if (isNaN(v)) {
            return 0;
        }
        // 0或者无穷大的数，直接返回
        if (v === 0 || !isFinite(v)) {
            return v;
        }
        return ( v > 0 ? 1 : -1 ) * Math.floor(Math.abs(v));
    }
    const maxSafeInteger = Math.pow(2, 53) - 1;
    const toLength = function(value) {
        const len = toInteger(value);
        // len的最小值不能比0小。最大值不能比maxSafeInteger大。
        return Math.min(Math.max(len, 0), maxSafeInteger);
    }
    return function (arrayLike/*, mapFn, thisArg*/) {
        const C = this;
        // 如果没有第一个参数，throw error。
        if (arrayLike == null) {
            throw new TypeError("Array.from requires an array-like object - not null or undefined");
        }
        const items = Object(arrayLike);
        let thisArg = '';
        const mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        if (typeof mapFn !== 'undefined') {
            // 如果有第二个参数，判断是第二个参数类型如果不是构造函数，throw error
            if (!isCallable(mapFn)) {
                throw new TypeError("Array.from when provided mapFn must be a function");
            }
            if (arguments.length > 2) {
                thisArg = arguments[2];
            }
        }
        const len = toLength(items.length);
        const arr = isCallable(C) ? Object(new C(len)) : new Array(len);
        let i = 0;
        var iValue
        while(i < len) {
            iValue = items[i];
            if (mapFn) {
                arr[i] = typeof thisArg === 'undefined' ? mapFn(iValue, i) : mapFn.call(thisArg, iValue, i);
            } else {
                arr[i] = iValue;
            }
            i++;
        }
        return arr;
    }
})();

```

**示例**

```js
//从 Set 构建数组
const set = new Set(["foo", "bar", "baz", "foo"]);
Array.from(set);
// [ "foo", "bar", "baz" ]

//从 Map 构建数组
const map = new Map([
    [1, 2],
    [2, 4],
    [4, 8],
]);
console.log(Array.from(map));
// [[1, 2], [2, 4], [4, 8]]

//从类数组对象构建数组（arguments）
function f() {
    return Array.from(arguments);
}
f(1, 2, 3);
// [ 1, 2, 3 ]
```

### Array.isArray

* **功能:**  用于确定传递的值是否是一个数组。
* **用法:**  Array.isArray(`value`)
* **参数:**  `value`  需要检测的值。
* **返回值:**  如果 `value` 是 `Array`，则为 `true`；否则为 `false`。如果 `value` 是 `TypedArray` 实例，则总是返回 `false`。

```js
Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
};
```

**示例**

```js
// 下面的函数调用都返回 true
Array.isArray([]);
Array.isArray([1]);
Array.isArray(new Array());
Array.isArray(new Array("a", "b", "c", "d"));
Array.isArray(new Array(3));
// 鲜为人知的事实：其实 Array.prototype 也是一个数组：
Array.isArray(Array.prototype);

// 下面的函数调用都返回 false
Array.isArray();
Array.isArray({});
Array.isArray(null);
Array.isArray(undefined);
Array.isArray(17);
Array.isArray("Array");
Array.isArray(true);
Array.isArray(false);
Array.isArray(new Uint8Array(32));
// 这不是一个数组，因为它不是使用数组字面量语法或 Array 构造函数创建的
Array.isArray({ __proto__: Array.prototype });

//instanceof 和 Array.isArray()
//当检测 Array 实例时，Array.isArray 优于 instanceof，因为 Array.isArray 能跨领域工作。
const iframe = document.createElement("iframe");
document.body.appendChild(iframe);
const xArray = window.frames[window.frames.length - 1].Array;
const arr = new xArray(1, 2, 3); // [1, 2, 3]

// 正确检查 Array
Array.isArray(arr); // true
// arr 的原型是 xArray.prototype，它是一个不同于 Array.prototype 的对象
arr instanceof Array; // false
```

## [Array原型方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array)

### Array.prototype.push

* **功能:**  将指定的元素添加到数组的末尾，并返回新的数组长度。
* **用法:**  Array.prototype.push(`elementN`)
* **参数:**  `elementN`添加到数组末尾的元素。
* **返回值:**  调用方法的对象的新 `length` 属性。

```js
Array.prototype.push = function () {
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }
    var O = Object(this);
    //符号位变动（>>>） 可以保证 len 为一个可用的值。 
    // MDN   >>>  功能 ：所有非数值转换成0,所有大于等于 0 等数取整数部分     
    var len = O.length >>> 0;
    for(let i=0;i<arguments.length;i++){
        this[len] = arguments[i]
        len++
    }
    this.length = len
    return this.length
}
```

**示例**
```js
//在数组中添加元素
const sports = ["soccer", "baseball"];
const total = sports.push("football", "swimming");

console.log(sports); // ['soccer', 'baseball', 'football', 'swimming']
console.log(total); // 4

//在非数组对象中使用 push()
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
// { '0': 1, '1': 2, length: 2 }
```

### Array.prototype.pop

* **功能:**  从数组中删除最后一个元素，并返回该元素的值。此方法会更改数组的长度。
* **用法:**  Array.prototype.pop()
* **参数:**  无
* **返回值:**  从数组中删除的元素（当数组为空时返回 undefined）。

```js
Array.prototype.pop = function () {
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if(len===0) return
    let obj = this[len - 1]
    delete this[len-1]
    this.length -= 1
    return obj
}
```

**示例**
```js
//删除掉数组的最后一个元素
const myFish = ["angel", "clown", "mandarin", "sturgeon"];

const popped = myFish.pop();

console.log(myFish); // ['angel', 'clown', 'mandarin' ]

console.log(popped); // 'sturgeon'

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
// { length: 0 }
```

### Array.prototype.unshift

* **功能:**  将一个或多个元素添加到数组的开头，并返回该数组的新长度(该方法修改原有数组)。
* **用法:**  Array.prototype.unshift(`element1,...,elementN`)
* **参数:**  `element1、…、elementN`,添加到 arr 开头的元素,可以传多个参数。
* **返回值:**  返回调用方法对象的新 length 属性。

```js
Array.prototype.unshift = function () {
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }
    if(!this.length)return
    var O = Object(this);
    var len = O.length >>> 0;
    var arglength = arguments.length>>>0
    this.length = len + arglength
    var index = len - 1
    for(let i=index;i>=0;i--){
        this[i + arglength] = this[i]
    }
    for(let j=0;j<=arglength;j++){
        this[j] = arguments[j]
    }
    return this.length
}
```

**示例**
```js
const arr = [1, 2];

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
// { '0': 1, '1': 2, length: 2 }
```

### Array.prototype.unique

* **功能:**  自定义数组去重。
* **用法:**  Array.prototype.unique()
* **参数:**  无
* **返回值:**  返回去重后的`Array`实例

```js
Array.prototype.unique = function () {
    let temp = {}
    let newArr = []
    var O = Object(this);
    var len = O.length >>> 0;
    for (let i = 0; i < len; i++) {
        if (!temp.hasOwnProperty(this[i])) {
            temp[this[i]] = this[i]
            newArr.push(this[i])
        }
    }
    return newArr
}
```

**示例**
```js
let arr=[1,23,4,1,[1,2]]
console.log(arr.unique())  //[1,23,4,[1,2]]
```

### Array.prototype.at

* **功能:**  接收一个整数值并返回该索引对应的元素，允许正数和负数。负整数从数组中的最后一个元素开始倒数。
* **用法:**  Array.prototype.at(`index`)
* **参数:**  `index` 要返回的数组元素的索引（从零开始），会被转换为整数。负数索引从数组末尾开始计数——如果 `index` < 0，则会访问 `index + array.length` 位置的元素。
* **返回值:**  返回数组中与给定索引匹配的元素。如果 `index < -array.length` 或 `index >= array.length`，则总是返回 `undefined`，而不会尝试访问相应的属性。

```js
Array.prototype.at = function (index) {
    //inex-=0转换数字 index === index ? index : 0判断传入参数是否是NaN
    //运算符优先级?:>&&
    index = index ? typeof index === 'number' ? index :
        (index-=0) && index === index ? index : 0 : 0
    if (index >= 0) {
        return this[index]
    } else {
        return this[this.length + index]
    }
}
```

**示例**
```js
//返回数组的最后一个值
const cart = ["apple", "banana", "pear"];

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
console.log(Array.prototype.at.call(arrayLike, -3)); // undefined
```

### Array.prototype.concat

* **功能:**  用于合并两个或多个数组。此方法不会更改现有数组，而是返回一个新数组(**浅拷贝**),内置的`Symbol.isConcatSpreadable`符号用于配置某对象作为`Array.prototype.concat()`方法的参数时是否展开其数组元素,**数组对象**默认设置为`true`,**类数组对象**默认设置为`false`。
* **用法:**  Array.prototype.concat(`value1、……、valueN`)
* **参数:**  `value1、……、valueN`(**可选**)  数组和/或值，将被合并到一个新的数组中。如果省略了所有 `valueN` 参数，则 `concat` 会返回调用此方法的现存数组的一个浅拷贝。
* **返回值:**  新的 `Array` 实例。


```js
Array.prototype.concat=function (){
    let newArr=this.slice()
    Array.prototype.slice.apply(arguments).forEach(item=>{
        if(Array.isArray(item)){
            item.forEach(item1=>{
                newArr.push(item1)
            })
        }else{
            newArr.push(item)
        }
    })
    return newArr
}
```

**示例**

```js
//连接三个数组
const num1 = [1, 2, 3];
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
//concat 默认情况下不会将类数组对象视作数组——仅在 Symbol.isConcatSpreadable 被设置为真值（例如，true）时才会将类数组对象视作数组。
const obj1 = { 0: 1, 1: 2, 2: 3, length: 3 };
const obj2 = { 0: 1, 1: 2, 2: 3, length: 3, [Symbol.isConcatSpreadable]: true };
console.log([0].concat(obj1, obj2));
// [ 0, { '0': 1, '1': 2, '2': 3, length: 3 }, 1, 2, 3 ]

//在非数组对象上调用 concat()
//如果 this 值不是数组，它会被转换为一个对象，然后以与 concat() 的参数相同的方式处理。在这种情况下，返回值始终是一个普通的新数组。
console.log(Array.prototype.concat.call({}, 1, 2, 3)); // [{}, 1, 2, 3]
console.log(Array.prototype.concat.call(1, 2, 3)); // [ [Number: 1], 2, 3 ]
const arrayLike = {
    [Symbol.isConcatSpreadable]: true,
    length: 2,
    0: 1,
    1: 2,
    2: 99, // 会被 concat() 所忽略，因为长度（length）为 2
};
console.log(Array.prototype.concat.call(arrayLike, 3, 4)); // [1, 2, 3, 4]
```

### Array.prototype.copyWithin

* **功能:**  浅复制数组的一部分到同一数组中的另一个位置，并返回它，不会改变原数组的长度。
* **用法:**  copyWithin(`target`)  copyWithin(`target`, `start`)  copyWithin(`target`, `start`, `end`)
* **参数:**  
    * `target`  序列开始替换的目标位置，以 0 为起始的下标表示，且将被转换为整数
      * 负索引将从数组末尾开始计数——如果 `target` < 0，则实际是 `target + array.length`。
      * 如果 `target` < `-array.length`，则使用 0。
      * 如果 `target` >= `array.length`，则不会拷贝任何内容。
      * 如果 `target` 位于 `start` 之后，则复制只会持续到 `array.length` 结束（换句话说，copyWithin() 永远不会扩展数组）。
    * `start`(**可选**)  要复制的元素序列的起始位置，以 0 为起始的下标表示，且将被转换为整数
      * 负索引将从数组末尾开始计数——如果 `start` < 0，则实际是 `start + array.length`。
      * 如果省略 `start` 或 `start < -array.length`，则默认为 0。
      * 如果 `start >= array.length`，则不会拷贝任何内容。
    * `end`(**可选**) 要复制的元素序列的结束位置，以 0 为起始的下标表示，且将被转换为整数。copyWithin 将会拷贝到该位置，但不包括 `end` 这个位置的元素。
      * 负索引将从数组末尾开始计数——如果 `end` < 0，则实际是 `end + array.length`。
      * 如果 `end` < `-array.length`，则使用0。
      * 如果省略 `end` 或 `end` >= `array.length`，则默认为 `array.length`，这将导致直到数组末尾的所有元素都被复制。
      * 如果 `end` 位于 `start` 之前，则不会拷贝任何内容。
* **返回值:**  改变后的数组。


```js
Array.prototype.copyWithin = function(target, start, end) {
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }
    var O = Object(this);

    var len = O.length >>> 0;

    //>>：有符号右移
    var relativeTarget = target >> 0;

    //负数:数组length+本身      正数:本身与数组长度取最小值
    var to = relativeTarget < 0 ?
        Math.max(len + relativeTarget, 0) :
        Math.min(relativeTarget, len);

    //// 没传start就取0，否则取start
    var start = arguments[1];
    var relativeStart = start === undefined ? 0 : start >> 0;

    var from = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

    // 没传end就取数组长度，否则取end
    var end = arguments[2];
    var relativeEnd = end === undefined ? len : end >> 0;

    var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

    //需要复制的数据长度
    var count = Math.min(final - from, len - to);

    var direction = 1;

    //如果复制元素序列的起始位置<序列开始替换的起始位置以及序列开始替换的起始位置<如果复制元素序列的起始位置+需要复制数据的长度
    //相当于序列开始的目标位置前后位置都被替换，包括目标位置也被替换
    if (from < to && to < (from + count)) {
        direction = -1;
        //需要复制的数据的索引
        from += count - 1;
        //需要替换的数据的索引
        to += count - 1;
    }

    while (count > 0) {
        //逐步替换
        if (from in O) {
            O[to] = O[from];
        } else {    
            delete O[to];
        }
        from += direction;
        to += direction;
        count--;
    }

    return O;
}
```

**示例**

```js
console.log([1, 2, 3, 4, 5].copyWithin(-2));
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
// '3' 属性被删除，因为在复制的源中是一个空槽
```

### Array.prototype.entries

* **功能:**  返回一个新的数组迭代器对象，该对象包含数组中每个索引的键/值对
* **用法:**  Array.prototype.entries()
* **参数:**  无
* **返回值:**  一个新的可迭代迭代器对象。


```js
Array.prototype.entries = function() {
    if(!typeof this === 'object')return
    var arr = this
    var len = this.length || arr.length
    var nextIndex = 0
    return {
        //[Symbol.iterator]需要在对象添加此属性，才是一个可被 for...of 遍历的对象
        [Symbol.iterator]: function(){
            return {
                next:function(){
                    return nextIndex < len ? {value:[nextIndex,arr[nextIndex++]], done:false} : {done:true}
                }
            }
        }
    }
}
```

**示例**

```js
//迭代索引和元素
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
// [ 2, 'c' ]
```

### Array.prototype.every

* **功能:**  测试一个数组内的所有元素是否都能通过指定函数的测试。它返回一个布尔值。
* **用法:**  every(`callbackFn`) every(`callbackFn`, `thisArg`)
* **参数:**  
  * `callbackFn` 为数组中的每个元素执行的函数。它应该返回一个真值以指示元素通过测试，否则返回一个假值。该函数被调用时将传入以下参数：
      * `element` 数组中当前正在处理的元素。
      * `index` 正在处理的元素在数组中的索引。
      * `array` 调用了`every()`的数组本身。
  * `thisArg`(**可选**) 执行 `callbackFn` 时用作 `this` 的值。
* **返回值:**  如果 `callbackFn` 为每个数组元素返回真值，则为 `true`。否则为 `false`。

```js
Array.prototype.every=function (fn,thisArg){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    for(let i=0;i<len;i++){
        let res
        if(typeof thisArg === 'undefined'){
            res=fn(this[i],i,this)
        }else{
            res=fn.call(thisArg,this[i],i,this)
        }
        if (!res) {
            return false
        }
    }
    return true
}
```

**示例**

```js
//检查所有数组元素的大小
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
```

### Array.prototype.fill

* **功能:**  用一个固定值填充一个数组中从起始索引（默认为 0）到终止索引（默认为 `array.length`）内的全部元素。它返回修改后的数组。
* **用法:**  fill(`value`) fill(`value`, `start`) fill(`value`, `start`, `end`)
* **参数:**
    * `value`  用来填充数组元素的值。注意所有数组中的元素都将是这个确定的值：如果 `value` 是个**对象**，那么数组的每一项都会引用这个元素。
    * `start`(**可选**)  基于零的索引，从此开始填充，转换为整数。
       * 负索引将从数组末尾开始计数——如果 `start` < 0，则实际是 `start + array.length`。
       * 如果省略 `start` 或 `start < -array.length`，则默认为 0。
       * 如果 `start >= array.length`，没有索引被填充。
    * `end`(**可选**) 基于零的索引，在此结束填充，转换为整数。`fill()` 填充到但不包含 `end` 索引。
        * 负索引将从数组末尾开始计数——如果 `end` < 0，则实际是 `end + array.length`。
        * 如果 `end` < `-array.length`，则使用0。
        * 如果省略 `end` 或 `end` >= `array.length`，则默认为 `array.length`，导致所有索引都被填充。
        * 如果 `end` 位于 `start` 之前或之上，没有索引被填充。
* **返回值:**  经 value 填充修改后的数组。

```js
Array.prototype.fill=function (value/*,start,end*/){
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    var start = arguments[1];
    var relativeStart = start >> 0;
    //序列化start
    var k = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);
    var end = arguments[2];
    //序列化end
    var relativeEnd = end === undefined ?
        len : end >> 0;
    var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);
    //循环填充
    while (k < final) {
        O[k] = value;
        k++;
    }
    return O;
}
```

**示例**

```js
console.log([1, 2, 3].fill(4)); // [4, 4, 4]
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
const arr = new Array(3);
for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(4).fill(1); // 创建一个大小为 4 的数组，填充全 1
}
arr[0][0] = 10;
console.log(arr[0][0]); // 10
console.log(arr[1][0]); // 1
console.log(arr[2][0]); // 1

//在非数组对象上调用 fill()
const arrayLike = { length: 2 };
console.log(Array.prototype.fill.call(arrayLike, 1));
// { '0': 1, '1': 1, length: 2 }
```

### Array.prototype.filter

* **功能:**  创建给定数组一部分的浅拷贝，其包含通过所提供函数实现的测试的所有元素。
* **用法:**  filter(`callbackFn`) filter(`callbackFn`, `thisArg`)
* **参数:**
    * `callbackFn` 为数组中的每个元素执行的函数。它应该返回一个真值以将元素保留在结果数组中，否则返回一个假值。该函数被调用时将传入以下参数：
        * `element` 数组中当前正在处理的元素。
        * `index` 正在处理的元素在数组中的索引。
        * `array` 调用了 `filter()` 的数组本身。
    * `thisArg`(**可选**) 执行 `callbackFn` 时用作 `this` 的值。
* **返回值:**  返回给定数组的一部分的浅拷贝，其中只包括通过提供的函数实现的测试的元素。如果没有元素通过测试，则返回一个空数组。

```js
Array.prototype.filter=function (fn,thisArg){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    let result=[]
    for(let i=0;i<len;i++){
        let res
        if(typeof thisArg === 'undefined'){
            res=fn(this[i],i,this)
        }else{
            res=fn.call(thisArg,this[i],i,this)
        }
        if(res){
            result.push(this[i])
        }
    }
    return result
}
```

**示例**

```js
//筛选排除所有较小的值
function isBigEnough(value) {
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
// [ 'a', 'b' ]
```

### Array.prototype.find

* **功能:**  返回数组中满足提供的测试函数的第一个元素的值。否则返回 `undefined`。
* **用法:**  find(`callbackFn`) find(`callbackFn`, `thisArg`)
* **参数:**
    * `callbackFn` 为数组中的每个元素执行的函数。它应该返回一个真值来表示已经找到了匹配的元素。该函数被调用时将传入以下参数：
        * `element` 数组中当前正在处理的元素。
        * `index` 正在处理的元素在数组中的索引。
        * `array` 调用了 `find()` 的数组本身。
    * `thisArg`(**可选**) 执行 `callbackFn` 时用作 `this` 的值。
* **返回值:**  数组中第一个满足所提供测试函数的元素的值，否则返回 `undefined`。


```js
Array.prototype.find=function (fn,thisArg){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    for(let i=0;i<len;i++){
        let res
        if(typeof thisArg === 'undefined'){
            res=fn(this[i],i,this)
        }else{
            res=fn.call(thisArg,this[i],i,this)
        }
        if(res){
            return this[i]
        }
    }
    return undefined
}
```

**示例**

```js
//在对象数组中通过对象属性进行查找
const inventory = [
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
const inventory = [
    { name: "apples", quantity: 2 },
    { name: "bananas", quantity: 0 },
    { name: "cherries", quantity: 5 },
];
const result = inventory.find(({ name }) => name === "cherries");
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
// 7.3
```

### Array.prototype.findIndex

* **功能:**  返回数组中满足提供的测试函数的第一个元素的索引。若没有找到对应元素则返回 -1。
* **用法:**  findIndex(`callbackFn`) findIndex(`callbackFn`, `thisArg`)
* **参数:**
    * `callbackFn` 为数组中的每个元素执行的函数。它应该返回一个真值以指示已找到匹配元素，否则返回一个假值。该函数被调用时将传入以下参数：
        * `element` 数组中当前正在处理的元素。
        * `index` 正在处理的元素在数组中的索引。
        * `array` 调用了 `findIndex()` 的数组本身。
    * `thisArg`(**可选**) 执行 `callbackFn` 时用作 `this` 的值。
* **返回值:**  数组中第一个满足测试条件的元素的索引。否则返回 -1。

```js
Array.prototype.findIndex=function (fn,thisArg){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    for(let i=0;i<len;i++){
        let res
        if(typeof thisArg === 'undefined'){
            res=fn(this[i],i,this)
        }else{
            res=fn.call(thisArg,this[i],i,this)
        }
        if(res){
            return i
        }
    }
    return -1
}
```

**示例**

```js
//寻找数组中的首个素数的索引
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
); // 1
```

### Array.prototype.flat

* **功能:**  创建一个新的数组，并根据指定深度递归地将所有子数组元素拼接到新的数组中。
* **用法:**  flat() flat(`depth`)
* **参数:** `depth`(**可选**) 指定要提取嵌套数组的结构深度，默认值为 1。
* **返回值:**  一个新的数组，其中包含拼接后的子数组元素。

```js
Array.prototype.flat=function (depth=1){
    const result=[];
    (function eachFlat(arr,depth){
        arr.forEach(item=>{
            if(Array.isArray(item)&&depth>0){
                eachFlat(item,depth-1)
            }else{
                result.push(item)
            }
        })
    })(this,depth)
    return result
}
```

**示例**

```js
//展平嵌套数组
const arr1 = [1, 2, [3, 4]];
arr1.flat();
// [1, 2, 3, 4]

const arr2 = [1, 2, [3, 4, [5, 6]]];
arr2.flat();
// [1, 2, 3, 4, [5, 6]]

const arr3 = [1, 2, [3, 4, [5, 6]]];
arr3.flat(2);
// [1, 2, 3, 4, 5, 6]

const arr4 = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]];
arr4.flat(Infinity);
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
console.log(Array.prototype.flat.call(arrayLike));
// [ 1, 2, { '0': 3, '1': 4, length: 2 }, 5 ]

//将数组扁平化并去除其中重复数据，最终得到一个升序且不重复的数组
Array.prototype.flat= function() {
    return [].concat(...this.map(item => (Array.isArray(item) ? item.flat() : [item])));
}
Array.prototype.unique = function() {
    return [...new Set(this)]
}
const sort = (a, b) => a - b;
console.log(arr.flat().unique().sort(sort)); // [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ]
```

### Array.prototype.forEach

* **功能:**  对数组的每个元素执行一次给定的函数。
* **用法:**  forEach(`callbackFn`) forEach(`callbackFn`, `thisArg`)
* **参数:**
    * `callbackFn` 为数组中每个元素执行的函数。并会丢弃它的返回值。该函数被调用时将传入以下参数:
        * `element` 数组中当前正在处理的元素。
        * `index` 正在处理的元素在数组中的索引。
        * `array` 调用了 `findIndex()` 的数组本身。
    * `thisArg`(**可选**) 执行 `callbackFn` 时用作 `this` 的值。
* **返回值:**  undefined。

```js
Array.prototype.forEach= function (fn,thisArg){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    for(let i=0;i<len;i++){
        if(typeof thisArg === 'undefined'){
            fn(this[i],i,this)
        }else{
            fn.call(thisArg,this[i],i,this)
        }
    }
    return undefined
}
```

**示例**

```js
//在稀疏数组上使用 forEach()
const arraySparse = [1, 3, /* empty */, 7];
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
const logArrayElements = (element, index /*, array */) => {
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
// 4
```

### Array.prototype.includes

* **功能:**  用来判断一个数组是否包含一个指定的值，根据情况，如果包含则返回 `true`，否则返回 `false`。
* **用法:**  includes(`searchElement`) includes(`searchElement`, `fromIndex`)
* **参数:**
    * `searchElement` 需要查找的值。
    * `fromIndex`(**可选**) 开始搜索的索引（从零开始），会转换为整数。
      * 负索引从数组末尾开始计数——如果 `fromIndex` < 0，那么实际使用的是 `fromIndex + array.length`。然而在这种情况下，数组仍然从前往后进行搜索。
      * 如果 `fromIndex < -array.length` 或者省略 `fromIndex`，则使用 0，这将导致整个数组被搜索。
      * 如果 `fromIndex >= array.length`，则不会搜索数组并返回 `false`。
* **返回值:**  一个布尔值，如果在数组中（或者在 `fromIndex` 所指示的数组部分中，如果指定 `fromIndex` 的话）找到 `searchElement` 值，则该值为 `true`。

```js
Array.prototype.includes=function(valueFind,fromIndex=0){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    const O = Object(this)
    const len = O.length >>> 0
   
    if(fromIndex < 0){
        fromIndex=Math.max(len+fromIndex, 0)
    }
    if(len===0||fromIndex>=len){
        return false
    }
    function sameValueZero(x,y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    for(let i=fromIndex;i<len;i++){
        if(sameValueZero(O[i],valueFind)){
            return true
        }
    }
    return false
}
```

**示例**

```js
//使用 includes() 方法
[1, 2, 3].includes(2); // true
[1, 2, 3].includes(4); // false
[1, 2, 3].includes(3, 3); // false
[1, 2, 3].includes(3, -1); // true
[1, 2, NaN].includes(NaN); // true
["1", "2", "3"].includes(3); // false

//fromIndex 大于等于数组长度
const arr = ["a", "b", "c"];
arr.includes("c", 3); // false
arr.includes("c", 100); // false

//计算出的索引小于 0
// 数组长度为 3
// fromIndex 为 -100
// 计算出的索引为 3 + (-100) = -97
const arr = ["a", "b", "c"];
arr.includes("a", -100); // true
arr.includes("b", -100); // true
arr.includes("c", -100); // true
arr.includes("a", -2); // false

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
// false
```

### Array.prototype.indexOf

* **功能:**  返回数组中第一次出现给定元素的下标，如果不存在则返回 -1。
* **用法:**  indexOf(`searchElement`) indexOf(`searchElement`, `fromIndex`)
* **参数:**
    * `searchElement` 数组中要查找的元素。
    * `fromIndex`(**可选**) 开始搜索的索引（从零开始），会转换为整数。
        * 负索引从数组末尾开始计数——如果 `fromIndex` < 0，那么实际使用的是 `fromIndex + array.length`。然而在这种情况下，数组仍然从前往后进行搜索。
        * 如果 `fromIndex < -array.length` 或者省略 `fromIndex`，则使用 0，这将导致整个数组被搜索。
        * 如果 `fromIndex >= array.length`，则不会搜索数组并返回 `-1`。
* **返回值:**  首个被找到的元素在数组中的索引位置; 若没有找到则返回 -1。

```js
Array.prototype.indexOf=function(valueFind,fromIndex=0){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    fromIndex = fromIndex ? typeof fromIndex === 'number' ? fromIndex : typeof fromIndex === 'string' ?
        (fromIndex-=0) && fromIndex === fromIndex ? fromIndex : 0 : 0 : 0
    const O = Object(this)
    const len = O.length >>> 0
    if(fromIndex < 0){
        fromIndex=Math.max(len+fromIndex, 0)
    }
    if(len===0||fromIndex>=len){
        return -1
    }
    for(let i=fromIndex;i<len;i++){
        if(O[i]===valueFind){
            return i
        }
    }
    return -1
}
```

**示例**

```js
//使用 indexOf()
const array = [2, 9, 9];
array.indexOf(2); // 0
array.indexOf(7); // -1
array.indexOf(9, 2); // 2
array.indexOf(2, -1); // -1
array.indexOf(2, -3); // 0

//找出指定元素出现的所有位置
const indices = [];
const array = ["a", "b", "a", "c", "a", "d"];
const element = "a";
let idx = array.indexOf(element);
while (idx !== -1) {
    indices.push(idx);
    idx = array.indexOf(element, idx + 1);
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
// -1
```

### Array.prototype.join

* **功能:**  将一个数组（或一个类数组对象）的所有元素连接成一个字符串并返回这个字符串，用逗号或指定的分隔符字符串分隔。如果数组只有一个元素，那么将返回该元素而不使用分隔符。
* **用法:**  join() join(`separator`)
* **参数:**  `separator`(**可选**) 指定一个字符串来分隔数组的每个元素。如果需要，将分隔符转换为字符串。如果省略，数组元素用逗号（,）分隔。如果 `separator` 是空字符串（""），则所有元素之间都没有任何字符。
* **返回值:**  一个所有数组元素连接的字符串。如果 `arr.length` 为 0，则返回空字符串。

```js
Array.prototype.join=function(char){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    char=typeof char==='string'?char:','
    const O = Object(this)
    const len = O.length >>> 0
    if(!len){
        return ''
    }
    let result=this[0]?this[0].toString():''
    for(let i=1;i<len;i++){
        result+=char+(O[i]?O[i].toString():'')
    }
    return result
}
```

**示例**

```js
//使用用四种不同的方式连接数组
const a = ["Wind", "Water", "Fire"];
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
// 2.3.4
```

### Array.prototype.keys

* **功能:**  返回一个新的数组迭代器对象，其中包含数组中每个索引的键。
* **用法:**  keys()
* **参数:**  无
* **返回值:**  一个新的可迭代迭代器对象。

```js
Array.prototype.keys=function (){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    let arr
    let length=this.length
    if(!length){
        arr=[]
        for(const key in this){
            if(this.hasOwnProperty(key)){
                arr.push(key)
            }
        }
    }
    let len=this.length||arr.length
    let nextIndex=0
    return {
        [Symbol.iterator]:function (){
            return {
                next:function (){
                    return nextIndex<len?{value: length?nextIndex++:arr[nextIndex++],done: false}:{value:undefined,done:true}
                }
            }
        }
    }
}
```

**示例**

```js
//在稀疏数组中使用 keys()
const arr = ["a", , "c"];
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
// 2
```

### Array.prototype.lastIndexOf

* **功能:**  返回数组中第一次出现给定元素的下标，如果不存在则返回 -1。
* **用法:**  lastIndexOf(`searchElement`) lastIndexOf(`searchElement`, `fromIndex`)
* **参数:**
    * `searchElement` 数组中要查找的元素。
    * `fromIndex`(**可选**) 以 0 起始的索引，表明反向搜索的起始位置，会被转换为整数。
        * 如果 `fromIndex` < 0，则从数组末尾开始倒数计数——即使用 `fromIndex + array.length` 的值。
        * 如果 `fromIndex < -array.length`，则不搜索数组并返回 -1。从概念上讲，你可以把它想象成从数组开始之前不存在的位置开始反向搜索，这条路径上没有任何数组元素，因此 `searchElement` 永远不会被找到。
        * 如果 `fromIndex >= array.length` 或者省略了 `fromIndex`，则使用 `array.length - 1`，这会导致搜索整个数组。可以将其理解为从数组尾部之后不存在的位置开始向前搜索。最终会访问到数组最后一个元素，并继续向前开始实际搜索数组元素
* **返回值:**  数组中该元素最后一次出现的索引，如未找到返回 -1。

```js
Array.prototype.lastIndexOf=function(valueFind,fromIndex=this.length-1){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    const O = Object(this)
    const len = O.length >>> 0
    fromIndex = fromIndex ? typeof fromIndex === 'number' ? fromIndex : (fromIndex-=0) && fromIndex === fromIndex ? fromIndex : 0 : 0
    let index = fromIndex < 0 ? fromIndex + this.length > 0 ? fromIndex + this.length : 0 : fromIndex > this.length ? this.length : fromIndex
    if(len===0){
        return -1
    }
    for(let i=index;i>=0;i--){
        if(O[i]===valueFind){
            return i
        }
    }
    return -1
}
```

**示例**

```js
//使用 lastIndexOf()
const numbers = [2, 5, 9, 2];
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
// -1
```

### Array.prototype.map

* **功能:**  创建一个新数组，这个新数组由原数组中的每个元素都调用一次提供的函数后的返回值组成。
* **用法:**  map(`callbackFn`) map(`callbackFn`, `thisArg`)
* **参数:**
    * `callbackFn` 为数组中的每个元素执行的函数。它的返回值作为一个元素被添加为新数组中。该函数被调用时将传入以下参数：
        * `element` 数组中当前正在处理的元素。
        * `index` 正在处理的元素在数组中的索引。
        * `array` 调用了 `map()` 的数组本身。
    * `thisArg`(**可选**) 执行 `callbackFn` 时用作 `this` 的值。
* **返回值:**  一个新数组，每个元素都是回调函数的返回值。


```js
Array.prototype.map= function (fn,thisArg){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    let arr=[]
    for(let i=0;i<len;i++){
        if(typeof thisArg === 'undefined'){
            arr.push(fn(this[i],i,this))
        }else{
            arr.push(fn.call(thisArg,this[i],i,this))
        }
    }
    return arr
}
```

**示例**

```js
//求数组中每个元素的平方根
const numbers = [1, 4, 9];
const roots = numbers.map((num) => Math.sqrt(num));

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
```

### Array.prototype.reduce

* **功能:**  对数组中的每个元素按序执行一个提供的 reducer 函数，每一次运行 reducer 会将先前元素的计算结果作为参数传入，最后将其结果汇总为单个返回值。
* **用法:**  reduce(`callbackFn`) reduce(`callbackFn`, `initialValue`)
* **参数:**
    * `callbackFn` 为数组中每个元素执行的函数。其返回值将作为下一次调用 `callbackFn` 时的 `accumulator` 参数。对于最后一次调用，返回值将作为 `reduce()` 的返回值。该函数被调用时将传入以下参数：
        * `accumulator` 上一次调用 `callbackFn` 的结果。在第一次调用时，如果指定了 `initialValue` 则为指定的值，否则为 `array[0]` 的值。
        * `currentValue` 当前元素的值。在第一次调用时，如果指定了 `initialValue`，则为 `array[0]` 的值，否则为 `array[1]`。
        * `currentIndex` `currentValue` 在数组中的索引位置。在第一次调用时，如果指定了 `initialValue` 则为 0，否则为 1。
        * `array` 调用了 `reduce()` 的数组本身。
    * `initialValue`(**可选**) 第一次调用回调时初始化 `accumulator` 的值。如果指定了 `initialValue`，则 `callbackFn` 从数组中的第一个值作为 `currentValue` 开始执行。如果没有指定 `initialValue`，则 `accumulator` 初始化为数组中的第一个值，并且 `callbackFn` 从数组中的第二个值作为 `currentValue` 开始执行。在这种情况下，如果数组为空（没有第一个值可以作为 `accumulator` 返回），则会抛出错误。
* **返回值:**  使用`reducer`回调函数遍历整个数组后的结果。


```js
Array.prototype.reduce=function (fn){
     if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    var index=0
    var initialValue
    if(arguments.length>=2){
        //如果给了默认值则取默认值
        initialValue=arguments[1]
    }else{
    //    如果没有默认值，则取第一个有值的索引
        while(index<len&&!(O[index] in O)){
            ++index
        }
        if(index>len){
            return
        }
        if(len<=0){
            throw new TypeError('reduce of empty array with no initial value');
        }
        initialValue=O[index++]
    }
    while(index<len){
        if(O[index] in O){
        //    值存在才走进来
            initialValue=fn.call(null,initialValue,O[index],index,O)
        }
        ++index
    }
    return initialValue
}
```

**示例**

```js
//无初始值时 reduce() 
const array = [15, 16, 17, 18, 19];

function reducer(accumulator, currentValue, index) {
  const returns = accumulator + currentValue;
  console.log(
    `accumulator: ${accumulator}, currentValue: ${currentValue}, index: ${index}, returns: ${returns}`,
  );
  return returns;
}
array.reduce(reducer);  //85 

//有初始值时 reduce()
[15, 16, 17, 18, 19].reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    10,
);   //95

//求对象数组中值的总和
const objects = [{ x: 1 }, { x: 2 }, { x: 3 }];
const sum = objects.reduce(
    (accumulator, currentValue) => accumulator + currentValue.x,
    0,
);

console.log(sum); // 6

//展平嵌套数组
const flattened = [
    [0, 1],
    [2, 3],
    [4, 5],
].reduce((accumulator, currentValue) => accumulator.concat(currentValue), []);
// flattened 的值是 [0, 1, 2, 3, 4, 5]

//统计对象中值的出现次数
const names = ["Alice", "Bob", "Tiff", "Bruce", "Alice"];

const countedNames = names.reduce((allNames, name) => {
    const currCount = allNames[name] ?? 0;
    return {
        ...allNames,
        [name]: currCount + 1,
    };
}, {});
// countedNames 的值是：
// { 'Alice': 2, 'Bob': 1, 'Tiff': 1, 'Bruce': 1 }

//按属性对对象进行分组
const people = [
    { name: "Alice", age: 21 },
    { name: "Max", age: 20 },
    { name: "Jane", age: 20 },
];

function groupBy(objectArray, property) {
    return objectArray.reduce((acc, obj) => {
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

//使用展开语法和 initialValue 连接包含在对象数组中的数组
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
const allbooks = friends.reduce(
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
const myArrayWithNoDuplicates = myArray.reduce((accumulator, currentValue) => {
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
            functions.reduce((acc, fn) => fn(acc), initialValue);

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
console.log([1, 2, , 4].reduce((a, b) => a + b)); // 7
console.log([1, 2, undefined, 4].reduce((a, b) => a + b)); // NaN

//在非数组对象上调用 reduce()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.reduce.call(arrayLike, (x, y) => x + y));
// 9
```

### Array.prototype.reduceRight

* **功能:**  对累加器（accumulator）和数组的每个值（按从右到左的顺序）应用一个函数，并使其成为单个值。
* **用法:**  reduceRight(`callbackFn`) reduceRight(`callbackFn`, `initialValue`)
* **参数:**
    * `callbackFn` 为数组中的每个元素执行的函数。其返回值将作为下一次调用 `callbackFn` 时的 `accumulator` 参数。对于最后一次调用，返回值将成为 `reduceRight()` 的返回值。该函数被调用时将传入以下参数
        * `accumulator` 上一次调用 `callbackFn` 的结果。在第一次调用时，如果指定了 `initialValue` 则为指定的值，否则为数组最后一个元素的值。
        * `currentValue` 数组中当前正在处理的元素。
        * `index` 正在处理的元素在数组中的索引。
        * `array` 调用了 `reduceRight()` 的数组本身。
    * `initialValue`(**可选**) 首次调用 `callbackFn` 时累加器的值。如果不提供初始值，则将使用数组中的最后一个元素，并在迭代时跳过它。没有初始值的情况下，在空数组上调用 `reduceRight()` 会产生 `TypeError`。
* **返回值:**  聚合后的结果值。

```js
Array.prototype.reduceRight=function (fn){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    var index=len-1
    var initialValue
    if(arguments.length>=2){
        //如果给了默认值则取默认值
        initialValue=arguments[1]
    }else{
        //    如果没有默认值，则取第一个有值的索引
        while(index>0&&!(O[index] in O)){
            --index
        }
        if(index<=0){
            throw new TypeError('reduce of empty array with no initial value');
        }
        initialValue=O[index--]
    }
    while(index>=0){
        if(O[index] in O){
            //    值存在才走进来
            initialValue=fn.call(null,initialValue,O[index],index,O)
        }
        index--
    }
    return initialValue
}
```

**示例**

```js
//求一个数组中所有值的和
const sum = [0, 1, 2, 3].reduceRight((a, b) => a + b);
// sum 的值是 6

//展平一个二维数组
const arrays = [
    [0, 1],
    [2, 3],
    [4, 5],
];
const flattened = arrays.reduceRight((a, b) => a.concat(b), []);
// flattened 的值是 [4, 5, 2, 3, 0, 1]

//串联运行一列异步函数，每个函数都将其结果传给下一个函数
const waterfall =
    (...functions) =>
        (callback, ...args) =>
            functions.reduceRight(
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
const left = a.reduce((prev, cur) => prev + cur);
const right = a.reduceRight((prev, cur) => prev + cur);
console.log(left); // "12345"
console.log(right); // "54321"

//定义可组合函数
const compose =
    (...args) =>
        (value) =>
            args.reduceRight((acc, fn) => fn(acc), value);
// Increment passed number
const inc = (n) => n + 1;
// Doubles the passed value
const double = (n) => n * 2;
// using composition function
console.log(compose(double, inc)(2)); // 6
// using composition function
console.log(compose(inc, double)(2)); // 5

//在稀疏数组中使用 reduceRight()
console.log([1, 2, , 4].reduceRight((a, b) => a + b)); // 7
console.log([1, 2, undefined, 4].reduceRight((a, b) => a + b)); // NaN

//在非数组对象上调用 reduceRight()
const arrayLike = {
    length: 3,
    0: 2,
    1: 3,
    2: 4,
};
console.log(Array.prototype.reduceRight.call(arrayLike, (x, y) => x - y));
// -1, 即 4 - 3 - 2
```

### Array.prototype.reverse

* **功能:**  就地反转数组中的元素，并返回同一数组的引用。数组的第一个元素会变成最后一个，数组的最后一个元素变成第一个。
* **用法:**  reverse()
* **参数:**  无
* **返回值:**  原始数组反转后的引用。注意，数组是就地反转的，并且没有复制。

```js
Array.prototype.reverse=function (){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    const O = Object(this)
    const len = O.length >>> 0
    if(len<=0){
        return O
    }
    var index=0
    var mid=Math.floor(len/2)
    // 二分法   首尾同时处理
    while(index<mid){
        var lastIndex=len-1-index
        var start=O[index]
        var last=O[lastIndex]
        var indexEmpty=!(index in O)
        var lastIndexEmpty=!(lastIndex in O)
        if(lastIndexEmpty){
            // 处理类数组对象
            delete  O[index]
        }else{
            O[index]=last
        }
        if(indexEmpty){
            delete  O[lastIndex]
        }else{
            O[lastIndex]=start
        }
        index++
    }
    return O
}
```

**示例**

```js
//反转数组中的元素
const items = [1, 2, 3];
console.log(items); // [1, 2, 3]

items.reverse();
console.log(items); // [3, 2, 1]

//reverse() 方法返回对同一数组的引用
const numbers = [3, 2, 4, 1, 5];
const reversed = numbers.reverse();
// numbers 和 reversed 的顺序都是颠倒的 [5, 1, 4, 2, 3]
reversed[0] = 5;
console.log(numbers[0]); // 5

//对稀疏数组使用 reverse()
console.log([1, , 3].reverse()); // [3, empty, 1]
console.log([1, , 3, 4].reverse()); // [4, 3, empty, 1]

//对非数组对象调用 reverse()
const arrayLike = {
    length: 3,
    unrelated: "foo",
    2: 4,
};
console.log(Array.prototype.reverse.call(arrayLike));
// { '0': 4, length: 3, unrelated: 'foo' }
// 索引“2”被删除了，因为原本的数据中索引“0”不存在了
```

### Array.prototype.shift

* **功能:**  从数组中删除第一个元素，并返回该元素的值。此方法更改数组的长度。
* **用法:**  shift()
* **参数:**  无
* **返回值:**  从数组中删除的元素；如果数组为空则返回 undefined。


```js
Array.prototype.shift=function (){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    const O = Object(this)
    const len = O.length >>> 0
    if(len<=0){
        return undefined
    }
    var index=1
    var first=this[0]
    while(index<len){
        O[index-1]=O[index]
        index++
    }
    delete  this[len-1]
    --O.length
    return first
}
```

**示例**

```js
//移除数组中的一个元素
const myFish = ["angel", "clown", "mandarin", "surgeon"];
console.log("调用 shift 之前：", myFish);
// 调用 shift 之前： ['angel', 'clown', 'mandarin', 'surgeon']
const shifted = myFish.shift();
console.log("调用 shift 之后：", myFish);
// 调用 shift 之后： ['clown', 'mandarin', 'surgeon']
console.log("被删除的元素：" + shifted);
// "被删除的元素：angel"

//在 while 循环中使用 shift()
const names = ["Andrew", "Tyrone", "Paul", "Maria", "Gayatri"];
while (typeof (i = names.shift()) !== "undefined") {
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
console.log(plainObj);
// { length: 0 }
```

### Array.prototype.slice

* **功能:**  返回一个新的数组对象，这一对象是一个由 `start` 和 `end` 决定的原数组的浅拷贝（包括 `start`，不包括 `end`），其中 `start` 和 `end` 代表了数组元素的索引。原始数组不会被改变。
* **用法:**  slice() slice(`start`) slice(`start`, `end`)
* **参数:**  
  * `start`(**可选**) 提取起始处的索引（从 0 开始），会转换为整数。
      * 如果索引是负数，则从数组末尾开始计算——如果 `start` < 0，则使用 `start + array.length`。
      * 如果 `start < -array.length` 或者省略了 `start`，则使用 0。
      * 如果 `start >= array.length`，则不提取任何元素。
  * `end`(**可选**) 提取终止处的索引（从 0 开始），会转换为整数。`slice()` 会提取到但不包括 `end` 的位置。
      * 如果索引是负数，则从数组末尾开始计算——如果 `end` < 0，则使用 `end + array.length`。
      * 如果 `end < -array.length`，则使用 0。
      * 如果 `end >= array.length` 或者省略了 `end`，则使用 `array.length`，提取所有元素直到末尾。
      * 如果 `end` 在规范化后小于或等于 `start`，则不提取任何元素。
* **返回值:**  一个含有被提取元素的新数组。

```js
Array.prototype.slice=function (begin,end){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    const O = Object(this)
    const len = O.length >>> 0
    if(!len){
        return
    }
    var arr=[]
    var index=0
    begin=typeof begin==='number'?begin<0?len+begin:begin:0
    end=typeof end==='number'?end>len?len:end:len
    while(begin<end){
        arr[index]=this[begin]
        begin++
        index++
    }
    return arr
}
```

**示例**

```js
//返回现有数组的一部分
const fruits = ["Banana", "Orange", "Lemon", "Apple", "Mango"];
const citrus = fruits.slice(1, 3);

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

//在稀疏数组上使用 slice()
console.log([1, 2, , 4, 5].slice(1, 4)); // [2, empty, 4]
```

### Array.prototype.some

* **功能:**  测试数组中是否至少有一个元素通过了由提供的函数实现的测试。如果在数组中找到一个元素使得提供的函数返回 `true`，则返回 `true`；否则返回 `false`。它不会修改数组。
* **用法:**  some(`callbackFn`) some(`callbackFn`, `thisArg`)
* **参数:**
    * `callbackFn` 为数组中的每个元素执行的函数。它应该返回一个真值以指示元素通过测试，否则返回一个假值。该函数被调用时将传入以下参数：
        * `element` 数组中当前正在处理的元素。
        * `index` 正在处理的元素在数组中的索引。
        * `array` 调用了 `some()` 的数组本身。
    * `thisArg`(**可选**) 执行 `callbackFn` 时用作 `this` 的值。
* **返回值:**  如果回调函数对数组中至少一个元素返回一个真值，则返回 `true`。否则返回 `false`。

```js
Array.prototype.some=function (fn,thisArg){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    if (typeof fn !== "function") {
        throw new TypeError(fn + ' is not a function')
    }
    const O = Object(this)
    const len = O.length >>> 0
    for(let i=0;i<len;i++){
        let res
        if(typeof thisArg === 'undefined'){
            res=fn(this[i],i,this)
        }else{
            res=fn.call(thisArg,this[i],i,this)
        }
        if (res) {
            return true
        }
    }
    return false
}
```

**示例**

```js
//测试数组元素的值
function isBiggerThan10(element, index, array) {
  return element > 10;
}

[2, 5, 8, 1, 4].some(isBiggerThan10); // false
[12, 5, 8, 1, 4].some(isBiggerThan10); // true

//使用箭头函数测试数组元素的值
[2, 5, 8, 1, 4].some((x) => x > 10); // false
[12, 5, 8, 1, 4].some((x) => x > 10); // true

//判断数组元素中是否存在某个值
const fruits = ["apple", "banana", "mango", "guava"];
function checkAvailability(arr, val) {
    return arr.some((arrVal) => val === arrVal);
}
checkAvailability(fruits, "kela"); // false
checkAvailability(fruits, "banana"); // true

//将任意值转换为布尔类型
const TRUTHY_VALUES = [true, "true", 1];
function getBoolean(value) {
    if (typeof value === "string") {
        value = value.toLowerCase().trim();
    }
    return TRUTHY_VALUES.some((t) => t === value);
}
getBoolean(false); // false
getBoolean("false"); // false
getBoolean(1); // true
getBoolean("true"); // true

//在稀疏数组上使用 some()
console.log([1, , 3].some((x) => x === undefined)); // false
console.log([1, , 1].some((x) => x !== 1)); // false
console.log([1, undefined, 1].some((x) => x !== 1)); // true

//在非数组对象上调用 some()
const arrayLike = {
    length: 3,
    0: "a",
    1: "b",
    2: "c",
};
console.log(Array.prototype.some.call(arrayLike, (x) => typeof x === "number"));
// false
```

### Array.prototype.values

* **功能:**  返回一个新的数组迭代器对象，该对象迭代数组中每个元素的值。
* **用法:**  values()
* **参数:**  无
* **返回值:**  一个新的可迭代迭代器对象。

```js
Array.prototype.values=function (){
    if(!typeof this==='object') return
    let arr=this
    let length=this.length
    if(!length){
        arr=[]
        for(const key in this){
            if(this.hasOwnProperty(key)){
                arr.push(this[key])
            }
        }
    }
    let len=this.length||arr.length
    let nextIndex=0
    return {
        [Symbol.iterator]:function (){
            return {
                next:function (){
                    return nextIndex<len?{value: arr[nextIndex++],done: false}:{value:undefined,done:true}
                }
            }
        }
    }
}
```

**示例**

```js
//使用 for...of 循环进行迭代
const arr = ["a", "b", "c", "d", "e"];
const iterator = arr.values();
for (const letter of iterator) {
    console.log(letter);
} // "a" "b" "c" "d" "e"

//使用 next() 迭代
const arr = ["a", "b", "c", "d", "e"];
const iterator = arr.values();
iterator.next(); // { value: "a", done: false }
iterator.next(); // { value: "b", done: false }
iterator.next(); // { value: "c", done: false }
iterator.next(); // { value: "d", done: false }
iterator.next(); // { value: "e", done: false }
iterator.next(); // { value: undefined, done: true }
console.log(iterator.next().value); // undefined

//迭代稀疏数组
for (const element of [, "a"].values()) {
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
}
// a
// b
// c
```

### Array.prototype.sort

* **功能:**  对数组的元素进行排序，并返回对相同数组的引用。默认排序是将元素转换为字符串，然后按照它们的 UTF-16 码元值升序排序。
* **用法:**  sort() sort(`compareFn`)
* **参数:**  
  * `compareFn`(**可选**) 定义排序顺序的函数。返回值应该是一个数字，其符号表示两个元素的相对顺序：如果 `a` 小于 `b`，返回值为负数，如果 `a` 大于 `b`，返回值为正数，如果两个元素相等，返回值为 0。NaN 被视为 0。该函数使用以下参数调用：
    *  `a`   第一个用于比较的元素。不会是 `undefined`。
    *  `b`   第二个用于比较的元素。不会是 `undefined`。
* **返回值:**  经过排序的原始数组的引用。注意数组是就地排序的，不会进行复制。

```js
/**
 * 划分函数  快排算法
 */
function partition(arr,low,high,cb) {
    var poivt = arr[low]
    while (low<high) {
        while (low<high && cb(arr[high],poivt) >= 0 ) {
            high--
        }
        arr[low] = arr[high]
        while (low<high && cb(arr[low],poivt) <= 0 ) {
            low++
        }
        arr[high] = arr[low]
    }
    arr[low] = poivt
    return low
}

function quickSort(arr,low,high,cb) {
    if(low<high){
        var mid = partition(arr,low,high,cb)
        quickSort(arr,low,mid-1,cb)
        quickSort(arr,mid+1,high,cb)
    }
    return arr
}
Array.prototype.sort = function(cb) {
    return quickSort(this,0,this.length-1,cb)
}
```

**示例**

```js
//创建、显示及排序数组
const stringArray = ["Blue", "Humpback", "Beluga"];
const numberArray = [40, 1, 5, 200];
const numericStringArray = ["80", "9", "700"];
const mixedNumericArray = ["80", "9", "700", 40, 1, 5, 200];

function compareNumbers(a, b) {
    return a - b;
}
stringArray.join(); // 'Blue,Humpback,Beluga'
stringArray.sort(); // ['Beluga', 'Blue', 'Humpback']
numberArray.join(); // '40,1,5,200'
numberArray.sort(); // [1, 200, 40, 5]
numberArray.sort(compareNumbers); // [1, 5, 40, 200]
numericStringArray.join(); // '80,9,700'
numericStringArray.sort(); // ['700', '80', '9']
numericStringArray.sort(compareNumbers); // ['9', '80', '700']
mixedNumericArray.join(); // '80,9,700,40,1,5,200'
mixedNumericArray.sort(); // [1, 200, 40, 5, '700', '80', '9']
mixedNumericArray.sort(compareNumbers); // [1, 5, '9', 40, '80', 200, '700']

//对象数组的排序
const items = [
    { name: "Edward", value: 21 },
    { name: "Sharpe", value: 37 },
    { name: "And", value: 45 },
    { name: "The", value: -12 },
    { name: "Magnetic", value: 13 },
    { name: "Zeros", value: 37 },
];

// 根据 value 排序
items.sort((a, b) => a.value - b.value);

// 根据 name 排序
items.sort((a, b) => {
    const nameA = a.name.toUpperCase(); // 忽略大小写
    const nameB = b.name.toUpperCase(); // 忽略大小写
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }

    // name 必须相等
    return 0;
});

//使用 map 改善排序
// 需要被排序的数组
const data = ["delta", "alpha", "charlie", "bravo"];

// 用于存放位置和排序值的对象数组
const mapped = data.map((v, i) => {
    return { i, value: someSlowOperation(v) };
});

// 按照多个值排序数组
mapped.sort((a, b) => {
    if (a.value > b.value) {
        return 1;
    }
    if (a.value < b.value) {
        return -1;
    }
    return 0;
});

const result = mapped.map((v) => data[v.i]);

//sort() 方法返回对同一数组的引用
const numbers = [3, 1, 4, 1, 5];
const sorted = numbers.sort((a, b) => a - b);
// numbers 和 sorted 都是 [1, 1, 3, 4, 5]
sorted[0] = 10;
console.log(numbers[0]); // 10

//在稀疏数组上使用 sort()
console.log(["a", "c", , "b"].sort()); // ['a', 'b', 'c', empty]
console.log([, undefined, "a", "b"].sort()); // ["a", "b", undefined, empty]

//在类数组对象上调用 sort()
const arrayLike = {
    length: 3,
    unrelated: "foo",
    0: 5,
    2: 4,
};
console.log(Array.prototype.sort.call(arrayLike));
// { '0': 4, '1': 5, length: 3, unrelated: 'foo' }
```

### Array.prototype.splice

* **功能:**  就地移除或者替换已存在的元素和/或添加新的元素。
* **用法:**  splice(`start`) splice(`start`, `deleteCount`) splice(`start`, `deleteCount`, `item1`, `item2`, /* …, */ `itemN`)
* **参数:**
    * `start` 从 0 开始计算的索引，表示要开始改变数组的位置，它会被转换成整数。
      * 负索引从数组末尾开始计算——如果 `-array.length <= start < 0`，使用 `start + array.length`。
      * 如果 `start < -array.length`，使用 0。
      * 如果 `start >= array.length`，则不会删除任何元素，但是该方法会表现为添加元素的函数，添加所提供的那些元素。
      * 如果 `start` 被省略了（即调用 `splice()` 时不传递参数），则不会删除任何元素。这与传递 `undefined` 不同，后者会被转换为 0。
    * `deleteCount`(**可选**) 一个整数，表示数组中要从 start 开始删除的元素数量。
        * 如果省略了 `deleteCount`，或者其值大于或等于由 `start` 指定的位置到数组末尾的元素数量，那么从 `start` 到数组末尾的所有元素将被删除。但是，如果你想要传递任何 `itemN` 参数，则应向 `deleteCount` 传递 `Infinity` 值，以删除 `start` 之后的所有元素，因为显式的 `undefined` 会转换为 0。
        * 如果 `deleteCount` 是 0 或者负数，则不会移除任何元素。在这种情况下，你应该至少指定一个新元素。
    * `item1、…、itemN`(**可选**) 从 start 开始要加入到数组中的元素，如果不指定任何元素，splice() 将只从数组中删除元素。
* **返回值:**  一个包含了删除的元素的数组，如果只移除一个元素，则返回一个元素的数组，如果没有删除任何元素，则返回一个空数组。

```js
Array.prototype.splice = function(start,deleteCount) {
    if(!this.length)return
    var arr = []
    /**
     * 如果超出了数组的长度，则从数组末尾开始添加内容；
     * 如果是负值，则表示从数组末位开始的第几位（从-1计数）；
     * 如果负数的绝对值大于数组的长度，则表示开始位置为第0位。
     */
    start = typeof start === 'number' ?
        start > this.length ? this.length
            : start < 0 ? this.length + start < 0 ? 0
            : this.length + start
            : start
        : 0
    /**
     * 如果 deleteCount 大于 start 之后的元素的总数，则从 start 后面的元素都将被删除（含第 start 位）。
     * 如果 deleteCount 被省略，则其相当于 array.length - start。
     * 如果 deleteCount 被省略了，或者它的值大于等于array.length - start(也就是说，如果它大于或者等于start之后的所有元素的数量)，那么start之后数组的所有元素都会被删除。
     * 如果 deleteCount 是 0 或者负数，则不移除元素。这种情况下，至少应添加一个新元素。
     */
    deleteCount = typeof deleteCount === 'number' ?
        deleteCount < 0 ? 0
            : deleteCount > this.length - start ? this.length - start
            : deleteCount : deleteCount === undefined ? this.length - start
            : 0
    //取出除去前两个参数之后的剩余参数
    var args = arguments.length > 2 ? Array.prototype.slice.call(arguments,2) : []
    var argLength = args.length

    //记录一下开始位置
    var oIndex = start
    //需要新增或者缩减的数目
    var moveLength = argLength - deleteCount
    //需要删除到指定的下标
    var delIndex = deleteCount + start
    //新增到指定的下表
    var addIndex = argLength + start
    var index = 0
    //删除 [...start, ... ,delIndex,...]
    while (start < delIndex) {
        arr[index] = this[start]
        this[start] = null
        ++start
        ++index
    }
    if(moveLength > 0){
        //数组不足以插入的时候,开辟新的位置
        var i = this.length - 1
        this.length += moveLength
        while (i >= oIndex) {
            this[i+moveLength] = this[i]
            --i
        }
    }else{
        //插入后还有剩余,需要回缩空间
        var i = this.length
        if(start < this.length){
            while (start < i) {
                this[start+moveLength] = this[start]
                ++start
            }
        }
        this.length += moveLength
    }
    var i = 0
    // 插入新的 item1...itemN
    while (oIndex < addIndex) {
        this[oIndex] = args[i]
        ++i
        ++oIndex
    }
    return arr
}
```

**示例**

```js
//在索引 2 处移除 0 个元素，并插入“drum”
const myFish = ["angel", "clown", "mandarin", "sturgeon"];
const removed = myFish.splice(2, 0, "drum");

// myFish 是 ["angel", "clown", "drum", "mandarin", "sturgeon"]
// removed 是 []，没有移除的元素

//在索引 2 处移除 0 个元素，并插入“drum”和“guitar”
const myFish = ["angel", "clown", "mandarin", "sturgeon"];
const removed = myFish.splice(2, 0, "drum", "guitar");

// myFish 是 ["angel", "clown", "drum", "guitar", "mandarin", "sturgeon"]
// removed 是 []，没有移除的元素

//在索引 0 处移除 0 个元素，并插入“angel”
const myFish = ["clown", "mandarin", "sturgeon"];
const removed = myFish.splice(0, 0, "angel");
// myFish 是 ["angel", "clown", "mandarin", "sturgeon"]
// 没有移除的元素

//在稀疏数组中使用 splice()
const arr = [1, , 3, 4, , 6];
console.log(arr.splice(1, 2)); // [empty, 3]
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
```









