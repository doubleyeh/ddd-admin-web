import { useUserStore } from '@/store/user'
import router from '@/router'
import type { RestResponse } from '@/types/api'

const BASE_URL = '/api'

function handleResponse<T>(res: Response): Promise<T> {
  const store = useUserStore()
  if (res.status == 401) {
    store.logout()
    router.push('/login')
  }

  return res.text().then((raw) => {
    let json: RestResponse<T> | null = null

    // 尝试解析后端 JSON（非 JSON 会抛出）
    try {
      json = raw ? JSON.parse(raw) : null
    } catch {
      throw new Error(raw || '非 JSON 响应')
    }

    // 业务错误（后端 state=false 或 code!=200）
    if (json && (json.state === false || json.code !== 200)) {
      const msg = json.message || '请求失败'

      // 登录失效（由后端定义 code）
      if (json.code === 401) {
        store.logout()
        router.push('/login')
      }

      throw new Error(msg)
    }

    // HTTP 层错误但无有效业务 JSON
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(json?.message || `您没有权限执行操作)`)
      } else if (res.status === 401) {
        store.logout()
        router.push('/login')
      } else {
        throw new Error(json?.message || `HTTP 错误(${res.status})`)
      }
    }

    // 返回业务数据
    return json?.data as T
  })
}

function createRequestOptions(method: string, body?: any): RequestInit {
  const store = useUserStore()
  const headers = new Headers({
    'Content-Type': 'application/json',
  })

  if (store.token) {
    headers.set('Authorization', `Bearer ${store.token}`)
  }
  if (store.tenantId) {
    headers.set('X-Tenant-Id', store.tenantId)
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  return options
}

const http = {
  get<T>(url: string, options?: { params?: Record<string, any> }): Promise<T> {
    const req = createRequestOptions('GET')
    let finalUrl = `${BASE_URL}${url}`

    if (options?.params) {
      const searchParams = new URLSearchParams()
      const params = options.params

      Object.keys(params).forEach((key) => {
        const value = params[key]

        if (value === null || value === undefined || value === '') return

        // 数组 => foo=1&foo=2
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)))
          return
        }

        // 对象 => JSON 字符串
        if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value))
          return
        }

        // 基本类型
        searchParams.append(key, String(value))
      })

      const queryString = searchParams.toString()
      if (queryString) {
        finalUrl += `?${queryString}`
      }
    }

    return fetch(finalUrl, req).then(handleResponse<T>)
  },

  post<T>(url: string, body: any): Promise<T> {
    const options = createRequestOptions('POST', body)
    return fetch(`${BASE_URL}${url}`, options).then(handleResponse<T>)
  },

  put<T>(url: string, body: any): Promise<T> {
    const options = createRequestOptions('PUT', body)
    return fetch(`${BASE_URL}${url}`, options).then(handleResponse<T>)
  },

  delete<T>(url: string): Promise<T> {
    const options = createRequestOptions('DELETE')
    return fetch(`${BASE_URL}${url}`, options).then(handleResponse<T>)
  },
}

export { http }
