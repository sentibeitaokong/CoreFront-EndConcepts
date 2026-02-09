# Object

`Object` 是 `JavaScript` 的一种**数据类型**。它用于存储各种键值集合和更复杂的实体。可以通过 `Object()` 构造函数或者使用对象字面量的方式创建对象。

## [Object静态方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object)

### Object.is

* **功能:**  确定两个值是否为相同值。
* **用法:**  Object.is(`value1, value2`)
* **参数:**  `value1`要比较的第一个值,`value2`要比较的第二个值。
* **返回值:**  一个布尔值，指示两个参数是否为相同的值。

```js
Object.is=function (a,b) {
    if(a===b){
        return a!==0||1/a===1/b;
    }
    // 当a、b为NaN时
    return a!==a&&b!==b
}
```

**示例**

```js
// 案例 1：评估结果和使用 === 相同
Object.is(25, 25); // true
Object.is("foo", "foo"); // true
Object.is("foo", "bar"); // false
Object.is(null, null); // true
Object.is(undefined, undefined); // true
Object.is(window, window); // true
Object.is([], []); // false
const foo = { a: 1 };
const bar = { a: 1 };
const sameFoo = foo;
Object.is(foo, foo); // true
Object.is(foo, bar); // false
Object.is(foo, sameFoo); // true

// 案例 2: 带符号的 0
Object.is(0, -0); // false
Object.is(+0, -0); // false
Object.is(-0, -0); // true

// 案例 3: NaN
Object.is(NaN, 0 / 0); // true
Object.is(NaN, Number.NaN); // true
```

### Object.keys

* **功能:**  返回一个由给定对象自身的可枚举的字符串键属性名组成的数组。
* **用法:**  Object.keys(`obj`)
* **参数:**  `obj`一个对象。
* **返回值:**  一个由给定对象自身可枚举的字符串键属性键组成的数组。

```js
Object.keys = function(obj) {
    // 1. 类型检查
    if (obj == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    // 2. 转换为对象
    obj = Object(obj);

    // 3. 收集可枚举的自身属性
    var result = [];

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result.push(key);
        }
    }

    // 4. 处理符号属性（ES6+）
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(obj);
        for (var i = 0; i < symbols.length; i++) {
            if (Object.prototype.propertyIsEnumerable.call(obj, symbols[i])) {
                result.push(symbols[i]);
            }
        }
    }

    return result;
};
```

**示例**

```js
// 简单数组
const arr = ["a", "b", "c"];
console.log(Object.keys(arr)); // ['0', '1', '2']

// 类数组对象
const obj = { 0: "a", 1: "b", 2: "c" };
console.log(Object.keys(obj)); // ['0', '1', '2']

// 键的顺序随机的类数组对象
const anObj = { 100: "a", 2: "b", 7: "c" };
console.log(Object.keys(anObj)); // ['2', '7', '100']

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
myObj.foo = 1;
console.log(Object.keys(myObj)); // ['foo']

//在基本类型中使用 Object.keys()
// 字符串具有索引作为可枚举的自有属性
console.log(Object.keys("foo")); // ['0', '1', '2']

// 其他基本类型（除了 undefined 和 null）没有自有属性
console.log(Object.keys(100)); // []
```

### Object.values

* **功能:**  返回一个给定对象的自有可枚举字符串键属性值组成的数组。
* **用法:**  Object.values(`obj`)
* **参数:**  `obj`一个对象。
* **返回值:**  一个由给定对象自身可枚举的字符串键属性键组成的数组。

```js
Object.values = function(obj) {
    // 1. 类型检查
    if (obj == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    // 2. 转换为对象
    obj = Object(obj);

    // 3. 收集值
    var keys = Object.keys(obj);
    var values = new Array(keys.length);

    // 4. 处理符号属性的值（如果需要）
    var symbolValues = [];
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(obj);
        for (var i = 0; i < symbols.length; i++) {
            if (Object.prototype.propertyIsEnumerable.call(obj, symbols[i])) {
                symbolValues.push(obj[symbols[i]]);
            }
        }
    }

    // 5. 获取所有值
    for (var i = 0; i < keys.length; i++) {
        values[i] = obj[keys[i]];
    }

    // 6. 合并结果（符号属性的值在最后）
    return values.concat(symbolValues);
};
```

