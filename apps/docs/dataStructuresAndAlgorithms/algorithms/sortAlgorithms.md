---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 排序算法

## 1. 分类

### 1.1 内部排序和外部排序

- **内部排序**：待排序记录存放在计算机随机存储器中（说简单点，就是内存）进行的排序过程。
- **外部排序**：待排序记录的数量很大，以致于内存不能一次容纳全部记录，所以在排序过程中需要对外存进行访问的排序过程。

![内部排序与外部排序对比示意图](/img/sortFirst.png)

### 1.2 比较类排序和非比较排序

- **比较类排序**：通过比较来决定元素间的相对次序，由于其时间复杂度不能突破 `O(nlogn)`，因此也称为非线性时间比较类排序。
- **非比较类排序**：不通过比较来决定元素间的相对次序，它可以突破基于比较排序的时间下界，以线性时间运行，因此也称为线性时间非比较类排序。

![比较类排序与非比较排序分类示意图](/img/sortSecond.png)

## 2. 复杂度分析，算法稳定性和适用场景

- **稳定**：如果 `a` 原本在 `b` 前面，而 `a=b`，排序之后 `a` 仍然在 `b` 的前面。
- **不稳定**：如果 `a` 原本在 `b` 的前面，而 `a=b`，排序之后 `a` 可能会出现在 `b` 的后面。
- **时间复杂度**：对排序数据的总的操作次数。反映当 `n` 变化时，操作次数呈现什么规律。
- **空间复杂度**：是指算法在计算机内执行时所需存储空间的度量，它也是数据规模 `n` 的函数。

![十大排序算法复杂度与稳定性对比图](/img/sort9.png)

### 2.1 稳定性的工程意义

“**稳定**”不只是教科书里的一个属性，它在真实业务里直接影响结果的正确性：

- **多字段排序**：想“**先按部门排，同部门内再按薪资排**”，如果排序是稳定的，只要先按薪资排一次、再按部门排一次即可——第二次排序不会打乱同部门内的薪资顺序。若排序不稳定，这个技巧就失效了，必须一次性在比较函数里写全所有字段。
- **分页 / 增量数据**：等值元素的相对顺序保持不变，翻页时不会出现同一条数据在相邻两页之间来回跳动。
- **可预期的调试**：稳定排序的结果是确定的，测试用例不会因为引擎实现不同而莫名失败。

> [!TIP]
> 判断一个排序稳不稳定，看它是“**交换相隔较远的元素**”还是“**只挪动相邻元素**”：冒泡、插入、归并只比较相邻或成对元素，因此稳定；选择、快排、堆排会做长距离交换，因此不稳定。计数、基数、桶排序在实现得当时也是稳定的。

### 2.2 `Array.prototype.sort` 的底层到底是什么？

很多面试会问“**JS 的 `sort` 用的是什么算法**”，答案是：**取决于引擎，而且不是一个固定算法**。

- **现代 V8（V8 7.0 / Chrome 70 起）使用 TimSort**：一种“**归并排序 + 插入排序**”的混合算法。它先从左到右扫描出天然有序的片段（run），再用二分插入排序补足过短的 run，最后合并这些 run。
- 因此 `sort()` 具有几个重要特性：
  - **稳定**：相等元素的相对顺序不变（ES2019 起规范强制要求）。
  - **自适应**：对接近有序的数据，效率接近 $O(n)$。
  - **最坏 $O(n \log n)$**：不会像朴素快排那样退化到 $O(n^2)$；代价是需要额外空间（最坏约 $O(n)$）。
- 对**很短的数组**，引擎会直接使用插入排序。V8 早期版本用的是快排 + 短数组插入排序，所以“**老引擎不稳定**”的说法才流传至今。

> [!NOTE]
> 无论底层怎么实现，比较函数都必须返回**一致的**顺序关系（同一对元素多次比较的结果相同）。像 `(a, b) => Math.random() - 0.5` 这种随机返回值会破坏前提，得到的顺序既不稳定也不均匀。

### 2.3 按对象字段排序：多字段与中文字符串

**按数字排序**必须传比较函数，否则会按字符串比较。按对象字段排序时，有几种常用套路：

