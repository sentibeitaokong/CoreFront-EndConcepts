const MyPromise=require('./Promise');
//  promise 测试
/*let promise=new MyPromise((resolve,reject)=>{   //executor执行器
    resolve('promise1')
    /!* setTimeout(()=>{
         resolve('success')
     },2000)*!/
});
// promise.then(res=>{console.log(res)})


let promise2=promise.then((value)=>{
    console.log(value)                        //promise1
    return new MyPromise((resolve,reject)=>{
        setTimeout(()=>{
            resolve(new MyPromise((resolve,reject)=>{
                resolve(new MyPromise((resolve,reject)=>{
                    resolve(new MyPromise((resolve,reject)=>{
                        resolve('new Promise3')
                    }))
                }))
            }))
            // resolve('new Promise')
        },2000)
    })
},(reason)=>{
    return reason
})

promise2.then().then().then().then().then().then((res)=>{
    console.log(res)                         //resolved 2
}).catch((error)=>{
    console.log('Error:'+error)
})


const resolved = MyPromise.resolve(2);
resolved.then(val => {
    console.log('resolved', val)  //resolved 2
}).finally(res=>{
    console.log('finally'+res)   //finallyundefined
})*/


/*const rejected = MyPromise.reject(1);
rejected.catch(val => {
    console.log('reject', val)             //reject 1
}).finally(res=>{
    console.log('finally'+res)             //finallyundefined
})*/

const resolved = MyPromise.resolve(1);
const rejected = MyPromise.reject(-1);
const rejected1 = MyPromise.reject(-2);
const resolved1 = MyPromise.resolve(17);

// const p = Promise.race([rejected,resolved,resolved1]);
// const p = Promise.any([rejected,resolved,resolved1]);
// const p = Promise.all([rejected,resolved,resolved1,rejected1]);
const p = MyPromise.allSettled([resolved,resolved1,rejected]);
p.then((result) => {
    console.log('result', result)
}).catch(err => {
    console.log('err1', err)
}).finally((res) => {
    console.log('finally'+res)
})
// const p =MyPromise.deferred()
// console.log(p)
