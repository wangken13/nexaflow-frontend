import { defineStore } from 'pinia'
import { request } from '../api/http'
import type { AuthLoginResponse } from '../api/trade'
import { clearAccessToken, setAccessToken } from '../auth/session'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    tenantId: '',
    role: '',
    username: '',
    restored: false
  }),
  actions: {
    async login(username: string, password: string, captchaId: string, captchaCode: string) {
      const data = await request<AuthLoginResponse>('/auth/login', {
        method: 'post',
        data: { username, password, captchaId, captchaCode }
      })
      this.applySession(data, username)
    },
    applySession(data: AuthLoginResponse, fallbackUsername = '') {
      this.token = data.token
      setAccessToken(data.token)
      this.tenantId = data.tenantId
      this.role = data.role
      this.username = data.username || fallbackUsername
    },
    async restore() {
      if (this.restored) return Boolean(this.token)
      this.restored = true
      try {
        const data = await request<AuthLoginResponse>('/auth/refresh', { method: 'post' })
        this.applySession(data)
        return true
      } catch {
        this.logout(false)
        return false
      }
    },
    async logout(clearCookie = true) {
      this.token = ''
      this.tenantId = ''
      this.role = ''
      this.username = ''
      clearAccessToken()
      if (clearCookie) {
        try {
          await request<void>('/auth/logout', { method: 'post' })
        } catch {
          // The local session is still cleared; a later request will handle a server outage.
        }
      }
    }
  }
})
