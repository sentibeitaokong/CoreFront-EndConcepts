# 高阶函数

## 防抖

```js
//debounce防抖函数    功能：n秒内只要你触发事件，就重新计时，事件处理函数的程序将永远不能被执行.
//基础版本   
function debounce(func, wait) {
    var timeout;

    return function () {
        //保存this指向和函数参数
        var context = this;
        var args = arguments;
        clearTimeout(timeout)
        timeout = setTimeout(function(){
            func.apply(context, args)
        }, wait);
    }
}
//进阶版本    直接执行，可取消
function debounce(fn, wait, immediate) {
    var t = null, result
    var debounced = function () {
        var self = this
        var args = arguments
        if (t) {
            clearTimeout(t)
        }
        // 首次立即执行
        if (immediate) {
            // 执行了就不执行，等定时器执行完，再次执行
            var callNow = !t
            t = setTimeout(function () {
                t = null
            }, wait)
            if (callNow) {
                result = fn.apply(self, args)
            }
        } else {
            t = setTimeout(function () {
                result = fn.apply(self, args)
            }, wait)
        }
        return result
    }
    // 取消防抖
    debounced.cancel = function () {
        clearTimeout(t)
        t = null
    }
    return debounced
}
```

## 节流

```js
//throttle节流函数   
// 功能：只要你触发事件就开始计时，n秒内，事件处理函数的程序将永远不能被执行，n秒后才能继续执行事件处理函数.
// 基础版本 
function throttle(func, wait) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        if (!timeout) {
            timeout = setTimeout(function(){
                timeout = null;
                func.apply(context, args)
            }, wait)
        }

    }
}
//进阶版本    功能：事件被触发，n秒之内只执行一次事件处理函数  leading:false禁用第一次执行   trailing:false禁用停止触发的回调
function throttle(fn, wait, options) {
    var t = null
    var previous = 0
    if (!options) {
        options = {}
    }
    var throttled = function () {
        var self = this
        var args = arguments
        //转换时间戳
        var now = +new Date()
        if (!previous && options.leading === false) {
            previous = now
        }
        //下次触发fn的剩余时间
        var remaining = wait - (now - previous)
        //如果没有剩余的时间或者改了系统时间
        if (remaining <= 0 || remaining > wait) {
            if (t) {
                clearTimeout(t)
                t = null
            }
            previous = now
            fn.apply(self, args)
            if (!t) {
                self = args = null
            }
        } else if (!t && options.trailing !== false) {
            t = setTimeout(function () {
                previous = options.leading === false ? 0 : +new Date()
                t = null
                fn.apply(self, args)
                if (!t) {
                    self = args = null
                }
            }, remaining)
        }
    }
    //取消节流
    throttled.cancel = function () {
        t = null
        clearTimeout(t)
        previous = 0
    }
    return throttled
}
```

## 惰性函数

```js
//惰性函数 
//适用于  1.需要环境检测的场景 2.初始化成本高且结果不变的操作  3.只需执行一次的逻辑
function addEvent(type, el, fn, capture = false) {
    // 重写函数
    if (window.addEventListener) {
        addEvent = function (type, el, fn, capture) {
            el.addEventListener(type, fn, capture);
        }
    }
    else if(window.attachEvent){
        addEvent = function (type, el, fn) {
            el.attachEvent('on' + type, fn);
        }
    }
    // 执行函数，有循环爆栈风险
    addEvent(type, el, fn, capture);
}
```

## 函数柯里化

```js
 //函数柯里化 功能：把一个接受 多个参数 的函数，转换成一系列 接受单个参数 的函数的技术。
//基础版本
function curry(fn, args) {
    var length = fn.length;
    args = args || [];
    return function() {
        var _args = args.slice(0),
            arg, i;
        for (i = 0; i < arguments.length; i++) {
            arg = arguments[i];
            _args.push(arg);
        }
        if (_args.length < length) {
            return curry.call(this, fn, _args);
        } else {
            return fn.apply(this, _args);
        }
    }
}


//进阶版本
function curry(fn, args, holes) {
    length = fn.length;
    args = args || [];
    holes = holes || [];
    return function() {
        var _args = args.slice(0),
            _holes = holes.slice(0),
            argsLen = args.length,
            holesLen = holes.length,
            arg, i, index = 0;
        for (i = 0; i < arguments.length; i++) {
            arg = arguments[i];
            // 处理类似 fn(1, _, _, 4)(_, 3) 这种情况，index 需要指向 holes 正确的下标
            if (arg === _ && holesLen) {
                index++
                if (index > holesLen) {
                    _args.push(arg);
                    _holes.push(argsLen - 1 + index - holesLen)
                }
            }
            // 处理类似 fn(1)(_) 这种情况
            else if (arg === _) {
                _args.push(arg);
                _holes.push(argsLen + i);
            }
            // 处理类似 fn(_, 2)(1) 这种情况
            else if (holesLen) {
                // fn(_, 2)(_, 3)
                if (index >= holesLen) {
                    _args.push(arg);
                }
                // fn(_, 2)(1) 用参数 1 替换占位符
                else {
                    _args.splice(_holes[index], 1, arg);
                    _holes.splice(index, 1)
                }
            }
            else {
                _args.push(arg);
            }

        }
        if (_holes.length || _args.length < length) {
            return curry.call(this, fn, _args, _holes);
        }
        else {
            return fn.apply(this, _args);
        }
    }
}
```

