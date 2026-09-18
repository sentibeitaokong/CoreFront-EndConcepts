/*
 * 示例代码：requestAnimationFrame.md
 * 来源文档：apps/docs/js/advanced/misc/requestAnimationFrame.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 3.1 基本循环 =====
// function animate(timestamp) {
//   // timestamp：回调触发时刻的高精度时间戳（毫秒）
//   box.style.transform = `translateX(${timestamp % 1000}px)`
//
//   requestAnimationFrame(animate) // 递归调度下一帧
// }
// requestAnimationFrame(animate)

// ===== 3.2 停止动画 =====
// let rafId
// function animate(t) {
//   rafId = requestAnimationFrame(animate)
// }
// rafId = requestAnimationFrame(animate)
//
// // 停止
// cancelAnimationFrame(rafId)

// ===== 3.2 停止动画 =====
// function createLoop(update) {
//   let rafId = 0
//   let running = false
//
//   function frame(now) {
//     if (!running) return
//     update(now)
//     rafId = requestAnimationFrame(frame)
//   }
//
//   return {
//     start() {
//       if (running) return // 已经在跑就不再排队，避免两条循环并行
//       running = true
//       rafId = requestAnimationFrame(frame)
//     },
//     stop() {
//       running = false
//       cancelAnimationFrame(rafId)
//     },
//   }
// }

// ===== 3.2 停止动画 =====
// // React：useEffect 的返回值就是清理函数
// useEffect(() => {
//   let id = requestAnimationFrame(function step(now) {
//     update(now)
//     id = requestAnimationFrame(step)
//   })
//   return () => cancelAnimationFrame(id)
// }, [])

// ===== 3.2 停止动画 =====
// // Vue 组合式 API：在 onBeforeUnmount 里停掉
// let rafId = 0
//
// onMounted(() => {
//   const step = now => {
//     update(now)
//     rafId = requestAnimationFrame(step)
//   }
//   rafId = requestAnimationFrame(step)
// })
//
// onBeforeUnmount(() => cancelAnimationFrame(rafId))

// ===== 3.3 基于时间增量做平滑动画 =====
// let start = null
// function move(timestamp) {
//   if (start === null) start = timestamp
//   const progress = (timestamp - start) / 1000 // 秒
//
//   box.style.left = Math.min(progress * 200, 200) + 'px' // 每秒移动 200px
//
//   if (progress < 1) requestAnimationFrame(move)
// }
// requestAnimationFrame(move)

// ===== 3.4 实现一个通用补间动画 =====
// function tween({ duration, from, to, onUpdate }) {
//   const start = performance.now()
//   function step(now) {
//     const t = Math.min((now - start) / duration, 1)
//     const eased = t * (2 - t) // easeOut
//     onUpdate(from + (to - from) * eased)
//     if (t < 1) requestAnimationFrame(step)
//   }
//   requestAnimationFrame(step)
// }
//
// tween({
//   duration: 1000,
//   from: 0,
//   to: 200,
//   onUpdate: v => (box.style.left = v + 'px'),
// })

// ===== 3.5 回调参数：高精度时间戳 =====
// function step(timestamp) {
//   const spent = performance.now() - timestamp
//   if (spent > 8) {
//     // 本帧已经花掉 8ms 以上，留给布局和绘制的时间不多了
//     console.warn('帧预算告急', spent.toFixed(2))
//   }
//   requestAnimationFrame(step)
// }
// requestAnimationFrame(step)

// ===== 3.6 delta 钳制与固定步长 =====
// let lastTime = 0
// function step(now) {
//   if (lastTime === 0) lastTime = now
//   // 切回前台时 delta 可能是好几秒，钳制到 100ms 以内，避免位置瞬移
//   const delta = Math.min(now - lastTime, 100)
//   lastTime = now
//
//   x += speed * (delta / 1000) // speed 的单位是 px/秒，与帧率无关
//   box.style.transform = `translateX(${x}px)`
//
//   if (x < limit) requestAnimationFrame(step)
// }
// requestAnimationFrame(step)

// ===== 3.6 delta 钳制与固定步长 =====
// const STEP = 1000 / 60 // 恒定步长：模拟每秒推进 60 次
// let lastFrame = 0
// let accumulator = 0
//
// function frame(now) {
//   const delta = Math.min(now - lastFrame, 250) // 钳制，避免切回前台时补算上千帧
//   lastFrame = now
//   accumulator += delta
//
//   while (accumulator >= STEP) {
//     simulate(STEP / 1000) // 每次固定推进 1/60 秒
//     accumulator -= STEP
//   }
//
//   render(accumulator / STEP) // 用剩余比例做插值，画面才不会一顿一顿
//   requestAnimationFrame(frame)
// }
// requestAnimationFrame(frame)

// ===== 3.7 缓动函数（easing） =====
// const easing = {
//   linear: t => t,
//   easeInQuad: t => t * t,
//   easeOutQuad: t => t * (2 - t),
//   easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
//   easeOutCubic: t => 1 - Math.pow(1 - t, 3),
//   easeOutBack: t =>
//     1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
// }
//
// const ease = easing.easeOutCubic
// const progress = ease(Math.min((now - start) / duration, 1)) // 0 → 1

// ===== 3.8 rAF 的兼容性与降级 =====
// window.requestAnimationFrame =
//   window.requestAnimationFrame ||
//   function (cb) {
//     return setTimeout(() => cb(performance.now()), 16)
//   }
//
// window.cancelAnimationFrame =
//   window.cancelAnimationFrame ||
//   function (id) {
//     clearTimeout(id)
//   }

// ===== 4. requestIdleCallback：利用空闲时间 =====
// requestIdleCallback(
//   deadline => {
//     // deadline.timeRemaining()：本帧剩余空闲时间
//     while (deadline.timeRemaining() > 0 && tasks.length > 0) {
//       const task = tasks.shift()
//       task()
//     }
//   },
//   { timeout: 1000 },
// ) // 若一直空闲，最多等 1000ms 强制执行

// ===== 4.2 timeout 选项与 didTimeout =====
// requestIdleCallback(
//   deadline => {
//     if (deadline.didTimeout) {
//       // 超时强制执行：只做最关键的一件事，剩下的重新排队
//       flushCriticalReport()
//       return
//     }
//     while (deadline.timeRemaining() > 0 && queue.length > 0) {
//       queue.shift()()
//     }
//   },
//   { timeout: 2000 },
// )

// ===== 4.3 适用场景 =====
// function chunkedProcess(items, handle, done) {
//   const run = deadline => {
//     while (deadline.timeRemaining() > 0 && items.length > 0) {
//       handle(items.shift())
//     }
//     if (items.length > 0) {
//       requestIdleCallback(run) // 还有剩，等下一个空闲时段
//     } else if (done) {
//       done()
//     }
//   }
//   requestIdleCallback(run)
// }

// ===== 4.4 兼容性垫片 =====
// window.requestIdleCallback =
//   window.requestIdleCallback ||
//   function (cb) {
//     const start = Date.now()
//     return setTimeout(() => {
//       cb({
//         didTimeout: false,
//         timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
//       })
//     }, 1)
//   }

// ===== 4.4 兼容性垫片 =====
// if ('requestIdleCallback' in window) {
//   window.requestIdleCallback(doWork, { timeout: 2000 })
// } else {
//   setTimeout(doWork, 0) // 降级：至少保证会执行
// }

// ===== 4.5 与 rAF 的分工：先渲染，再算账 =====
// const stats = []
//
// function frame(now) {
//   render(now)
//   stats.push(now) // 只记录，不做重活
//   requestAnimationFrame(frame)
// }
//
// requestIdleCallback(deadline => {
//   if (stats.length === 0) return
//   report(stats.splice(0, stats.length)) // 空闲时批量上报
// })
//
// requestAnimationFrame(frame)

// ===== 5.3 实战：滚动、拖拽与 observer 里的 rAF 节流 =====
// let scheduled = false
//
// function onScroll() {
//   if (scheduled) return // 本帧已经排过了，直接忽略
//   scheduled = true
//   requestAnimationFrame(() => {
//     update() // 一帧最多执行一次
//     scheduled = false
//   })
// }
//
// // passive: true 表示这个监听器不会调用 preventDefault，
// // 浏览器可以立刻开始滚动，不必等监听器执行完
// window.addEventListener('scroll', onScroll, { passive: true })

// ===== 5.3 实战：滚动、拖拽与 observer 里的 rAF 节流 =====
// const box = document.querySelector('#box')
//
// let startX = 0 // 按下那一刻的指针位置
// let startY = 0
// let originX = 0 // 按下那一刻的元素位置
// let originY = 0
// let x = 0 // 最新目标位置（还没写进 DOM）
// let y = 0
// let rafId = 0
//
// function flush() {
//   rafId = 0
//   // 只写 transform：不触发布局，交给合成器，一帧最多写一次
//   box.style.transform = `translate3d(${x}px, ${y}px, 0)`
// }
//
// function onPointerMove(e) {
//   // 只记数值，不读也不写 DOM —— 一帧里 pointermove 可能派发好几次
//   x = originX + e.clientX - startX
//   y = originY + e.clientY - startY
//
//   if (rafId === 0) rafId = requestAnimationFrame(flush) // 本帧没排过才排，多出来的直接丢
// }
//
// function onPointerDown(e) {
//   startX = e.clientX
//   startY = e.clientY
//   originX = x
//   originY = y
//   box.setPointerCapture(e.pointerId) // 指针移出元素甚至窗口，事件仍然派发给 box
//   box.addEventListener('pointermove', onPointerMove)
// }
//
// function onPointerUp(e) {
//   box.removeEventListener('pointermove', onPointerMove)
//   // pointercancel 时指针已经失效，直接释放会抛 NotFoundError
//   if (box.hasPointerCapture(e.pointerId)) box.releasePointerCapture(e.pointerId)
//   cancelAnimationFrame(rafId) // 丢掉排队中的那一帧
//   flush() // 立刻补上最后的位置，别停在上一帧
// }
//
// box.addEventListener('pointerdown', onPointerDown)
// box.addEventListener('pointerup', onPointerUp)
// box.addEventListener('pointercancel', onPointerUp) // 被系统手势打断也要收尾

// ===== 5.3 实战：滚动、拖拽与 observer 里的 rAF 节流 [css] =====
// #box {
//   touch-action: none; /* 触屏上必须有：否则拖动会被当成滚动，浏览器直接发 pointercancel */
//   user-select: none; /* 拖动时不要顺手选中文字 */
// }

