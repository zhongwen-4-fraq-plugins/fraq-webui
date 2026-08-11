// 环境检查与安装：fraq CLI 与 Milky 协议端（Yogurt / LuckyLilliaBot）。

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'
import extract from 'extract-zip'
import {
  getProtocolDir,
  setProtocolDir,
  getPortableNodeDir,
  setPortableNodeDir,
  saveState,
  MILKY_URL,
  MILKY_ACCESS_TOKEN,
} from '../core/config.js'
import * as fraqConfig from './fraqConfig.js'
import * as logService from './logService.js'
import { buildChildEnv } from './processManager.js'

const execAsync = promisify(exec)

// 支持的协议端来源（GitHub 仓库）
const SOURCES = {
  yogurt: { owner: 'SaltifyDev', repo: 'yogurt-releases' },
  lucky: { owner: 'LLOneBot', repo: 'LuckyLilliaBot' },
}

// 安装任务状态：前端轮询进度
const state = {
  busy: false,
  phase: 'idle', // idle | installing-cli | downloading | extracting | done | error
  progress: 0,
  message: '',
  error: '',
  exePath: '',
  task: '', // cli | protocol | node
  source: '',
  tag: '',
  asset: '',
  running: false,
  pid: null,
}

const releaseCache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000

let protocolChild = null

async function runCommand(cmd, args, { cwd, quiet = false } = {}) {
  const command = [cmd, ...args].join(' ')
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: buildChildEnv(),
    })
    const output = `${stdout}${stderr}`.trim()
    if (!quiet && output) {
      logService.push(output)
    }
    return output
  } catch (error) {
    const message = String(error.stderr ?? error.message ?? '').trim()
    throw new Error(message || `${cmd} 执行失败`)
  }
}

export async function checkCli() {
  try {
    // 注意：本版 CLI 不识别 --version，需用 version 子命令
    const version = await runCommand('fraq', ['version'], { quiet: true })
    return { installed: true, version }
  } catch {
    return { installed: false, version: '' }
  }
}

export async function checkProtocol() {
  const url = `${MILKY_URL.replace(/\/+$/, '')}/api/get_login_info`
  const token = MILKY_ACCESS_TOKEN || fraqConfig.getMilkyConfig().accessToken
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: '{}',
    })
    if (response.status === 401) {
      return {
        reachable: false,
        running: true,
        detail: '协议端在运行，但访问令牌未配置或不正确',
      }
    }
    if (!response.ok) {
      return { reachable: false, running: true, detail: `协议端返回 HTTP ${response.status}` }
    }
    const body = await response.json().catch(() => null)
    if (body?.status !== 'ok') {
      return { reachable: false, running: true, detail: body?.message ?? '协议端返回异常' }
    }
    return { reachable: true, running: true, detail: `已连接 ${MILKY_URL}` }
  } catch (error) {
    return {
      reachable: false,
      running: false,
      detail: '无法连接协议端，请安装或启动协议端',
    }
  }
}

export async function checkAll() {
  const [node, cli, protocol] = await Promise.all([checkNode(), checkCli(), checkProtocol()])
  return { node, cli, protocol, status: getStatus() }
}

export async function checkNode() {
  const [node, npm] = await Promise.allSettled([
    runCommand('node', ['--version'], { quiet: true }),
    runCommand('npm', ['--version'], { quiet: true }),
  ])
  if (node.status !== 'fulfilled') {
    return { installed: false, nodeVersion: '', npmVersion: '' }
  }
  return {
    installed: true,
    nodeVersion: node.value.replace(/^v/, ''),
    npmVersion: npm.status === 'fulfilled' ? npm.value : '',
  }
}

export function installCli() {
  if (state.busy) {
    throw new Error('已有安装任务在进行，请稍后再试')
  }
  state.busy = true
  Object.assign(state, {
    phase: 'installing-cli',
    progress: 0,
    message: '正在安装 fraq CLI（npm install -g @fraqjs/cli）...',
    error: '',
    exePath: '',
    task: 'cli',
    source: '',
    tag: '',
    asset: '',
  })
  logService.pushEvent('info', '开始安装 fraq CLI...')
  runCommand('npm', ['install', '-g', '@fraqjs/cli'])
    .then(() => {
      state.phase = 'done'
      state.progress = 100
      state.message = 'fraq CLI 安装完成'
      logService.pushEvent('info', 'fraq CLI 安装完成')
    })
    .catch((error) => {
      state.phase = 'error'
      state.error = error instanceof Error ? error.message : '安装失败'
      state.message = 'fraq CLI 安装失败'
      logService.pushEvent('error', `fraq CLI 安装失败：${state.error}`)
    })
    .finally(() => {
      state.busy = false
    })
}

