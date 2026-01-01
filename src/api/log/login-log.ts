import { http } from '@/utils/http'
import type { Page } from '@/types/api'
import type { LoginLogDTO, LoginLogQuery } from '@/types/log/login-log'

export function findPage(
  page: number,
  size: number,
  query: LoginLogQuery
): Promise<Page<LoginLogDTO>> {
  const params = {
    page,
    size,
    ...query,
  }
  return http.get('/login-logs', { params })
}
