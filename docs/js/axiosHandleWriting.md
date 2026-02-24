# Axios

## Axios类实例

```js
//Axios类的配置信息
function Axios(config){
    this.defaults = config
    this.interceptors={
        request:new InterceptorManager(),
        response:new InterceptorManager()
    }
}
//用于创建axios
function createInstance(config){
    //创建一个Axios实例
    let context=new Axios(config)
    //将Axios原型链上的request方法指向Axios实例，为了后续的方法调用
    let instance=Axios.prototype.request.bind(context)
    //将Axios原型链上的所有方法指向Axios实例，然后浅拷贝给instatnce，因此instance具备Axios原型链上的所有方法
    Object.keys(Axios.prototype).forEach(item=>{
        instance[item]=Axios.prototype[item].bind(context)
    })
    // 将Axios实例上所有配置信息拷贝给instance，instance现在是具备Axios实例上所有配置信息以及原型链上的所有方法
    Object.keys(context).forEach(item=>{
        instance[item]=context[item]
    })
    //疑问：为什么不直接instance=new Axios(config)，这样直接可以拿到配置项和原型链上的方法
    //主要还是因为axios还有一些自有的配置项，比如axios.cancelToken,axios.create,axios.all等方法
    //封装Axios主要用于接口请求
    return instance
}
```

**示例**

```js
// 创建 axios 函数
//创建实例
let axios = createInstance()

//创建axios实例
axios.create = function create(instanceConfig) {
    return createInstance(Object.assign({},axios.defaults, instanceConfig));
};
const duanzi = axios.create({
    baseURL: 'http://localhost:3000/posts/2',
    timeout: 2000
});
```

## Axios拦截器

```js
//拦截器管理器 存放拦截器数组
function InterceptorManager(){
    this.handlers=[]
}
InterceptorManager.prototype.use=function use(fulfilled,rejected) {
    // 将所有拦截器都储存在这个拦截器数组中
    this.handlers.push({fulfilled,rejected})
    //返回拦截器的编号
    return this.handlers.length-1
}
//get方法
Axios.prototype.get=function (url,config){
    return this.request({
        url,
        method:'get',
        ...config
    })
}
//post方法
Axios.prototype.post=function (url,config){
    return this.request({
        url,
        method:'post',
        ...config
    })
}
//Axois原型链上的方法  Axios调用的所有方法默认都是底层调用request方法
Axios.prototype.request=function (config){
    console.log('发送请求的方式是:',config.method)
    //创建一个Promise对象是为了递归处理数据
    let promise=Promise.resolve(config)
    // dispatchRequest是调用适配器函数，用于处理接口调用的返回值,undefined是占位符，保证请求加拦截器都能成对输出
    let chains=[dispatchRequest,undefined]
    // 将请求拦截器的数组放在chains数组前面待处理
    this.interceptors.request.handlers.forEach(item=>{
        chains.unshift(item.fulfilled,item.rejected)
    })
    //将响应拦截器的数组放在chains数组后面待处理
    this.interceptors.response.handlers.forEach(item=>{
        chains.push(item.fulfilled,item.rejected)
    })
    //while循环chains数组，处理所有请求拦截器，请求和响应拦截器
    while (chains.length>0){
        promise=promise.then(chains.shift(),chains.shift())
    }
    //promise.then可以递归处理数据
    return promise
}
//dispatchRequest函数是用于调用适配器方法来进行接口调用的
function dispatchRequest(config){
    //xhrAapter是适配器函数
    return xhrAapter(config).then(response=>{
        //成功返回值
        return response
    }).catch(error=>{
        //失败返回值
        return error
    })
}
```

**示例**
```js
//获取按钮
const btns = document.querySelectorAll('button');
// 设置请求拦截器  config 配置对象
axios.interceptors.request.use(function one(config) {
    console.log('请求拦截器 成功 - 1号');
    return config;
}, function one(error) {
    console.log('请求拦截器 失败 - 1号');
    return Promise.reject(error);
});

axios.interceptors.request.use(function two(config) {
    console.log('请求拦截器 成功 - 2号');
    return config;
}, function two(error) {
    console.log('请求拦截器 失败 - 2号');
    return Promise.reject(error);
});

// 设置响应拦截器
axios.interceptors.response.use(function (response) {
    console.log('响应拦截器 成功 1号');
    return response;
}, function (error) {
    console.log('响应拦截器 失败 1号')
    return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
    console.log('响应拦截器 成功 2号')
    return response;
}, function (error) {
    console.log('响应拦截器 失败 2号')
    return Promise.reject(error);
});


//请求拦截器 成功 - 2号
//请求拦截器 成功 - 1号
//响应拦截器 成功 1号
//响应拦截器 成功 2号

```


