# JavaScript `JSON.parse()` 和 `JSON.stringify()`

*   **`JSON.stringify()` (序列化)**: 将 JavaScript **值** (通常是对象或数组) 转换为 **JSON 字符串**。
*   **`JSON.parse()` (反序列化/解析)**: 将 **JSON 字符串** 转换为 JavaScript **值**。

## **1. `JSON.stringify()`**

`JSON.stringify()` 方法将一个 JavaScript 对象或值转换为 JSON 字符串。

**基础语法**:
`JSON.stringify(value[, replacer[, space]])`

### **1.1 `value` (必需)**

要转换的 JavaScript 值。

**基础用法**:
```javascript
const user = {
  id: 1,
  name: "Alice",
  isAdmin: true,
  courses: ["Math", "Science"],
  profile: {
    age: 30,
    city: "New York"
  }
};

const jsonString = JSON.stringify(user);
console.log(jsonString);
// 输出: '{"id":1,"name":"Alice","isAdmin":true,"courses":["Math","Science"],"profile":{"age":30,"city":"New York"}}'
```

**序列化规则与陷阱**:
1.  **`undefined`, `Function`, `Symbol`**:
    *   如果它们是**对象属性值**，这些键值对会**被忽略**（直接消失）。
    *   如果它们在**数组中**，会被转换为 `null`。
    *   如果它们是**顶层值**，`JSON.stringify()` 会返回 `undefined`。
2.  **`NaN`, `Infinity`, `-Infinity`**: 无论在对象还是数组中，都会被转换为 `null`。
3.  **`Date` 对象**: 会被转换为其 `toISOString()` 格式的**字符串**。
4.  **`RegExp`, `Error` 对象**: 会被转换为空对象 `{}`。
5.  **循环引用**: 如果对象存在循环引用，会抛出 `TypeError: Converting circular structure to JSON`。
6.  **`BigInt`**: 会抛出 `TypeError: Do not know how to serialize a BigInt`。
7.  **只序列化可枚举自身属性**: 原型链上的属性会被忽略。

```javascript
const data = {
  a: undefined,
  b: Symbol('id'),
  c: () => {},
  d: [NaN, Infinity]
};
console.log(JSON.stringify(data)); // '{"d":[null,null]}' (a, b, c 都消失了)
```

### **1.2 `replacer` (可选)**

一个**函数**或一个**数组**，用于在序列化过程中转换或过滤值。

*   **作为函数 `(key, value) => newValue`**:
    *   该函数会对要序列化的对象的每个键值对调用一次。
    *   `key` 是属性名，`value` 是属性值。
    *   **返回值**:
        *   返回一个 `Number`, `String`, `Boolean` 或 `Object`，该值会替代原始值。
        *   返回 `undefined`，该键值对会被忽略。
        *   返回 `null`，该值会变成 `null`。

    ```javascript
    const product = { name: "Laptop", price: 1200, secretCode: "XYZ123" };

    const replacerFunc = (key, value) => {
      if (key === "secretCode") {
        return undefined; // 过滤掉 secretCode
      }
      if (key === "price") {
        return `$${value}`; // 修改 price 的值
      }
      return value;
    };

    console.log(JSON.stringify(product, replacerFunc));
    // '{"name":"Laptop","price":"$1200"}'
    ```

*   **作为数组**:
    *   数组中的字符串值指定了**要被包含**在最终 JSON 字符串中的属性名。

    ```javascript
    const user = { name: "Alice", age: 30, city: "New York" };
    const whitelist = ["name", "age"];

    console.log(JSON.stringify(user, whitelist));
    // '{"name":"Alice","age":30}'
    ```

### **1.3 `space` (可选)**

用于控制最终字符串的**缩进和间距**，使其更具可读性。

*   **作为数字 (1-10)**: 指定每个级别缩进的空格数。
    ```javascript
    const user = { name: "Alice", age: 30 };
    console.log(JSON.stringify(user, null, 2));
    /*
    {
      "name": "Alice",
      "age": 30
    }
    */
    ```
*   **作为字符串 (最多 10 个字符)**: 该字符串将被用作缩进。
    ```javascript
    console.log(JSON.stringify(user, null, '----'));
    /*
    {
    ----"name": "Alice",
    ----"age": 30
    }
    */
    ```

## **2. `JSON.parse()`**

`JSON.parse()` 方法将一个 JSON 字符串解析为 JavaScript 对象或值。