**示例**

```js
const obj = { foo: "bar", baz: 42 };
console.log(Object.values(obj)); // ['bar', 42]

// 类数组对象
const arrayLikeObj1 = { 0: "a", 1: "b", 2: "c" };
console.log(Object.values(arrayLikeObj1)); // ['a', 'b', 'c']

// 具有随机键排序的类数组对象
// 使用数字键时，将按键的数字顺序返回值
const arrayLikeObj2 = { 100: "a", 2: "b", 7: "c" };
console.log(Object.values(arrayLikeObj2)); // ['b', 'c', 'a']

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
console.log(Object.values(myObj)); // ['bar']

//在基本类型中使用 Object.values()
// 字符串具有索引作为可枚举的自有属性
console.log(Object.values("foo")); // ['f', 'o', 'o']

// 其他基本类型（除了 undefined 和 null）没有自有属性
console.log(Object.values(100)); // []
```

### Object.entries

* **功能:**  返回一个数组，包含给定对象自有的可枚举字符串键属性的键值对。
* **用法:**  Object.entries(`obj`)
* **参数:**  `obj`一个对象。
* **返回值:**  一个由给定对象自有的可枚举字符串键属性的键值对组成的数组。每个键值对都是一个包含两个元素的数组：第一个元素是属性的键（始终是字符串），第二个元素是属性值。

```js
Object.entries=function(arg){
    //判断是数组
    if(Array.isArray(arg)){
        return arg.map((item,index)=>[`${index}`,item])
    }
    //判断是对象
    if(Object.prototype.toString.call(arg)===`[object Object]`){
        return Object.keys(arg).map(item=>[item,arg[item]])
    }
    //判断是字符串
    if(Object.prototype.toString.call(arg)===`[object String]`){
        return Object.keys(arg).map(item=>[item,arg[item]])
    }
    if(typeof arg==='number'){
        return []
    }
    throw '无法将参数转换为对象'
}
```

**示例**
```js
    const obj = { foo: "bar", baz: 42 };
    console.log(Object.entries(obj)); // [ ['foo', 'bar'], ['baz', 42] ]
    
    // 类数组对象
    const obj = { 0: "a", 1: "b", 2: "c" };
    console.log(Object.entries(obj)); // [ ['0', 'a'], ['1', 'b'], ['2', 'c'] ]
    
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
    const obj = { foo: "bar", baz: 42 };
    const map = new Map(Object.entries(obj));
    console.log(map); // Map(2) {"foo" => "bar", "baz" => 42}
    
    //遍历对象
    // 使用 for...of 循环
    const obj = { a: 5, b: 7, c: 9 };
    for (const [key, value] of Object.entries(obj)) {
        console.log(`${key} ${value}`); // "a 5", "b 7", "c 9"
    }
    
    // 使用数组方法
    Object.entries(obj).forEach(([key, value]) => {
        console.log(`${key} ${value}`); // "a 5", "b 7", "c 9"
    });
```

### Object.fromEntries

* **功能:**  将键值对列表转换为一个对象。
* **用法:**  Object.fromEntries(`iterable`)
* **参数:**  `iterable`一个包含对象列表的可迭代对象，例如 `Array` 或者 `Map`。每个对象都要有两个属性：
  * 0 表示属性键的字符串或者 Symbol。
  * 1 属性值。
* **返回值:**  一个新对象，其属性由可迭代对象的条目给定。

```js
Object.fromEntries=function(arg){
    //判断是不是Map类型
    if(Object.prototype.toString.call(arg)===`[object Map]`){
        const resMap={}
        for(const item of arg.keys()){
            resMap[item]=arg.get(item)
        }
        return resMap
    }
    //判断是不是Array
    if(Array.isArray(arg)){
        const resArr={}
        arg.map(([item,index])=>{
            resArr[item]=index
        })
        return resArr
    }
    throw  '参数不可编辑'
}
```

