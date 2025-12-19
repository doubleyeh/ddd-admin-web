import { http } from '@/utils/http'
import type { Page } from '@/types/api'
import type { RoleDTO, RoleOptionDTO, RoleSaveDTO, RoleGrantDTO } from '@/types/system/role'

export function findPage(
  page: number,
  size: number,
  query: Record<string, any> = {}
): Promise<Page<RoleDTO>> {
  const params = {
    page,
    size,
    ...query,
  }
  return http.get('/roles', { params })
}

export function getById(id: string): Promise<RoleDTO> {
  return http.get(`/roles/${id}`)
}

export function create(data: RoleSaveDTO): Promise<RoleDTO> {
  return http.post('/roles', data)
}

export function update(id: string, data: RoleSaveDTO): Promise<RoleDTO> {
  return http.put(`/roles/${id}`, data)
}

export function grant(id: string, data: RoleGrantDTO): Promise<void> {
  return http.post(`/roles/${id}/grant`, data)
}

export function updateState(id: string, state: boolean): Promise<RoleDTO> {
  return http.put(`/roles/${id}/state?state=${state}`, {})
}

export function deleteById(id: string): Promise<void> {
  return http.delete(`/roles/${id}`)
}

export function getRoleOptions(query: Record<string, any> = {}): Promise<RoleOptionDTO[]> {
  const params = {
    ...query,
  }
  return http.get('/roles/options', { params })
}

export function getMenus(id: string): Promise<any[]> {
  return http.get(`/roles/${id}/menus`)
}

export function getPermissions(id: string): Promise<any[]> {
  return http.get(`/roles/${id}/permissions`)
}
