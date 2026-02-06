### NativeJs/Promise.js
```js
const PENDING='PENDING',
        FULFILLED='FULFILLED',
        REJECTED='REJECTED'
function resolvePromise(promise,x,resolve,reject){
    // 如果 promise2 和 x 相同，抛出错误
    if(promise===x){
        return reject(new TypeError(' Chaining cycle detected for promise #MyPromise'))
    }
    // 判断x的类型
    // promise 有n种实现 都符合了这个规范 兼容别人的promise
    // 严谨 🇬应该判断 别人的promise 如果失败了就不能在调用成功 如果成功了不能在调用失败
    let called=false
    // 怎么判断 x是不是一个promise 看他有没有then方法
    if((typeof x==='object'&&x!==null)||typeof x==='function'){
        try{
            // 取then方法可能会出错，所以需要使用 trycatch
            let then=x.then
            if(typeof  then==='function'){
                // 如果 then 为 一个函数，我就认为他是一个promise
                // 直接使用取好的then，而不是使用x.then，否则会在次取值，有可能第一次取值没有报错，第二次取值就报错了
                then.call(x,y=>{
                    // 如果promise是成功的就把结果向下传，如果失败的就让下一个人也失败
                    if(called) return ; //防止多次调用成功和失败
                    called=true
                    // resolve(y)
                    // 为什么要使用 递归？
                    resolvePromise(promise,y,resolve,reject)
                },(r)=>{
                    // 报错的时候就直接往下走，不用再担心 是不是 promise 了
                    if(called) return ;
                    called=true
                    reject(r)
                })
            }else{
                // 说明 x 是一个普通对象，直接成功即可
                resolve(x)
            }
        }catch (e) {
            // 为了辨别这个promise 防止调用多次
            if(called) return ;
            called=true
            reject(e)
        }
    }else{
        // x是个常量
        resolve(x)
    }
}
class MyPromise{
    constructor(executor) {
        // 默认是等待态
        this.status=PENDING              //状态
        this.value=undefined             //成功返回值
        this.reason=undefined            //失败返回值
        this.onFulfillCallbacks=[]       //成功回调
        this.onRejectedCallbacks=[]      //失败回调
        const  resolve=(value)=>{
            // 只有状态为 PENDING 时才允许修改状态，因为promise状态不可逆
            if(this.status===PENDING){
                this.status=FULFILLED
                this.value=value
                // 发布
                this.onFulfillCallbacks.forEach(fn=>fn())
            }
        }
        const reject=(reason)=>{
            if(this.status===PENDING){
                this.status=REJECTED
                this.reason=reason
                // 发布
                this.onRejectedCallbacks.forEach(fn=>fn())
            }
        }
        // executor 中抛出错误时也会执行 reject()
        try{
            // 立即执行
            executor(resolve,reject)
        }catch (e) {
            //报错直接reject
            reject(e)
        }
    }
    /**
     * @description:
     * then方法会用到一个发布订阅模式，处理 executor 中的异步代码.
     * 如果resolve()的是一个Promise，会自动将这个promise执行，并且采用他的状态，如果成功会将成功的结果向下一层传递，
     * 如果then方法中的成功或者失败 执行的时候发生错误 会走下一个then的失败的回调
     * 如果then方法返回了一个失败的promise他会走外层then的失败的回调
     *  1、（then中传递的函数）判断成功/失败函数的返回结果
     *  2、 如果是 promise 则，采用它的结果
     *  3、 如果不是promise 则，继续将结果传递下去
     * @param {*} onFulfilled
     * @param {*} onRejected
     */
    // 同一个promise then 多次
    then(onFulfilled,onRejected){
        onFulfilled = typeof onFulfilled === 'function'? onFulfilled: value => value;     //onFulfilled是方法说明还是promise对象，否则是常量
        onRejected = typeof onRejected === 'function'? onRejected: reason =>{ throw reason } ;  //同上
        // 可以不停的调用then方法,返还了一个新的promise
        // 异步的特点 等待当前主栈代码都执行后才执行
        let promise2=new MyPromise((resolve, reject) => {
            if(this.status===FULFILLED){
                //异步执行结果
                // 为什么要使用 setTimeout ？ 如果不使用 setTimeout ，promise2 则会报错，涉及到代码的执行顺序问题，
                // 需要先 new完后再将结果赋值给 promise2 可以去掉  setTimeout 打印一下 promise2 看看
                // setTimeout作用： 为了保证 promise2 已经 new 完了
                setTimeout(()=>{
                    // try catch 用于 捕获 onFulfilled 函数的异常，比如 在执行 onFulfilled 函数的时候抛错，
                    // 或者 onFulfilled 函数中 手动抛出错误
                    // constructor 中的 try catch 无法捕获这里异步代码的异常
                    try{
                        // 调用当前then方法的结果，来判断当前这个promise2 是成功还是失败
                        let x=onFulfilled(this.value)
                        // 这里的x是普通值还是promise
                        // 如果是一个promise呢？继续递归下去
                        // 判断 x 和 promise2 和 promise 的关系
                        resolvePromise(promise2,x,resolve, reject)
                    }catch (e) {
                        reject(e)
                    }
                },0)


            }
            if(this.status===REJECTED){
                setTimeout(()=>{
                    try{
                        let x=onRejected(this.reason)
                        resolvePromise(promise2,x,resolve, reject)
                    }catch (e) {
                        reject(e)
                    }
                },0)
            }
            if(this.status===PENDING){
                // 订阅
                this.onFulfillCallbacks.push(()=>{
                    try{
                        let x=onFulfilled(this.value)
                        resolvePromise(promise2,x,resolve, reject)
                    }catch (e) {
                        reject(e)
                    }
                })
                this.onRejectedCallbacks.push(()=>{
                    try{
                        let x=onRejected(this.reason)
                        resolvePromise(promise2,x,resolve, reject)
                    }catch (e) {
                        reject(e)
                    }
                })
            }
        })
        return promise2

    }
    catch(errorBack){
        return this.then(null,errorBack)
    }
    //finally 执行完finally中的回调函数并把数据传递到最后
    finally(callback){
        return this.then(value=>{
            return MyPromise.resolve(callback()).then(()=>value)
        },reason=>{
            return MyPromise.reject(callback()).then(()=>{
                throw new Error('Error')
            })
        })
    }
    static resolve(value){

        if (value instanceof Promise) return value;
        if (value === null) return null;
        // 判断如果是promise
        if (typeof value === 'object' || typeof value === 'function') {
            try {
                // 判断是否有then方法
                let then = value.then;
                if (typeof then === 'function') {
                    return new MyPromise(then.call(value)); // 执行value方法
                }
            } catch (e) {
                return new MyPromise( (resolve, reject) =>{
                    reject(e);
                });
            }
        }
        return new MyPromise( (resolve, reject) =>{
            // if(isPromise(value)){
            //     value.then(resolve,reject)
            // }else{
            //     resolve(value);
            // }
            resolve(value);
        });
    }
    static reject(reason){
        return new MyPromise((resolve,reject)=>{
            reject(reason)
        })
    }
    //当所有promise对象都成功时，状态为成功，当有一个promise对象失败时，状态就为失败
    static all(values){
        return new MyPromise((resolve,reject)=> {
            let resultArr = []
            let orderIndex = 0;
            if (!isIterable(values)) {
                    throw new TypeError(`${values} is not iterable (cannot read property Symbol(Symbol.iterator))`);
            }
            let len=values.length
            if(len===0){
                resolve([])
            }
            //获得所有成功的promise对象返回值
            const processResultByKey = (value,index)=>{
                resultArr[index] = value
                orderIndex++
                if(orderIndex === len){
                    resolve(resultArr)
                }
            }
            values.forEach((value,i)=>{
                if(isPromise(value)){
                    //成功返回成功状态，并返回所有promise对象返回值，否则为失败
                    value.then(value=>{
                        processResultByKey(value,i)
                    },reject)
                }else {
                    processResultByKey(value,i)
                }
            })
        })
    }
    //当所有promise对象都失败时，状态为失败，否则为成功
    static any(values){
        return new MyPromise((resolve,reject)=>{
            let count=0
            let len=values.length
            if(len===0){
                resolve([])
            }
            if (!isIterable(values)) {
                throw new TypeError(`${values} is not iterable (cannot read property Symbol(Symbol.iterator))`);
            }
            values.forEach((item,i)=>{
                if(isPromise(item)){
                    item.then((resolve,reject)=>{
                        count++
                        if(count===values.length){
                            reject(new Error('All promises were rejected'))
                        }
                    })
                }else{
                    resolve(item);
                }
                /*item.then(value=>{
                    resolve(value)
                },reason=>{
                    count++
                    if(count===values.length){
                        reject(new Error('All promises were rejected'))
                    }
                })*/
            })
        })
    }
    //返回第一个promise对象的返回值
    static race(values){
        return new MyPromise((resolve,reject)=>{
            if (!isIterable(values)) {
                throw new TypeError(`${values} is not iterable (cannot read property Symbol(Symbol.iterator))`);
            }
            values.forEach(value=>{
                if(isPromise(value)){
                    value.then(resolve,reject)
                }else{
                    resolve(value);
                }
            })
        })
    }
    static deferred(){
        const dfd={}
        dfd.promise=new MyPromise((resolve,reject)=>{
            dfd.resolve=resolve
            dfd.reject=reject
        })
        return dfd
    }
    //获得所有promise对象的返回值，无论成功还是失败
    static allSettled(values){
        return new MyPromise((resolve,reject)=>{
            const result=[]
            let count=0
            if (!isIterable(values)) {
                throw new TypeError(`${values} is not iterable (cannot read property Symbol(Symbol.iterator))`);
            }
            let len=values.length
            if(len===0){
                resolve([])
            }
            const addData=(status,value,i)=>{
                count++
                result[i]={
                    status,
                    value
                }
                if(count===len){
                    resolve(result)
                }
            }

            values.forEach((item,i)=>{
                if(isPromise(item)){
                    item.then(res=>{
                        addData('Fulfilled',res,i)
                    },reason=>{
                        addData('Rejected',reason,i)
                    })
                }else {
                    addData('Fulfilled',item,i)
                }
            })
        })
    }
}
//判断是否是Promise对象
function isPromise (x) {
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    let then = x.then;
    //有then方法则算是promise
    return typeof then === 'function';
  }
  return false;
}
function isIterable (value) {
  return value !== null && value !== undefined && typeof value[Symbol.iterator] === 'function';
}
module.exports=MyPromise

```