```js
const users = [
  { name: '张三', age: 28, score: 90 },
  { name: '李四', age: 25, score: 90 },
  { name: '王五', age: 25, score: 85 },
]

// 1. 单个数字字段：直接用减法
const byAge = [...users].sort((a, b) => a.age - b.age)

// 2. 多个字段：年龄升序，年龄相同再按分数降序
const byAgeThenScore = [...users].sort(
  (a, b) => a.age - b.age || b.score - a.score,
)

// 3. 中文字符串排序：用 localeCompare，结果才符合中文习惯
const names = ['张三', '李四', '王五', '赵六']
const sortedNames = [...names].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
console.log(sortedNames)
```

[width(19,43,38)]

| 需求                | 推荐写法                                                         | 说明                                                        |
| :------------------ | :--------------------------------------------------------------- | :---------------------------------------------------------- |
| **数字升 / 降序**   | `(a, b) => a - b` / `(a, b) => b - a`                            | 直接减法最简洁。                                            |
| **多字段排序**      | `(a, b) => a.x - b.x \|\| a.y - b.y`                             | 用 `\|\|` 串联：前一个字段相等（差为 0）时才比较下一个。    |
| **字符串（英文）**  | `(a, b) => a.localeCompare(b)`                                   | 比直接比较 `<` / `>` 更符合语言习惯，也能忽略大小写差异。   |
| **中文字符串**      | `(a, b) => a.localeCompare(b, 'zh-Hans-CN')`                     | 按拼音或笔画排序由本地化规则决定，远优于比较 Unicode 码点。 |
| **布尔 / 特殊规则** | `(a, b) => Number(b.pinned) - Number(a.pinned) \|\| a.id - b.id` | 把规则换算成数字再参与比较。                                |

> [!WARNING]
> `localeCompare` 每次调用都要构造本地化比较器，在大数组上比纯数字比较慢很多。如果要在几万条数据上按中文排序，建议先用 `Intl.Collator` 建一个比较器再复用：`const collator = new Intl.Collator('zh-Hans-CN'); arr.sort(collator.compare)`。

### 2.4 大数据量下的排序选择

[width(28,39,33)]

| 数据规模 / 特征                 | 推荐做法                                               | 原因                                                    |
| :------------------------------ | :----------------------------------------------------- | :------------------------------------------------------ |
| **几万条以内**                  | 直接用原生 `Array.prototype.sort`                      | 引擎的 TimSort 经过高度优化，手写算法基本拼不过。       |
| **接近有序的数据**              | 同样用原生 `sort`                                      | TimSort 对有序片段有自适应优化，效率接近 $O(n)$。       |
| **只需要前 K 大 / 小（Top K）** | 用大小为 K 的堆（优先队列），不要对整个数组排序        | 全排序是 $O(n \log n)$，堆只取 K 个则是 $O(n \log K)$。 |
| **数据量巨大、内存放不下**      | 外部排序：分块读入内存排序后写回临时文件，再做多路归并 | 见 FAQ 4.6。                                            |
| **纯整数且取值范围小**          | 计数排序（$O(n + k)$）                                 | 非比较排序可突破 $O(n \log n)$ 下界，但受取值范围限制。 |

> [!TIP]
> 在浏览器里，排序大数组还会阻塞主线程。几万条以上的数据，除了选对算法，更要考虑把它放进 Web Worker 里执行，避免页面卡顿。

## 3. 十大排序算法详解

### 3.1 选择排序

![选择排序过程演示](/img/sort1.gif)

#### 思路分析

- 第一个跟后面的所有数相比，如果大于（或小于）第一个数的时候，暂存较小数的下标，第一趟结束后，将第一个数，与暂存的那个最小数进行交换，第一个数就是最小（或最大的数）。
- 下标移到第二位，第二个数跟后面的所有数相比，一趟下来，确定第二小（或第二大）的数。
- 重复以上步骤直到指针移到倒数第二位，确定倒数第二小（或倒数第二大）的数，那么最后一位也就确定了，排序完成。

#### 复杂度分析

- 不管原始数组是否有序，时间复杂度都是 **O(n²)**。
  因为每一个数都要与其他数比较一次， `(n-1)²` 次，分解：`n²-2n+1`，去掉低次幂和常数，剩下 `n²`，所以最后的时间复杂度是 `O(n²)`。
