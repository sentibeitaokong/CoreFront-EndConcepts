### NativeJs/Function.js
```js
// ES3
//call()方法
//保证fn属性的唯一性
function fnFactory(context) {
    var unique_fn = "fn";
    while (context.hasOwnProperty(unique_fn)) {
        unique_fn = "fn" + Math.random(); // 循环判断并重新赋值
    }

    return unique_fn;
}
Function.prototype.Mycall=function (context) {
    //如果context是undefined或者Null就赋值为window,否则转换为对象
    var context=context == undefined ? window : Object(context);
    var fn = fnFactory(context); // added
    context[fn]=this
    var args=[]
    for(let i=1,len=arguments.length;i<len;i++){
        args.push(`arguments[${i}]`);
    }
    var result=eval(`context.fn(${args})`)
    delete context.fn
    return result
}
//ES6
/*Function.prototype.Mycall = function (context) {
    context = context ? Object(context) : window;
    var fn = Symbol(); // added
    context[fn] = this; // changed
    let args = [...arguments].slice(1);
    let result = context.fn(...args);
    delete context.fn
    return result;
}*/

//ES3
// apply方法
Function.prototype.MyApply=function (context,arr) {
    //如果context是undefined或者Null就赋值为window,否则转换为对象
    var context=context == undefined ? window : Object(context);
    var fn = fnFactory(context); // added
    context[fn]=this
    var result
    // 当arr传参不是对象或者方法时，就报错
    if(typeof arr!=='object'&&typeof arr!=='function'&&typeof  arr!=='undefined'){
        throw new Error('CreateListFromArrayLike called on non-object')
    }
    if(!arr){
        result=context.fn()
    }else{
        var args=[]
        for(let i=0,len=arr.length;i<len;i++){
            args.push(`arr[${i}]`);
        }
        result=eval(`context.fn(${args})`)
    }

    delete context.fn
    return result
}

//ES6
/*Function.prototype.MyApply = function (context, arr) {
    context = context ? Object(context) : window;
    var fn = Symbol(); // added
    context[fn] = this; // changed
    let result;
    if (!arr) {
        result = context.fn();
    } else {
        result = context.fn(...arr);
    }

    delete context.fn
    return result;
}*/

// bind方法
Function.prototype.MyBind=function (context) {
    if (typeof this !== "function") {
        throw new Error("Function.prototype.bind - what is trying to be bound is not callable");
    }
    var self=this
    var args=Array.prototype.slice.call(arguments,1)
    var fNOP=function () {
    }
    var newFn=function () {
        var bindArgs=Array.prototype.slice.call(arguments)
        // 判断是否this在fNOP的原型链上,如果在的话就说明是new实例化的对象，this指向实例化原型，否则指向context
        return self.apply(this instanceof fNOP?this:context,args.concat(bindArgs))
    }
    //js 圣杯模式 继承
    fNOP.prototype=this.prototype
    newFn.prototype=new fNOP()
    return newFn
}

module.exports=Function

```