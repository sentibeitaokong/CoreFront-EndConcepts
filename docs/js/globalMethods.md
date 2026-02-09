# 常用全局函数

## 浅拷贝

```js
function clone(target) {
    if(typeof target!=='object'){
        return target
    }
    let newTarget=target instanceof Array?[]:{};
    for (let prop in target) {
        // 筛选自身可枚举属性
        if (target.hasOwnProperty(prop)) {
            newTarget[prop] = target[prop]
        }
    }
    return newTarget
}
```

## 深拷贝

```js
function deepClone(target, hash = new WeakMap()) {
    if (target === null) return target
    if (target instanceof Date) return new Date(target)
    if (target instanceof RegExp) return new RegExp(target)
    // if (target instanceof HTMLElement) return target // 处理 DOM元素
    if (typeof target !== 'object') return target
    if (hash.has(target)) {
        return hash.get(target)
    }
    const cloneTarget = new target.constructor()
    hash.set(target, cloneTarget)
    Reflect.ownKeys(target).forEach(key => {
            cloneTarget[key] = deepClone(target[key], hash)
    })
    return cloneTarget
}
```

## new方法

```js
function New(){
    var obj = new Object()
    var constructor = Array.prototype.shift.call(arguments)
    obj.__proto__ = constructor.prototype
    var ret = constructor.apply(obj, arguments)
    // 如果构造函数中return 了对象则返回对象
    return typeof ret === 'object' ? ret : obj
}
```

## instaceOf方法

```js
function instaceOf(target, origin) {
    let proto = target.__proto__
    while (true) {
        if (proto === null) {
            return false
        }
        if (proto === origin.prototype) {
            return true
        }
        proto = proto.__proto__
    }
    // MDN
    /* while (target != null) {
         if (target == origin.prototype)
             return true;
         if (typeof object == 'xml') {
             return origin.prototype == XML.prototype;  //应对XML对象
         }
         target = target.__proto__;
     }
     return false;*/
}
```

## 乱序 

洗牌算法

```js
function shuffle(arr){
    let m = arr.length;
    while (m > 1){
        let index = Math.floor(Math.random() * m--);
        [arr[m] , arr[index]] = [arr[index] , arr[m]]
    }
    return arr;
}
```

## for of实现
```js
function forOf(obj,cb) {
    let iterable,result
    if(typeof obj[Symbol.iterator]!=='function'){
        throw new TypeError(result+"is not iterable")
    }
    iterable=obj[Symbol.iterator]();
    result=iterable.next()
    while(!result.done){
        cb(result.value);
        result=iterable.next();
    }
}
```

## isNaN

```js
// isNaN方法  功能：用来确定一个值是否为NaN
function isNaN(value) {
    var n = Number(value);
    return n !== n;
}
```

## 包含关系
```js
 //判断是否为包含关系
function isSuperset(set, subset) {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}
```

## 并集

```js
function union(setA, setB) {
    let _union = new Set(setA);
    for (let elem of setB) {
        _union.add(elem);
    }
    return _union;
}
```

## 交集

```js
function intersection(setA, setB) {
    let _intersection = new Set();
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}
```

## 补集  

AB的并集减去AB的交集

```js
function symmetricDifference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem);
        } else {
            _difference.add(elem);
        }
    }
    return _difference;
}
```

## 差集 

属于A但不属于B的

```js
function difference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}
```