```js
const map = new Map([
  ["foo", "bar"],
  ["baz", 42],
]);
const obj = Object.fromEntries(map);
console.log(obj); // { foo: "bar", baz: 42 }
const arr = [
    ["0", "a"],
    ["1", "b"],
    ["2", "c"],
];
const obj1 = Object.fromEntries(arr);
console.log(obj1); // { 0: "a", 1: "b", 2: "c" }
const object1 = { a: 1, b: 2, c: 3 };

const object2 = Object.fromEntries(
    Object.entries(object1).map(([key, val]) => [key, val * 2]),
);

console.log(object2);
// { a: 2, b: 4, c: 6 }
```

### Object.getOwnPropertyNames

* **功能:**  返回一个数组，其包含给定对象中所有自有属性（包括不可枚举属性，但不包括使用 symbol 值作为名称的属性）。
* **用法:**  Object.getOwnPropertyNames(`obj`)
* **参数:**  `obj`一个对象，其自有的可枚举和不可枚举属性的名称被返回。
* **返回值:**  在给定对象上找到的自有属性对应的字符串数组。

```js
// Object.getOwnPropertyNames 的最基础 ES5 实现
Object.getOwnPropertyNames = function(obj) {
    // 1. 参数检查
    if (obj === null || obj === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    // 2. 转换为对象
    obj = Object(obj);

    // 3. 收集所有自身属性名
    var result = [];

    // 遍历所有可枚举属性
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result.push(key);
        }
    }

    // 4. 处理不可枚举属性（ES5 需要包含不可枚举属性）
    // 需要特殊处理 constructor 和其他不可枚举属性
    var nonEnumerableProps = ['constructor', 'prototype', '__proto__', '__defineGetter__',
        '__defineSetter__', '__lookupGetter__', '__lookupSetter__'];

    for (var i = 0; i < nonEnumerableProps.length; i++) {
        var prop = nonEnumerableProps[i];
        if (Object.prototype.hasOwnProperty.call(obj, prop) &&
            result.indexOf(prop) === -1) {
            result.push(prop);
        }
    }

    // 5. 返回结果数组
    return result;
};
```

**示例**
```js
const arr = ["a", "b", "c"];
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
// ["prop", "method"]
```


### Object.getOwnPropertySymbols

* **功能:**  返回一个包含给定对象所有自有 `Symbol` 属性的数组。
* **用法:**  Object.getOwnPropertySymbols(`obj`)
* **参数:**  `obj`要返回 `Symbol` 属性的对象。
* **返回值:**  在给定对象找到的所有自有 `Symbol` 属性的数组。

```js
Object.getOwnPropertySymbols = function(obj) {
    'use strict';
    // 参数检查
    if (obj == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }
    // 转换为对象
    obj = Object(obj);

    const result = [];

    // 方法1：使用 Reflect.ownKeys（最佳方案）
    if (typeof Reflect === 'object' && Reflect.ownKeys) {
        const keys = Reflect.ownKeys(obj);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (typeof key === 'symbol') {
                result.push(key);
            }
        }
        return result;
    }
};
```

**示例**

```js
const obj = {};
const a = Symbol("a");
const b = Symbol.for("b");

obj[a] = "localSymbol";
obj[b] = "globalSymbol";

const objectSymbols = Object.getOwnPropertySymbols(obj);

console.log(objectSymbols.length); // 2
console.log(objectSymbols); // [Symbol(a), Symbol(b)]
console.log(objectSymbols[0]); // Symbol(a)
```

### Object.assign

* **功能:**  将一个或者多个源对象中所有可枚举的自有属性复制到目标对象，并返回修改后的目标对象。
* **用法:**  Object.assign(`target`, `...sources`)
* **参数:**  `target` 需要应用源对象属性的目标对象，修改后将作为返回值,`sources` 一个或多个包含要应用的属性的源对象。
* **返回值:**  修改后的目标对象。

```js
MyObject.assign=function(target,...source){
    if(target==null){
        throw new TypeError('Cannot convert undefined or null to object')
    }
    let ret=Object(target)
    source.forEach(obj=>{
        if(obj!=null){
            for(let key in obj){
                if(Object.prototype.hasOwnProperty.call(obj, key)){
                    ret[key]=obj[key]
                }
            }
        }
    })
    return ret
   // MDN官方
   /* Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target === null || target === undefined) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource !== null && nextSource !== undefined) {
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });*/
}
```

**示例**

