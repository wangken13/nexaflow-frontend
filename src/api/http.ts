import axios from 'axios'

export const http = axios.create({
  baseURL: '/api',
  timeout: 20000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('trade-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function request<T>(url: string, options?: { method?: 'get' | 'post' | 'patch'; data?: unknown }) {
  const response = await http.request<ApiResponse<T>>({
    url,
    method: options?.method ?? 'get',
    data: options?.data
  })
  if (!response.data.success) {
    throw new Error(response.data.message)
  }
  return response.data.data
}
