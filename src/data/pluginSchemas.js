// 官方插件配置表单（字段取自 fraqjs/fraq 各插件源码的 apply 配置参数）。
// 未列出的插件使用通用 JSON 编辑器。

export const PLUGIN_SCHEMAS = {
  'fraqjs/hono': {
    fields: [
      { key: 'host', label: '监听地址', type: 'text', placeholder: '127.0.0.1' },
      { key: 'port', label: '端口', type: 'number', placeholder: '4649' },
    ],
  },
  'fraqjs/milky-server': {
    fields: [
      { key: 'prefix', label: '路径前缀', type: 'text', placeholder: '/milky' },
      { key: 'accessToken', label: '访问令牌', type: 'password', secret: true },
    ],
  },
  'fraqjs/webui-gateway': {
    fields: [
      { key: 'accessToken', label: '访问令牌', type: 'password', secret: true, required: true },
      {
        key: 'secureCookies',
        label: '安全 Cookie',
        type: 'boolean',
        hint: 'HTTPS 部署时启用',
      },
      {
        key: 'sessionMaxAgeSeconds',
        label: '会话有效期（秒）',
        type: 'number',
        placeholder: '604800',
      },
    ],
  },
  'fraqjs/kysely': {
    fields: [
      {
        key: 'sqliteUrl',
        label: '数据库文件',
        type: 'text',
        placeholder: 'file:./fraq.db',
      },
      { key: 'autoVacuum.enabled', label: '自动整理数据库', type: 'boolean' },
      { key: 'autoVacuum.intervalMinutes', label: '整理间隔（分钟）', type: 'number', placeholder: '60' },
    ],
  },
  'fraqjs/message-store': {
    fields: [{ key: 'listenRecall', label: '监听撤回事件', type: 'boolean' }],
  },
  'fraqjs/conversation': {
    fields: [
      { key: 'defaultTimeout', label: '默认超时（秒）', type: 'number' },
      {
        key: 'onCollision',
        label: '会话冲突处理',
        type: 'select',
        options: [
          { value: 'reject-incoming', label: '拒绝新会话' },
          { value: 'abort-existing', label: '中断旧会话' },
        ],
      },
    ],
  },
  'fraqjs/random': {
    fields: [
      { key: 'seed', label: '随机种子', type: 'number' },
      { key: 'sequence', label: '序列', type: 'number' },
    ],
  },
  'fraqjs/milky-webhook': {
    fields: [
      { key: 'endpoint', label: '回调路径', type: 'text', placeholder: '/milky/webhook' },
      { key: 'accessToken', label: '访问令牌', type: 'password', secret: true },
    ],
  },
  'fraqjs/takumi': {
    fields: [
      { key: 'loadBuiltinFonts', label: '加载内置字体', type: 'boolean' },
      {
        key: 'onFontRegisterConflict',
        label: '字体冲突处理',
        type: 'select',
        options: [
          { value: 'error', label: '报错' },
          { value: 'warn-and-ignore', label: '警告并忽略' },
          { value: 'warn-and-replace', label: '警告并替换' },
        ],
      },
    ],
  },
  'fraqjs/ai': {
    fields: [
      { key: 'defaultModel', label: '默认模型', type: 'text', placeholder: 'akile/gpt-5.6-sol' },
      { key: 'defaultImageModel', label: '默认图片模型', type: 'text' },
      {
        key: 'providers',
        label: '模型提供商',
        type: 'providers',
        hint: '每个提供商配置 SDK、API Key、Base URL 与模型列表',
      },
      { key: 'aliases', label: '模型别名', type: 'json' },
    ],
  },
}

// ai 插件支持的 SDK（取自 fraqjs/fraq 的 provider.ts）
export const AI_SDK_OPTIONS = [
  { value: '@ai-sdk/openai-compatible', label: 'OpenAI 兼容接口' },
  { value: '@ai-sdk/openai', label: 'OpenAI' },
  { value: '@ai-sdk/anthropic', label: 'Anthropic' },
  { value: '@ai-sdk/deepseek', label: 'DeepSeek' },
  { value: '@ai-sdk/google', label: 'Google Gemini' },
  { value: '@ai-sdk/alibaba', label: '阿里通义千问' },
  { value: '@ai-sdk/bytedance', label: '字节豆包' },
  { value: '@ai-sdk/moonshotai', label: 'Moonshot Kimi' },
  { value: '@ai-sdk/xai', label: 'xAI Grok' },
]

export function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

export function setByPath(obj, path, value) {
  const keys = path.split('.')
  let target = obj
  for (const key of keys.slice(0, -1)) {
    if (target[key] == null || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }
  target[keys.at(-1)] = value
}

export function deleteByPath(obj, path) {
  const keys = path.split('.')
  let target = obj
  for (const key of keys.slice(0, -1)) {
    if (target[key] == null || typeof target[key] !== 'object') {
      return
    }
    target = target[key]
  }
  delete target[keys.at(-1)]
}

export function getPluginSchema(pluginId) {
  return PLUGIN_SCHEMAS[pluginId] ?? null
}