```js
const obj = { a: 1 };
const copy = Object.assign({}, obj);
console.log(copy); // { a: 1 }

//深拷贝问题
const obj1 = { a: 0, b: { c: 0 } };
const obj2 = Object.assign({}, obj1);
console.log(obj2); // { a: 0, b: { c: 0 } }

obj1.a = 1;
console.log(obj1); // { a: 1, b: { c: 0 } }
console.log(obj2); // { a: 0, b: { c: 0 } }

obj2.a = 2;
console.log(obj1); // { a: 1, b: { c: 0 } }
console.log(obj2); // { a: 2, b: { c: 0 } }

obj2.b.c = 3;
console.log(obj1); // { a: 1, b: { c: 3 } }
console.log(obj2); // { a: 2, b: { c: 3 } }

// 深拷贝
const obj3 = { a: 0, b: { c: 0 } };
const obj4 = JSON.parse(JSON.stringify(obj3));
obj3.a = 4;
obj3.b.c = 4;
console.log(obj4); // { a: 0, b: { c: 0 } }

//合并对象
const one1 = { a: 1 };
const one2 = { b: 2 };
const one3 = { c: 3 };
const currentObj = Object.assign(one1, one2, one3);
console.log(currentObj); // { a: 1, b: 2, c: 3 }
console.log(one1); // { a: 1, b: 2, c: 3 }，目标对象本身发生了变化

//合并具有相同属性的对象
const o1 = { a: 1, b: 1, c: 1 };
const o2 = { b: 2, c: 2 };
const o3 = { c: 3 };
//
const currentObj3 = Object.assign({}, o1, o2, o3);
console.log(currentObj3); // { a: 1, b: 2, c: 3 }

//拷贝 Symbol 类型属性
const os1 = { a: 1 };
const os2 = { [Symbol("foo")]: 2 };

const os3 = Object.assign({}, os1, os2);
console.log(os3); // { a : 1, [Symbol("foo")]: 2 } (cf. bug 1207182 on Firefox)
Object.getOwnPropertySymbols(os3); // [Symbol(foo)]

//原型链上的属性和不可枚举的属性不能被复制
const currentObj1 = Object.create(
    // foo 在 obj 的原型链上
    { foo: 1 },
    {
        bar: {
            value: 2, // bar 是不可枚举的属性
        },
        baz: {
            value: 3,
            enumerable: true, // baz 是可枚举的自有属性
        },
    },
);

const currentCopy = Object.assign({}, currentObj1);
console.log(currentCopy); // { baz: 3 }

//异常会中断后续的复制
const target = Object.defineProperty({}, "foo", {
    value: 1,
    writable: false,
}); // target.foo 是一个只读属性

Object.assign(target, { bar: 2 }, { foo2: 3, foo: 3, foo3: 3 }, { baz: 4 });
// TypeError: "foo" is read-only
// 这个异常会在给 target.foo 赋值的时候抛出

console.log(target.bar); // 2，第一个源对象成功复制。
console.log(target.foo2); // 3，第二个源对象的第一个属性也成功复制。
console.log(target.foo); // 1，异常在这里被抛出
console.log(target.foo3); // undefined，属性赋值已经结束，foo3 不会被复制
console.log(target.baz); // undefined，第三个源对象也不会被复制

//拷贝访问器
const currentObj2 = {
    foo: 1,
    get bar() {
        return 2;
    },
};

let copy2 = Object.assign({}, currentObj2);
console.log(copy2);
// { foo: 1, bar: 2 }
// copy.bar 的值是 obj.bar 的 getter 的返回值。
```

### Object.getPrototypeOf

* **功能:**  返回指定对象的原型（即内部 [[Prototype]] 属性的值）。
* **用法:** Object.getPrototypeOf(`obj`)
* **参数:**  `obj` 要返回其原型的对象。
* **返回值:**  给定对象的原型，可能是 null。

```js
Object.getPrototypeOf = function(obj) {
    // 1. 参数检查
    if (obj === null || obj === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    
    // 2. 转换为对象
    obj = Object(obj);
    
    // 3. 使用 __proto__ 属性（非标准，但广泛支持）
    if (typeof obj.__proto__ !== 'undefined') {
      return obj.__proto__;
    }
    
    // 4. 使用 constructor.prototype
    if (typeof obj.constructor !== 'undefined') {
      return obj.constructor.prototype;
    }
    
    // 5. 默认返回 Object.prototype 或 null
    return Object.prototype;
};
```

