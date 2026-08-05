// 设置数据模型与默认值。

export const DEFAULT_SETTINGS = {
  baseUrl: 'http://127.0.0.1:4649',
  accessToken: '',
  secureCookies: false,
}

export function normalizeSettings(raw = {}) {
  return {
    baseUrl: typeof raw.baseUrl === 'string' ? raw.baseUrl : DEFAULT_SETTINGS.baseUrl,
    accessToken: typeof raw.accessToken === 'string' ? raw.accessToken : '',
    secureCookies: raw.secureCookies === true,
  }
}
