// markdown 行扫描工具：代码块、表格、[width(...)] 指令。
//
// 不引 markdown AST：这个仓库的写法足够规整（表格一定带首尾竖线，[width(...)] 一定独占一行），
// 行扫描既够用又少一个依赖。所有行号都是 1-based，跟编辑器一致。

/** 逐行扫描出所有 fenced code block。未闭合的块也会返回，带 unterminated 标记。 */
export function extractFences(text) {
  const lines = text.split('\n')
  const out = []
  let cur = null
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*```(\S*)/)
    if (m) {
      if (cur === null) {
        cur = {open: m[1] || '', startLine: i + 1, body: []}
      } else {
        cur.lang = cur.open
        cur.bodyText = cur.body.join('\n')
        cur.endLine = i + 1
        delete cur.body
        out.push(cur)
        cur = null
      }
    } else if (cur !== null) {
      cur.body.push(lines[i])
    }
  }
  if (cur !== null) {
    cur.lang = cur.open
    cur.bodyText = cur.body.join('\n')
    cur.endLine = lines.length
    cur.unterminated = true
    delete cur.body
    out.push(cur)
  }
  return out
}

/** 代码块内按语言归类。lang 已转小写，裸 ``` 记为 ''。 */
export function fenceLanguages(fences) {
  const by = {}
  for (const f of fences) {
    const k = (f.lang || '').toLowerCase()
    by[k] = (by[k] || 0) + 1
  }
  return by
}

/** 把代码块内的内容挖空（保留行数），用于链接/图片扫描时不被示例代码里的假链接误伤。 */
export function blankFences(text) {
  const lines = text.split('\n')
  const fenced = new Array(lines.length).fill(false)
  let inside = false
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) {
      fenced[i] = true
      inside = !inside
      continue
    }
    if (inside) fenced[i] = true
  }
  return lines.map((l, i) => (fenced[i] ? '' : l))
}

/** 只挖掉行内代码 span（`...`），保留其余文本，避免示例里的假链接。 */
export function blankInlineCode(line) {
  return line.replace(/`[^`\n]*`/g, m => ' '.repeat(m.length))
}

/** 拆一行表格为单元格，正确处理转义的 \| 。 */
export function splitRow(line) {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1)
  const cells = []
  let cur = ''
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') {
      cur += '|'
      i++
      continue
    }
    if (s[i] === '|') {
      cells.push(cur)
      cur = ''
      continue
    }
    cur += s[i]
  }
  cells.push(cur)
  return cells.map(c => c.trim())
}

const TABLE_ROW = /^\s*\|.*\|\s*$/
const SEPARATOR_ROW = /^\s*\|[\s:|-]+\|\s*$/

/** 找出所有表格：起始行、列数、以及紧邻其上的 [width(...)] 指令（若有）。 */
export function scanTables(text) {
  const lines = text.split('\n')
  const tables = []
  for (let i = 0; i < lines.length - 1; i++) {
    if (!TABLE_ROW.test(lines[i])) continue
    if (!SEPARATOR_ROW.test(lines[i + 1])) continue
    // 表头行本身不能是分隔行（分隔行前面不会再有表头）
    if (SEPARATOR_ROW.test(lines[i])) continue
    const headerCells = splitRow(lines[i])
    const sepCells = splitRow(lines[i + 1])
    if (headerCells.length !== sepCells.length) continue
    const cols = sepCells.length
    if (cols < 2) continue
    let end = i + 1
    while (end + 1 < lines.length && TABLE_ROW.test(lines[end + 1])) end++
    tables.push({
      startLine: i + 1,
      endLine: end + 1,
      cols,
      header: headerCells,
      directive: findDirective(lines, i),
    })
    i = end
  }
  return tables
}

/** 从表格起始行往前找 [width(...)]，允许中间隔空行，最多回溯 3 行。 */
function findDirective(lines, tableStartIdx) {
  for (let j = tableStartIdx - 1; j >= Math.max(0, tableStartIdx - 3); j--) {
    const line = lines[j]
    if (line === undefined) break
    if (line.trim() === '') continue
    const values = parseWidthDirective(line)
    if (values) return {lineNo: j + 1, values, raw: line.trim()}
    return null
  }
  return null
}

/** 解析 `[width(20,30,50)]` 这一行；不是该形式则返回 null。 */
export function parseWidthDirective(line) {
  const m = line.match(/^\s*\[width\(\s*([\d\s,]+?)\s*\)\]\s*$/)
  if (!m) return null
  const parts = m[1].split(',').map(s => s.trim())
  if (parts.some(p => p === '' || !/^\d+$/.test(p))) return null
  return parts.map(Number)
}

/** 生成 `[width(a,b,c)]`。 */
export function formatWidthDirective(values) {
  return `[width(${values.join(',')})]`
}

/**
 * 找出围栏内以 ASI guard（行首 `;`）开头的行，prettier 可能把它改写成别的语义。
 *
 * 返回的 `code` 已经剥掉行尾注释——只比较代码本身。拿整行比较会因为「改了注释措辞」
 * 而误报 guard 消失，而注释措辞是最常动的部分。
 */
export function asiGuardLines(bodyText) {
  return bodyText
    .split('\n')
    .map((l, i) => ({line: i + 1, text: l}))
    .filter(({text}) => /^\s*;[\[(`]/.test(text))
    .map(({line, text}) => ({line, code: text.replace(/\s*\/\/.*$/, '').trim()}))
}
