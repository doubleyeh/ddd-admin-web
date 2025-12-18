import { http } from '@/utils/http'
import type { OnlineUserDTO } from '@/types/system/online-user'

export function list(): Promise<OnlineUserDTO[]> {
  return http.get('/online-user/list')
}

export function kickout(token: string): Promise<void> {
  return http.post('/online-user/kickout', { token })
}
