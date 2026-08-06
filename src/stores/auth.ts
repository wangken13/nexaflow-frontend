import { defineStore } from 'pinia'
import { request } from '../api/http'

interface LoginResponse {
  token: string
  tenantId: string
  role: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('trade-token') ?? '',
    tenantId: localStorage.getItem('trade-tenant') ?? '',
    role: localStorage.getItem('trade-role') ?? ''
  }),
  actions: {
    async login(username: string, password: string) {
      const data = await request<LoginResponse>('/auth/login', {
        method: 'post',
        data: { username, password }
      })
      this.token = data.token
      this.tenantId = data.tenantId
      this.role = data.role
      localStorage.setItem('trade-token', data.token)
      localStorage.setItem('trade-tenant', data.tenantId)
      localStorage.setItem('trade-role', data.role)
    },
    logout() {
      this.token = ''
      this.tenantId = ''
      this.role = ''
      localStorage.removeItem('trade-token')
      localStorage.removeItem('trade-tenant')
      localStorage.removeItem('trade-role')
    }
  }
})
