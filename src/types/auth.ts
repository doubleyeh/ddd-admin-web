export interface LoginResDTO {
  token: string
  username: string
  tenantId: string
  superTenant: boolean
}

export interface UserInfoDTO {
  id: string | number
  username: string
  nickname: string
  state: number
  createTime: string
}