- 空间复杂度是 **O(1)**，因为只定义了两个辅助变量，与 `n` 的大小无关，所以空间复杂度为 `O(1)`。

```js
function selectionSort() {
  let n = [1, 6, 3, 8, 33, 27, 66, 9, 7, 88]
  let temp,
    index = -1
  for (let i = 0; i < n.length - 1; i++) {
    index = i
    // 如果大于，暂存较小的数的下标
    for (let j = i + 1; j < n.length; j++) {
      if (n[index] > n[j]) {
        index = j
      }
    }
    // 将一趟下来求出的最小数，与这个数交换
    if (index > 0) {
      temp = n[i]
      n[i] = n[index]
      n[index] = temp
    }
    console.log('第' + (i + 1) + '趟:', n.slice())
  }
  console.log('最终结果:', n)
}
selectionSort()
```

### 3.2 冒泡排序

![冒泡排序过程演示](/img/sort2.gif)

#### 思路分析

- 相邻两个数两两相比，`n[i]` 跟 `n[j+1]` 比，如果 `n[i] > n[j+1]`，则将两个数进行交换。
- `j++`，重复以上步骤，第一趟结束后，最大数就会被确定在最后一位，这就是冒泡排序又称大(小)数沉底。
- `i++`，重复以上步骤，直到 `i=n-1` 结束，排序完成。

#### 复杂度分析

- 不管原始数组是否有序，时间复杂度都是 **O(n²)**。
- 空间复杂度是 **O(1)**，因为只定义了一个辅助变量，与`n`的大小无关。

```js
function bubbleSort() {
  let n = [1, 6, 3, 8, 33, 27, 66, 9, 7, 88]
  let temp
  for (let i = 0; i < n.length; i++) {
    for (let j = 0; j < n.length - 1 - i; j++) {
      if (n[j] > n[j + 1]) {
        temp = n[j]
        n[j] = n[j + 1]
        n[j + 1] = temp
      }
    }
  }
  console.log('最终结果:', n)
}
bubbleSort()
```

### 3.3 插入排序

![插入排序过程演示](/img/sort3.gif)

#### 思路分析

- 从第二位开始遍历。
- 当前数（第一趟是第二位数）与前面的数依次比较，如果前面的数大于当前数，则将前面的数向后移，当前数的下标减1。
- 重复以上步骤，直到当前数不大于前面的某一个数为止，这时，将当前数放到这个位置。1-3步就是保证当前数前面的数都是有序的，内层循环的目的就是将当前数插入到前面的有序序列里。
- 重复以上3步，直到遍历到最后一位数，并将最后一位数插入到合适的位置，插入排序结束。

#### 复杂度分析

- **时间复杂度**：插入算法就是保证前面的序列是有序的，只需要把当前数插入前面的某一个位置即可。
  - 如果数组本来就是有序的，则数组的最好情况下时间复杂度为 **O(n)**。
  - 如果数组恰好是倒序，最坏情况下时间复杂度为 **O(n²)**。
  - 平均时间复杂度为 **O(n²)**。
- **空间复杂度**：插入排序算法，只需要两个变量暂存当前数以及下标，与 `n` 的大小无关，空间复杂度为 **O(1)**。

```js
function insertionSort(arr) {
  const len = arr.length
  let preIndex, current
  for (let i = 1; i < len; i++) {
    preIndex = i - 1
    current = arr[i]
    //每次比较后面的数比前面的数大的时候就把前面的数往后移动，当前面的数比后面的数大的时候就直接插入数组
    while (preIndex >= 0 && arr[preIndex] > current) {
      arr[preIndex + 1] = arr[preIndex] // 元素向后移动
      preIndex--
    }
    arr[preIndex + 1] = current // 插入当前元素
  }
  return arr
}
```

### 3.4 快速排序

![快速排序过程演示](/img/sort4.gif)

#### 思路分析

快速排序的思想就是选一个数作为基数，大于这个基数的放到右边，小于这个基数的放到左边。一趟结束后，将基数放到中间分隔的位置，第二趟将数组从基数的位置分成两半，重复以上步骤，直到数组不能再分为止。
例如从小到大排序：

