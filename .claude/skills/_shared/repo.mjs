// 仓库定位与 VitePress 路径映射。被 docs-check 和 table-width 两个 skill 共用。
//
// 本文件所在目录没有 SKILL.md，所以不会被当成 skill 加载——它只是两个 skill 之间的共享库。
import {execFileSync} from 'node:child_process'
import path from 'node:path'

// 与 apps/docs/.vitepress/config.mts:155 保持一致。改了那里就得改这里。
export const SITE_BASE = '/CoreFront-EndConcepts'
export const DOCS_SUBDIR = 'apps/docs'
export const DEFAULT_PORT = 5173

let cachedRoot = null
export function repoRoot() {
  if (cachedRoot) return cachedRoot
  try {
    cachedRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {encoding: 'utf8'}).trim()
  } catch {
    throw new Error('当前目录不在 git 仓库内，无法定位仓库根目录')
  }
  return cachedRoot
}

export function docsRoot() {
  return path.join(repoRoot(), DOCS_SUBDIR)
}

/** 绝对路径 → 仓库相对路径（POSIX 分隔符，git 的写法）。 */
export function repoRel(abs) {
  return path.relative(repoRoot(), abs).split(path.sep).join('/')
}

/**
 * 把用户给的参数解析成 markdown 文件绝对路径。
 * 接受三种形式：仓库相对路径、绝对路径、页面 URL。
 */
export function resolveToFile(input, {port = DEFAULT_PORT} = {}) {
  if (/^https?:\/\//.test(input)) return urlToFile(input)
  const abs = path.isAbsolute(input) ? input : path.join(repoRoot(), input)
  return path.normalize(abs)
}

/** 页面 URL → markdown 文件绝对路径。 */
export function urlToFile(url) {
  let p = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0].split('#')[0]
  if (p.startsWith(SITE_BASE)) p = p.slice(SITE_BASE.length)
  p = p.replace(/^\//, '').replace(/\/$/, '')
  const base = docsRoot()
  if (p === '') return path.join(base, 'index.md')
  const direct = path.join(base, `${p}.md`)
  return p.endsWith('index') ? direct : direct
}

/** markdown 文件绝对路径 → 页面 URL。 */
export function fileToUrl(file, {port = DEFAULT_PORT} = {}) {
  let rel = path.relative(docsRoot(), file).split(path.sep).join('/')
  if (rel.endsWith('index.md')) rel = rel.slice(0, -'index.md'.length)
  else rel = rel.replace(/\.md$/, '')
  return `http://localhost:${port}${SITE_BASE}/${rel}`
}

/** 取某个文件在 HEAD 的版本；文件在 HEAD 不存在（新增文件）时返回 null。 */
export function headVersion(repoRelPath) {
  try {
    return execFileSync('git', ['-C', repoRoot(), 'show', `HEAD:${repoRelPath}`], {
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

/** 当前 git 工作区相对 HEAD 有改动的 markdown 文件（仓库相对路径）。 */
export function changedMarkdownFiles() {
  const out = execFileSync('git', ['-C', repoRoot(), 'diff', '--name-only', 'HEAD', '--', '*.md'], {
    encoding: 'utf8',
  })
  return out.trim().split('\n').filter(Boolean)
}