// ===== 5.3 实战：滚动、拖拽与 observer 里的 rAF 节流 =====
// const sizes = new Map()
// let dirty = false
//
// const ro = new ResizeObserver(entries => {
//   for (const entry of entries) {
//     sizes.set(entry.target, entry.contentRect) // 只记录，不写样式
//   }
//   if (!dirty) {
//     dirty = true
//     requestAnimationFrame(() => {
//       applySizes(sizes) // 下一帧统一写入
//       dirty = false
//     })
//   }
// })
//
// ro.observe(box)

// ===== 5.3 实战：滚动、拖拽与 observer 里的 rAF 节流 =====
// const canvas = document.querySelector('#canvas')
//
// // §3.2 的 createLoop：start 是幂等的，重复调用不会排出第二条循环
// const loop = createLoop(now => {
//   draw(now) // 逐帧绘制
// })
//
// const io = new IntersectionObserver(
//   entries => {
//     for (const entry of entries) {
//       // 回到视口：继续绘制；离开视口：立刻停帧
//       if (entry.isIntersecting) loop.start()
//       else loop.stop()
//     }
//   },
//   {
//     root: null, // 判定基准是视口
//     rootMargin: '0px', // 贴着视口边缘，真正看不见了才停
//     threshold: 0, // 交叉比例从 0 变正即触发
//   },
// )
//
// io.observe(canvas)
//
// // 组件卸载 / 页面销毁时一并清理，否则观察器会一直抓着 canvas
// // io.disconnect()
// // loop.stop()

// ===== 5.6 后台标签页、首帧与 document.hidden =====
// document.addEventListener('visibilitychange', () => {
//   if (document.hidden) {
//     loop.stop() // 顺便停掉配套的定时器、轮询、音频
//   } else {
//     loop.start()
//   }
// })