- 第一趟，第一个数为基数 `temp`，设置两个指针 `left = 0`，`right = n.length`。
  - ①从 `right` 开始与基数比较，如果 `n[right] > temp`，则 `right` 指针向前移，直到不满足条件。
  - ②将 `n[right]` 赋给 `n[left]`。
  - ③从 `left` 开始与基数比较，如果 `n[left] <= temp`，则 `left` 指针向后移，直到不满足条件。
  - ④将 `n[left]` 赋给 `n[right]`。
  - ⑤重复①-④步，直到 `left == right`，将基数赋给 `n[left]`。
- 第二趟，将数组从中间分隔，进行第1步的操作。
- 递归重复，直到只剩下一个元素的时候，结束递归。

#### 复杂度分析

- **时间复杂度**：
  - 最坏情况（每次取到的元素是最小/最大的，退化为冒泡排序），时间复杂度为 **O(n²)**。
  - 最好情况下是 **O(nlogn)**。
  - 平均时间复杂度为 **O(nlogn)**。
- **空间复杂度**：
  - 快速排序本身的元素交换空间是 **O(1)**，但递归调用会消耗空间。
  - 最优情况空间复杂度为：**O(logn)**。
  - 最差情况下（退化为冒泡）空间复杂度为：**O(n)**。
  - 平均空间复杂度为 **O(logn)**。

```js
function quickSortMain() {
  let arr = [10, 6, 3, 8, 33, 27, 66, 9, 7, 88]
  f(arr, 0, arr.length - 1)
  console.log('最终结果:', arr)
}

function f(arr, start, end) {
  // 直到 start >= end 时结束递归
  if (start < end) {
    let left = start
    let right = end
    let temp = arr[start]
    while (left < right) {
      // 右面的数字大于标准数时，右边的数的位置不变，指针向左移一个位置
      while (left < right && arr[right] > temp) {
        right--
      }
      // 右边的数字及下标小于或等于基本数，将右边的数放到左边
      if (left < right) {
        arr[left] = arr[right]
        left++
      }
      // 左边的数字小于或等于标准数时，左边的数的位置不变，指针向右移一个位置
      while (left < right && arr[left] <= temp) {
        left++
      }
      // 左边的数字大于基本数，将左边的数放到右边
      if (left < right) {
        arr[right] = arr[left]
      }
    }
    // 一趟循环结束，此时 left = right，将基数放到这个重合的位置
    arr[left] = temp
    // 将数组从left位置分为两半，继续递归下去进行排序
    f(arr, start, left - 1)
    f(arr, left + 1, end)
  }
}
```

### 3.5 归并排序

![归并排序过程演示](/img/sort5.gif)

#### 思路分析

归并排序就是递归得将原始数组递归对半分隔，直到不能再分（只剩下一个元素）后，开始从最小的数组向上归并排序：

- 向上归并排序的时候，需要一个暂存数组用来排序。
- 将待合并的两个数组，从第一位开始比较，小的放到暂存数组，指针向后移。
- 直到一个数组空，直接将另一个数组剩下的元素追加到暂存数组里。
- 再将暂存数组排序后的元素放到原数组里，两个数组合成一个。

#### 复杂度分析

- **时间复杂度**：无论原始数组是否有序，都要递归分隔并向上归并排序，所以时间复杂度始终是 **O(nlogn)**。
- **空间复杂度**：每次进行归并排序时，都会利用一个长度为 `n` 的数组作为辅助数组，所以空间复杂度为 **O(n)**。

```js
function mergeSort(arr) {
  const len = arr.length
  if (len < 2) {
    return arr
  }
  const middle = Math.floor(len / 2)
  const left = arr.slice(0, middle)
  const right = arr.slice(middle)

  return merge(mergeSort(left), mergeSort(right))
}

function merge(left, right) {
  const result = []
  while (left.length && right.length) {
    if (left[0] <= right[0]) {
      result.push(left.shift())
    } else {
      result.push(right.shift())
    }
  }
  while (left.length) result.push(left.shift())
  while (right.length) result.push(right.shift())
  return result
}
```

### 3.6 基数排序

![基数排序过程演示](/img/sort6.gif)

#### 思路分析

