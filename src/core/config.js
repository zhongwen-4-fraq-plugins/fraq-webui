// 全局配置：轮询间隔、日志分页大小、数据来源开关。

import pkg from '../../package.json'

export const APP_NAME = 'fraq-webui'
export const APP_VERSION = pkg.version ?? '0.0.0'

// 概览与插件的轮询间隔（毫秒）
export const POLL_INTERVAL_MS = 5000

// 日志的轮询间隔（毫秒）
export const LOG_POLL_INTERVAL_MS = 2000

// 提示（toast）自动消失时长（毫秒），与进度条动画同步
export const TOAST_DURATION_MS = 4500

// 日志页同时渲染的最大条数，超出部分通过“加载更早”追加
export const MAX_VISIBLE_LOGS = 200

// “加载更早”每次追加的条数
export const LOG_PAGE_SIZE = 100

// fraq 官方插件注册表（fraqjs/registry）
export const PLUGIN_REGISTRY_URL = 'https://raw.githubusercontent.com/fraqjs/registry/main/plugins.json'
