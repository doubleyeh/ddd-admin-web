import { http } from '@/utils/http'
import type { Page } from '@/types/api'
import type { UserDTO, UserPostDTO, UserPutDTO } from '@/types/system/user'

export function findPage(
  page: number,
  size: number,
  query: Record<string, any> = {}
): Promise<Page<UserDTO>> {
  const params = {
    page,
    size,
    ...query,
  }
  return http.get('/users', { params })
}

export function create(data: UserPostDTO): Promise<UserDTO> {
  return http.post('/users', data)
}

export function update(id: number | string, data: UserPutDTO): Promise<UserDTO> {
  return http.put(`/users/${id}`, data)
}

export function resetPassword(id: number | string): Promise<string> {
  return http.put(`/users/${id}/password`, {})
}

export function deleteById(id: number | string): Promise<void> {
  return http.delete(`/users/${id}`)
}
