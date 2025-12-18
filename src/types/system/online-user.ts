export interface SessionDetail {
  id: string
  ip: string
  browser: string
  loginTime: number
}

export interface OnlineUserDTO {
  userId: string
  username: string
  tenantId: string
  tenantName: string
  sessions: SessionDetail[]
}
