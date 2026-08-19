import axios from 'axios'
import { clearAccessToken, getAccessToken, setAccessToken } from '../auth/session'

export const http = axios.create({
  baseURL: '/api',
  timeout: 20000,
  withCredentials: true
})

type RetryableRequestConfig = NonNullable<Parameters<typeof http.request>[0]> & {
  _authRetry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

function redirectToLogin() {
  if (location.pathname === '/login') return
  const target = location.pathname.startsWith('/app') ? `${location.pathname}${location.search}${location.hash}` : '/app'
  location.assign(`/login?redirect=${encodeURIComponent(target)}`)
}

function isAuthEndpoint(url?: string) {
  return ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/captcha', '/auth/sms-login', '/auth/wechat/login']
    .some(path => url?.endsWith(path))
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = http.post<ApiResponse<{ token: string }>>('/auth/refresh')
      .then(response => {
        const token = response.data.data?.token
        if (!response.data.success || !token) throw new Error('refresh failed')
        setAccessToken(token)
        return token
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const config = error.config as RetryableRequestConfig | undefined
      const isLogoutRequest = config?.url === '/auth/logout'
      if (config && !config._authRetry && !isAuthEndpoint(config.url)) {
        config._authRetry = true
        const token = await refreshAccessToken()
        if (token) {
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${token}`
          return http.request(config)
        }
      }
      clearAccessToken()
      if (!isLogoutRequest) redirectToLogin()
    }
    return Promise.reject(error)
  }
)

export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
}

export interface SseMessage<T> {
  id: string
  event: string
  data: T
}

function fallbackMessage(status?: number, errorCode?: string) {
  if (errorCode === 'ECONNABORTED') return '请求处理超时，请稍后重试'
  if (!status) return '无法连接服务器，请检查网络或确认服务已经启动'
  if (status === 401) return '登录状态已失效，请重新登录'
  if (status === 403) return '当前账号没有执行此操作的权限'
  if (status === 404) return '请求的接口或数据不存在，请确认前后端服务版本一致'
  if (status === 405) return '当前服务版本不支持此操作，请确认前后端服务版本一致'
  if (status === 409) return '当前数据已发生变化或存在业务冲突，请刷新后重试'
  if (status === 413) return '上传文件超过系统允许的大小'
  if (status === 429) return '操作过于频繁，请稍后再试'
  if (status === 502) return '外部服务返回异常，请稍后重试'
  if (status === 503) return '业务服务暂时不可用，请稍后重试'
  if (status === 504) return '服务处理超时，请稍后重试'
  return '服务器处理请求失败，请稍后重试'
}

export async function streamSse<T>(
  url: string,
  data: unknown,
  onMessage: (message: SseMessage<T>) => void,
  signal?: AbortSignal
) {
  const token = getAccessToken()
  const response = await fetch(`/api${url}`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken()
      redirectToLogin()
    }
    let message = ''
    try {
      message = (await response.json() as ApiResponse<unknown>).message
    } catch {
      // Non-JSON gateway responses use the status-specific fallback below.
    }
    throw new Error(message || fallbackMessage(response.status))
  }

  if (!response.body) throw new Error('浏览器无法读取 AI 流式响应')
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  const dispatch = (block: string) => {
    let id = ''
    let event = 'message'
    const lines: string[] = []
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue
      if (line.startsWith('id:')) id = line.slice(3).trimStart()
      else if (line.startsWith('event:')) event = line.slice(6).trimStart()
      else if (line.startsWith('data:')) lines.push(line.slice(5).trimStart())
    }
    if (!lines.length) return
    try {
      onMessage({ id, event, data: JSON.parse(lines.join('\n')) as T })
    } catch {
      throw new Error('AI 流式响应格式异常，请稍后重试')
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        dispatch(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
      if (done) break
    }
    if (buffer.trim()) dispatch(buffer)
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export async function request<T>(url: string, options?: { method?: 'get' | 'post' | 'put' | 'patch' | 'delete'; data?: unknown }) {
  try {
    const response = await http.request<ApiResponse<T>>({
      url,
      method: options?.method ?? 'get',
      data: options?.data
    })
    if (!response.data.success) throw new Error(response.data.message)
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      const message = error.response?.data?.message
      throw new Error(message || fallbackMessage(error.response?.status, error.code))
    }
    throw error
  }
}
