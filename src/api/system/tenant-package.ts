import { http } from '@/utils/http'
import type { Page } from '@/types/api'
import type {
  TenantPackageDTO,
  TenantPackageOptionDTO,
  TenantPackageQuery,
  TenantPackageSaveDTO,
} from '@/types/system/tenant-package'

export function findPage(
  page: number,
  size: number,
  query: TenantPackageQuery = {}
): Promise<Page<TenantPackageDTO>> {
  return http.get('/tenant-packages', {
    params: {
      page,
      size,
      ...query,
    },
  })
}

export function getById(id: string): Promise<TenantPackageDTO> {
  return http.get(`/tenant-packages/${id}`)
}

export function create(data: TenantPackageSaveDTO): Promise<void> {
  return http.post('/tenant-packages', data)
}

export function update(id: string, data: TenantPackageSaveDTO): Promise<void> {
  return http.put(`/tenant-packages/${id}`, data)
}

export function updateState(id: string, state: boolean): Promise<TenantPackageDTO> {
  return http.put(`/tenant-packages/${id}/state?state=${state}`, null)
}

export function deleteById(id: string): Promise<void> {
  return http.delete(`/tenant-packages/${id}`)
}

export function getOptions(name?: string): Promise<TenantPackageOptionDTO[]> {
  return http.get('/tenant-packages/options', {
    params: { name },
  })
}
