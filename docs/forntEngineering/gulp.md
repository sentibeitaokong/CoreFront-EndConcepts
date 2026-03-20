# Gulp.js

## 1. 什么是 Gulp？

Gulp 是一个基于 **Node.js 流（Stream）** 的前端自动化构建工具。它可以自动执行重复性的开发任务，例如代码压缩、CSS 预处理、图片优化、文件合并、自动刷新浏览器等。

Gulp 的核心理念是 **“代码优于配置”**（Code over Configuration）。与 Grunt 等工具通过复杂的 JSON 配置文件来定义任务不同，Gulp 允许你使用简洁的 JavaScript 代码来编写构建任务，这使得任务定义更加直观、灵活和强大。

## 2. 四个核心 API

Gulp 的 API 非常精简，你只需要掌握四个核心 API 就可以开始工作。

| API | 描述 |
| :--- | :--- |
| `gulp.src()` | **源文件读取**：获取一个或多个文件以供处理。它接受一个 `glob` 模式（类似 `*.js` 或 `src/**/*.css`）作为参数，并返回一个 Node.js 流（Stream），这个流可以被“管道”到其他 Gulp 插件中。 |
| `gulp.dest()` | **目标文件写入**：将处理后的文件流写入到指定的目录。如果目录不存在，Gulp 会自动创建它。 |
| `gulp.task()` | **任务定义** (Gulp 3.x 及更早版本)：用于定义一个 Gulp 任务。在 Gulp 4.x 中，虽然它仍然可用，但更推荐直接导出 JavaScript 函数。 |
| `gulp.watch()` | **文件监视**：监视文件或目录的变化，并在变化发生时自动执行指定的任务。 |

## 3. 核心概念解析

### 3.1 流 (Streams)

这是 Gulp 最核心、最基础的概念。想象一条从 `gulp.src()` 到 `gulp.dest()` 的“管道”，文件就像水流一样在这条管道中流动。

*   **起点**：`gulp.src()` 从文件系统中读取文件，并将它们转换成内存中的虚拟文件对象（Vinyl File Object），然后将这些对象放入流中。
*   **中间处理**：流中的文件可以被 `.pipe()` 方法“导向”到各种 Gulp 插件中进行处理（例如，`gulp-sass`、`gulp-terser`）。每个插件都会对流中的文件执行特定操作，然后将处理后的文件再次推入流中，传递给下一个插件。
*   **终点**：`gulp.dest()` 接收最终处理过的文件流，并将它们写回到文件系统中。

**优点**：基于流的操作极其高效，因为它不需要频繁地读写磁盘。文件在内存中被一次性读取，经过一系列插件处理后，最后一次性写入，大大减少了 I/O 开销。

**示例：**
```javascript
// gulpfile.js
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const terser = require('gulp-terser');

function styles() {
  return gulp.src('src/scss/*.scss') // 1. 读取源文件，创建流
    .pipe(sass())                   // 2. 流入 sass 插件进行编译
    .pipe(gulp.dest('dist/css'));   // 3. 流入 dest，写入到目标目录
}

exports.styles = styles;
```

### 3.2 任务 (Tasks)

在 Gulp 中，一个任务就是一个执行特定构建步骤的 JavaScript 函数。在 Gulp 4.x 中，任何被导出的函数都会被 Gulp CLI 识别为一个任务。

```javascript
// 这个函数就是一个 Gulp 任务
function clean() {
  // ... 清理 dist 目录的逻辑
}

// 导出后，你就可以在命令行运行 `gulp clean`
exports.clean = clean;
```

### 3.3 组合任务 (`series` 和 `parallel`)

Gulp 4.x 引入了两个强大的任务组合工具，用于控制任务的执行顺序。

*   **`gulp.series(...tasks)`**: **串行执行**。任务会按照排列的顺序依次执行，前一个任务完成后，后一个任务才会开始。适用于有依赖关系的任务（例如，必须先 `clean` 清理目录，然后才能 `build`）。
*   **`gulp.parallel(...tasks)`**: **并行执行**。所有任务会同时开始执行，没有顺序保证。适用于没有相互依赖的任务（例如，可以同时处理 `javascript` 和 `css`），能极大地提升构建速度。

**示例：**
```javascript
const { series, parallel } = require('gulp');

function javascript() { /* ... */ }
function css() { /* ... */ }
function clean() { /* ... */ }

// 先执行 clean，然后并行执行 javascript 和 css
const build = series(clean, parallel(javascript, css));

exports.build = build;
```
现在，运行 `gulp build` 就会按照你定义的顺序来执行任务。

### 3.4 插件 (Plugins)

