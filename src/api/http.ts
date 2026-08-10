import axios from 'axios'
import { clearAccessToken, getAccessToken } from '../auth/session'

export const http = axios.create({
  baseURL: '/api',
  timeout: 20000,
  withCredentials: true
})

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAccessToken()
      if (location.pathname !== '/login') location.assign('/login')
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

function fallbackMessage(status?: number, errorCode?: string) {
  if (errorCode === 'ECONNABORTED') return '请求处理超时，请稍后重试'
  if (!status) return '无法连接服务器，请检查网络或确认服务已经启动'
  if (status === 401) return '登录状态已失效，请重新登录'
  if (status === 403) return '当前账号没有执行此操作的权限'
  if (status === 404) return '请求的功能或数据不存在'
  if (status === 409) return '当前数据已发生变化或存在业务冲突，请刷新后重试'
  if (status === 413) return '上传文件超过系统允许的大小'
  if (status === 429) return '操作过于频繁，请稍后再试'
  if (status === 502) return '外部服务返回异常，请稍后重试'
  if (status === 503) return '业务服务暂时不可用，请稍后重试'
  if (status === 504) return '服务处理超时，请稍后重试'
  return '服务器处理请求失败，请稍后重试'
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