基数排序第 `i` 趟将待排数组里的每个数的 `i` 位数放到队列中，然后再从这十个队列中取出数据，重新放到原数组里，直到 `i` 大于待排数的最大位数。

- 数组里的数最大位数是 `n` 位，就需要排 `n` 趟。
- 将数据分配到桶（队列）中。
- 分配结束后，再依次从数组中取出数据，遵循先进先出原则。
- 循环到 `n` 趟后结束，排序完成。

#### 复杂度分析

- **时间复杂度**：每一次关键字的桶分配需要 `O(n)`，合并又需要 `O(n)`。假如待排数据可以分为 `d` 个关键字，时间复杂度将是 `O(d*2n)`，忽略系数，时间复杂度始终为 **O(d\*n)**。
- **空间复杂度**：基数排序的空间复杂度为 **O(n+k)**，其中 `k` 为桶的数量。

```js
function radixSortMain() {
  let arr = [10, 6, 3, 8, 33, 27, 66, 9, 7, 88]
  radixSort(arr)
}

function radixSort(arr) {
  // 求出待排数的最大数
  let maxLength = 0
  for (let i = 0; i < arr.length; i++) {
    if (maxLength < arr[i]) maxLength = arr[i]
  }
  // 根据最大数求最大长度 (转为字符串取长度)
  maxLength = (maxLength + '').length

  // 用于暂存数据的二维数组 (10个桶)
  let temp = Array.from({ length: 10 }, () => new Array(arr.length))
  // 用于记录temp数组中每个桶内存的数据的数量
  let counts = new Array(10).fill(0)

  let num = 0
  // 用于取的元素需要放的位置
  let index = 0

  // 根据最大长度决定排序的次数
  for (let i = 0, n = 1; i < maxLength; i++, n *= 10) {
    for (let j = 0; j < arr.length; j++) {
      // 利用 JS 的 Math.floor 模拟整数除法
      num = Math.floor(arr[j] / n) % 10
      temp[num][counts[num]] = arr[j]
      counts[num]++
    }
    // 从temp中取元素重新放到arr数组中
    for (let j = 0; j < counts.length; j++) {
      for (let j2 = 0; j2 < counts[j]; j2++) {
        arr[index] = temp[j][j2]
        index++
      }
      counts[j] = 0 // 重置桶计数器
    }
    index = 0
  }
  console.log('最终结果:', arr)
}
radixSortMain()
```

### 3.7 希尔排序

![希尔排序过程演示](/img/sort7.gif)

#### 思路分析

希尔排序是把记录按下标的一定增量分组，对每组使用直接插入排序算法排序；随着增量逐渐减少，每组包含的关键词越来越多，当增量减至1时，整个文件恰被分成一组，算法便终止。
希尔排序在数组中采用跳跃式分组的策略，使得整个数组在初始阶段达到从宏观上看基本有序，然后缩小增量，到增量为1时，多数情况下只需微调即可，不会涉及过多的数据移动。

#### 复杂度分析

- **时间复杂度**：最坏情况下时间复杂度为 **O(n²)**，最好情况下时间复杂度为 **O(n)**。平均时间复杂度约为 **O(n^1.3)**。
- **空间复杂度**：希尔排序只需要一个变量用于两数交换，与 `n` 的大小无关，空间复杂度为 **O(1)**。

```js
function shellSortMain() {
  let arr = [10, 6, 3, 8, 33, 27, 66, 9, 7, 88]
  shellSort(arr)
  console.log('最终结果:', arr)
}

function shellSort(arr) {
  let temp
  // 控制增量序列, 增量序列为1的时候为最后一趟 (使用 Math.floor 保证整除)
  for (let i = Math.floor(arr.length / 2); i > 0; i = Math.floor(i / 2)) {
    // 根据增量序列，找到每组比较序列的最后一个数的位置
    for (let j = i; j < arr.length; j++) {
      // 根据该比较序列的最后一个数的位置，依次向前执行插入排序
      for (let k = j - i; k >= 0; k -= i) {
        if (arr[k] > arr[k + i]) {
          temp = arr[k]
          arr[k] = arr[k + i]
          arr[k + i] = temp
        }
      }
    }
  }
}
shellSortMain()
```

### 3.8 堆排序

