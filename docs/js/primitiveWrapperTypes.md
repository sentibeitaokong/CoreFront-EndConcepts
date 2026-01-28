# 原始值包装类型（Primitive Wrapper Types）
原始值包装类型是一个非常特殊且巧妙的设计，它解决了“原始值（Primitive）”无法拥有属性和方法的问题。

### 1. 核心矛盾：原始值 vs 对象

在 JS 中，数据类型分为两类：
*   **原始值**：`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`。它们是简单的值，**没有属性和方法**。
*   **引用值（对象）**：`Object`, `Array`, `Function` 等。它们可以拥有属性和方法。

**矛盾点**：
既然字符串 `'abc'` 是原始值，为什么我们可以调用 `'abc'.toUpperCase()` 或 `'abc'.length`？

**答案**：这就是**原始值包装类型**在起作用。JS 引擎在后台进行了“自动装箱”操作。

### 2. 哪些是包装类型？

主要有三个（对应三种常见的原始类型）：
1.  **`String`**：对应 string
2.  **`Number`**：对应 number
3.  **`Boolean`**：对应 boolean

*(注：`Symbol` and `BigInt` 也有对应的包装对象机制，但不能通过 `new` 显式创建)*

### 3. “自动装箱” (Auto-boxing) 原理解析

当你访问一个原始值的属性时（例如 `str.length`），JS 引擎会**瞬间**完成以下三个步骤：

假设代码是：
```js
var s1 = "some text";
var s2 = s1.substring(2);
```

**引擎在后台实际执行的过程：**

1.  **创建实例**：根据原始值，临时创建一个对应的包装对象实例。
    *   `var temp = new String("some text");`
2.  **调用方法**：在这个临时对象上调用指定的方法。
    *   `s2 = temp.substring(2);`
3.  **销毁实例**：方法调用结束后，这个临时对象被立即销毁。
    *   `temp = null;`

正是因为这个**创建 -> 执行 -> 销毁**的过程发生得非常快，让你感觉原始值好像真的有方法一样。

### 4. 显式创建 vs 隐式创建

你可以手动创建包装对象，但它们与原始值有本质区别：

| 特性 | 原始值 (Primitive) | 包装对象 (Wrapper Object) |
| :--- | :--- | :--- |
| **创建方式** | `var s = "hello"` | `var s = new String("hello")` |
| **`typeof`** | `"string"` | `"object"` |
| **真值判断** | 非空字符串为 true | **永远为 true** (因为它是对象) |

```js
var s1 = "hello";
var s2 = new String("hello");

console.log(typeof s1); // "string"
console.log(typeof s2); // "object"

console.log(s1 === s2); // false (类型不同)
console.log(s1 == s2);  // true (值相等，隐式转换)
```

### 5. 常见坑点与面试题

#### 坑点 1：给原始值添加属性

由于包装对象的生命周期**只有一瞬间**，你给原始值添加属性是无效的。

```js
var str = "abc";
str.color = "red"; // 步骤1: 创建临时对象 -> 步骤2: 添加属性 -> 步骤3: 销毁对象

console.log(str.color); // undefined
// 这里又创建了一个新的临时对象，这个新对象显然没有 color 属性
```

#### 坑点 2：Boolean 包装对象的误导性

这是最容易出错的地方：**`new Boolean(false)` 在条件判断中是 `true`！**

```js
var falseObject = new Boolean(false);
var result = falseObject && true;

console.log(result); // true
```
**原因**：`falseObject` 是一个对象。在 JS 中，**所有的对象（包括空对象）转为布尔值时都是 `true`**。所以永远不要显式地使用 `new Boolean()`。

---

### 6. 拆箱 (Unboxing)

如果想把包装对象变回原始值，可以使用 `valueOf()`或`toString()` 方法。

```js
var obj = new Number(123); // object
var obj2= new String('123'); // object
var val = obj.valueOf();   // number 123
var val= obj.toString(); // string 123


console.log(typeof obj); // "object"
console.log(typeof obj2); // "object"
console.log(typeof val); // "number"
console.log(typeof val2); // "string"
```

### 7. 总结

1.  **目的**：让原始值像对象一样方便地调用方法（如 `substring`, `toFixed`）。
2.  **机制**：**读取**属性时，临时创建对象；读取完毕，立即销毁。
3.  **最佳实践**：
    *   **不要**显式地使用 `new Number()`, `new String()`, `new Boolean()` 创建对象，这会带来混淆和性能损耗。
    *   可以直接使用 `Number()`, `String()`（不带 new）作为**类型转换函数**使用，这是安全的。