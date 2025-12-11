import { http } from '@/utils/http'
import type { Page } from '@/types/api'
import type { TenantCreateResultDTO, TenantDTO, TenantSaveDTO } from '@/types/system/tenant'

export function findPage(
  page: number,
  size: number,
  query: Record<string, any> = {}
): Promise<Page<TenantDTO>> {
  const params = {
    page,
    size,
    ...query,
  }
  return http.get('/tenants', { params })
}

export function create(data: TenantSaveDTO): Promise<TenantCreateResultDTO> {
  return http.post('/tenants', data)
}

export function update(id: string, data: TenantSaveDTO): Promise<TenantDTO> {
  return http.put(`/tenants/${id}`, data)
}

export function updateState(id: string, state: Boolean): Promise<TenantDTO> {
  return http.put(`/tenants/${id}/state?state=${state}`, {})
}

export function deleteById(id: string): Promise<void> {
  return http.delete(`/tenants/${id}`)
}