![堆排序过程演示](/img/sort8.gif)

#### 思路分析

堆是具有以下性质的完全二叉树：

- **大顶堆**：每个结点的值都大于或等于其左右孩子结点的值。`arr[i] >= arr[2i+1] && arr[i] >= arr[2i+2]`
- **小顶堆**：每个结点的值都小于或等于其左右孩子结点的值。`arr[i] <= arr[2i+1] && arr[i] <= arr[2i+2]`

**堆排序基本思路：**
a. 将无序序列构建成一个堆，根据升序降序需求选择大顶堆或小顶堆。
b. 将堆顶元素与末尾元素交换，将最大元素“**沉**”到数组末端。
c. 重新调整结构，使其满足堆定义，然后继续交换堆顶元素与当前末尾元素，反复执行调整+交换步骤，直到整个序列有序。

#### 复杂度分析

- **时间复杂度**：构建初始堆复杂度为 `O(n)`，在交换并重建堆的过程中近似为 `nlogn`。所以堆排序时间复杂度最好和最坏情况下都是 **O(nlogn)**。
- **空间复杂度**：堆排序不需要任何辅助数组，只需要一个辅助变量，所占空间是常数与 `n` 无关，所以空间复杂度为 **O(1)**。

```js
function heapSortMain() {
  let arr = [4, 6, 8, 5, 9]
  let length = arr.length
  // 从最后一个非叶节点开始构建大顶堆
  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
    maximumHeap(i, arr, length)
  }
  // 从最小的叶子节点开始与根节点进行交换并重新构建大顶堆
  for (let i = arr.length - 1; i >= 0; i--) {
    swap(arr, 0, i)
    length--
    maximumHeap(0, arr, length)
  }
  console.log('最终结果:', arr)
}

// 构建大顶堆
function maximumHeap(i, arr, length) {
  let temp = arr[i]
  for (let j = i * 2 + 1; j < length; j = j * 2 + 1) {
    // 如果右孩子大于左孩子，则指向右孩子
    if (j + 1 < length && arr[j + 1] > arr[j]) {
      j++
    }
    // 如果大孩子大于当前节点，则将大孩子赋给当前节点，向下走
    if (arr[j] > temp) {
      arr[i] = arr[j]
      i = j
    } else {
      break
    }
  }
  // 将temp放到最终位置
  arr[i] = temp
}

// 交换辅助函数
function swap(arr, i, j) {
  let temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}
heapSortMain()
```

### 3.9 计数排序

- **思路分析**：它不是基于比较的，而是利用数组下标来确定元素的正确位置。找出待排序数组的最大和最小元素，统计数组中每个值为 `i` 的元素出现的次数，存入数组 `C` 的第 `i` 项。然后反向填充目标数组。

![计数排序过程演示](/img/sort10.gif)

- **适用场景**：适用于**最大值和最小值差值不大**的整数型数据（比如高考分数排序、年龄排序）。如果数据跨度过大（例如 1 和 10000），极其浪费内存。
- **时间复杂度**：O(n + k)（k 为整数的范围）
- **空间复杂度**：O(k)

```js
function countingSort(arr) {
  if (arr.length <= 1) return arr

  // 1. 寻找最大值和最小值
  let max = arr[0],
    min = arr[0]
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i]
    if (arr[i] < min) min = arr[i]
  }

  // 2. 创建计数数组并统计元素频率
  // 数组长度为 max - min + 1，避免负数或最小值极大造成的空间浪费
  let counts = new Array(max - min + 1).fill(0)
  for (let i = 0; i < arr.length; i++) {
    counts[arr[i] - min]++
  }

  // 3. 反向填充原数组
  let index = 0
  for (let i = 0; i < counts.length; i++) {
    while (counts[i] > 0) {
      arr[index++] = i + min
      counts[i]--
    }
  }
  console.log('计数排序最终结果:', arr)
  return arr
}

countingSort([10, 6, 3, 8, 33, 27, 66, 9, 7, 88])
```

### 3.10 桶排序

- **思路分析**：桶排序是计数排序的升级版。它利用函数的映射关系，将数据分到有限数量的桶里，每个桶里再分别进行排序（有可能再使用别的排序算法，或是以递归方式继续使用桶排序）。

