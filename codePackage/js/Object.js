const MyObject=Object.create(null)

// Object.is()函数底层实现     功能：主要是判断两个值是否是同值相等
MyObject.is=function (a,b) {
    if(a===b){
        return a!==0||1/a===1/b;
    }
    // 当a、b为NaN时
    return a!==a&&b!==b
}

// Object.entries()函数底层实现    功能：返回一个给定对象自身可枚举属性的键值对数组，原型上的属性属于不可枚举属性
// 其排列与使用 for...in 循环遍历该对象时返回的顺序一致（区别在于 for-in 循环还会枚举原型链中的属性）
MyObject.entries=function(arg){
    //判断是数组
    if(Array.isArray(arg)){
        return arg.map((item,index)=>[`${index}`,item])
    }
    //判断是对象或者字符串
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
// Object.keys()函数底层实现  返回一个由给定对象自身的可枚举的字符串键属性名组成的数组。
MyObject.keys = function(obj) {
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
//Object.values()  返回一个给定对象的自有可枚举字符串键属性值组成的数组。
MyObject.values = function(obj) {
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
// Object.fromEntries()函数底层实现  功能：把键值对列表转换为一个对象。
MyObject.fromEntries=function(arg){
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

//Object.assign()函数实现  功能：用于将所有可枚举属性的值从一个或多个源对象分配到目标对象。它将返回目标对象。
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

MyObject.getOwnPropertyNames = function(obj) {
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

// 现代 JavaScript 环境中的实现
MyObject.getOwnPropertySymbols = function(obj) {
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


MyObject.getPrototypeOf = function(obj) {
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


//object.create()  功能：创建一个新对象，使用现有的对象来提供新创建的对象的__proto__
MyObject.create = function (proto, propertiesObject) {
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

MyObject.freeze = function(obj) {
    // 1. 参数检查
    if (obj === null || obj === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
    }
    // 2. 处理原始类型（包装对象）
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return obj; // 原始类型直接返回
    }
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

//object.freeze()  功能：可以冻结一个对象。一个被冻结的对象再也不能被修改；
// 冻结了一个对象则不能向这个对象添加新的属性，不能删除已有属性，不能修改该对象已有属性的可枚举性、可配置性、可写性，
// 以及不能修改已有属性的值。此外，冻结一个对象后该对象的原型引用也不能被修改。freeze() 返回和传入的参数相同的对象。
//不可修改、不可删除、不可添加
//实现深冻结   对应函数Object.isFrozen()判断对象是否被冻结
MyObject.deepFreeze=function(o){
    //取出当前对象中的所有属性（包括不可枚举属性，排除Symbol属性）
    let _keys=Object.getOwnPropertyNames(o)
    if(_keys.length){
        _keys.forEach(item=>{
            var _value=o[item]
            if(typeof _value==='object' && _value!==null){
                MyObject.deepFreeze(_value)
            }
        })
    }
    return Object.freeze(o)
}

MyObject.seal = function(obj) {
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
//object.Seal()     功能：封闭一个对象，阻止添加新属性并将所有现有属性标记为不可配置。当前属性的值只要原来是可写的就可以改变。
//可修改、不可删除、不可添加
//实现深密封    对应函数Object.isSealed()判断对象是否被密封
MyObject.deepSeal=function(o){
    //取出当前对象中的所有属性（包括不可枚举属性，排除Symbol属性）
    let _keys=Object.getOwnPropertyNames(o)
    if(_keys.length){
        _keys.forEach(item=>{
            var _value=o[item]
            if(typeof _value==='object' && _value!==null){
                MyObject.deepSeal(_value)
            }
        })
    }
    return Object.seal(o)
}
MyObject.preventExtensions = function(obj) {
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

//object.preventExtensions()     功能：让一个对象变的不可扩展，也就是永远不能再添加新的属性。
//可修改、可删除、不可添加
//实现深不可扩展   对应函数Object.isExtensions()判断对象是否不可扩展(不可添加)
MyObject.deepPreventExtensions=function(o){
    //取出当前对象中的所有属性（包括不可枚举属性，排除Symbol属性）
    let _keys=Object.getOwnPropertyNames(o)
    if(_keys.length){
        _keys.forEach(item=>{
            var _value=o[item]
            if(typeof _value==='object' && _value!==null){
                MyObject.deepPreventExtensions(_value)
            }
        })
    }
    return Object.preventExtensions(o)
}
//Object.isExtensible() 静态方法判断一个对象是否是可扩展的（是否可以在它上面添加新的属性）。
// 检查方法
MyObject.isExtensible = function(obj) {
    if (obj == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return false;
    }

    return !obj.__nonExtensible__;
};

MyObject.isSealed = function(obj) {
    if (obj == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return true; // 原始值被认为是密封的
    }

    // 检查是否不可扩展
    if (Object.isExtensible(obj)) {
        return false;
    }

    // 检查所有属性是否都不可配置
    const props = Object.getOwnPropertyNames(obj);
    for (const prop of props) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
        if (descriptor && descriptor.configurable) {
            return false;
        }
    }

    return true;
};

MyObject.isFrozen = function(obj) {
    if (obj == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return true; // 原始值被认为是冻结的
    }

    // 检查是否密封
    if (!Object.isSealed(obj)) {
        return false;
    }

    // 检查所有数据属性是否都不可写
    const props = Object.getOwnPropertyNames(obj);
    for (const prop of props) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

        // 对于数据属性，检查是否可写
        if (descriptor &&
            'value' in descriptor &&
            descriptor.writable) {
            return false;
        }
    }

    return true;
};

module.exports=MyObject