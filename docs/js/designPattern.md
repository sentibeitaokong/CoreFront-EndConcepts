
### NativeJs/designPattern.js
```js
//单例模式
/*
function Singleton(name){
    this.name=name
    this.instance=null
}
Singleton.prototype.getName=function () {
    console.log(this.name)
}
Singleton.getInstace=function (name) {
    if(!this.instance){
        this.instance=new Singleton(name)
    }
    return this.instance
}
var a=Singleton.getInstace('sven1')
var b=Singleton.getInstace('sven2')
console.log(a===b)*/


//策略模式
/*var strategies={
    'S':function(salary){
        return salary*4;
    },
    'A':function(salary){
        return salary*3
    },
    'B':function(salary){
        return salary*2
    }
}
var calculateBonus=function(level,salary){
    return strategies[level](salary);
}
console.log(calculateBonus('S',2000));
console.log(calculateBonus('A',2000));*/
```