import type { LoginResDTO, UserInfoDTO } from '@/types/auth'
import { http } from '@/utils/http'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    username: localStorage.getItem('username') || '',
    tenantId: localStorage.getItem('tenantId') || '',
    superTenant: localStorage.getItem('superTenant') || '0',
    nickname: '',
    permissions: [] as string[],
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isSuperTenant: (state) => {
      return (): boolean => {
        return state.superTenant === '1'
      }
    },
    hasPermission: (state) => {
      return (perm: string): boolean => {
        return state.permissions.includes(perm)
      }
    },
  },
  actions: {
    login(userInfo: LoginResDTO) {
      this.token = userInfo.token
      this.username = userInfo.username
      this.tenantId = userInfo.tenantId

      localStorage.setItem('token', userInfo.token)
      localStorage.setItem('username', userInfo.username)
      localStorage.setItem('tenantId', userInfo.tenantId)
      localStorage.setItem('superTenant', userInfo.superTenant ? '1' : '0')
    },

    setAccountInfo(userInfo: UserInfoDTO, permissions: string[]) {
      this.nickname = userInfo.nickname
      this.permissions = permissions
    },

    logout() {
      http.post<void>('/auth/logout', {})
      this.token = ''
      this.username = ''
      this.tenantId = ''
      this.nickname = ''
      this.superTenant = '0'
      this.permissions = []

      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('tenantId')
      localStorage.removeItem('superTenant')
    },
  },
})