const nodeReleaseCache = { at: 0, data: [] }

export async function listNodeReleases() {
  if (Date.now() - nodeReleaseCache.at < CACHE_TTL_MS) {
    return nodeReleaseCache.data
  }
  const response = await fetch('https://nodejs.org/dist/index.json', {
    headers: { 'User-Agent': 'fraq-webui' },
  })
  if (!response.ok) {
    throw new Error(`Node.js 官网返回 HTTP ${response.status}，请稍后重试`)
  }
  const all = await response.json()
  nodeReleaseCache.data = all
    .filter((item) => item.lts !== false)
    .slice(0, 12)
    .map((item) => ({
      version: item.version,
      lts: typeof item.lts === 'string' ? item.lts : '',
      date: item.date,
    }))
  nodeReleaseCache.at = Date.now()
  return nodeReleaseCache.data
}

export function installNode({ version, installDir }) {
  if (state.busy) {
    throw new Error('已有安装任务在进行，请稍后再试')
  }
  state.busy = true
  const dirError = applyInstallDir(installDir)
  if (dirError) {
    state.busy = false
    throw new Error(dirError)
  }
  const ver = version.startsWith('v') ? version : `v${version}`
  const assetName = `node-${ver}-win-x64.zip`
  const destDir = path.join(getProtocolDir(), 'node', ver)
  const url = `https://nodejs.org/dist/${ver}/${assetName}`

  state.task = 'node'
  state.phase = 'downloading'
  state.progress = 0
  state.message = `正在下载 ${assetName}`
  state.error = ''
  state.exePath = ''
  state.source = ''
  state.tag = ver
  state.asset = assetName
  logService.pushEvent('info', `开始下载 ${assetName}...`)
  void (async () => {
    try {
      const filePath = path.join(destDir, assetName)
      fs.mkdirSync(destDir, { recursive: true })
      await downloadFileWithRetry(url, filePath, 0, (received, total) => {
        state.progress = Math.min(89, Math.round((received / total) * 100))
        state.message = `正在下载 ${assetName}（${formatBytes(received)} / ${formatBytes(total)}）`
      })
      state.phase = 'extracting'
      state.progress = 92
      state.message = '正在解压...'
      await extract(filePath, { dir: destDir })
      try {
        fs.unlinkSync(filePath)
      } catch {
        // 解压后删除压缩包失败不影响使用
      }
      const nodeExe = findExecutable(destDir, 'node')
      setPortableNodeDir(nodeExe ? path.dirname(nodeExe) : destDir)
      saveState()
      state.phase = 'done'
      state.progress = 100
      state.message = 'Node.js 安装完成'
      logService.pushEvent('info', `Node.js 安装完成（${nodeExe}）`)
    } catch (error) {
      state.phase = 'error'
      state.error = error instanceof Error ? error.message : '安装失败'
      state.message = 'Node.js 安装失败'
      logService.pushEvent('error', `Node.js 安装失败：${state.error}`)
    } finally {
      state.busy = false
    }
  })()
}

export async function listReleases(source) {
  const info = SOURCES[source]
  if (!info) {
    throw new Error('未知的协议端来源')
  }
  const cached = releaseCache.get(info.repo)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data
  }
  const response = await fetch(
    `https://api.github.com/repos/${info.owner}/${info.repo}/releases?per_page=30`,
    {
      headers: {
        'User-Agent': 'fraq-webui',
        Accept: 'application/vnd.github+json',
      },
    },
  )
  if (!response.ok) {
    throw new Error(`GitHub 返回 HTTP ${response.status}，请稍后重试`)
  }
  const releases = await response.json()
  const data = releases.map((release) => ({
    tag: release.tag_name,
    name: release.name || release.tag_name,
    publishedAt: release.published_at,
    prerelease: Boolean(release.prerelease),
    assets: (release.assets ?? []).map((asset) => ({
      name: asset.name,
      size: asset.size,
      url: asset.browser_download_url,
    })),
  }))
  releaseCache.set(info.repo, { at: Date.now(), data })
  return data
}