Gulp 拥有一个庞大且活跃的生态系统，包含数千个插件。每个插件通常只做一件小事（例如，`gulp-rename` 只负责重命名文件），并遵循 Gulp 的流式处理机制。

使用插件非常简单，通常只需 `npm install` 安装，然后在 `gulpfile.js` 中 `require`，并用 `.pipe()` 将其插入到处理流中即可。

## 4. 常见问题 (FAQ)

### 4.1 任务执行时报错 "Did you forget to signal async completion?" (你是否忘记了标记异步任务完成？)

**问题描述**:
Gulp 4.x 要求所有任务都必须明确地告知 Gulp 它们何时完成，否则 Gulp 就会认为任务一直没有结束，最终超时并报错。

**原因**:
Gulp 任务本质上是异步的，尤其是那些涉及文件 I/O 的操作（如 `gulp.src` 和 `gulp.dest`）。

**解决方案** (三选一即可):

*   **返回一个流 (Stream)**：这是最常见、最推荐的方式。如果你的任务以 `gulp.dest()` 结束，只需 `return` 这个流即可。
    ```javascript
    function myTask() {
      return gulp.src('src/*.js')
        .pipe(gulp.dest('dist')); // 返回这个流
    }
    ```
*   **返回一个 Promise**：如果你的任务使用了基于 Promise 的库，可以返回这个 Promise。
    ```javascript
    const del = require('del');
    function clean() {
      return del(['dist']); // del() 返回一个 Promise
    }
    ```
*   **使用 `done` 回调函数**：Gulp 会向任务函数中注入一个名为 `done` 的回调。在任务的所有操作完成后，手动调用它。
    ```javascript
    function myCallbackTask(done) {
      // ... 执行一些没有返回流或 Promise 的异步操作
      console.log('任务完成!');
      done(); // 手动标记任务结束
    }
    ```

### 4.2 Gulp 3.x 的 `gulpfile.js` 在 Gulp 4.x 中无法运行，怎么办？

**问题描述**:
Gulp 4.x 的 API 发生了重大变化，旧的 `gulpfile.js` 不再兼容。

**主要变化及解决方案**:

*   **任务依赖**:
    *   **旧 (Gulp 3)**: `gulp.task('scripts', ['clean'], function() { ... });`
    *   **新 (Gulp 4)**: 使用 `series` 或 `parallel` 组合任务。
        ```javascript
        const { series } = require('gulp');
        // gulp.task('scripts', series(clean, function() { ... }));
        // 或者更好地，导出组合任务
        exports.scripts = series(clean, scriptsTaskFunction);
        ```
*   **任务定义**:
    *   **旧 (Gulp 3)**: 严重依赖 `gulp.task('task-name', ...)`。
    *   **新 (Gulp 4)**: 推荐直接导出函数。
        ```javascript
        // 旧
        // gulp.task('my-task', function() { ... });

        // 新
        function myTask() { /* ... */ }
        exports.myTask = myTask;
        ```

### 4.3 如何处理 `gulp-sass` 插件的安装或使用错误？

**问题描述**:
`gulp-sass` 依赖于 `node-sass` 或 `dart-sass`。`node-sass` 因为需要针对不同环境进行二进制编译，经常在安装时出错（例如 `node-gyp` 错误）。

**解决方案**:

*   **首选 `dart-sass`**: `dart-sass` 是 Sass 官方现在主推的实现，它是纯 JavaScript 编写的，安装时不会有编译问题，且兼容性更好。
    ```bash
    # 1. 卸载旧的
    npm uninstall gulp-sass node-sass

    # 2. 安装新的
    npm install gulp-sass sass --save-dev
    ```
*   **在 `gulpfile.js` 中指明 Sass 实现**:
    ```javascript
    // 明确告诉 gulp-sass 使用你安装的 'sass' (Dart Sass)
    const sass = require('gulp-sass')(require('sass'));
    ```

### 4.4 `gulp.watch` 为什么只执行一次就停止了？

**问题描述**:
在 `watch` 任务中，如果一个被监视的文件在处理过程中发生错误（例如，Sass 语法错误），`watch` 进程可能会因为未捕获的异常而崩溃。

**解决方案**:
在你的管道（pipe）中添加错误处理机制，最常用的是 `plumber` 插件，或者直接监听流的 `error` 事件。

*   **使用 `gulp-plumber`**: 这是一个专门用来防止 Gulp 因插件错误而崩溃的插件。
    ```javascript
    const plumber = require('gulp-plumber');

    function css() {
      return gulp.src('src/scss/*.scss')
        .pipe(plumber()) // 在出错时保持流的畅通
        .pipe(sass().on('error', sass.logError)) // sass 插件本身的错误日志
        .pipe(gulp.dest('dist/css'));
    }
    ```

