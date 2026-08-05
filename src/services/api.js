// 数据服务出口：视图只依赖这里的能力，不关心数据来自模拟还是真实后端。
// 当前使用内置模拟实现（mockApi）；真实后端管理接口就绪后，把 mockApi 换成
// 基于 fetch 的实现即可，视图代码无需改动。

import { mockApi } from './mockApi.js'

export const api = mockApi
