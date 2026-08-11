# 🪤 webui 鉴权中间件会拦 milky 代理，fraq 核心 API 全 401

SUMMARY: fraq-webui 的 `/api/*` 登录校验会拦截 POST `/api/<单段端点>` 的 milky 透明代理转发，导致 fraq 核心把 milky.url 指向 webui 时所有协议端 API 调用 401（如 get_impl_info）；需在鉴权中间件放行单段端点路径。

READ WHEN: 当 fraq 核心经 webui 代理调用 Milky API 报 401，或写协议端连通性检查/安装功能时

---

- milky 代理路径 `POST /api/:endpoint`（单段 snake_case，如 get_login_info）与 webui 自己的 `/api/*` 鉴权中间件冲突；放行条件：`method === 'POST' && /^\/api\/[a-z0-9_]+$/`，与所有显式路由（多段路径）不重叠。
- 协议端探测必须带 `Content-Type: application/json` 和 body `{}`：Yogurt 空 body 会报 "Cannot transform this request's content to JsonElement"（status failed）。
- 代理令牌优先级：`FRAQ_WEBUI_MILKY_TOKEN` 环境变量 > fraq.yml `milky.accessToken`（设置页写入的位置）。
- 检查协议端应直接探测 `MILKY_URL`（默认 localhost:30001），不要探测 fraq.yml 的 milky.url（那可能指向 webui 自己）。