## Axios取消请求
```js
function xhrAapter(config){
    console.log('适配器函数')
    let requestData = config.data;
    //适配器函数返回一个Prosmise对象，便于处理接口返回值
    return new Promise((resolve, reject)=>{
        //ajax底层原理    创建xhrHttpRequest对象
        let xhr=new XMLHttpRequest();
        // 设置请求头
        // xhr.setRequestHeader('Content-Type', 'application/json')
        //开启一个请求
        xhr.open(config.method, config.url,true);
        //发送请求并附带请求参数
        xhr.send(JSON.stringify(requestData))
        //监听请求方法
        xhr.onreadystatechange=function () {
            //成功请求状态判断
            if(xhr.readyState===4){
                //成功状态
                if(xhr.status >= 200 && xhr.status < 300){
                    resolve({
                        //配置对象
                        config: config,
                        //响应体
                        data: xhr.response,
                        //响应头
                        headers: xhr.getAllResponseHeaders(), //字符串  parseHeaders
                        // xhr 请求对象
                        request: xhr,
                        //响应状态码
                        status: xhr.status,
                        //响应状态字符串
                        statusText: xhr.statusText
                    })
                }else{
                    //失败的状态
                    reject(new Error('请求失败 失败的状态码为' + xhr.status));
                }
            }
        }
        // 取消请求的处理
        if(config.cancelToken){
            //config.cancelToken.promise是一个promise对象
            config.cancelToken.promise.then(cancel=>{
                xhr.abort()
                //将整体结果设置为失败
                reject(new Error('请求已经被取消'))
            })
        }
    })
}
//CancelToken构造函数
function  CancelToken(executor){
    // 声明promise对象变量
    var resolvePromise
    //为CancelToken构造函数添加实例,实例里面是promise对象
    this.promise=new Promise(resolve=>{
        //存储resolve状态
        resolvePromise=resolve
    })
    executor(function () {
        //直接执行promise并让其成功
        resolvePromise()
    })
}
```

**示例**

```js
<div class="container">
    <h2 class="page-header">基本使用</h2>
    <button class="btn btn-primary"> 发送GET请求 </button>
    <button class="btn btn-warning" > 发送POST请求 </button>
    <button class="btn btn-success"> 发送 PUT 请求 </button>
    <button class="btn btn-danger"> 发送 DELETE 请求 </button>
    <button class="btn btn-primary"> 发送请求 </button>
    <button class="btn btn-warning"> 取消请求 </button>
</div>
//第一个
btns[0].onclick = function(){
    //发送 AJAX 请求
    duanzi({
        //请求类型
        method: 'GET',
        //URL
        url: ``,
    }).then(response => {
        console.log(response);
    });
}

//添加一篇新的文章
btns[1].onclick = function(){
    //发送 AJAX 请求
    axios({
        //请求类型
        method: 'POST',
        //URL
        url: 'http://localhost:3000/posts',
        //设置请求体
        data: {
            title: "今天天气不错, 还挺风和日丽的",
            author: "张三"
        }
    }).then(response => {
        console.log(response);
    });
}

//更新数据
btns[2].onclick = function(){
    //发送 AJAX 请求
    axios({
        //请求类型
        method: 'PUT',
        //URL
        url: 'http://localhost:3000/posts/3',
        //设置请求体
        data: {
            title: "今天天气不错, 还挺风和日丽的",
            author: "李四"
        }
    }).then(response => {
        console.log(response);
    });
}

//删除数据
btns[3].onclick = function(){
    //发送 AJAX 请求
    axios({
        //请求类型
        method: 'delete',
        //URL
        url: 'http://localhost:3000/posts/3',
    }).then(response => {
        console.log(response);
    });
}
//删除数据
let cancel=null
btns[4].onclick = function(){
    console.log('11111')
    //cancel不为空说明正在请求接口，直接阻止请求
    if(cancel!==null){
        cancel()
    }
    //创建cancelToken值
    let cancelToken=new CancelToken(function(c){
        cancel=c
    })
    //发送 AJAX 请求
    axios({
        //请求类型
        method: 'POST',
        //URL
        url: 'http://localhost:3000/posts',
        //设置请求体
        data: {
            title: "今天天气不错, 还挺风和日丽的",
            author: "张三"
        },
        //可以阻止请求的参数
        cancelToken:cancelToken
    }).then(response => {
        console.log(response);
        //请求结束，阻止请求参数赋值为null
        cancel=null
    });
}
btns[5].onclick = function(){
    cancel()
}
```


## Axios实现源码

