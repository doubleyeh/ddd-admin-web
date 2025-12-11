export interface UserDTO {
  id: string | number
  username: string
  nickname: string
  state: 0 | 1
  createTime: string
}

export interface UserPostDTO {
  username: string
  nickname: string
  state: 0 | 1
  password: string
}

export interface UserPutDTO {
  id: string | number
  username?: string
  nickname?: string
  state?: 0 | 1
  password?: string
}

export interface UserQuery {
  username: string
  nickname: string
  state: 0 | 1 | null
}
