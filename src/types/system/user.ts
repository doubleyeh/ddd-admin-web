export interface UserDTO {
  id: string
  username: string
  nickname: string
  state: 0 | 1
  createTime: string
}

export interface UserPostDTO {
  id?: string
  username: string
  nickname: string
  state: 0 | 1
  password: string
}

export interface UserPutDTO {
  id: string
  username?: string
  nickname?: string
  state?: 0 | 1
  password?: string
}

export interface UserQuery {
  username: string
  nickname: string
  state: 0 | 1 | null
  tenantId: string | null
}
