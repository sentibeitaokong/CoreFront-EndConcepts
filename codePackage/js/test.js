/*var obj = new Number(123); // object
var obj2= new String('123'); // object
var val = obj.valueOf();   // number 123
var val2= obj.toString(); // string 123


console.log(typeof obj); // "object"
console.log(typeof obj2); // "object"
console.log(typeof val); // "number"
console.log(typeof val2);*/


/*function Animal(name) {
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
console.log(dog2.colors); // ['black', 'white'] (未被污染)*/
/*
class Example{
    get hello(){
        return 'world'
    }
}
const obj=new Example()
var descriptor = Object.getOwnPropertyDescriptor(
    Example.prototype, "hello"
);

console.log("get" in descriptor)  // true
console.log("set" in descriptor)  // true
console.log(obj.hello) //world
console.log(Object.getOwnPropertyDescriptor(obj, 'hello'))   //undefined
console.log(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), 'hello'))*/

/*class User {
    constructor(name) {
        this.name = name;
    }
    sayHi = function() {
        console.log(`你好, 我是 ${this.name}`);
    };
}
const user1 = new User('Alice');
const user2 = new User('Bob');
console.log(user1.sayHi === user2.sayHi); // true，共享同一个函数*/
/*class Graph {
    constructor() {
        this.vertices = []; // 存储所有顶点的名字（方便遍历）
        this.adjList = new Map(); // 使用 Map 存储邻接表
    }

    // --- 1. 添加顶点 (Vertex) ---
    addVertex(v) {
        if (!this.adjList.has(v)) {
            this.vertices.push(v);
            this.adjList.set(v, []); // 初始化该顶点的邻居列表为空数组
        }
    }

    // --- 2. 添加边 (Edge) ---
    // 因为是无向图，所以 A 连接 B 的同时，B 也连接 A
    addEdge(v, w) {
        // 容错：如果顶点不存在，先添加顶点
        if (!this.adjList.has(v)) this.addVertex(v);
        if (!this.adjList.has(w)) this.addVertex(w);

        this.adjList.get(v).push(w); // 将 w 加入 v 的邻居列表
        this.adjList.get(w).push(v); // 将 v 加入 w 的邻居列表
    }

    // --- 辅助方法：打印图 ---
    toString() {
        let s = '';
        for (let i = 0; i < this.vertices.length; i++) {
            const vertex = this.vertices[i];
            const neighbors = this.adjList.get(vertex);
            s += vertex + ' -> ';
            for (let j = 0; j < neighbors.length; j++) {
                s += neighbors[j] + ' ';
            }
            s += '\n';
        }
        return s;
    }
}

// === 构建测试图 ===
const myGraph = new Graph();
const myVertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
myVertices.forEach(v => myGraph.addVertex(v));

myGraph.addEdge('A', 'B');
myGraph.addEdge('A', 'C');
myGraph.addEdge('A', 'D');
myGraph.addEdge('C', 'D');
myGraph.addEdge('C', 'G');
myGraph.addEdge('D', 'G');
myGraph.addEdge('D', 'H');
myGraph.addEdge('B', 'E');
myGraph.addEdge('B', 'F');
myGraph.addEdge('E', 'I');

console.log('--- 图的结构 ---');
console.log(myGraph.toString());*/

// 假设图的结构依然使用邻接表表示
const graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
};

/**
 * 无权图最短路径 (BFS)
 * @param {Object} graph 邻接表图
 * @param {string} start 起点
 * @param {string} target 终点
 */
function unweightedShortestPath(graph, start, target) {
    const queue = [start];
    const visited = { [start]: true };
    const distances = { [start]: 0 };     // 记录到每个节点的最短距离
    const predecessors = { [start]: null }; // 记录每个节点的前驱节点，用于还原路径

    while (queue.length > 0) {
        const current = queue.shift();

        // 如果找到目标，提前结束搜索
        if (current === target) break;

        const neighbors = graph[current] || [];
        for (let neighbor of neighbors) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                // 邻居的距离 = 当前节点距离 + 1
                distances[neighbor] = distances[current] + 1;
                // 记录邻居是从 current 走过来的
                predecessors[neighbor] = current;
                queue.push(neighbor);
            }
        }
    }
    console.log(distances,predecessors);
    // 如果目标节点未被访问，说明不可达
    if (!visited[target]) return { distance: Infinity, path: [] };

    // 还原路径：从终点开始，顺着前驱节点一路找回起点
    const path = [];
    let currNode = target;
    while (currNode !== null) {
        path.unshift(currNode); // 每次插到最前面，最后得到 正向路径
        currNode = predecessors[currNode];
    }

    return {
        distance: distances[target],
        path: path
    };
}

// === 测试 ===
const result = unweightedShortestPath(graph, 'A', 'F');
console.log(`最短距离: ${result.distance}`); // 最短距离: 2
console.log(`最短路径: ${result.path.join(' -> ')}`); // 最短路径: A -> C -> F
