#!/usr/bin/env node
// 表格列宽：一条命令测完、择优、回写、复查。可以一次传多个文件。
//
//   node .claude/skills/table-width/scripts/fix-widths.mjs <文件或URL> [更多文件...]
//   node .claude/skills/table-width/scripts/fix-widths.mjs --auto <文件...>   # 给 husky 用
//
// 需要 dev server；没有就自己拉一个（--auto 时如此，手动跑时若也没有会自己起）。
// 默认**直接回写 markdown**，--dry 只看不改。
//
// 输出刻意做到极简：每张改动的表一行，最后一行汇总。不要把候选集打印出来——
// 这个脚本存在的意义就是让模型不必看见表格内容。
import fs from 'node:fs'

import {
  DEFAULT_PORT,
  SITE_BASE,
  repoRoot,
  docsRoot,
  repoRel,
  resolveToFile,
  fileToUrl,
} from '../../_shared/repo.mjs'
import {scanTables, formatWidthDirective} from '../../_shared/markdown.mjs'
import {solveTablesInPage} from './lib/page.mjs'
import {
  ToolError,
  loadPuppeteer,
  loadPrettier,
  launchBrowser,
  ensureServer,
} from './lib/browser.mjs'

const EXIT = {ok: 0, error: 1, usage: 2, noServer: 3, mapping: 4, needsChange: 5, browser: 6}
const PORT = DEFAULT_PORT
const USAGE = `用法: node .claude/skills/table-width/scripts/fix-widths.mjs <文件或URL> [更多文件...] [选项]

  --dry            只报告，不改文件
  --check          只校验；需要改动时退出码 5（隐含 --dry）
  --auto           给 git 钩子用：把这次要提交的文件里**每一张**表都校验一遍——
                   没填 [width] 的补上，填了但不是最优的改成最优。出错时告警
                   放行而不是拦提交。隐含 --insert --quiet
  --insert         对没有 [width(...)] 的表格补一条
  --heading <前缀>  只处理最近标题以此开头的表格
  --table <n>      在过滤结果里只处理第 n 张（1 起）
  --port <n>       dev server 端口（默认 ${PORT}）
  --url <url>      直接指定站点地址，跳过探测与自启
  --min <n>        最小百分比（默认 8）
  --json           输出机器可读结果
  --quiet          不打印未改动的表格
`

/** --auto 走到死路时抛这个，由最外层统一降级成「告警 + 放行」。 */
class AutoSkip extends Error {}

