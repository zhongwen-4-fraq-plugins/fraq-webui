// fraq 进程管理：启动/停止 fraq CLI，并把输出接入日志服务。

import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'
import { getAppDir, getPortableNodeDir } from '../core/config.js'
import * as logService from './logService.js'

const execAsync = promisify(exec)

// 子进程 PATH 可能缺少 npm/fraq 所在目录，这里显式补上
export function buildChildEnv() {
  const nodeDir = path.dirname(process.execPath)
  const globalBin =
    process.platform === 'win32'
      ? path.join(os.homedir(), 'AppData', 'Roaming', 'npm')
      : '/usr/local/bin'
  const portable = getPortableNodeDir()
  return {
    ...process.env,
    FORCE_COLOR: '0',
    PATH: [portable, nodeDir, globalBin, process.env.PATH].filter(Boolean).join(path.delimiter),
  }
}

let child = null
let startedAt = null
let stopping = false

export function isRunning() {
  return child !== null
}

export function getProcessInfo() {
  return {
    running: isRunning(),
    pid: child?.pid ?? null,
    startedAt,
  }
}

export async function start() {
  if (child) {
    throw new Error('fraq 已经在运行')
  }

  stopping = false
  startedAt = Date.now()
  child = spawn('fraq', ['start'], {
    cwd: getAppDir(),
    shell: process.platform === 'win32',
    windowsHide: true,
    env: buildChildEnv(),
  })

  child.stdout?.on('data', (chunk) => logService.push(String(chunk)))
  child.stderr?.on('data', (chunk) => logService.push(String(chunk)))

  child.on('error', (error) => {
    logService.pushEvent('error', `启动 fraq 失败：${error.message}`)
    child = null
  })

  child.on('exit', (code) => {
    if (!stopping) {
      logService.pushEvent('warn', `fraq 进程已退出（code=${code}）`)
    }
    child = null
  })

  logService.pushEvent('info', `正在启动 fraq（${getAppDir()}）...`)
}

export async function stop() {
  if (!child) {
    return
  }
  stopping = true
  const pid = child.pid
  child = null

  try {
    if (process.platform === 'win32') {
      await execAsync(`taskkill /PID ${pid} /T /F`)
    } else {
      process.kill(pid, 'SIGTERM')
    }
  } catch {
    // 进程可能已经退出，忽略
  }
  stopping = false
  startedAt = null
  logService.pushEvent('info', 'fraq 已停止')
}

export async function installDependencies() {
  await execAsync('fraq install', { cwd: getAppDir() })
}
