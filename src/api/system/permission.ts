import { http } from '@/utils/http'
import type { PermissionDTO } from '@/types/system/permission'

export function findByMenuId(menuId: string) {
  return http.get<PermissionDTO[]>(`/permissions/menu/${menuId}`)
}

export function save(data: Partial<PermissionDTO>) {
  return http.post<PermissionDTO>('/permissions', data)
}

export function deleteById(id: string) {
  return http.delete<void>(`/permissions/${id}`)
}
