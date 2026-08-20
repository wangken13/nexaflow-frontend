import { defineStore } from 'pinia'
import { request } from '../api/http'
import type { AuthLoginResponse } from '../api/trade'
import { clearAccessToken, setAccessToken } from '../auth/session'

let restorePromise: Promise<boolean> | null = null

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
      this.restored = true
    },
    async restore() {
      if (this.restored) return Boolean(this.token)
      if (restorePromise) return restorePromise

      restorePromise = (async () => {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const data = await request<AuthLoginResponse>('/auth/refresh', { method: 'post' })
            this.applySession(data)
            return true
          } catch {
            if (attempt === 0) await new Promise(resolve => window.setTimeout(resolve, 250))
          }
        }
        await this.logout(false)
        this.restored = true
        return false
      })()

      try {
        return await restorePromise
      } finally {
        restorePromise = null
      }
    },
    async logout(clearCookie = true) {
      try {
        if (clearCookie) {
          await request<void>('/auth/logout', { method: 'post' })
        }
      } catch {
        // Local logout must remain available when the session is already invalid or the server is unavailable.
      } finally {
        this.token = ''
        this.tenantId = ''
        this.role = ''
        this.username = ''
        clearAccessToken()
      }
    }
  }
})
