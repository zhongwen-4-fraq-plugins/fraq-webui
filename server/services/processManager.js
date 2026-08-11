// fraq 进程管理：启动/停止 fraq CLI，并把输出接入日志服务。

import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'
import { getAppDir, getPortableNodeDir } from '../core/config.js'
import * as fraqConfig from './fraqConfig.js'
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
let adoptedPid = null // 服务重启后接管到的仍在运行的 fraq 进程
let adoptedStartedAt = null

export function isRunning() {
  return child !== null || adoptedPid !== null
}

export function getProcessInfo() {
  if (child) {
    return { running: true, pid: child.pid, startedAt }
  }
  if (adoptedPid) {
    return { running: true, pid: adoptedPid, startedAt: adoptedStartedAt }
  }
  return {
    running: false,
    pid: null,
    startedAt,
  }
}

// 服务重启后，若 fraq 核心仍在运行（孤儿进程），探测 Hono 端口并接管
export async function detectRunningCore() {
  if (child || adoptedPid) {
    return isRunning()
  }
  const { port } = fraqConfig.getHonoConfig()
  const pid = await findPidByPort(port)
  if (pid) {
    adoptedPid = pid
    adoptedStartedAt = Date.now()
    logService.pushEvent('info', `检测到已在运行的 fraq 进程（PID ${pid}），已接管`)
  }
  return isRunning()
}

async function findPidByPort(port) {
  try {
    const { stdout } = await execAsync('netstat -ano')
    for (const line of stdout.split(/\r?\n/)) {
      const match = line.match(/TCP\s+\S+:(\d+)\s+\S+:\S+\s+LISTENING\s+(\d+)/i)
      if (match && Number(match[1]) === port) {
        return Number(match[2])
      }
    }
  } catch {
    // 探测失败视为未运行
  }
  return null
}

export async function start() {
  if (child || adoptedPid) {
    throw new Error('fraq 已经在运行')
  }

  stopping = false
  startedAt = Date.now()
  // Windows 下 fraq 是 .cmd 垫片，需经 cmd 执行；用受控命令串避免 shell:true 弃用警告
  const isWindows = process.platform === 'win32'
  child = spawn(
    isWindows ? process.env.ComSpec ?? 'cmd.exe' : 'fraq',
    isWindows ? ['/d', '/c', 'fraq start'] : ['start'],
    {
    cwd: getAppDir(),
    windowsHide: true,
    env: buildChildEnv(),
    },
  )

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
  const targetPid = child?.pid ?? adoptedPid
  if (!targetPid) {
    return
  }
  stopping = true
  child = null
  adoptedPid = null
  adoptedStartedAt = null

  try {
    if (process.platform === 'win32') {
      await execAsync(`taskkill /PID ${targetPid} /T /F`)
    } else {
      process.kill(targetPid, 'SIGTERM')
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