![桶排序过程演示](/img/sort11.gif)

- **适用场景**：适用于数据**均匀分布**的场景（比如 0~1 之间的浮点数排序）。
- **时间复杂度**：平均 O(n + k)（k 为桶的个数）。最坏情况如果所有数据都进了一个桶，就会退化成 O(n²)。
- **空间复杂度**：O(n + k)

```js
function bucketSort(arr, bucketSize = 5) {
  if (arr.length === 0) return arr

  // 1. 确定最大值和最小值
  let minValue = arr[0],
    maxValue = arr[0]
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < minValue) minValue = arr[i]
    if (arr[i] > maxValue) maxValue = arr[i]
  }

  // 2. 初始化桶
  // 桶的数量 = (最大值 - 最小值) / 每个桶的容量 + 1
  let bucketCount = Math.floor((maxValue - minValue) / bucketSize) + 1
  let buckets = new Array(bucketCount)
  for (let i = 0; i < buckets.length; i++) {
    buckets[i] = []
  }

  // 3. 将数据分配到各个桶中
  for (let i = 0; i < arr.length; i++) {
    let bucketIndex = Math.floor((arr[i] - minValue) / bucketSize)
    buckets[bucketIndex].push(arr[i])
  }

  // 4. 对每个桶内部进行排序（这里借助原生的 sort 或者插入排序），并合并结果
  arr.length = 0
  for (let i = 0; i < buckets.length; i++) {
    // 使用原生的比较排序对桶内元素进行排序
    buckets[i].sort((a, b) => a - b)
    for (let j = 0; j < buckets[i].length; j++) {
      arr.push(buckets[i][j])
    }
  }

  console.log('桶排序最终结果:', arr)
  return arr
}

bucketSort([10, 6, 3, 8, 33, 27, 66, 9, 7, 88])
```

## 4. 常见问题 (FAQ)

### 4.1 为什么 `[10, 1, 3].sort()` 的结果不是数字顺序？

不传比较函数时，`sort()` 会把每个元素先转成**字符串**，再按 UTF-16 码点比较。`"10"` 的第一个字符 `"1"` 小于 `"3"`，所以 `10` 排在了 `3` 前面，结果是 `[1, 10, 3]` 而不是 `[1, 3, 10]`。

- **解决：** 数字排序必须显式传入比较函数——升序用 `arr.sort((a, b) => a - b)`，降序用 `arr.sort((a, b) => b - a)`。

### 4.2 哪些排序是稳定的？哪些不是？

[width(11,89)]

| 稳定性     | 排序算法                                                               |
| :--------- | :--------------------------------------------------------------------- |
| **稳定**   | 冒泡排序、插入排序、归并排序、计数排序、基数排序、桶排序（实现得当时） |
| **不稳定** | 选择排序、快速排序、希尔排序、堆排序                                   |

- **记忆技巧：** 会做“**长距离交换**”的多半不稳定（选择、快排、堆排、希尔）；只比较相邻或成对元素的多半稳定（冒泡、插入、归并）。

### 4.3 快速排序最坏 $O(n^2)$ 出现在什么情况？怎么避免？

- **何时出现：** 当每次选取的基准（pivot）恰好是当前区间的**最大或最小值**时，划分会极度不平衡（一边 0 个、一边 $n-1$ 个），递归深度退化为 $n$，整体变成 $O(n^2)$。典型触发输入是**已经有序或逆序**的数组配上“**固定取第一个元素**”作为基准。
- **如何避免：**
  - **随机化基准**：每次从区间里随机选一个元素和首元素交换后再划分，让最坏情况极难被构造出来。
  - **三数取中**：取首、中、尾三个数的中位数作为基准，简单有效地避开有序输入。
  - **改用混合算法**：重复元素多时可用三路快排;或直接交给最坏有 $O(n \log n)$ 保证的 TimSort / 归并排序。

### 4.4 堆排序、快速排序、归并排序到底怎么选？

[width(18,23,33,26)]

