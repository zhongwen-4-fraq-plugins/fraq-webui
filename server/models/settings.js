// 设置数据模型：只返回地址与令牌是否已设置，绝不回传令牌明文。

export function settings({ baseUrl, hasAccessToken }) {
  return {
    baseUrl: baseUrl ?? '',
    accessToken: '', // 前端留空表示“不修改”
    hasAccessToken: hasAccessToken === true,
    secureCookies: false,
  }
}
