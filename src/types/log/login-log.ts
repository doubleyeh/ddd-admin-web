export interface LoginLogDTO {
  id: string
  username: string
  ipAddress: string
  status: 'SUCCESS' | 'FAILURE'
  message: string
  tenantId: string
  tenantName: string
  createTime: string
}

export interface LoginLogQuery {
  username: string
  status: 'SUCCESS' | 'FAILURE' | null
  startTime: string | null
  endTime: string | null
}