```js
//Axios类的配置信息
function Axios(config){
    this.defaults = config
    this.interceptors={
        request:new InterceptorManager(),
        response:new InterceptorManager()
    }
}
//拦截器管理器 存放拦截器数组
function InterceptorManager(){
    this.handlers=[]
}
InterceptorManager.prototype.use=function use(fulfilled,rejected) {
    // 将所有拦截器都储存在这个拦截器数组中
    this.handlers.push({fulfilled,rejected})
    //返回拦截器的编号
    return this.handlers.length-1
}
//Axois原型链上的方法  Axios调用的所有方法默认都是底层调用request方法
Axios.prototype.request=function (config){
    console.log('发送请求的方式是:',config.method)
    //创建一个Promise对象是为了递归处理数据
    let promise=Promise.resolve(config)
    // dispatchRequest是调用适配器函数，用于处理接口调用的返回值,undefined是占位符，保证请求加拦截器都能成对输出
    let chains=[dispatchRequest,undefined]
    // 将请求拦截器的数组放在chains数组前面待处理
    this.interceptors.request.handlers.forEach(item=>{
        chains.unshift(item.fulfilled,item.rejected)
    })
    //将响应拦截器的数组放在chains数组后面待处理
    this.interceptors.response.handlers.forEach(item=>{
        chains.push(item.fulfilled,item.rejected)
    })
    //while循环chains数组，处理所有请求拦截器，请求和响应拦截器
    while (chains.length>0){
        promise=promise.then(chains.shift(),chains.shift())
    }
    //promise.then可以递归处理数据
    return promise
}
//dispatchRequest函数是用于调用适配器方法来进行接口调用的
function dispatchRequest(config){
    //xhrAapter是适配器函数
    return xhrAapter(config).then(response=>{
        //成功返回值
        return response
    }).catch(error=>{
        //失败返回值
        return error
    })
}
function xhrAapter(config){
    console.log('适配器函数')
    let requestData = config.data;
    //适配器函数返回一个Prosmise对象，便于处理接口返回值
    return new Promise((resolve, reject)=>{
        //ajax底层原理    创建xhrHttpRequest对象
        let xhr=new XMLHttpRequest();
        // 设置请求头
        // xhr.setRequestHeader('Content-Type', 'application/json')
        //开启一个请求
        xhr.open(config.method, config.url,true);
        //发送请求并附带请求参数
        xhr.send(JSON.stringify(requestData))
        //监听请求方法
        xhr.onreadystatechange=function () {
            //成功请求状态判断
            if(xhr.readyState===4){
                //成功状态
                if(xhr.status >= 200 && xhr.status < 300){
                    resolve({
                        //配置对象
                        config: config,
                        //响应体
                        data: xhr.response,
                        //响应头
                        headers: xhr.getAllResponseHeaders(), //字符串  parseHeaders
                        // xhr 请求对象
                        request: xhr,
                        //响应状态码
                        status: xhr.status,
                        //响应状态字符串
                        statusText: xhr.statusText
                    })
                }else{
                    //失败的状态
                    reject(new Error('请求失败 失败的状态码为' + xhr.status));
                }
            }
        }
        // 取消请求的处理
        if(config.cancelToken){
            //config.cancelToken.promise是一个promise对象
            config.cancelToken.promise.then(cancel=>{
                xhr.abort()
                //将整体结果设置为失败
                reject(new Error('请求已经被取消'))
            })
        }
    })
}
//CancelToken构造函数
function  CancelToken(executor){
    // 声明promise对象变量
    var resolvePromise
    //为CancelToken构造函数添加实例,实例里面是promise对象
    this.promise=new Promise(resolve=>{
        //存储resolve状态
        resolvePromise=resolve
    })
    executor(function () {
        //直接执行promise并让其成功
        resolvePromise()
    })
}
//get方法
Axios.prototype.get=function (url,config){
    return this.request({
        url,
        method:'get',
        ...config
    })
}
//post方法
Axios.prototype.post=function (url,config){
    return this.request({
        url,
        method:'post',
        ...config
    })
}
//用于创建axios
function createInstance(config){
    //创建一个Axios实例
    let context=new Axios(config)
    //将Axios原型链上的request方法指向Axios实例，为了后续的方法调用
    let instance=Axios.prototype.request.bind(context)
    //将Axios原型链上的所有方法指向Axios实例，然后浅拷贝给instatnce，因此instance具备Axios原型链上的所有方法
    Object.keys(Axios.prototype).forEach(item=>{
        instance[item]=Axios.prototype[item].bind(context)
    })
    // 将Axios实例上所有配置信息拷贝给instance，instance现在是具备Axios实例上所有配置信息以及原型链上的所有方法
    Object.keys(context).forEach(item=>{
        instance[item]=context[item]
    })
    //疑问：为什么不直接instance=new Axios(config)，这样直接可以拿到配置项和原型链上的方法
    //主要还是因为axios还有一些自有的配置项，比如axios.cancelToken,axios.create,axios.all等方法
    //封装Axios主要用于接口请求
    return instance
}
/*
var axios=createInstance(config)
export default axios*/

```