**基础语法**:
`JSON.parse(text[, reviver])`

### **2.1 `text` (必需)**

一个**有效的 JSON 字符串**。如果字符串格式不符合 JSON 规范，会抛出 `SyntaxError`。

**基础用法**:
```javascript
const jsonString = '{"id":1,"name":"Alice","isAdmin":true,"courses":["Math","Science"]}';
const userObject = JSON.parse(jsonString);

console.log(userObject.name); // "Alice"
console.log(userObject.courses[0]); // "Math"
```

**常见错误**:
*   **属性名必须是双引号**: `'{ "name": "Bob" }'` 是有效的，`"{ 'name': 'Bob' }"` 或 `"{ name: 'Bob' }"` 都会报错。
*   **末尾逗号**: JSON 不支持在数组或对象的最后一个元素后有逗号。`'[1, 2, ]'` 会报错。

### **2.2 `reviver` (可选)**

一个**函数 `(key, value) => newValue`**，它会在解析后、返回结果前，对每个键值对进行转换。

*   **执行顺序**: 从最内层的键值对开始，逐级向外处理，直到顶层。
*   **返回值**:
    *   返回任何值，该值会替代原始解析出的值。
    *   返回 `undefined`，该键值对会被从其父对象中删除。
    *   不返回值 (或返回原始 `value`)，则保持不变。

**最经典的应用：将日期字符串转换回 `Date` 对象**
```javascript
const jsonString = '{"name":"Meeting","time":"2023-10-27T10:00:00.000Z"}';

const reviverFunc = (key, value) => {
  // 正则表达式匹配 ISO 8601 日期格式
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
};

const eventObject = JSON.parse(jsonString, reviverFunc);

console.log(eventObject.time instanceof Date); // true
```

## **3. 常见问题与技巧 (FAQ)**

*   **Q1: 如何用 `JSON.stringify` 实现深拷贝？**
    *   **A**: `const deepCopy = JSON.parse(JSON.stringify(originalObject));`
    *   **重要**: 这是一个**有缺陷**的深拷贝。它简单快捷，但无法处理函数、`undefined`、`Date`、循环引用等情况。只应用于纯粹的、JSON 安全的数据。

*   **Q2: 如何处理 `BigInt` 的序列化？**
    *   **A**: `BigInt` 默认不支持。你需要通过 `replacer` 或修改 `BigInt.prototype.toJSON` 来实现。
    ```javascript
    // 方法一：修改原型 (会影响全局)
    BigInt.prototype.toJSON = function() {
      return this.toString();
    };
    console.log(JSON.stringify({ value: 123n })); // '{"value":"123"}'

    // 方法二：使用 replacer (更安全)
    const replacer = (key, value) => {
      return typeof value === 'bigint' ? value.toString() : value;
    };
    ```

*   **Q3: 为什么 `JSON.parse()` 报错 `SyntaxError: Unexpected token`？**
    *   **A**: 99% 的可能性是你的 JSON 字符串格式不正确。请检查：
        1.  **键名**是否用了双引号 `"`。
        2.  字符串值是否用了双引号 `"`。
        3.  对象或数组的末尾是否有多余的**逗号**。
        4.  字符串中是否有未正确转义的特殊字符（如换行符）。

*   **Q4: `JSON.stringify` 有性能问题吗？**
    *   **A**: 是的。对于非常巨大的对象（几 MB 或几十 MB），`JSON.stringify` 是一个**同步的、阻塞的操作**。在主线程上执行它可能会导致页面卡顿。对于大数据，可以考虑使用 `Web Worker` 在后台线程中进行序列化，或者使用流式 (streaming) JSON 库。

*   **Q5: `toJSON()` 方法有什么用？**
    *   **A**: 如果一个对象有自己的 `toJSON()` 方法，那么 `JSON.stringify()` 在序列化这个对象时，会**优先调用这个 `toJSON()` 方法**，并使用其返回值进行下一步的序列化。`Date` 对象就是一个很好的例子，它的 `toJSON()` 方法返回其 ISO 字符串。
    ```javascript
    const user = {
      name: 'Alice',
      lastLogin: new Date(),
      toJSON: function() {
        return { // 自定义序列化结果
          user_name: this.name,
          login_timestamp: this.lastLogin.getTime()
        };
      }
    };
    console.log(JSON.stringify(user));
    // '{"user_name":"Alice","login_timestamp":169839...}'
    ```