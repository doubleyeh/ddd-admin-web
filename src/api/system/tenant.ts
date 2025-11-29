import { http } from '@/utils/http'
import type { RestResponse, Page } from '@/types/api'
import type { TenantCreateResultDTO, TenantDTO, TenantSaveDTO } from '@/types/system/tenant'

export function findPage(page: number, size: number, query: Record<string, any> = {}): Promise<RestResponse<Page<TenantDTO>>> {
  const params = {
    page,
    size,
    ...query
  }
  return http.get('/tenants', { params })
}

export function create(data: TenantSaveDTO): Promise<RestResponse<TenantCreateResultDTO>> {
  return http.post('/tenants', data)
}

export function update(id: number, data: TenantSaveDTO): Promise<RestResponse<TenantDTO>> {
  return http.put(`/tenants/${id}`, data)
}

export function deleteById(id: number): Promise<RestResponse<void>> {
  return http.delete(`/tenants/${id}`)
}