export function installProtocol({ source, tag, assetName, installDir }) {
  if (state.busy) {
    throw new Error('已有安装任务在进行，请稍后再试')
  }
  state.busy = true
  const info = SOURCES[source]
  if (!info) {
    state.busy = false
    throw new Error('未知的协议端来源')
  }
  const dirError = applyInstallDir(installDir)
  if (dirError) {
    state.busy = false
    throw new Error(dirError)
  }
  // 校验版本与文件，通过后再开始后台下载
  void listReleases(source).then((releases) => {
    const release = releases.find((item) => item.tag === tag)
    if (!release) {
      throw new Error(`找不到版本 ${tag}`)
    }
    const asset = release.assets.find((item) => item.name === assetName)
    if (!asset) {
      throw new Error(`找不到文件 ${assetName}`)
    }
    return { info, release, asset }
  }).then(({ release, asset }) => {
    startDownload(source, tag, assetName, release, asset)
  }).catch((error) => {
    state.phase = 'error'
    state.error = error instanceof Error ? error.message : '安装失败'
    state.busy = false
  })
}

async function startDownload(source, tag, assetName, release, asset) {
  const destDir = path.join(getProtocolDir(), source, tag)
  fs.mkdirSync(destDir, { recursive: true })
  const filePath = path.join(destDir, assetName)

  state.busy = true
  Object.assign(state, {
    phase: 'downloading',
    progress: 0,
    message: `正在下载 ${assetName}`,
    error: '',
    exePath: '',
    task: 'protocol',
    source,
    tag,
    asset: assetName,
  })
  logService.pushEvent('info', `开始下载 ${assetName}（${formatBytes(asset.size)}）...`)
  try {
    await downloadFileWithRetry(asset.url, filePath, asset.size, (received, total) => {
      state.progress = Math.min(89, Math.round((received / total) * 100))
      state.message = `正在下载 ${assetName}（${formatBytes(received)} / ${formatBytes(total)}）`
    })
    if (filePath.toLowerCase().endsWith('.zip')) {
      state.phase = 'extracting'
      state.progress = 92
      state.message = '正在解压...'
      await extract(filePath, { dir: destDir })
      try {
        fs.unlinkSync(filePath)
      } catch {
        // 解压后删除压缩包失败不影响使用
      }
    }
    state.exePath = findExecutable(destDir, source)
    state.phase = 'done'
    state.progress = 100
    state.message = state.exePath
      ? '安装完成，可以启动协议端'
      : '文件已下载，请手动运行安装程序'
    logService.pushEvent('info', state.message)
  } catch (error) {
    state.phase = 'error'
    state.error = error instanceof Error ? error.message : '安装失败'
    state.message = '协议端安装失败'
    logService.pushEvent('error', `协议端安装失败：${state.error}`)
  } finally {
    state.busy = false
  }
}

async function downloadFileWithRetry(url, filePath, total, onProgress) {
  const maxAttempts = 2
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await downloadFile(url, filePath, total, onProgress)
      return
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error
      }
      logService.pushEvent('warn', `下载中断（${error.message}），正在重试...`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

// GitHub 下载会 302 跳转到对象存储，用原生 https 模块避免 undici 连接超时问题
function downloadFile(url, filePath, total, onProgress) {
  return new Promise((resolve, reject) => {
    const request = (target, redirects) => {
      const req = https.get(
        target,
        { headers: { 'User-Agent': 'fraq-webui', Accept: '*/*' } },
        (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            response.resume()
            if (redirects >= 5) {
              reject(new Error('下载重定向次数过多'))
              return
            }
            request(new URL(response.headers.location, target).toString(), redirects + 1)
            return
          }
          if (response.statusCode !== 200) {
            response.resume()
            reject(new Error(`下载失败（HTTP ${response.statusCode}）`))
            return
          }
          const contentLength = Number(response.headers['content-length']) || total || 0
          const writer = fs.createWriteStream(filePath)
          let received = 0
          response.on('data', (chunk) => {
            received += chunk.length
            if (contentLength > 0) {
              onProgress(received, contentLength)
            }
          })
          response.pipe(writer)
          writer.on('finish', resolve)
          writer.on('error', reject)
          response.on('error', reject)
        },
      )
      req.setTimeout(30000, () => req.destroy(new Error('连接超时')))
      req.on('error', reject)
    }
    request(url, 0)
  })
}