**示例**

```js
//基础版本
var fn = curry(function(a, b, c) {
    console.log([a, b, c]);
});

fn("a", "b", "c") // ["a", "b", "c"]
fn("a", "b")("c") // ["a", "b", "c"]
fn("a")("b")("c") // ["a", "b", "c"]
fn("a")("b", "c") // ["a", "b", "c"]

//进阶版本
var _ = {};
var fn = curry(function(a, b, c, d, e) {
    console.log([a, b, c, d, e]);
});
// 验证 输出全部都是 [1, 2, 3, 4, 5]
fn(1, 2, 3, 4, 5);
fn(_, 2, 3, 4, 5)(1);
fn(1, _, 3, 4, 5)(2);
fn(1, _, 3)(_, 4)(2)(5);
fn(1, _, _, 4)(_, 3)(2)(5);
fn(_, 2)(_, _, 4)(1)(3)(5)
```

## 偏函数

```js
//偏函数  
// 1.提高代码复用性：通过参数预设创建专用函数 
// 2.增强表达能力：创建语义化的函数名称
// 3.支持函数组合：便于构建处理流水线
// 4。延迟执行：部分应用后可稍后提供剩余参数
const _ = Symbol('partial.placeholder');
function partialAdvanced(fn, ...args) {
    return function(...newArgs) {
        const finalArgs = [];
        let argIndex = 0;
        let placeholderCount = 0;
        // 处理预置参数
        for (const arg of args) {
            if (arg === _) {
                placeholderCount++;
                if (newArgs[argIndex] !== undefined) {
                    finalArgs.push(newArgs[argIndex++]);
                } else {
                    // 占位符没有对应新参数，保持为占位符（用于二次偏应用）
                    finalArgs.push(_);
                }
            } else {
                finalArgs.push(arg);
            }
        }
        // 添加剩余的新参数（填充剩余占位符）
        while (argIndex < newArgs.length) {
            finalArgs.push(newArgs[argIndex++]);
        }
        // 如果还有占位符，返回新的偏函数
        if (finalArgs.includes(_)) {
            return partialAdvanced(fn, ...finalArgs);
        }
        return fn.apply(this, finalArgs);
    };
}
```

**示例**

```js
// 使用示例：任意位置固定参数
function formatDate(year, month, day, hour, minute) {
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 固定年份和月份
const formatThisYearMonth = partialAdvanced(formatDate, 2024, 1);
console.log(formatThisYearMonth(15, 10, 30)); // "2024-1-15 10:30"

// 使用占位符固定特定位置
const formatWithFixedDay = partialAdvanced(formatDate, _, _, 15);
console.log(formatWithFixedDay(2024, 1, 10, 30)); // "2024-1-15 10:30"
```

## 函数组合

```js
 //函数组合 参数从右至左执行
function compose(){
    var args=arguments
    var start=args.length-1
    return function () {
        var i=start
        //执行最后一个参数返回result
        var result=args[start].apply(this,arguments)
        while(i--){
            result=args[i].call(this,result)
        }
        return result
    }
}
```

**示例**

```js
// 需求：输入 'kevin'，返回 'HELLO, KEVIN'。
var toUpperCase = function(x) { return x.toUpperCase(); };
var hello = function(x) { return 'HELLO, ' + x; };

var greet = compose(hello, toUpperCase);
greet('kevin'); //'HELLO, KEVIN'
```

## 函数记忆

```js
//函数记忆
function memoize(func,hasher){
  var memoized=function(key){
      var cache=memoized.cache
      var address=''+(hasher?hasher.apply(this,arguments):key);
      if(!cache[address]){
          cache[address]=func.apply(this,arguments)
      }
      return cache[address]
  }
  memoized.cache={}
  return memoized
}
```

**示例**

```js
//正常情况处理斐波那契数列
var count = 0;
var fibonacci = function(n){
    count++;
    return n < 2? n : fibonacci(n-1) + fibonacci(n-2);
};
for (var i = 0; i <= 10; i++){
    fibonacci(i)
}
console.log(count) // 453

//使用函数记忆处理斐波那契数列
var count = 0;
var fibonacci = function(n) {
    count++;
    return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
};
fibonacci = memoize(fibonacci)
for (var i = 0; i <= 10; i++) {
    fibonacci(i)
}
console.log(count) // 12
```

## 函数重载

```js
//函数重载 JavaScript 没有传统意义上的函数重载（同名不同参数）。但可以通过多种模式模拟函数重载的效果：
//通过检查 arguments 对象或参数特征来实现多态行为：
function doAdd() {
    if(arguments.length == 1) {
        console.log(arguments[0] + 5);
    } else if(arguments.length == 2) {
        console.log(arguments[0] + arguments[1]);
    }
}
```

**示例**

```js
console.log(doAdd(5));     // 10
console.log(doAdd(5, 3));  // 8
```

## 蹦床函数

```js
//递归转循环防止执行栈溢出   蹦床函数
function tco(f) {
    var value;
    var active = false;
    var accumulated = [];

    return function accumulator() {
        accumulated.push(arguments);
        if (!active) {
            active = true;
            while (accumulated.length) {
                value = f.apply(this, accumulated.shift());
            }
            active = false;
            return value;
        }
    };
}

var sum = tco(function(x, y) {
    if (y > 0) {
        return sum(x + 1, y - 1)
    }
    else {
        return x
    }
});

sum(1, 100000)
```