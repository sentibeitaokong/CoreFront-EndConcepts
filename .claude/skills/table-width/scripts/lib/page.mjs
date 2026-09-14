// 在页面里测量并择优。
//
// ⚠️ 这个函数必须是**自包含**的：page.evaluate 会把它 toString() 序列化后送进浏览器，
// 任何对模块作用域变量的引用都会消失。所以所有辅助函数都定义在内部。

/**
 * @param {{minPct:number, headingPrefix:string|null, onlyIndex:number|null}} arg
 * @returns 每张表的测量与择优结果，按 DOM 顺序。
 */
export async function solveTablesInPage(arg) {
  const MIN = arg.minPct
  const headingPrefix = arg.headingPrefix
  const onlyIndex = arg.onlyIndex

  // 目标函数的三级比较（与既有脚本一致，已在真实页面上验证过）：
  //   ① 表格渲染高度最小
  //   ② 并列时按列从左到右比较各列累计换行行数，少者胜
  //   ③ 再并列时取与「padding 感知的自然宽度比」L1 距离最小者
  const cmpLines = (a, b) => {
    if (a.length !== b.length) return a.length - b.length // 防 NaN：长度不等时 NaN<0 为 false，会掩盖真实比较
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
    return 0
  }
  const l1 = (a, b) => a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0)

  const allTables = [...document.querySelectorAll('.vp-doc table')]
  const heads = [...document.querySelectorAll('.vp-doc h1, .vp-doc h2, .vp-doc h3, .vp-doc h4')]
  const headingOf = el => {
    const prev = heads
      .filter(h => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
      .pop()
    return prev ? prev.textContent.trim() : '(无标题)'
  }

  const matched = []
  let matchCount = 0
  for (let i = 0; i < allTables.length; i++) {
    const t = allTables[i]
    const heading = headingOf(t)
    let selected = true
    if (headingPrefix && !heading.startsWith(headingPrefix)) selected = false
    if (selected && onlyIndex != null) {
      matchCount++
      if (matchCount !== onlyIndex) selected = false
    }
    matched.push({table: t, heading, selected})
  }

  const results = []
  for (let idx = 0; idx < matched.length; idx++) {
    const {table, heading, selected} = matched[idx]
    const base = {index: idx + 1, heading}

    if (!selected) {
      results.push({...base, status: 'filtered'})
      continue
    }

    const rows = [...table.querySelectorAll('tr')]
    const cols = rows[0] ? rows[0].cells.length : 0
    if (cols < 2 || rows.length < 2) {
      results.push({...base, status: 'trivial', cols})
      continue
    }
    const header = [...rows[0].cells].map(c => c.textContent.trim()).join(' | ').slice(0, 80)

    // colspan/rowspan 会让「HTML 单元格下标 = 列下标」这个假设失效。宁可大声跳过，
    // 也不要给出一个看起来合理但实际错误的宽度向量。
    const ragged = new Set(rows.map(r => r.cells.length)).size > 1
    const spans = rows.some(r => [...r.cells].some(c => c.colSpan > 1 || c.rowSpan > 1))
    if (ragged || spans) {
      results.push({...base, status: 'span', cols, header})
      continue
    }

    const cell0 = rows[0].cells[0]
    const cs0 = getComputedStyle(cell0)
    const lineHeight = parseFloat(cs0.lineHeight) || 1
    const chrome =
      parseFloat(cs0.paddingLeft) +
      parseFloat(cs0.paddingRight) +
      parseFloat(cs0.borderLeftWidth) +
      parseFloat(cs0.borderRightWidth)

    // 当前写的 [width(...)] 渲染出来的高度，**不需要改动 DOM 就能读**：
    // AnyBlock 自己已经输出了 table-layout:fixed 和每个格子的 width/min/max。
    // （旧脚本的 baselineHeight 是在 auto 布局下测的，跟最优值不可比，那个数字没有意义。）
    const hasFixedLayout = getComputedStyle(table).tableLayout === 'fixed'
    const hBefore = table.getBoundingClientRect().height
    const tableWidth = table.getBoundingClientRect().width

    const linesIn = cell => {
      const rng = document.createRange()
      rng.selectNodeContents(cell)
      return Math.max(1, Math.round(rng.getBoundingClientRect().height / lineHeight))
    }
    const colLines = () => {
      const v = new Array(cols).fill(0)
      for (const r of rows) for (let i = 0; i < r.cells.length; i++) v[i] += linesIn(r.cells[i])
      return v
    }

    // 自然宽度：保存内联样式 → 切成 auto/max-content 并清掉格子宽度 → 读 → 还原。
    const saved = new Map()
    for (const el of [table, ...rows.flatMap(r => [...r.cells])]) {
      saved.set(el, el.getAttribute('style'))
    }
    const restore = () => {
      for (const [el, s] of saved) {
        if (s === null) el.removeAttribute('style')
        else el.setAttribute('style', s)
      }
    }
    let naturalWidths
    try {
      table.style.tableLayout = 'auto'
      table.style.width = 'max-content'
      for (const r of rows) {
        for (const c of r.cells) {
          c.style.removeProperty('width')
          c.style.removeProperty('min-width')
          c.style.removeProperty('max-width')
        }
      }
      naturalWidths = [...rows[0].cells].map(c => +c.getBoundingClientRect().width.toFixed(1))
    } finally {
      restore()
    }

    // padding 感知的自然比例，钳到 >=MIN 后归一化到 100
    const natContent = naturalWidths.map(n => Math.max(0, n - chrome))
    const sumNat = natContent.reduce((a, b) => a + b, 0)
    const availContent = tableWidth - chrome * cols
    const rawTarget =
      sumNat <= availContent
        ? naturalWidths.map(n => (n / tableWidth) * 100)
        : natContent.map(n => (((n / sumNat) * availContent + chrome) / tableWidth) * 100)
    const targetInt = rawTarget.map(x => Math.max(MIN, Math.round(x)))
    let diff = 100 - targetInt.reduce((a, b) => a + b, 0)
    const order = targetInt.map((_, i) => i).sort((i, j) => targetInt[j] - targetInt[i])
    for (let k = 0; diff !== 0 && k < 1e5; k++) {
      const i = order[k % order.length]
      if (diff > 0) {
        targetInt[i]++
        diff--
      } else if (targetInt[i] > MIN) {
        targetInt[i]--
        diff++
      }
    }

    const apply = w => {
      table.style.tableLayout = 'fixed'
      table.style.width = '100%'
      for (const r of rows) {
        for (let i = 0; i < r.cells.length; i++) {
          const c = r.cells[i]
          c.style.width = c.style.minWidth = c.style.maxWidth = w[i] + '%'
        }
      }
    }

    let bestH = Infinity
    let bestLines = null
    let bestW = null
    // 按「解析出来的像素宽度」而非百分比做记忆：在 688px 宽度下，很多不同的百分比
    // 会落到完全相同的像素分布，这样能合并掉大量重复计算，且不改变结果。
    const memo = new Map()

    const consider = w => {
      apply(w)
      const pxKey = [...rows[0].cells].map(c => c.getBoundingClientRect().width.toFixed(1)).join(',')
      if (memo.has(pxKey)) return
      const h = table.getBoundingClientRect().height
      if (h > bestH + 0.01) {
        memo.set(pxKey, {h, lines: null, w: [...w]})
        return
      }
      const lines = colLines()
      memo.set(pxKey, {h, lines, w: [...w]})
      const c = bestLines === null ? -1 : cmpLines(lines, bestLines)
      if (h < bestH - 0.01 || (Math.abs(h - bestH) <= 0.01 && c < 0)) {
        bestH = h
        bestLines = lines
        bestW = [...w]
      }
    }

    const rec = (prefix, rest, left, step) => {
      if (left === 1) {
        if (rest >= MIN) consider([...prefix, rest])
        return
      }
      for (let v = MIN; rest - v >= MIN * (left - 1); v += step) {
        rec([...prefix, v], rest - v, left - 1, step)
      }
    }

    // 当前写在文件里的向量必须参与比较，否则粗网格搜索可能报出一个**比现状更差**的方案
    // （推荐回归比不推荐还糟）。AnyBlock 会把值写成 min-width，所以从 DOM 就能读到实际生效的值。
    const currentVector = [...rows[0].cells].map(c => {
      const v = parseFloat(c.style.minWidth)
      return Number.isFinite(v) ? Math.round(v) : null
    })
    const hasCurrent = hasFixedLayout && currentVector.every(v => v !== null) &&
      currentVector.reduce((a, b) => a + b, 0) === 100

    // 先评估现状：bestH 立刻有了上界，后续比它高的候选会被直接剪掉（顺带提速），
    // 也保证结果永远不会比现在更差。
    if (hasCurrent) consider(currentVector)

    let evaluated = 0
    const exhaustive = cols <= 3
    if (exhaustive) rec([], 100, cols, 1)
    else {
      rec([], 100, cols, 5)
      consider(targetInt)
      // 局部细化：把 k 个单位从一列挪到另一列
      const refine = k0 => {
        const cur = bestW
        if (!cur) return
        let moved = false
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < cols; j++) {
            if (i === j) continue
            for (let k = k0; k >= 1; k--) {
              if (cur[i] - k < MIN) continue
              const nw = [...cur]
              nw[i] -= k
              nw[j] += k
              const before = bestH
              consider(nw)
              moved = true
              if (before !== bestH) break
            }
          }
        }
        return moved
      }
      for (let r = 0; r < 3; r++) refine(3)
      refine(1)
    }
    evaluated = memo.size

    if (!bestW) {
      results.push({...base, status: 'nosolve', cols, header})
      continue
    }

    // 写完之前先在 DOM 上验证一遍最优解确实可复现，且没有列被挤塌
    apply(bestW)
    const verifyH = table.getBoundingClientRect().height
    const widths = [...rows[0].cells].map(c => c.getBoundingClientRect().width)
    const collapsed = widths.some(w => w < (MIN / 100) * tableWidth - 1)

    // 溢出/裁切检查（原来独立的 ovf.mjs，并进来就不用再开一次浏览器）
    let clipped = false
    for (const r of rows) {
      for (const c of r.cells) {
        const last = c.lastElementChild
        const over = last ? last.getBoundingClientRect().right - c.getBoundingClientRect().right : 0
        if (c.scrollWidth > c.clientWidth + 1 || over > 1) clipped = true
      }
    }

    const sumOk = bestW.reduce((a, b) => a + b, 0) === 100
    const minOk = bestW.every(v => v >= MIN)
    const reproducible = Math.abs(verifyH - bestH) <= 0.5

    results.push({
      ...base,
      status: 'solved',
      cols,
      header,
      rows: rows.length,
      hasFixedLayout,
      hBefore: +hBefore.toFixed(1),
      hAfter: +bestH.toFixed(1),
      bestW,
      bestLines,
      targetInt,
      naturalWidths,
      tableWidth: +tableWidth.toFixed(1),
      lineHeight,
      clipped,
      collapsed,
      evaluated,
      valid: sumOk && minOk && reproducible && !collapsed,
      invalidReason: !sumOk
        ? `宽度和 ${bestW.reduce((a, b) => a + b, 0)} ≠ 100`
        : !minOk
          ? '有列低于最小值'
          : !reproducible
            ? `最优高度复现失败（${bestH} vs ${verifyH}）`
            : collapsed
              ? '有列被挤塌'
              : null,
    })
  }

  return results
}
