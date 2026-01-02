import { http } from '@/utils/http'
import type { Page } from '@/types/api'
import type { OperLog, OperLogQuery } from '@/types/log/oper-log'

export function findPage(page: number, size: number, query: OperLogQuery): Promise<Page<OperLog>> {
  const params = {
    page,
    size,
    sort: 'createTime,desc',
    ...query,
  }
  return http.get('/oper-logs', { params })
}
