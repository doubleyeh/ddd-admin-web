export interface LoginResDTO {
  token: string
  username: string
  tenantId: string
}

export interface UserInfoDTO {
    id: string | number
    username: string
    nickname: string
    state: number
    createTime: string
}