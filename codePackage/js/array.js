/**
 * 原数组修改方法： push/pop/splice/sort/reverse/shift/unshift
 * push方法  功能：将一个或多个元素添加到数组的末尾，并返回该数组的新长度。
 */

Array.prototype.myPush = function () {
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    for(let i=0;i<arguments.length;i++){
        this[len] = arguments[i]
        len++
    }
    this.length = len
    return this.length
}

/**
 * pop 方法 功能：从数组中删除最后一个元素，并返回该元素的值。此方法会更改数组的长度。
 */

Array.prototype.myPop = function () {
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

/**
 * unshift方法  功能：将一个或多个元素添加到数组的开头，并返回该数组的新长度(该方法修改原有数组)
 */

Array.prototype.myUnshift = function () {
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

//

/**
 * unique  功能：数组去重
 */

Array.prototype.unique = function () {
    let temp = {}
    let newArr = []
    for (let i = 0; i < this.length; i++) {
        if (!temp.hasOwnProperty(this[i])) {
            temp[this[i]] = this[i]
            newArr.push(this[i])
        }
    }
    return newArr
}



/**
 * at  功能：接收一个整数值并返回该索引的项目，允许正数和负数。负整数从数组中的最后一个项目开始倒数。
 * 传入的参数true和false会被转换为1和0，string类型的数字会转换为数字作为数组索引访问，其他全部返回数组第一项.
 */

Array.prototype.myAt = function (index) {
    index = index ? typeof index === 'number' ? index :
        (index-=0) && index === index ? index : 0 : 0
    if (index >= 0) {
        return this[index]
    } else {
        return this[this.length + index]
    }
}


/**
 * concat方法 功能：用于合并两个或多个数组。此方法不会更改现有数组，而是返回一个新数组,浅拷贝现存数组old_array
 * concat将对象引用复制到新数组中。 原始数组old_array和新数组new_array都引用相同的对象。 也就是说，如果引用的对象被修改，则更改对于新数组和原始数组都是可见的。 这包括也是数组的数组参数的元素。
 * var new_array = old_array.concat(value1[, value2[, ...[, valueN]]])
 * 内置的Symbol.isConcatSpreadable符号用于配置某对象作为Array.prototype.concat()方法的参数时是否展开其数组元素,数组对象默认设置为true,类数组对象默认设置为false。
 * 当设置为true时，使用concat拼接数组时，默认展开一层数组元素，否则不展开
 */


Array.prototype.Myconcat=function (){
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


/**
 * copWithin方法  功能：浅复制数组的一部分到同一数组中的另一个位置，并返回它，不会改变原数组的长度。
 * copyWithin 方法不要求其 this 值必须是一个数组对象；除此之外，copyWithin 是一个可变方法，它可以改变 this 对象本身，并且返回它，而不仅仅是它的拷贝。
 * MDN   //>>>  功能 ：所有非数值转换成0,所有大于等于 0 等数取整数部分     >>：有符号右移
 */

Array.prototype.MycopyWithin = function(target, start/*, end*/) {
    // Steps 1-2.
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }

    var O = Object(this);

    // Steps 3-5.

    var len = O.length >>> 0;

    // Steps 6-8.
    var relativeTarget = target >> 0;

    //负数:数组length+本身      正数:本身与数组长度取最小值
    var to = relativeTarget < 0 ?
        Math.max(len + relativeTarget, 0) :
        Math.min(relativeTarget, len);

    // Steps 9-11.
    var relativeStart = start >> 0;

    var from = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

    // Steps 12-14.
    // 没传end就取数组长度，否则取end
    var end = arguments[2];
    var relativeEnd = end === undefined ? len : end >> 0;

    var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

    // Step 15.
    var count = Math.min(final - from, len - to);

    // Steps 16-17.
    var direction = 1;

    if (from < to && to < (from + count)) {
        console.log(from)
        debugger
        direction = -1;
        from += count - 1;
        to += count - 1;
    }

    // Step 18.
    while (count > 0) {
        if (from in O) {
            O[to] = O[from];
        } else {
            delete O[to];
        }

        from += direction;
        to += direction;
        count--;
    }

    // Step 19.
    return O;
}

/**
 * entries()方法  功能：返回一个新的Array Iterator对象，该对象包含数组中每个索引的键/值对。
 */

Array.prototype.myEntries = function() {
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


/**
 * every方法  功能：测试一个数组内的所有元素是否都能通过某个指定函数的测试。它返回一个布尔值。
 * 如果为 every 提供一个 thisArg 参数，则该参数为调用 callback 时的 this 值。如果省略该参数，
 * 则 callback 被调用时的 this 值，在非严格模式下为全局对象，在严格模式下传入 undefined。详见 this 条目。
 */

Array.prototype.Myevery=function (fn,thisArg){
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


/**
 * fill方法    功能：用一个固定值填充一个数组中从起始索引到终止索引内的全部元素。不包括终止索引
 * fill 方法接受三个参数 value, start 以及 end. start 和 end 参数是可选的，其默认值分别为 0 和 this 对象的 length 属性值。
 * 如果 start 是个负数，则开始索引会被自动计算成为 length+start, 其中 length 是 this 对象的 length 属性值。如果 end 是个负数，则结束索引会被自动计算成为 length+end。
 * fill 方法故意被设计成通用方法，该方法不要求 this 是数组对象。
 * fill 方法是个可变方法，它会改变调用它的 this 对象本身，然后返回它，而并不是返回一个副本。
 * 当一个对象被传递给 fill方法的时候，填充数组的是这个对象的引用。
 * MDN
 */

Array.prototype.Myfill=function (value){
    // Steps 1-2.
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }

    var O = Object(this);

    // Steps 3-5.
    var len = O.length >>> 0;

    // Steps 6-7.
    var start = arguments[1];
    var relativeStart = start >> 0;

    // Step 8.
    var k = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

    // Steps 9-10.
    var end = arguments[2];
    var relativeEnd = end === undefined ?
        len : end >> 0;

    // Step 11.
    var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

    // Step 12.
    while (k < final) {
        O[k] = value;
        k++;
    }

    // Step 13.
    return O;
}



/**
 * filter方法   功能：filter 为数组中的每个元素调用一次 callback 函数，
 * 并利用所有使得callback 返回 true 或等价于 true 的值的元素创建一个新数组。
 * callback 只会在已经赋值的索引上被调用，对于那些已经被删除或者从未被赋值的索引不会被调用。
 * 那些没有通过 callback 测试的元素会被跳过，不会被包含在新数组中。
 */

Array.prototype.Myfilter=function (fn,thisArg){
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


/**
 * find方法    功能：返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined
 * 在第一次调用 callback 函数时会确定元素的索引范围，因此在 find 方法开始执行之后添加到数组的新元素将不会被 callback 函数访问到。
 * 如果数组中一个尚未被 callback 函数访问到的元素的值被 callback 函数所改变，那么当 callback 函数访问到它时，它的值是将是根据它在数组中的索引所访问到的当前值。
 * 被删除的元素仍旧会被访问到，但是其值已经是 undefined 了。
 */

Array.prototype.Myfind=function (fn,thisArg){
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




/**
 * findIndex方法   功能：返回数组中找到的元素的值，而不是其索引。
 * 在第一次调用callback函数时会确定元素的索引范围，因此在findIndex方法开始执行之后添加到数组的新元素将不会被callback函数访问到。
 * 如果数组中一个尚未被callback函数访问到的元素的值被callback函数所改变，那么当callback函数访问到它时，
 * 它的值是将是根据它在数组中的索引所访问到的当前值。被删除的元素仍然会被访问到。
 */

Array.prototype.MyfindIndex=function (fn,thisArg){
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




/**
 * flat方法    功能：按照一个可指定的深度递归遍历数组，并将所有元素与遍历到的子数组中的元素合并为一个新数组返回。
 * var newArray = arr.flat([depth]) depth 可选指定要提取嵌套数组的结构深度，默认值为 1。
 * 扁平化数组 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
 */

Array.prototype.Myflat=function (depth=1){
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
//将数组扁平化并去除其中重复数据，最终得到一个升序且不重复的数组
/*Array.prototype.flat= function() {
    return [].concat(...this.map(item => (Array.isArray(item) ? item.flat() : [item])));
}
Array.prototype.unique = function() {
    return [...new Set(this)]
}
const sort = (a, b) => a - b;
console.log(arr.flat().unique().sort(sort)); // [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ]*/



/**
 * flatMap方法   功能:首先使用映射函数映射每个元素，然后将结果压缩成一个新数组。它与 map 连着深度值为 1 的 flat 几乎相同，但 flatMap 通常在合并成一种方法的效率稍微高一些。
 * 与map方法相同，但结构深度depth值为1
 * 返回值 一个新的数组，其中每个元素都是回调函数的结果，并且结构深度 depth 值为 1.
 */





/**
 * forEach方法    功能：对数组的每个元素执行一次给定的函数。返回值undefined 那些已删除或者未初始化的项将被跳过
 * forEach() 为每个数组元素执行一次 callback 函数；与 map() 或者 reduce() 不同的是，它总是返回 undefined 值，
 * 并且不可链式调用。其典型用例是在一个调用链的最后执行副作用（side effects，函数式编程上，指函数进行 返回结果值 以外的操作）。
 * 除了抛出异常以外，没有办法中止或跳出 forEach() 循环。如果你需要中止或跳出循环，forEach() 方法不是应当使用的工具。
 * 若你需要提前终止循环，你可以使用：一个简单的 for 循环，for...of / for...in 循环
 */

Array.prototype.MyforEach= function (fn,thisArg){
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


/**
 * from方法   功能：对一个类似数组或可迭代对象创建一个新的，浅拷贝的数组实例。
 * Array.from(arrayLike[, mapFn[, thisArg]])
 * 参数：arrayLike想要转换成数组的伪数组对象或可迭代对象,mapFn 可选如果指定了该参数，新数组中的每个元素会执行该回调函数,thisArg 可选参数，执行回调函数 mapFn 时 this 对象。
 * from() 的 length 属性为 1 ，即 Array.from.length === 1。
 */
Array.Myfrom=(function() {
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

/**
 *includes方法   功能：用来判断一个数组是否包含一个指定的值，根据情况，如果包含则返回 true，否则返回 false。
 * 技术上来讲，includes() 使用 零值相等 算法来确定是否找到给定的元素。
 * arr.includes(valueToFind[, fromIndex])
 * 如果 fromIndex 大于等于数组的长度，则将直接返回 false，且不搜索该数组。
 * 如果 fromIndex 为负值，计算出的索引将作为开始搜索searchElement的位置。如果计算出的索引小于 0，则整个数组都会被搜索。
 * includes() 方法有意设计为通用方法。它不要求this值是数组对象，所以它可以被用于其他类型的对象 (比如类数组对象)
 */

Array.prototype.Myincludes=function(valueFind,fromIndex=0){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    const O = Object(this)
    const len = O.length >>> 0
    if(len===0){
        return false
    }
    if(fromIndex<0){
        fromIndex=len+fromIndex
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
/**
 *indexOf方法  功能：返回在数组中可以找到一个给定元素的第一个索引，如果不存在，则返回-1。
 */

Array.prototype.MyindexOf=function(valueFind,fromIndex=0){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    fromIndex = fromIndex ? typeof fromIndex === 'number' ? fromIndex : typeof fromIndex === 'string' ?
        (fromIndex-=0) && fromIndex === fromIndex ? fromIndex : 0 : 0 : 0
    const O = Object(this)
    const len = O.length >>> 0
    if(fromIndex<0){
        fromIndex=len+fromIndex
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

/**
 *isArray方法   功能：确定传递的值是否是一个 Array。
 */

Array.MyisArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
};

/**
 * join方法   功能：将一个数组（或一个类数组对象）的所有元素连接成一个字符串并返回这个字符串。如果数组只有一个项目，那么将返回该项目而不使用分隔符。
 */

Array.prototype.Myjoin=function(char){
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
/**
 * keys方法      功能：返回一个包含数组中每个索引键的Array Iterator对象。
 * 索引迭代器会包含那些没有对应元素的索引
 */


Array.prototype.Mykeys=function (){
    if(!typeof this==='object') return
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
/**
 * lastIndexOf方法    功能：返回指定元素（也即有效的 JavaScript 值或变量）在数组中的最后一个的索引，如果不存在则返回 -1。从数组的后面向前查找，从 fromIndex 处开始。
 * arr.lastIndexOf(searchElement[, fromIndex])   使用严格相等进行判断
 * fromIndex 可选
 * 从此位置开始逆向查找。默认为数组的长度减 1(arr.length - 1)，即整个数组都被查找。如果该值大于或等于数组的长度，则整个数组会被查找。
 * 如果为负值，将其视为从数组末尾向前的偏移。即使该值为负，数组仍然会被从后向前查找。如果该值为负时，其绝对值大于数组长度，则方法返回 -1，即数组不会被查找。
 */
Array.prototype.MyLastIndexOf=function(valueFind,fromIndex=this.length-1){
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

/**
 * map方法  功能：创建一个新数组，这个新数组由原数组中的每个元素都调用一次提供的函数后的返回值组成。
 * map 不修改调用它的原数组本身（当然可以在 callback 执行时改变原数组）
 * map 方法处理数组元素的范围是在 callback 方法第一次调用之前就已经确定了。调用map方法之后追加的数组元素不会被callback访问。
 * 如果存在的数组元素改变了，那么传给callback的值是map访问该元素时的值。在map函数调用后但在访问该元素前，该元素被删除的话，则无法被访问到。
 * */
Array.prototype.MyMap= function (fn,thisArg){
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
/*of方法    功能：创建一个具有可变数量参数的新数组实例，而不考虑参数的数量或类型。*/
Array.MyOf = function() {
    return Array.prototype.slice.call(arguments);
};

/**
 * Array.prototype.reduce(callback,initialValue)
 * reduce() 方法对数组中的每个元素执行一个由您提供的reducer函数(升序执行)，将其结果汇总为单个返回值。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
 * callback 执行数组中每个值的函数，包含四个参数：
 * accumulator: 累计器累计回调的返回值; 它是上一次调用回调时返回的累积值，或initialValue（见于下方）。
 * currentValue: 数组中正在处理的元素。
 * currentIndex可选: 数组中正在处理的当前元素的索引。 如果提供了initialValue，则起始索引号为0，否则为1。
 * array可选: 调用reduce()的数组
 * initialValue 可选
 * 作为第一次调用 callback函数时的第一个参数的值。 如果没有提供初始值，则将使用数组中的第一个元素。 在没有初始值的空数组上调用 reduce 将报错。
 */
Array.prototype.MyReduce=function (fn){
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
/**
 * Array.prototype.reduceRight(callback,initialValue)
 * reduceRight() 方法对数组中的每个元素执行一个由您提供的reducer函数(降序执行)，将其结果汇总为单个返回值。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight
 * callback 执行数组中每个值的函数，包含四个参数：
 * accumulator: 累计器累计回调的返回值; 它是上一次调用回调时返回的累积值，或initialValue（见于下方）。
 * currentValue: 数组中正在处理的元素。
 * currentIndex可选: 数组中正在处理的当前元素的索引。 如果提供了initialValue，则起始索引号为0，否则为1。
 * array可选: 调用reduceRight()的数组
 * initialValue 可选
 * 作为第一次调用 callback函数时的第一个参数的值。 如果没有提供初始值，则将使用数组中的第一个元素。 在没有初始值的空数组上调用 reduceRight 将报错。
 */
Array.prototype.MyReduceRight=function (fn){
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

/**
 * Array.prototype.reverse()
 * reverse()  方法将数组中元素的位置颠倒,并返回该数组。该方法会改变原数组。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
 * 方法颠倒数组中元素的位置，并返回该数组的引用。
 */
Array.prototype.MyReverse=function (){
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
/**
 *  shift方法      功能：从数组中删除第一个元素，并返回该元素的值。此方法更改数组的长度。
 */
Array.prototype.Myshift=function (){
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
/**
 * Array.prototype.slice(begin,end)
 * 方法返回一个新的数组对象，这一对象是一个由 begin和 end（不包括end）决定的原数组的浅拷贝。原始数组不会被改变。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
 * slice 不修改原数组，只会返回一个浅复制了原数组中的元素的一个新数组。原数组的元素会按照下述规则拷贝：
 * 如果该元素是个对象引用 （不是实际的对象），slice 会拷贝这个对象引用到新的数组里。
 * 两个对象引用都引用了同一个对象。如果被引用的对象发生改变，则新的和原来的数组中的这个元素也会发生改变。
 * 对于字符串、数字及布尔值来说（不是 String、Number 或者 Boolean 对象），slice 会拷贝这些值到新的数组里。
 * 在别的数组里修改这些字符串或数字或是布尔值，将不会影响另一个数组。
 *
 */
Array.prototype.MySlice=function (begin,end){
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
/**
 * Array.prototype.some(callback,context)
 * some() 方法测试是否至少有一个元素通过由提供的函数实现的测试。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/some
 * callback 生成新数组元素的函数，使用三个参数：
 * currentValue
 * callback 数组中正在处理的当前元素。
 * index可选
 * callback 数组中正在处理的当前元素的索引。
 * array可选
 * callback  some 方法被调用的数组。
 * thisArg可选
 * 执行 callback 函数时使用的this 值。
 */
Array.prototype.MySome=function (fn,thisArg){
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

/**
 * Array.prototype.values()方法返回一个新的 Array Iterator 对象，该对象包含数组每个索引的值。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/values
 * 数组迭代器是一次性的，或者说临时对象
 * 如果数组中元素改变，那么迭代器的值也会改变
 */
Array.prototype.MyValues=function (){
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

/**
 * Array.prototype.toString()方法 功能：返回一个字符串，表示指定的数组及其元素。
 * Array对象覆盖了Object的 toString 方法。对于数组对象，toString 方法连接数组并返回一个字符串，其中包含用逗号分隔的每个数组元素。
 * 当一个数组被作为文本值或者进行字符串连接操作时，将会自动调用其 toString 方法。
 * Array.prototype.toString.call({join(){ return 42 }})返回42   数组的toString()实际调用了join()
 */



/**
 * Array.prototype.toLocaleString()方法 功能：返回一个字符串表示数组中的元素。
 * 数组中的元素将使用各自的 toLocaleString 方法转成字符串，这些字符串将使用一个特定语言环境的字符串（例如一个逗号 ","）隔开。
 *
 */

/**
 * sort() 方法用原地算法对数组的元素进行排序，并返回数组。排序算法现在是稳定的。默认排序顺序是根据字符串Unicode码点。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 * compareFunction 可选
 * 用来指定按某种顺序进行排列的函数。如果省略，元素按照转换为的字符串的各个字符的Unicode位点进行排序。
 * firstEl
 * 第一个用于比较的元素。
 * secondEl
 * 第二个用于比较的元素。
 * 当排序非 ASCII 字符的字符串（如包含类似 e, é, è, a, ä 等字符的字符串）。一些非英语语言的字符串需要使用 String.localeCompare。这个函数可以将函数排序到正确的顺序。
 * 自 ES10（EcmaScript 2019）起，规范 要求 Array.prototype.sort 为稳定排序。   比较的元素相等时维持原顺序
 */
/**
 * 快排
 * @param {*} arr 待排序数组
 * @param {*} low 起点
 * @param {*} high 终点
 * @param {*} cb 比较函数
 */
function quickSort(arr,low,high,cb) {
    if(low<high){
        var mid = partition(arr,low,high,cb)
        quickSort(arr,low,mid-1,cb)
        quickSort(arr,mid+1,high,cb)
    }
    return arr
}
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
Array.prototype.mySort = function(cb) {
    return quickSort(this,0,this.length-1,cb)
}

/**
 * Array.prototype.splice(start,deleteCount,item1,...,itemN)
 * 方法通过删除或替换现有元素来修改数组,并以数组形式返回被修改的内容。此方法会改变原数组。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 * 如果添加进数组的元素个数不等于被删除的元素个数，数组的长度会发生相应的改变。
 *
 */
Array.prototype.mySplice = function(start,deleteCount) {
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
    var args = arguments.length > 2 ? Array.prototype.mySlice.call(arguments,2) : []
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
module.exports = Array;/**
 * 原数组修改方法： push/pop/splice/sort/reverse/shift/unshift
 * push方法  功能：将一个或多个元素添加到数组的末尾，并返回该数组的新长度。
 */

Array.prototype.myPush = function () {
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    for(let i=0;i<arguments.length;i++){
        this[len] = arguments[i]
        len++
    }
    this.length = len
    return this.length
}

/**
 * pop 方法 功能：从数组中删除最后一个元素，并返回该元素的值。此方法会更改数组的长度。
 */

Array.prototype.myPop = function () {
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

/**
 * unshift方法  功能：将一个或多个元素添加到数组的开头，并返回该数组的新长度(该方法修改原有数组)
 */

Array.prototype.myUnshift = function () {
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

//

/**
 * unique  功能：数组去重
 */

Array.prototype.unique = function () {
    let temp = {}
    let newArr = []
    for (let i = 0; i < this.length; i++) {
        if (!temp.hasOwnProperty(this[i])) {
            temp[this[i]] = this[i]
            newArr.push(this[i])
        }
    }
    return newArr
}



/**
 * at  功能：接收一个整数值并返回该索引的项目，允许正数和负数。负整数从数组中的最后一个项目开始倒数。
 * 传入的参数true和false会被转换为1和0，string类型的数字会转换为数字作为数组索引访问，其他全部返回数组第一项.
 */

Array.prototype.myAt = function (index) {
    index = index ? typeof index === 'number' ? index :
        (index-=0) && index === index ? index : 0 : 0
    if (index >= 0) {
        return this[index]
    } else {
        return this[this.length + index]
    }
}


/**
 * concat方法 功能：用于合并两个或多个数组。此方法不会更改现有数组，而是返回一个新数组,浅拷贝现存数组old_array
 * concat将对象引用复制到新数组中。 原始数组old_array和新数组new_array都引用相同的对象。 也就是说，如果引用的对象被修改，则更改对于新数组和原始数组都是可见的。 这包括也是数组的数组参数的元素。
 * var new_array = old_array.concat(value1[, value2[, ...[, valueN]]])
 * 内置的Symbol.isConcatSpreadable符号用于配置某对象作为Array.prototype.concat()方法的参数时是否展开其数组元素,数组对象默认设置为true,类数组对象默认设置为false。
 * 当设置为true时，使用concat拼接数组时，默认展开一层数组元素，否则不展开
 */


Array.prototype.Myconcat=function (){
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


/**
 * copWithin方法  功能：浅复制数组的一部分到同一数组中的另一个位置，并返回它，不会改变原数组的长度。
 * copyWithin 方法不要求其 this 值必须是一个数组对象；除此之外，copyWithin 是一个可变方法，它可以改变 this 对象本身，并且返回它，而不仅仅是它的拷贝。
 * MDN   //>>>  功能 ：所有非数值转换成0,所有大于等于 0 等数取整数部分     >>：有符号右移
 */

Array.prototype.MycopyWithin = function(target, start/*, end*/) {
    // Steps 1-2.
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }

    var O = Object(this);

    // Steps 3-5.

    var len = O.length >>> 0;

    // Steps 6-8.
    var relativeTarget = target >> 0;

    //负数:数组length+本身      正数:本身与数组长度取最小值
    var to = relativeTarget < 0 ?
        Math.max(len + relativeTarget, 0) :
        Math.min(relativeTarget, len);

    // Steps 9-11.
    var relativeStart = start >> 0;

    var from = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

    // Steps 12-14.
    // 没传end就取数组长度，否则取end
    var end = arguments[2];
    var relativeEnd = end === undefined ? len : end >> 0;

    var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

    // Step 15.
    var count = Math.min(final - from, len - to);

    // Steps 16-17.
    var direction = 1;

    if (from < to && to < (from + count)) {
        direction = -1;
        from += count - 1;
        to += count - 1;
    }

    // Step 18.
    while (count > 0) {
        if (from in O) {
            O[to] = O[from];
        } else {
            delete O[to];
        }

        from += direction;
        to += direction;
        count--;
    }

    // Step 19.
    return O;
}

/**
 * entries()方法  功能：返回一个新的Array Iterator对象，该对象包含数组中每个索引的键/值对。
 */

Array.prototype.myEntries = function() {
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


/**
 * every方法  功能：测试一个数组内的所有元素是否都能通过某个指定函数的测试。它返回一个布尔值。
 * 如果为 every 提供一个 thisArg 参数，则该参数为调用 callback 时的 this 值。如果省略该参数，
 * 则 callback 被调用时的 this 值，在非严格模式下为全局对象，在严格模式下传入 undefined。详见 this 条目。
 */

Array.prototype.Myevery=function (fn,thisArg){
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


/**
 * fill方法    功能：用一个固定值填充一个数组中从起始索引到终止索引内的全部元素。不包括终止索引
 * fill 方法接受三个参数 value, start 以及 end. start 和 end 参数是可选的，其默认值分别为 0 和 this 对象的 length 属性值。
 * 如果 start 是个负数，则开始索引会被自动计算成为 length+start, 其中 length 是 this 对象的 length 属性值。如果 end 是个负数，则结束索引会被自动计算成为 length+end。
 * fill 方法故意被设计成通用方法，该方法不要求 this 是数组对象。
 * fill 方法是个可变方法，它会改变调用它的 this 对象本身，然后返回它，而并不是返回一个副本。
 * 当一个对象被传递给 fill方法的时候，填充数组的是这个对象的引用。
 * MDN
 */

Array.prototype.Myfill=function (value){
    // Steps 1-2.
    if (this == null) {
        throw new TypeError('this is null or not defined');
    }

    var O = Object(this);

    // Steps 3-5.
    var len = O.length >>> 0;

    // Steps 6-7.
    var start = arguments[1];
    var relativeStart = start >> 0;

    // Step 8.
    var k = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

    // Steps 9-10.
    var end = arguments[2];
    var relativeEnd = end === undefined ?
        len : end >> 0;

    // Step 11.
    var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

    // Step 12.
    while (k < final) {
        O[k] = value;
        k++;
    }

    // Step 13.
    return O;
}



/**
 * filter方法   功能：filter 为数组中的每个元素调用一次 callback 函数，
 * 并利用所有使得callback 返回 true 或等价于 true 的值的元素创建一个新数组。
 * callback 只会在已经赋值的索引上被调用，对于那些已经被删除或者从未被赋值的索引不会被调用。
 * 那些没有通过 callback 测试的元素会被跳过，不会被包含在新数组中。
 */

Array.prototype.Myfilter=function (fn,thisArg){
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


/**
 * find方法    功能：返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined
 * 在第一次调用 callback 函数时会确定元素的索引范围，因此在 find 方法开始执行之后添加到数组的新元素将不会被 callback 函数访问到。
 * 如果数组中一个尚未被 callback 函数访问到的元素的值被 callback 函数所改变，那么当 callback 函数访问到它时，它的值是将是根据它在数组中的索引所访问到的当前值。
 * 被删除的元素仍旧会被访问到，但是其值已经是 undefined 了。
 */

Array.prototype.Myfind=function (fn,thisArg){
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




/**
 * findIndex方法   功能：返回数组中找到的元素的值，而不是其索引。
 * 在第一次调用callback函数时会确定元素的索引范围，因此在findIndex方法开始执行之后添加到数组的新元素将不会被callback函数访问到。
 * 如果数组中一个尚未被callback函数访问到的元素的值被callback函数所改变，那么当callback函数访问到它时，
 * 它的值是将是根据它在数组中的索引所访问到的当前值。被删除的元素仍然会被访问到。
 */

Array.prototype.MyfindIndex=function (fn,thisArg){
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




/**
 * flat方法    功能：按照一个可指定的深度递归遍历数组，并将所有元素与遍历到的子数组中的元素合并为一个新数组返回。
 * var newArray = arr.flat([depth]) depth 可选指定要提取嵌套数组的结构深度，默认值为 1。
 * 扁平化数组 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
 */

Array.prototype.Myflat=function (depth=1){
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
//将数组扁平化并去除其中重复数据，最终得到一个升序且不重复的数组
/*Array.prototype.flat= function() {
    return [].concat(...this.map(item => (Array.isArray(item) ? item.flat() : [item])));
}
Array.prototype.unique = function() {
    return [...new Set(this)]
}
const sort = (a, b) => a - b;
console.log(arr.flat().unique().sort(sort)); // [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ]*/



/**
 * flatMap方法   功能:首先使用映射函数映射每个元素，然后将结果压缩成一个新数组。它与 map 连着深度值为 1 的 flat 几乎相同，但 flatMap 通常在合并成一种方法的效率稍微高一些。
 * 与map方法相同，但结构深度depth值为1
 * 返回值 一个新的数组，其中每个元素都是回调函数的结果，并且结构深度 depth 值为 1.
 */





/**
 * forEach方法    功能：对数组的每个元素执行一次给定的函数。返回值undefined 那些已删除或者未初始化的项将被跳过
 * forEach() 为每个数组元素执行一次 callback 函数；与 map() 或者 reduce() 不同的是，它总是返回 undefined 值，
 * 并且不可链式调用。其典型用例是在一个调用链的最后执行副作用（side effects，函数式编程上，指函数进行 返回结果值 以外的操作）。
 * 除了抛出异常以外，没有办法中止或跳出 forEach() 循环。如果你需要中止或跳出循环，forEach() 方法不是应当使用的工具。
 * 若你需要提前终止循环，你可以使用：一个简单的 for 循环，for...of / for...in 循环
 */

Array.prototype.MyforEach= function (fn,thisArg){
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


/**
 * from方法   功能：对一个类似数组或可迭代对象创建一个新的，浅拷贝的数组实例。
 * Array.from(arrayLike[, mapFn[, thisArg]])
 * 参数：arrayLike想要转换成数组的伪数组对象或可迭代对象,mapFn 可选如果指定了该参数，新数组中的每个元素会执行该回调函数,thisArg 可选参数，执行回调函数 mapFn 时 this 对象。
 * from() 的 length 属性为 1 ，即 Array.from.length === 1。
 */
Array.Myfrom=(function() {
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

/**
 *includes方法   功能：用来判断一个数组是否包含一个指定的值，根据情况，如果包含则返回 true，否则返回 false。
 * 技术上来讲，includes() 使用 零值相等 算法来确定是否找到给定的元素。
 * arr.includes(valueToFind[, fromIndex])
 * 如果 fromIndex 大于等于数组的长度，则将直接返回 false，且不搜索该数组。
 * 如果 fromIndex 为负值，计算出的索引将作为开始搜索searchElement的位置。如果计算出的索引小于 0，则整个数组都会被搜索。
 * includes() 方法有意设计为通用方法。它不要求this值是数组对象，所以它可以被用于其他类型的对象 (比如类数组对象)
 */

Array.prototype.Myincludes=function(valueFind,fromIndex=0){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    const O = Object(this)
    const len = O.length >>> 0
    if(len===0){
        return false
    }
    if(fromIndex<0){
        fromIndex=len+fromIndex
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
/**
 *indexOf方法  功能：返回在数组中可以找到一个给定元素的第一个索引，如果不存在，则返回-1。
 */

Array.prototype.MyindexOf=function(valueFind,fromIndex=0){
    if (this == null) {
        throw new TypeError('this is null or not defined')
    }
    fromIndex = fromIndex ? typeof fromIndex === 'number' ? fromIndex : typeof fromIndex === 'string' ?
        (fromIndex-=0) && fromIndex === fromIndex ? fromIndex : 0 : 0 : 0
    const O = Object(this)
    const len = O.length >>> 0
    if(fromIndex<0){
        fromIndex=len+fromIndex
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

/**
 *isArray方法   功能：确定传递的值是否是一个 Array。
 */

Array.MyisArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
};

/**
 * join方法   功能：将一个数组（或一个类数组对象）的所有元素连接成一个字符串并返回这个字符串。如果数组只有一个项目，那么将返回该项目而不使用分隔符。
 */

Array.prototype.Myjoin=function(char){
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
/**
 * keys方法      功能：返回一个包含数组中每个索引键的Array Iterator对象。
 * 索引迭代器会包含那些没有对应元素的索引
 */


Array.prototype.Mykeys=function (){
    if(!typeof this==='object') return
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
/**
 * lastIndexOf方法    功能：返回指定元素（也即有效的 JavaScript 值或变量）在数组中的最后一个的索引，如果不存在则返回 -1。从数组的后面向前查找，从 fromIndex 处开始。
 * arr.lastIndexOf(searchElement[, fromIndex])   使用严格相等进行判断
 * fromIndex 可选
 * 从此位置开始逆向查找。默认为数组的长度减 1(arr.length - 1)，即整个数组都被查找。如果该值大于或等于数组的长度，则整个数组会被查找。
 * 如果为负值，将其视为从数组末尾向前的偏移。即使该值为负，数组仍然会被从后向前查找。如果该值为负时，其绝对值大于数组长度，则方法返回 -1，即数组不会被查找。
 */
Array.prototype.MyLastIndexOf=function(valueFind,fromIndex=this.length-1){
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

/**
 * map方法  功能：创建一个新数组，这个新数组由原数组中的每个元素都调用一次提供的函数后的返回值组成。
 * map 不修改调用它的原数组本身（当然可以在 callback 执行时改变原数组）
 * map 方法处理数组元素的范围是在 callback 方法第一次调用之前就已经确定了。调用map方法之后追加的数组元素不会被callback访问。
 * 如果存在的数组元素改变了，那么传给callback的值是map访问该元素时的值。在map函数调用后但在访问该元素前，该元素被删除的话，则无法被访问到。
 * */
Array.prototype.MyMap= function (fn,thisArg){
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
/*of方法    功能：创建一个具有可变数量参数的新数组实例，而不考虑参数的数量或类型。*/
Array.MyOf = function() {
    return Array.prototype.slice.call(arguments);
};

/**
 * Array.prototype.reduce(callback,initialValue)
 * reduce() 方法对数组中的每个元素执行一个由您提供的reducer函数(升序执行)，将其结果汇总为单个返回值。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
 * callback 执行数组中每个值的函数，包含四个参数：
 * accumulator: 累计器累计回调的返回值; 它是上一次调用回调时返回的累积值，或initialValue（见于下方）。
 * currentValue: 数组中正在处理的元素。
 * currentIndex可选: 数组中正在处理的当前元素的索引。 如果提供了initialValue，则起始索引号为0，否则为1。
 * array可选: 调用reduce()的数组
 * initialValue 可选
 * 作为第一次调用 callback函数时的第一个参数的值。 如果没有提供初始值，则将使用数组中的第一个元素。 在没有初始值的空数组上调用 reduce 将报错。
 */
Array.prototype.MyReduce=function (fn){
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
/**
 * Array.prototype.reduceRight(callback,initialValue)
 * reduceRight() 方法对数组中的每个元素执行一个由您提供的reducer函数(降序执行)，将其结果汇总为单个返回值。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight
 * callback 执行数组中每个值的函数，包含四个参数：
 * accumulator: 累计器累计回调的返回值; 它是上一次调用回调时返回的累积值，或initialValue（见于下方）。
 * currentValue: 数组中正在处理的元素。
 * currentIndex可选: 数组中正在处理的当前元素的索引。 如果提供了initialValue，则起始索引号为0，否则为1。
 * array可选: 调用reduceRight()的数组
 * initialValue 可选
 * 作为第一次调用 callback函数时的第一个参数的值。 如果没有提供初始值，则将使用数组中的第一个元素。 在没有初始值的空数组上调用 reduceRight 将报错。
 */
Array.prototype.MyReduceRight=function (fn){
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

/**
 * Array.prototype.reverse()
 * reverse()  方法将数组中元素的位置颠倒,并返回该数组。该方法会改变原数组。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
 * 方法颠倒数组中元素的位置，并返回该数组的引用。
 */
Array.prototype.MyReverse=function (){
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
/**
 *  shift方法      功能：从数组中删除第一个元素，并返回该元素的值。此方法更改数组的长度。
 */
Array.prototype.Myshift=function (){
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
/**
 * Array.prototype.slice(begin,end)
 * 方法返回一个新的数组对象，这一对象是一个由 begin和 end（不包括end）决定的原数组的浅拷贝。原始数组不会被改变。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
 * slice 不修改原数组，只会返回一个浅复制了原数组中的元素的一个新数组。原数组的元素会按照下述规则拷贝：
 * 如果该元素是个对象引用 （不是实际的对象），slice 会拷贝这个对象引用到新的数组里。
 * 两个对象引用都引用了同一个对象。如果被引用的对象发生改变，则新的和原来的数组中的这个元素也会发生改变。
 * 对于字符串、数字及布尔值来说（不是 String、Number 或者 Boolean 对象），slice 会拷贝这些值到新的数组里。
 * 在别的数组里修改这些字符串或数字或是布尔值，将不会影响另一个数组。
 *
 */
Array.prototype.MySlice=function (begin,end){
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
/**
 * Array.prototype.some(callback,context)
 * some() 方法测试是否至少有一个元素通过由提供的函数实现的测试。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/some
 * callback 生成新数组元素的函数，使用三个参数：
 * currentValue
 * callback 数组中正在处理的当前元素。
 * index可选
 * callback 数组中正在处理的当前元素的索引。
 * array可选
 * callback  some 方法被调用的数组。
 * thisArg可选
 * 执行 callback 函数时使用的this 值。
 */
Array.prototype.MySome=function (fn,thisArg){
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

/**
 * Array.prototype.values()方法返回一个新的 Array Iterator 对象，该对象包含数组每个索引的值。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/values
 * 数组迭代器是一次性的，或者说临时对象
 * 如果数组中元素改变，那么迭代器的值也会改变
 */
Array.prototype.MyValues=function (){
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

/**
 * Array.prototype.toString()方法 功能：返回一个字符串，表示指定的数组及其元素。
 * Array对象覆盖了Object的 toString 方法。对于数组对象，toString 方法连接数组并返回一个字符串，其中包含用逗号分隔的每个数组元素。
 * 当一个数组被作为文本值或者进行字符串连接操作时，将会自动调用其 toString 方法。
 * Array.prototype.toString.call({join(){ return 42 }})返回42   数组的toString()实际调用了join()
 */



/**
 * Array.prototype.toLocaleString()方法 功能：返回一个字符串表示数组中的元素。
 * 数组中的元素将使用各自的 toLocaleString 方法转成字符串，这些字符串将使用一个特定语言环境的字符串（例如一个逗号 ","）隔开。
 *
 */

/**
 * sort() 方法用原地算法对数组的元素进行排序，并返回数组。排序算法现在是稳定的。默认排序顺序是根据字符串Unicode码点。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 * compareFunction 可选
 * 用来指定按某种顺序进行排列的函数。如果省略，元素按照转换为的字符串的各个字符的Unicode位点进行排序。
 * firstEl
 * 第一个用于比较的元素。
 * secondEl
 * 第二个用于比较的元素。
 * 当排序非 ASCII 字符的字符串（如包含类似 e, é, è, a, ä 等字符的字符串）。一些非英语语言的字符串需要使用 String.localeCompare。这个函数可以将函数排序到正确的顺序。
 * 自 ES10（EcmaScript 2019）起，规范 要求 Array.prototype.sort 为稳定排序。   比较的元素相等时维持原顺序
 */
/**
 * 快排
 * @param {*} arr 待排序数组
 * @param {*} low 起点
 * @param {*} high 终点
 * @param {*} cb 比较函数
 */
function quickSort(arr,low,high,cb) {
    if(low<high){
        var mid = partition(arr,low,high,cb)
        quickSort(arr,low,mid-1,cb)
        quickSort(arr,mid+1,high,cb)
    }
    return arr
}
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
Array.prototype.mySort = function(cb) {
    return quickSort(this,0,this.length-1,cb)
}

/**
 * Array.prototype.splice(start,deleteCount,item1,...,itemN)
 * 方法通过删除或替换现有元素来修改数组,并以数组形式返回被修改的内容。此方法会改变原数组。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 * 如果添加进数组的元素个数不等于被删除的元素个数，数组的长度会发生相应的改变。
 *
 */
Array.prototype.mySplice = function(start,deleteCount) {
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
    var args = arguments.length > 2 ? Array.prototype.mySlice.call(arguments,2) : []
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
module.exports = Array;