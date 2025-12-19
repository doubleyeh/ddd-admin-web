import { http } from '@/utils/http'
import type { MenuDTO, MenuOptionDTO } from '@/types/system/menu'

export function getMenuTree() {
  return http.get<MenuDTO[]>('/menus/tree')
}

export function createMenu(data: Partial<MenuDTO>) {
  return http.post<MenuDTO>('/menus', data)
}

export function updateMenu(id: string, data: Partial<MenuDTO>) {
  return http.put<MenuDTO>(`/menus/${id}`, data)
}

export function deleteMenu(id: string) {
  return http.delete<void>(`/menus/${id}`)
}

export function getMenuTreeOptions() {
  return http.get<MenuOptionDTO[]>('/menus/tree-options')
}