function findExecutable(dir, source) {
  const keywords = source === 'yogurt' ? ['yogurt'] : ['lucky', 'lillia']
  const results = []
  const walk = (current, depth) => {
    if (depth > 3) {
      return
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) {
        continue
      }
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full, depth + 1)
      } else if (/\.(exe|appimage|sh)$/i.test(entry.name)) {
        results.push(full)
      }
    }
  }
  walk(dir, 0)
  const score = (file) =>
    keywords.reduce((sum, keyword) => sum + (file.toLowerCase().includes(keyword) ? 1 : 0), 0)
  results.sort((a, b) => score(b) - score(a))
  return results[0] ?? ''
}

export function startProtocol() {
  if (protocolChild) {
    return { running: true, pid: protocolChild.pid }
  }
  const exePath = state.exePath
  if (!exePath || !fs.existsSync(exePath)) {
    throw new Error('协议端未安装，请先下载安装')
  }
  protocolChild = spawn(exePath, [], {
    cwd: path.dirname(exePath),
    windowsHide: true,
  })
  state.running = true
  state.pid = protocolChild.pid
  logService.pushEvent('info', `正在启动协议端（${exePath}）...`)
  protocolChild.stdout?.on('data', (chunk) => logService.push(String(chunk)))
  protocolChild.stderr?.on('data', (chunk) => logService.push(String(chunk)))
  protocolChild.on('error', (error) => {
    logService.pushEvent('error', `启动协议端失败：${error.message}`)
  })
  protocolChild.on('exit', (code) => {
    if (state.running) {
      logService.pushEvent('warn', `协议端已退出（code=${code}）`)
    }
    state.running = false
    state.pid = null
    protocolChild = null
  })
  return { running: true, pid: protocolChild.pid }
}

export async function stopProtocol() {
  const child = protocolChild
  protocolChild = null
  state.running = false
  state.pid = null
  if (!child) {
    return
  }
  try {
    if (process.platform === 'win32') {
      await execAsync(`taskkill /PID ${child.pid} /T /F`)
    } else {
      process.kill(child.pid, 'SIGTERM')
    }
  } catch {
    // 进程可能已经退出
  }
  logService.pushEvent('info', '协议端已停止')
}

export function getStatus() {
  return { ...state, protocolDir: getProtocolDir() }
}

// 目录选择：列出指定目录的子文件夹；path 为空时列出磁盘根
export function listDirs(dir) {
  if (!dir || !String(dir).trim()) {
    return { path: '', parent: '', dirs: listRoots() }
  }
  const absolute = path.resolve(String(dir).trim())
  try {
    if (!fs.statSync(absolute).isDirectory()) {
      throw new Error('不是目录')
    }
  } catch {
    throw new Error('目录不存在或无法访问')
  }
  let names = []
  try {
    names = fs
      .readdirSync(absolute, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith('.'))
      .sort((a, b) => a.localeCompare(b))
  } catch {
    // 无权限读取时仍允许"使用此目录"
  }
  const parent = path.dirname(absolute)
  return {
    path: absolute,
    parent: parent === absolute ? '' : parent,
    dirs: names.map((name) => path.join(absolute, name)),
  }
}

function listRoots() {
  if (process.platform === 'win32') {
    const roots = []
    for (let i = 65; i <= 90; i += 1) {
      const letter = `${String.fromCharCode(i)}:\\`
      try {
        if (fs.existsSync(letter)) {
          roots.push(letter)
        }
      } catch {
        // 跳过不可访问的盘符
      }
    }
    return roots
  }
  return ['/']
}

function applyInstallDir(installDir) {
  if (installDir !== undefined && installDir !== null && String(installDir).trim()) {
    const dir = String(installDir).trim()
    if (!path.isAbsolute(dir)) {
      return '安装目录需要是完整路径，例如 D:\\bot\\yogurt'
    }
    setProtocolDir(dir)
    saveState()
  }
  return ''
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return ''
  }
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}