**示例**

```js
const proto = {};
const obj = Object.create(proto);
Object.getPrototypeOf(obj) === proto; // true
```

### Object.create

* **功能:**  以一个现有对象作为原型，创建一个新对象。
* **用法:** Object.create(`proto`) Object.create(`proto`, `propertiesObject`)
* **参数:**  `proto` 新创建对象的原型对象，`propertiesObject`(**可选**) 如果该参数被指定且不为 undefined，则该传入对象可枚举的自有属性将为新创建的对象添加具有对应属性名称的属性描述符。这些属性对应于 `Object.defineProperties()` 的第二个参数。
* **返回值:**  根据指定的原型对象和属性创建的新对象。

```js
Object.create = function (proto, propertiesObject) {
    if (typeof proto !== 'object' && typeof proto !== 'function') {
        throw new TypeError('Object prototype may only be an Object or null.')
    }
    if (propertiesObject == null) {
        new TypeError('Cannot convert undefined or null to object')
    }
    function F() {
    }
    F.prototype=proto
    const obj=new F()
    if(propertiesObject!=undefined){
        Object.defineProperties(obj,propertiesObject)
    }
    if(proto===null){
        obj.__proto__=proto
    }
    return obj
};
```

**示例**

```js
// Shape——父类
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

//使用 Object.create() 的 propertyObject 参数
o = {};
// 等价于：
o = Object.create(Object.prototype);

o = Object.create(Object.prototype, {
    // foo 是一个常规数据属性
    foo: {
        writable: true,
        configurable: true,
        value: "hello",
    },
    // bar 是一个访问器属性
    bar: {
        configurable: false,
        get() {
            return 10;
        },
        set(value) {
            console.log("Setting `o.bar` to", value);
        },
    },
});

// 创建一个新对象，它的原型是一个新的空对象，并添加一个名为 'p'，值为 42 的属性。
o = Object.create({}, { p: { value: 42 } });

//使用 Object.create()，我们可以创建一个原型为 null 的对象。
o = Object.create(null);
// 等价于：
o = { __proto__: null };

//默认情况下，属性是不可写、可枚举和可配置的。
o.p = 24; // 在严格模式下会报错
o.p; // 42

o.q = 12;
for (const prop in o) {
    console.log(prop);
}
// 'q'

delete o.p;
// false；在严格模式下会报错

//如果要指定与字面量对象中相同的属性，请显式指定 writable、enumerable 和 configurable。
o2 = Object.create(
    {},
    {
        p: {
            value: 42,
            writable: true,
            enumerable: true,
            configurable: true,
        },
    },
);
// 这与以下语句不等价：
// o2 = Object.create({ p: 42 })
// 后者将创建一个原型为 { p: 42 } 的对象。

//你可以使用 Object.create() 来模仿 new 运算符的行为。
function Constructor() {}
o = new Constructor();
// 等价于：
o = Object.create(Constructor.prototype);
```

### Object.preventExtensions

* **功能:**  可以防止新属性被添加到对象中（即防止该对象被扩展）。它还可以防止对象的原型被重新指定。
* **用法:** Object.preventExtensions(`obj`)
* **参数:**  `obj` 将要变得不可扩展的对象。
* **返回值:**  已经不可扩展的对象。

```js
//可修改、可删除、不可添加
Object.preventExtensions = function(obj) {
    // 1. 参数检查
    if (obj == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    // 2. 原始类型直接返回
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return obj;
    }

    // 3. 标记对象为不可扩展
    Object.defineProperty(obj, '__nonExtensible__', {
        value: true,
        writable: false,
        enumerable: false,
        configurable: false
    });

    // 4. 拦截 defineProperty（全局拦截，不完美）
    var originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(target, prop, descriptor) {
        if (target === obj && !target.hasOwnProperty(prop)) {
            throw new TypeError('Cannot define property ' + prop + ', object is not extensible');
        }
        return originalDefineProperty(target, prop, descriptor);
    };

    return obj;
};
```

**示例**

