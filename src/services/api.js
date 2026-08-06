// 数据服务出口：视图只依赖这里的能力，不关心数据来自哪个传输层。
// 当前使用真实后端（配套管理服务 server/）。

import { httpApi } from './httpApi.js'

export const api = httpApi
