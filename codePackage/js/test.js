/*var obj = new Number(123); // object
var obj2= new String('123'); // object
var val = obj.valueOf();   // number 123
var val2= obj.toString(); // string 123


console.log(typeof obj); // "object"
console.log(typeof obj2); // "object"
console.log(typeof val); // "number"
console.log(typeof val2);*/


function Animal(name) {
    this.name = name; // 实例自身属性
    this.colors = ['black', 'white']; // 引用类型属性，用于测试
}

// 在父类原型上添加共享方法
Animal.prototype.eat = function() {
    console.log(`${this.name} is eating.`);
};
function Dog(name) {
    Animal.call(this, name); // 继承自身属性
}

Dog.prototype = new Animal(); // 继承原型方法
Dog.prototype.constructor = Dog; // 修正 constructor 指向

const dog1 = new Dog('Buddy');
dog1.eat(); // "Buddy is eating."
const dog2 = new Dog('Max');
dog1.colors.push('brown');
console.log(dog1)
console.log(dog2.colors); // ['black', 'white'] (未被污染)