| 对比维度       | 堆排序                   | 快速排序                   | 归并排序                     |
| :------------- | :----------------------- | :------------------------- | :--------------------------- |
| **平均时间**   | $O(n \log n)$            | $O(n \log n)$              | $O(n \log n)$                |
| **最坏时间**   | $O(n \log n)$            | $O(n^2)$                   | $O(n \log n)$                |
| **额外空间**   | $O(1)$，原地             | $O(\log n)$（递归栈）      | $O(n)$（辅助数组）           |
| **稳定性**     | 不稳定                   | 不稳定                     | 稳定                         |
| **缓存友好度** | 差（跳跃访问）           | 好（以顺序访问为主）       | 好                           |
| **适合场景**   | 内存吃紧、只要最坏有保证 | 通用、数据随机、追求常数小 | 要求稳定、链表排序、外部排序 |

- **一句话选型：** 追求**最坏有保证且省内存**选堆排；追求**平均最快**选快排；要求**稳定**或处理**链表 / 外部数据**选归并。

### 4.5 如何只取数组的 Top K 而不做全排序？

- **最优思路：用大小为 K 的堆。** 求最大的 K 个数，就维护一个**大小为 K 的最小堆**：
  - 先取前 K 个元素建堆；
  - 遍历剩余元素，只要当前元素比堆顶（这 K 个里最小的那个）大，就替换堆顶并向下调整；
  - 遍历结束后，堆里保留的就是最大的 K 个数。
- **复杂度：** 建堆 $O(K)$，每个元素最多做一次 $O(\log K)$ 的调整，总体 $O(n \log K)$，优于全排序的 $O(n \log n)$，在 $K$ 远小于 $n$ 时优势尤其明显。

```js
// 求数组里最大的 k 个元素：维护一个大小为 k 的最小堆
function topK(nums, k) {
  if (k <= 0) return []
  const heap = [] // 最小堆，堆顶是当前 K 个里最小的

  // 上浮：新元素加入堆尾后恢复堆序
  const siftUp = i => {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (heap[parent] <= heap[i]) break
      const tmp = heap[parent]
      heap[parent] = heap[i]
      heap[i] = tmp
      i = parent
    }
  }

  // 下沉：堆顶被替换后恢复堆序
  const siftDown = i => {
    const size = heap.length
    while (true) {
      let smallest = i
      const left = i * 2 + 1
      const right = i * 2 + 2
      if (left < size && heap[left] < heap[smallest]) smallest = left
      if (right < size && heap[right] < heap[smallest]) smallest = right
      if (smallest === i) break
      const tmp = heap[smallest]
      heap[smallest] = heap[i]
      heap[i] = tmp
      i = smallest
    }
  }

  for (const num of nums) {
    if (heap.length < k) {
      heap.push(num)
      siftUp(heap.length - 1)
    } else if (num > heap[0]) {
      heap[0] = num // 比堆顶大，替换掉当前最小的那个
      siftDown(0)
    }
  }
  return heap.sort((a, b) => b - a)
}

console.log(topK([3, 1, 4, 1, 5, 9, 2, 6], 3)) // [9, 6, 5]
```

> [!NOTE]
> 不要用 `arr.sort((a, b) => b - a).slice(0, K)` 来取 Top K。它虽然最省事，但当 $n$ 很大时做了大量无用功，复杂度停在 $O(n \log n)$。

### 4.6 数据量超过内存怎么办？——外部排序简介

- **问题：** 当待排序的数据达到几十 GB、内存一次装不下时，任何“**在内存里排完再输出**”的算法都会 OOM。
- **解决思路（外部排序）：** 核心是“**分块排序 + 多路归并**”：
  - **分块**：把大文件切成若干能放进内存的小块，逐块读入内存，用任意内排序算法排好，写回临时文件；
  - **归并**：对这些**已有序**的临时文件做**多路归并**，每次从各文件当前的头部取出最小的写进最终结果，直到全部合并完毕。
- **为什么有效：** 它把一个“**内存放不下**”的排序，拆成了若干次“**内存放得下**”的排序加上几趟顺序读写，充分利用了“**有序文件归并是线性时间**”这一性质。
- **前端延伸：** 浏览器里更常见的做法是**分页 / 虚拟列表 + 流式处理**；如果非要在前端排序超大 JSON，可以考虑放进 Web Worker 分块处理，或用 `IndexedDB` 建索引，而不是一次性把数据全读进内存。
