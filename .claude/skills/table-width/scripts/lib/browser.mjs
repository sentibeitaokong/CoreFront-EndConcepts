// 依赖解析：puppeteer、Chrome、prettier，以及 dev server 探测。
//
// 这里全部要动态解析，不能写死版本号：
//   - puppeteer 不是本仓库的直接依赖，是 unlighthouse 带进来的传递依赖，
//     写死 `puppeteer@25.1.0` 会在任何一次 pnpm 升级后失效。
//   - .pnpm 里同时躺着 prettier@2.8.8 和 3.8.4，绝不能用 glob 挑。
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import net from 'node:net'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

export class ToolError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

const ver = v => (v.match(/^(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number)
const cmpVer = (a, b) => {
  const A = ver(a)
  const B = ver(b)
  for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]
  return 0
}

const BROWSER_HELP = `装一个就行：
    npx puppeteer browsers install chrome
  或复用系统已有的 Chrome：
    export TW_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`

/** 解析 puppeteer 模块。优先正常解析，失败再去 .pnpm 虚拟仓里挑最高版本。 */
export function loadPuppeteer(repoRoot) {
  const req = createRequire(path.join(repoRoot, 'package.json'))
  try {
    return req('puppeteer')
  } catch {
    /* 落到虚拟仓扫描 */
  }
  const store = path.join(repoRoot, 'node_modules/.pnpm')
  if (!fs.existsSync(store)) {
    throw new ToolError(`找不到 puppeteer，也没有 node_modules/.pnpm。\n  ${BROWSER_HELP}`, 6)
  }
  const hits = fs
    .readdirSync(store)
    .filter(d => /^puppeteer@\d/.test(d))
    .sort((a, b) => cmpVer(b.slice('puppeteer@'.length), a.slice('puppeteer@'.length)))
  for (const h of hits) {
    const pkg = path.join(store, h, 'node_modules/puppeteer/package.json')
    if (fs.existsSync(pkg)) {
      if (hits.length > 1) {
        process.stderr.write(`table-width: .pnpm 里有多个 puppeteer，用最高的 ${h}\n`)
      }
      return createRequire(pkg)('puppeteer')
    }
  }
  throw new ToolError(
    `找不到 puppeteer（虚拟仓里有 ${hits.length} 个候选但都没装全）。\n  ${BROWSER_HELP}`,
    6
  )
}

/** 找 Chrome。返回 {exe, headless}；headless 由找到的是哪个二进制决定。 */
export function findChrome() {
  if (process.env.TW_CHROME) return {exe: process.env.TW_CHROME, headless: true}
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return {exe: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true}
  }
  const cache =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    (process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library/Caches/ms-playwright')
      : path.join(os.homedir(), '.cache/ms-playwright'))
  if (!fs.existsSync(cache)) return {exe: undefined, headless: true}

  const build = d => Number((d.match(/-(\d+)$/) || [])[1] || 0)
  const dirs = prefix =>
    fs
      .readdirSync(cache)
      .filter(d => d.startsWith(prefix))
      .sort((a, b) => build(b) - build(a))

  // 优先 chrome-headless-shell：体积小、就是为无头场景做的。
  // 用 headless: 'shell' 配它——配 error 混用会在某些版本上渲染出不一样的结果。
  for (const d of dirs('chromium_headless_shell-')) {
    const p = path.join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')
    if (fs.existsSync(p)) return {exe: p, headless: 'shell'}
  }
  for (const d of dirs('chromium-')) {
    const p = path.join(
      cache,
      d,
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    )
    if (fs.existsSync(p)) return {exe: p, headless: true}
  }
  // 交给 puppeteer 自己的缓存去找
  return {exe: undefined, headless: true}
}

/**
 * 解析 prettier。必须走 createRequire(repoRoot/package.json)——虚拟仓里同时有
 * 2.8.8 和 3.8.4，glob 会挑错。解析不到不算致命，返回 null 让调用方降级。
 */
export function loadPrettier(repoRoot) {
  try {
    const req = createRequire(path.join(repoRoot, 'package.json'))
    const p = req.resolve('prettier')
    return req(p)
  } catch {
    return null
  }
}