// ── 参数 ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flag = name => argv.includes(`--${name}`)
const opt = name => {
  const i = argv.findIndex(a => a === `--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}
const positional = []
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    if (['heading', 'table', 'port', 'url', 'min'].includes(argv[i].slice(2))) i++
    continue
  }
  positional.push(argv[i])
}

if (!positional.length || flag('help') || flag('h')) {
  console.log(USAGE)
  process.exit(positional.length ? EXIT.ok : EXIT.usage)
}

const AUTO = flag('auto')
const DRY = flag('dry') || flag('check')
const CHECK = flag('check')
const INSERT = flag('insert') || AUTO
const JSON_OUT = flag('json')
const QUIET = flag('quiet') || AUTO
const MIN = Number(opt('min') ?? 8)
const PORT_OPT = Number(opt('port') ?? PORT)
// 没显式给 --port 时，探测应该在常见端口里找——你自己起的 server 可能在 5174，
// 那样就能直接复用，不必再拉起一个。
const PROBE_PORT = opt('port') === undefined ? undefined : PORT_OPT

/**
 * 出错处理。手动跑就正常报错退出；--auto 时抛出去，让整个提交照常进行。
 *
 * 为什么 --auto 必须放行：宽度没算出来是「不够好」，不是「有问题」。为了一个
 * 优化步骤把提交卡死（Chrome 没装、端口被占、页面编译报错……）得不偿失。
 * 真正的正确性红线由 docs-check 把守，那个才拦。
 */
function fail(msg, code = EXIT.error) {
  if (!AUTO) {
    console.error(`table-width: ${msg}`)
    process.exit(code)
  }
  throw new AutoSkip(msg)
}

// ── 定位目标 ──────────────────────────────────────────────────────────────────
//
// --auto 是**全量校验**：这次要提交的文件里，每一张表都过一遍——没填 [width] 的补上，
// 填了但不是最优的改成最优。不是「只处理我这次改过的表」。
//
// 之所以敢全量，是量出来的而不是猜的：拿仓库里 [width] 最密集的 10 个文件跑一遍，
// 116 处人工调好的宽度里只有 1 处会被改动（dom.md 的 20,80 -> 12,88，确实矮 24px）。
// 「全量扫描会翻案手工成果」这个顾虑实测是 1/116，其余全部命中「未变」。
const items = []
for (const p of positional) {
  const file = resolveToFile(p, {port: PORT_OPT})
  if (!fs.existsSync(file)) fail(`文件不存在: ${file}`, EXIT.mapping)
  if (!file.startsWith(docsRoot())) fail(`只处理 apps/docs 下的文档: ${repoRel(file)}`, EXIT.mapping)
  const text = fs.readFileSync(file, 'utf8')
  const tables = scanTables(text)
  items.push({
    file,
    rel: repoRel(file),
    text,
    tables,
    // 唯一的静态门：整个文件一张表都没有就直接跳过，连浏览器都不起。
    needWork: tables.length > 0,
  })
}

// 手动跑：所有文件都处理。--auto：只处理真的需要补宽度的。
const active = AUTO ? items.filter(i => i.needWork) : items
if (!active.length) {
  if (!AUTO) console.log('没有需要处理的表格')
  process.exit(EXIT.ok)
}

// ── 服务与浏览器（整个批次共用一套）──────────────────────────────────────────
let server
let browser
const results = []

try {
  try {
    server = opt('url')
      ? {url: `${new URL(opt('url')).origin}${SITE_BASE}/`, started: false, stop: async () => {}}
      : await ensureServer({
          port: PROBE_PORT,
          base: SITE_BASE,
          repoRoot: repoRoot(),
          onNotice: m => process.stderr.write(`table-width: ${m}\n`),
        })
  } catch (e) {
    fail(e instanceof ToolError ? e.message : String(e), e?.code ?? EXIT.noServer)
  }
  const serverPort = Number(new URL(server.url).port) || PORT_OPT

  try {
    browser = await launchBrowser(loadPuppeteer(repoRoot()))
  } catch (e) {
    fail(`启动浏览器失败：${e.message}`, EXIT.browser)
  }

  const page = await browser.newPage()
  const pageErrors = []
  page.on('pageerror', e => pageErrors.push(String(e)))

  for (const item of active) {
    pageErrors.length = 0
    try {
      results.push(await processFile(page, item, {serverPort, pageErrors}))
    } catch (e) {
      // 单个文件失败不该拖垮同一次提交里的其它文件
      if (e instanceof AutoSkip) {
        process.stderr.write(`table-width: ${item.rel} 跳过（${e.message}）\n`)
        continue
      }
      throw e
    }
  }
} catch (e) {
  // --auto 下**任何**异常都降级成告警放行，不只是我们自己抛的 AutoSkip。
  // 页面超时、Chrome 崩了、Vite 编译报错……都会走到这里；放一段 stack trace
  // 出来再把提交拦下，正好是这个特性最不该有的行为。
  if (!AUTO) throw e
  process.stderr.write(
    `table-width: ${e instanceof AutoSkip ? e.message : (e?.message ?? String(e))}\n` +
      `  → 本次没有自动定宽度，**不影响提交**。手动跑：\n` +
      `    node .claude/skills/table-width/scripts/fix-widths.mjs <文件>\n`
  )
} finally {
  await browser?.close().catch(() => {})
  await server?.stop().catch(() => {})
}

// ── 处理一个文件 ──────────────────────────────────────────────────────────────
async function processFile(page, item, {serverPort, pageErrors}) {
  const {file, rel, tables: mdTables} = item
  const mdText = fs.readFileSync(file, 'utf8')
  const url = fileToUrl(file, {port: serverPort}).replace(/\/$/, '')

  let res
  try {
    res = await page.goto(url, {waitUntil: 'networkidle0', timeout: 30000})
  } catch (e) {
    // 不把这个异常原样抛出去：手动跑时那会是一段 Node stack trace，
    // 读的人只想知道「页面打不开」，不想看调用栈。
    fail(`${rel}: 打不开页面 ${url}\n  ${e.message}`, EXIT.noServer)
  }
  if (!res) fail(`页面没有响应: ${url}`, EXIT.mapping)
  // VitePress dev 对任意路径都返回 200，所以状态码证明不了页面存在；靠表格数量对齐来验。
  await new Promise(r => setTimeout(r, 400))
  if (pageErrors.length) {
    process.stderr.write(`table-width: ${rel} 页面报错 ${pageErrors.length} 条（第一条：${pageErrors[0]}）\n`)
  }

  let domResults
  try {
    domResults = await page.evaluate(solveTablesInPage, {
      minPct: MIN,
      headingPrefix: opt('heading') ?? null,
      onlyIndex: opt('table') ? Number(opt('table')) : null,
    })
  } catch (e) {
    fail(`${rel}: 页面里测量失败\n  ${e.message}`, EXIT.browser)
  }

  // 两个来源的表格数必须一致，否则「第 n 张」对不上，回写就会写错地方。
  // 这也是唯一能证明 URL 指向的确实是这个文件的办法。
  if (domResults.length !== mdTables.length) {
    fail(
      `${rel}: 页面上有 ${domResults.length} 张表，文件里有 ${mdTables.length} 张——对不上。\n` +
        `  多半是 URL 指错了页面，或者页面里有 .vp-doc 之外的表格。\n  URL: ${url}`,
      EXIT.mapping
    )
  }

  // ── 决定每张表的新宽度 ──────────────────────────────────────────────────────
  const planned = []
  for (let i = 0; i < domResults.length; i++) {
    const dom = domResults[i]
    const md = mdTables[i]
    const directive = md?.directive ?? null
    const lineNo = directive?.lineNo ?? md?.startLine ?? 0

    if (dom.status === 'filtered') continue
    if (dom.status === 'trivial') continue
    if (dom.status === 'span') {
      planned.push({kind: 'skip', dom, lineNo, reason: '表格有合并单元格（colspan/rowspan），不支持'})
      continue
    }
    if (dom.status === 'nosolve') {
      planned.push({kind: 'skip', dom, lineNo, reason: '没有找到可行解'})
      continue
    }
    if (!dom.valid) {
      planned.push({kind: 'skip', dom, lineNo, reason: `结果未通过自检：${dom.invalidReason}`})
      continue
    }
    if (!directive && !INSERT) {
      planned.push({kind: 'skip', dom, lineNo, reason: '没有 [width(...)]（加 --insert 可以补一条）'})
      continue
    }

    const same =
      directive &&
      directive.values.length === dom.bestW.length &&
      directive.values.join(',') === dom.bestW.join(',')
    planned.push({
      kind: same ? 'same' : 'change',
      dom,
      md,
      lineNo,
      tableIndex: i,
      from: directive?.values ?? null,
      to: dom.bestW,
      insert: !directive,
    })
  }

  // ── 回写 ────────────────────────────────────────────────────────────────────
  const changes = planned.filter(p => p.kind === 'change')
  let text = mdText
  if (!DRY && changes.length) {
    const lines = text.split('\n')
    // 从后往前改，避免行号偏移
    for (const p of changes.sort((a, b) => b.lineNo - a.lineNo)) {
      const vec = formatWidthDirective(p.to)
      if (p.insert) {
        const at = p.md.startLine - 1
        const prevBlank = at === 0 || lines[at - 1].trim() === ''
        lines.splice(at, 0, ...(prevBlank ? [vec, ''] : ['', vec, '']))
      } else {
        const indent = (lines[p.lineNo - 1].match(/^\s*/) || [''])[0]
        lines[p.lineNo - 1] = `${indent}${vec}`
      }
    }
    const next = lines.join('\n')

    // 写后校验：这是旧脚本从来没有的一步，也是这个工具能被信任的原因。
    // 链条是 markdown → AnyBlock → 内联样式 → 实测高度 → 选中的向量 → 回写 markdown，
    // 最后一环必须靠重新读文件来证明，而不是假设。
    const problem = verifyWrite(mdText, next, changes)
    if (problem) fail(`${rel}: 写入校验失败，文件未改动：${problem}`)
    fs.writeFileSync(file, next)
    text = next
  }

  // ── Prettier 只是体检，不用它写文件 ─────────────────────────────────────────
  // 不用 prettier --write 重排，因为它会顺带改掉跟表格无关的东西（现有文件里就有
  // 空行和 JS 三元表达式的重排）。Prettier 对 [width(...)] 行和表格管道对齐本来就是
  // 不动点，而且 lint-staged 提交时反正会跑一遍。这里只回答「我这次写坏了吗」。
  let prettierNote = null
  if (!DRY && changes.length) {
    const prettier = loadPrettier(repoRoot())
    if (prettier) {
      try {
        const opts = {filepath: file}
        const cleanBefore = await prettier.check(mdText, opts)
        const cleanAfter = await prettier.check(text, opts)
        if (cleanBefore && !cleanAfter) prettierNote = '写完之后 prettier 会重新格式化（可能是宽度值没对齐）'
      } catch {
        /* prettier 不可用就不管 */
      }
    }
  }

  return {rel, url, planned, changes, prettierNote, wrote: !DRY && changes.length > 0}
}

/**
 * 校验回写只动了该动的行，且写进去的向量能被重新解析出来。
 */
function verifyWrite(before, after, changes) {
  const a = before.split('\n')
  const b = after.split('\n')
  const touched = new Set(changes.map(c => c.lineNo - 1))
  // 插入会让总行数变化，那种情况下的逐行比对没有意义，只做重新解析的校验
  if (b.length === a.length) {
    for (let i = 0; i < a.length; i++) {
      if (!touched.has(i) && a[i] !== b[i]) return `第 ${i + 1} 行意外被改动`
    }
  }
  // 用**表格序号**定位，不用行号：同一次提交里如果既有插入又有改动，
  // 插入会让它后面所有行的行号整体偏移，按行号回查就会误判成写入失败。
  // 改的只是 [width(...)] 独立行，表格的数量和顺序不变，所以序号是稳的。
  const reparsed = scanTables(after)
  for (const c of changes) {
    const t = reparsed[c.tableIndex]
    if (!t) return `第 ${c.tableIndex + 1} 张表重新解析不出来`
    if (!t.directive) return `第 ${c.tableIndex + 1} 张表的 [width(...)] 没写进去`
    if (t.directive.values.join(',') !== c.to.join(',')) {
      return `第 ${c.tableIndex + 1} 张表写进去的是 ${t.directive.values.join(',')}，期望 ${c.to.join(',')}`
    }
  }
  return null
}

// ── 报告 ──────────────────────────────────────────────────────────────────────
const totals = {changed: 0, unchanged: 0, skipped: 0, written: 0, files: results.length}
for (const r of results) {
  totals.changed += r.changes.length
  totals.unchanged += r.planned.filter(p => p.kind === 'same').length
  totals.skipped += r.planned.filter(p => p.kind === 'skip').length
  if (r.wrote) totals.written += r.changes.length
}

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        dryRun: DRY,
        files: results.map(r => ({
          file: r.rel,
          url: r.url,
          wrote: r.wrote,
          tables: r.planned.map(p => ({
            index: p.dom.index,
            line: p.lineNo,
            heading: p.dom.heading,
            cols: p.dom.cols,
            from: p.from,
            to: p.to ?? null,
            hBefore: p.dom.hBefore ?? null,
            hAfter: p.dom.hAfter ?? null,
            delta: p.dom.hAfter != null ? +(p.dom.hAfter - p.dom.hBefore).toFixed(1) : null,
            status: p.kind,
            reason: p.reason ?? null,
            clipped: p.dom.clipped ?? null,
          })),
        })),
        totals,
      },
      null,
      2
    )
  )
} else {
  for (const r of results) {
    for (const p of r.planned) {
      if (p.kind === 'same') {
        if (!QUIET) console.log(`= #${p.dom.index} ${p.dom.cols}col ${p.to.join(',')}  L${p.lineNo}`)
        continue
      }
      if (p.kind === 'skip') {
        console.log(`! #${p.dom.index} ${p.dom.cols}col ${p.reason}  L${p.lineNo}`)
        continue
      }
      const delta = p.dom.hAfter - p.dom.hBefore
      const clip = p.dom.clipped ? '  ⚠有内容溢出' : ''
      console.log(
        `~ #${p.dom.index} ${p.dom.cols}col ${p.from ? p.from.join(',') : '(无)'} -> ${p.to.join(',')}` +
          `  ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}px  L${p.lineNo}${clip}`
      )
    }
    if (r.prettierNote) console.log(`⚠ ${r.prettierNote}`)
    const unchanged = r.planned.filter(p => p.kind === 'same').length
    const skipped = r.planned.filter(p => p.kind === 'skip').length
    if (AUTO) {
      // 钩子里每个文件只留一行，而且只在真的补了东西时才说话
      if (r.wrote) console.log(`${r.rel}: 自动补了 ${r.changes.length} 处 [width(...)]`)
    } else {
      const wrote = DRY ? '' : ` -> 写入 ${r.changes.length} 处`
      console.log(`${r.rel}: ${r.changes.length} 改动, ${unchanged} 未变, ${skipped} 跳过${wrote}`)
    }
  }
  if (results.length > 1) {
    const wrote = DRY ? '' : ` -> 写入 ${totals.written} 处`
    console.log(`合计: ${totals.files} 个文件, ${totals.changed} 改动, ${totals.skipped} 跳过${wrote}`)
  }
}

if (CHECK && totals.changed) process.exit(EXIT.needsChange)
process.exit(EXIT.ok)
