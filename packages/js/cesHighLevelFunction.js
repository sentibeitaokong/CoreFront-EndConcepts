//偏函数
/*
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
function formatDate(year, month, day, hour, minute) {
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 固定年份和月份
const formatThisYearMonth = partialAdvanced(formatDate, 2024, 1);
console.log(formatThisYearMonth(15, 10, 30)); // "2024-1-15 10:30"

// 使用占位符固定特定位置
const formatWithFixedDay = partialAdvanced(formatDate, _, _, 15);
console.log(formatWithFixedDay(2024, 1, 10, 30)); // "2024-1-15 10:30"*/

//函数记忆
/*function memoize(func,hasher){
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
var count = 0;
var fibonacci = function(n){
    count++;
    return n < 2? n : fibonacci(n-1) + fibonacci(n-2);
};
for (var i = 0; i <= 10; i++){
    fibonacci(i)
}

console.log(count) // 453

var count = 0;
var fibonacci = function(n) {
    count++;
    return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
};

fibonacci = memoize(fibonacci)

for (var i = 0; i <= 10; i++) {
    fibonacci(i)
}

console.log(count) // 12*/

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

var fn = curry(function(a, b, c) {
    console.log([a, b, c]);
});

fn("a", "b", "c") // ["a", "b", "c"]
fn("a", "b")("c") // ["a", "b", "c"]
fn("a")("b")("c") // ["a", "b", "c"]
fn("a")("b", "c") // ["a", "b", "c"]