export async function launchBrowser(puppeteer, {width = 1440, height = 1200, headless} = {}) {
  const chrome = findChrome()
  try {
    return await puppeteer.launch({
      executablePath: chrome.exe,
      headless: headless ?? chrome.headless,
      args: ['--no-sandbox'],
      defaultViewport: {width, height},
    })
  } catch (e) {
    throw new ToolError(
      `启动 Chrome 失败：${e.message}\n  找过：${chrome.exe ?? '（未找到，已回退到 puppeteer 自带缓存）'}\n  ${BROWSER_HELP}`,
      6
    )
  }
}

/**
 * 找正在跑的 VitePress dev server。
 *
 * 不能只看 HTTP 状态码——VitePress dev 对**任何**路径都返回 200（SPA 外壳），
 * 所以状态码完全不能证明页面存在。用 HTML 里有没有 `id="app"` 做指纹。
 */
export async function probeServer({port, origin, base, ports = [5173, 5174, 5175, 5176, 4173]}) {
  const candidates = origin
    ? [origin]
    : (port ? [port] : ports).map(p => `http://localhost:${p}`)
  for (const o of candidates) {
    const url = `${o}${base}/`
    try {
      const res = await fetch(url, {signal: AbortSignal.timeout(2500)})
      if (!res.ok) continue
      const html = await res.text()
      if (html.includes('id="app"')) return url
    } catch {
      /* 换下一个 */
    }
  }
  return null
}

/** 真正去 bind 一下，比「探测不到 app」可靠：端口可能被别的服务占着。 */
function findFreePort() {
  return new Promise(resolve => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', () => resolve(null))
    srv.listen(0, '127.0.0.1', () => {
      const {port} = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

/**
 * 保证有一个能用的 dev server。**优先复用已经在跑的**——绝不主动去杀别人的进程。
 *
 * 只在确实需要时才自己拉一个（提交时自动定宽度就是这条路），并且返回的 stop()
 * 只关自己拉起来的那个。
 *
 * ⚠️ 这里必须有超时：VitePress 在配置有问题时会挂在半路不退出也不监听，
 * 卡在 pre-commit 里会让整个提交失去响应。
 */
export async function ensureServer({port, base, repoRoot, timeoutMs = 30000, onNotice} = {}) {
  const existing = await probeServer({port, base, ports: port ? [port] : undefined})
  if (existing) return {url: existing, started: false, stop: async () => {}}

  const bin = path.join(repoRoot, 'node_modules/.bin/vitepress')
  if (!fs.existsSync(bin)) {
    throw new ToolError(`找不到 ${path.relative(repoRoot, bin)}，先跑一次 pnpm install`, 3)
  }
  const free = await findFreePort()
  if (!free) throw new ToolError('本机找不到可用端口来起 dev server', 3)

  onNotice?.(`启动 VitePress dev server（:${free}）…`)
  const child = spawn(bin, ['dev', 'apps/docs', '--port', String(free)], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', d => (log += d))
  child.stderr.on('data', d => (log += d))

  // 只管关自己拉起来的那一个
  const stop = async () => {
    if (child.exitCode === null && !child.killed) {
      child.kill('SIGTERM')
      // 给它 2 秒自己退，不退就强杀，避免留下孤儿进程占着端口
      await new Promise(r => {
        const t = setTimeout(() => {
          child.kill('SIGKILL')
          r()
        }, 2000)
        child.once('exit', () => {
          clearTimeout(t)
          r()
        })
      })
    }
  }

  const deadline = Date.now() + timeoutMs
  const url = `http://localhost:${free}${base}/`
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      await stop()
      throw new ToolError(`dev server 退出了（码 ${child.exitCode}）：\n${log.trim().split('\n').slice(-8).join('\n')}`, 3)
    }
    try {
      const res = await fetch(url, {signal: AbortSignal.timeout(2000)})
      if (res.ok && (await res.text()).includes('id="app"')) {
        return {url, started: true, stop, pid: child.pid}
      }
    } catch {
      /* 还没起来 */
    }
    await new Promise(r => setTimeout(r, 250))
  }
  await stop()
  throw new ToolError(`dev server ${timeoutMs / 1000}s 内没起来：\n${log.trim().split('\n').slice(-8).join('\n')}`, 3)
}

export {pathToFileURL}