```js
// Object.preventExtensions 将原对象变的不可扩展，并且返回原对象。
const obj = {};
const obj2 = Object.preventExtensions(obj);
obj === obj2; // true

// 字面量方式定义的对象默认是可扩展的。
const empty = {};
Object.isExtensible(empty); // true

// 可以将其改变为不可扩展的。
Object.preventExtensions(empty);
Object.isExtensible(empty); // false

// 使用 Object.defineProperty 方法为一个不可扩展的对象添加新属性会抛出异常。
const nonExtensible = { removable: true };
Object.preventExtensions(nonExtensible);
Object.defineProperty(nonExtensible, "new", {
  value: 8675309,
}); // 抛出 TypeError

// 在严格模式中，为一个不可扩展对象的新属性赋值会抛出 TypeError 异常。
function fail() {
  "use strict";
  // 抛出 TypeError
  nonExtensible.newProperty = "FAIL";
}
fail();

//非对象参数
Object.preventExtensions(1);
// TypeError: 1 is not an object (ES5 code)
Object.preventExtensions(1);
// 1                             (ES2015 code)
```


**深不可扩展**

```js
Object.deepPreventExtensions=function(o){
    //取出当前对象中的所有属性（包括不可枚举属性，排除Symbol属性）
    let _keys=Object.getOwnPropertyNames(o)
    if(_keys.length){
        _keys.forEach(item=>{
            var _value=o[item]
            if(typeof _value==='object' && _value!==null){
                Object.deepPreventExtensions(_value)
            }
        })
    }
    return Object.preventExtensions(o)
}
```

### Object.freeze

* **功能:**  可以使一个对象被冻结。冻结对象可以防止扩展，并使现有的属性不可写入和不可配置。
* **用法:** Object.freeze(`obj`)
* **参数:**  `obj` 要冻结的对象。
* **返回值:**  传递给函数的对象。

```js
// Object.freeze 的最基础实现
Object.freeze = function(obj) {
    // 1. 参数检查
    if (obj === null || obj === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
    }
    // 2. 处理原始类型（包装对象）
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return obj; // 原始类型直接返回
    }
    // 3. 设置对象不可扩展
    Object.preventExtensions(obj);
    // 4. 冻结所有自身属性
    const properties = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
        // 如果属性是可配置的或可写的，将其设置为不可配置且不可写
        if (descriptor) {
            if (descriptor.configurable || descriptor.writable) {
                Object.defineProperty(obj, prop, {
                    configurable: false,
                    writable: false
                });
            }
        }
    }
    // 5. 冻结 Symbol 属性（ES6+）
    if (typeof Object.getOwnPropertySymbols === 'function') {
        const symbols = Object.getOwnPropertySymbols(obj);
        for (let i = 0; i < symbols.length; i++) {
            const sym = symbols[i];
            const descriptor = Object.getOwnPropertyDescriptor(obj, sym);

            if (descriptor) {
                if (descriptor.configurable || descriptor.writable) {
                    Object.defineProperty(obj, sym, {
                        configurable: false,
                        writable: false
                    });
                }
            }
        }
    }
    // 3. 标记为已冻结
    Object.defineProperty(obj, '__frozenFlag', {
        value: true,
        writable: false,
        enumerable: false,
        configurable: false
    });
    return obj;
};
```

**示例**

```js
//冻结对象
const obj = {
  prop() {},
  foo: "bar",
};
// 冻结前：可以添加新属性，也可以更改或删除现有属性
obj.foo = "baz";
obj.lumpy = "woof";
delete obj.prop;
// 冻结。
const o = Object.freeze(obj);
// 返回值和我们传入的对象相同。
o === obj; // true
// 对象已冻结。
Object.isFrozen(obj); // === true
// 现在任何更改都会失败。
obj.foo = "quux"; // 静默但什么都没做
// 静默且没有添加属性
obj.quaxxor = "the friendly duck";

// 严格模式下，这样的尝试会抛出 TypeError
function fail() {
  "use strict";
  obj.foo = "sparky"; // 抛出 TypeError
  delete obj.foo; // 抛出 TypeError
  delete obj.quaxxor; // 返回 true，因为属性‘quaxxor’从未被添加过。
  obj.sparky = "arf"; // 抛出 TypeError
}
fail();
// 尝试通过 Object.defineProperty 更改；
// 下面的两个语句都会抛出 TypeError。
Object.defineProperty(obj, "ohai", { value: 17 });
Object.defineProperty(obj, "foo", { value: "eit" });
// 同样无法更改原型
// 下面的两个语句都会抛出 TypeError。
Object.setPrototypeOf(obj, { x: 20 });
obj.__proto__ = { x: 20 };

//冻结数组
const a = [0];
Object.freeze(a); // 数组现在开始无法被修改
a[0] = 1; // 静默失败
// 严格模式下，这样的尝试将抛出 TypeError
function fail() {
    "use strict";
    a[0] = 1;
}
fail();
// 尝试在数组末尾追加元素
a.push(2); // 抛出 TypeError
//被冻结的对象是不可变的。但也不总是这样。以下示例显示被冻结的对象不是常量（浅冻结）。
const obj1 = {
    internal: {},
};
Object.freeze(obj1); 
obj1.internal.a = "aValue";
obj1.internal.a; // 'aValue'
```

