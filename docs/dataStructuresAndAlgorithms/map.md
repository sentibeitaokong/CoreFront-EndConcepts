# 字典 (Dictionary / Map)

## 1. 核心概念与特性 

在计算机科学中，**字典 (Dictionary)**，也常被称为**映射 (Map)** 或**关联数组**。它用来存储**[键, 值] (Key-Value) 对**。

如果说集合（Set）是只存储 `[值, 值]` 的数据结构，那么字典就是存储独特 `[键, 值]` 组合的数据结构，其中**键名必须是唯一的**，用于快速查找对应的值。

| 特性 | ES5 对象 (Object) 模拟字典的缺陷 | ES6 原生 `Map` 的优势 |
| :--- | :--- | :--- |
| **键的类型** | **只能是字符串或 Symbol**。如果传入对象作键，会被强转为 `"[object Object]"`。 | **任何类型都可以作为键**（包括函数、对象、NaN、基本类型）。 |
| **顺序性** | 键的遍历顺序较为复杂且不可靠（特别是混合数字键和字符串键时）。 | **严格按照插入顺序**进行遍历。 |
| **大小获取** | 必须手动遍历或使用 `Object.keys(obj).length`，时间复杂度 $O(n)$。 | 内置 `.size` 属性，时间复杂度 $O(1)$。 |
| **迭代性** | 默认不可迭代，不能直接用 `for...of`。 | 实现了 Iterable 协议，天然支持 `for...of` 和扩展运算符。 |

## 2. ES6 原生 `Map` 的核心操作

在现代 JavaScript 开发中，当我们需要真正的字典结构时，强烈推荐使用原生的 `Map`。

### 2.1 基础增删改查
```js
const myMap = new Map();

// 1. 设置键值对 (set) - 支持链式调用
myMap.set('name', 'Alice')
     .set('age', 25)
     .set({ id: 1 }, 'Object Key'); // 对象也可以作为键！

// 2. 根据键获取值 (get)
console.log(myMap.get('name')); // 输出: 'Alice'
console.log(myMap.get('gender')); // 输出: undefined

// 3. 判断键是否存在 (has)
console.log(myMap.has('age')); // true

// 4. 获取字典大小 (size)
console.log(myMap.size); // 3

// 5. 删除键值对 (delete)
myMap.delete('age');
console.log(myMap.has('age')); // false

// 6. 清空字典 (clear)
// myMap.clear();
```

### 2.2 遍历字典
`Map` 提供了三个遍历器生成函数和一个遍历方法。

```js
const map = new Map([
  ['a', 1],
  ['b', 2]
]);

// 1. 遍历键 (keys)
for (let key of map.keys()) {
  console.log(key); // 'a', 'b'
}

// 2. 遍历值 (values)
for (let value of map.values()) {
  console.log(value); // 1, 2
}

// 3. 遍历键值对 (entries) - Map 默认的迭代器就是 entries
for (let [key, value] of map.entries()) {
  console.log(key, value);
}
// 等价于
for (let [key, value] of map) {
  console.log(key, value);
}

// 4. forEach 方法
map.forEach((value, key, mapSelf) => {
  console.log(key, value);
});
```

## 3. 手写模拟实现一个字典类

为了加深理解，我们用 ES6 之前的语法（基于普通 `Object`）来模拟实现一个基础版的字典。

*注意：此模拟实现的键依然会被转为字符串，无法做到像 ES6 `Map` 那样支持对象作为键，这只是为了演示数据结构的逻辑封装。*

```js
class Dictionary {
  constructor() {
    this.items = {};
  }

  // 辅助方法：将 key 转换为字符串，避免对象作为 key 时都被转成 "[object Object]"
  // 虽然这不能完全解决对象作 key 的问题，但稍微好一点
  toStrFn(item) {
    if (item === null) {
      return 'NULL';
    } else if (item === undefined) {
      return 'UNDEFINED';
    } else if (typeof item === 'string' || item instanceof String) {
      return `${item}`;
    }
    // 对于对象，如果实现了自定义的 toString 方法，可以区分它们
    return item.toString(); 
  }

  // 1. 设置键值对
  set(key, value) {
    if (key != null && value != null) {
      const tableKey = this.toStrFn(key);
      this.items[tableKey] = value;
      return true;
    }
    return false;
  }

  // 2. 移除键值对
  remove(key) {
    if (this.hasKey(key)) {
      delete this.items[this.toStrFn(key)];
      return true;
    }
    return false;
  }

  // 3. 检查键是否存在
  hasKey(key) {
    return this.items.hasOwnProperty(this.toStrFn(key));
  }

  // 4. 获取值
  get(key) {
    const tableKey = this.toStrFn(key);
    return this.hasKey(tableKey) ? this.items[tableKey] : undefined;
  }

  // 5. 清空字典
  clear() {
    this.items = {};
  }

  // 6. 获取字典大小
  size() {
    return Object.keys(this.items).length;
  }

  // 7. 获取所有键名
  keys() {
    return Object.keys(this.items);
  }

  // 8. 获取所有值
  values() {
    return Object.values(this.items);
  }
}

// === 测试模拟字典 ===
const dict = new Dictionary();
dict.set('name', 'Gandalf');
dict.set('email', 'gandalf@email.com');

console.log(dict.hasKey('email')); // true
console.log(dict.size());          // 2
console.log(dict.keys());          // ["name", "email"]
console.log(dict.values());        // ["Gandalf", "gandalf@email.com"]

dict.remove('name');
console.log(dict.keys());          // ["email"]
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 什么时候用 `Object`，什么时候用 `Map`？
*   **用 `Object`**：当你的数据结构是固定的、用于表示一条记录（如用户信息：姓名、年龄），且键都是**字符串**时。对象字面量的语法更简洁，JSON 序列化也更天然。
*   **用 `Map`**：
    1.  当键名可能在运行时动态改变，或者**键名必须是对象/非字符串类型**时。
    2.  当需要频繁进行键值对的**增删操作**时（`Map` 的底层对这类操作做了优化）。
    3.  当你需要保证遍历时的**顺序严格一致**时。
    4.  当你需要用到巨大的数据集时。

### 4.2 为什么我把对象作为 `Map` 的键，却 `get` 不到值？
这是初学者最容易踩的坑。
```js
const map = new Map();
map.set({ id: 1 }, "User Info");

// 这样取不到！返回 undefined
console.log(map.get({ id: 1 })); 
```
*   **原因**：`Map` 判断键是否相等使用的是类似严格相等的底层算法（SameValueZero）。你 `set` 进去的对象和 `get` 时传入的新对象 `{ id: 1 }`，虽然内容一样，但它们在**内存中的地址引用是不同的**，所以 `Map` 认为这是两个完全不同的键。
*   **正确做法**：必须保存对原始对象的引用。
    ```js
    const keyObj = { id: 1 };
    map.set(keyObj, "User Info");
    console.log(map.get(keyObj)); // 输出: "User Info"
    ```

### 4.3 `WeakMap` 是什么？
与 `WeakSet` 类似，`WeakMap` 是一种键对垃圾回收机制友好的字典。
*   **核心特点**：它的**键必须是对象**。它对键的引用是“弱引用”。这意味着，如果外部代码清除了对这个键对象的引用，垃圾回收器会自动回收该对象，并且 `WeakMap` 中对应的键值对也会自动消失。
*   **应用场景**：在 Vue 3 的响应式系统源码中，广泛使用了 `WeakMap` 来存储对象及其对应的依赖（Dep），这样当组件销毁、原始数据对象被回收时，不会因为响应式系统的拦截而造成内存泄漏。