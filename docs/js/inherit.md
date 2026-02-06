### NativeJs/inherit.js
```js
//原型链继承   缺陷：引用类型的属性被所有实例共享  创建子实例无法向父实例传参
/*function Parent(){
    this.name='kevin'
    this.age=[18,20]
}
Parent.prototype.getName=function () {
    console.log(this.name,this.age)
}
function Child(){

}
Child.prototype=new Parent()*/


/*var child1=new Child()
child1.age.push(19)
child1.getName()
var child2=new Child()
child2.getName()*/

//构造函数继承   缺陷：每次创建实例都会创建一次实例方法
function Parent(age){
    this.name=age
    this.age=[18,20]
}
function Child(name) {
    Parent.call(this,name)
}
Child.prototype.value=1

var child=new Child('kevin')

child.age.push(19)
var child2=new Child('kevin')
console.log(child.age,child2.age,child.value,child2.value)

//组合继承    缺陷：会调用两次构造函数
/*function Parent(name) {
    this.name=name
}
Parent.prototype.getName=function () {
    console.log(this.name)
}
function Child(name) {
    Parent.call(this,name)
}
Child.prototype=new Parent()
Child.prototype.constructor=Child*/

//原型式继承  缺陷：引用类型的属性被所有实例共享
/*function createObj(o) {
    function fNOP() {

    }
    fNOP.prototype=o
    return new fNOP()
}*/


//寄生式继承   缺陷：每次创建实例的时候都会创建一次继承
function createObj(o){
    var clone=Object.create(o)
    clone.getName=function () {
        console.log('hi')
    }
    return clone;
}

//寄生组合继承
/*function Parent(name){
    this.name=name
}
Parent.prototype.getName=function () {
    console.log(this.name)
}

function Child(name){
    Parent.call(this,name)
}
var F=function () {

}
F.prototype=Parent.prototype
Child.prototype=new F()
Child.prototype.constructor=Child*/

/*var child=new Child('kevin')
child.getName()*/



//class继承
/*class Parent{
    constructor(height) {
        this.height=height
    }
    getHeight(){
        console.log(this.height)
    }
}


class Child extends Parent{
    constructor(name) {
        super(name);
    }

}

var child= new Child('18')
child.getHeight()*/

```