**深冻结**

```js
Object.deepFreeze=function (object) {
  // 获取对象的属性名
  const propNames = Reflect.ownKeys(object);
  // 冻结自身前先冻结属性
  for (const name of propNames) {
    const value = object[name];
    if ((value && typeof value === "object") || typeof value === "function") {
      Object.deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

const obj2 = {
  internal: {
    a: null,
  },
};

deepFreeze(obj2);

obj2.internal.a = "anotherValue"; // 非严格模式下会静默失败
obj2.internal.a; // null
```

### Object.seal

* **功能:**  密封一个对象。密封一个对象会阻止其扩展并且使得现有属性不可配置。密封对象有一组固定的属性：不能添加新属性、不能删除现有属性或更改其可枚举性和可配置性、不能重新分配其原型。只要现有属性的值是可写的，它们仍然可以更改。
* **用法:** Object.seal(`obj`)
* **参数:**  `obj` 要冻结的对象。
* **返回值:**  被密封的对象。

```js
// Object.seal 的最基础实现  //可修改、不可删除、不可添加
Object.seal = function(obj) {
  // 1. 参数检查
  if (obj === null || obj === undefined) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  
  // 2. 处理原始类型（包装对象）
  if (typeof obj !== 'object' && typeof obj !== 'function') {
    return obj; // 原始类型直接返回
  }
  
  // 3. 设置对象不可扩展
  Object.preventExtensions(obj);
  
  // 4. 密封所有自身属性（设为不可配置）
  const properties = Object.getOwnPropertyNames(obj);
  
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    
    // 如果属性是可配置的，将其设置为不可配置
    if (descriptor && descriptor.configurable) {
      Object.defineProperty(obj, prop, {
        configurable: false,
        writable: descriptor.writable,
        enumerable: descriptor.enumerable,
        value: descriptor.value,
        get: descriptor.get,
        set: descriptor.set
      });
    }
  }
  
  // 5. 密封 Symbol 属性（ES6+）
  if (typeof Object.getOwnPropertySymbols === 'function') {
    const symbols = Object.getOwnPropertySymbols(obj);
    
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      const descriptor = Object.getOwnPropertyDescriptor(obj, sym);
      
      if (descriptor && descriptor.configurable) {
        Object.defineProperty(obj, sym, {
          configurable: false,
          writable: descriptor.writable,
          enumerable: descriptor.enumerable,
          value: descriptor.value,
          get: descriptor.get,
          set: descriptor.set
        });
      }
    }
  }
  // 3. 标记为已密封
  Object.defineProperty(obj, '__sealedFlag', {
     value: true,
     writable: false,
     enumerable: false,
     configurable: false
  });
  return obj;
};

```

**示例**
```js
const obj = {
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
}); // 更改现有属性值

//非对象参数
Object.seal(1);
// TypeError: 1 is not an object (ES5 code)
Object.seal(1);
// 1                             (ES2015 code)
```

**深密封**

```js
Object.deepSeal=function(o){
    //取出当前对象中的所有属性（包括不可枚举属性，排除Symbol属性）
    let _keys=Object.getOwnPropertyNames(o)
    if(_keys.length){
        _keys.forEach(item=>{
            var _value=o[item]
            if(typeof _value==='object' && _value!==null){
                Object.deepSeal(_value)
            }
        })
    }
    return Object.seal(o)
}
```



