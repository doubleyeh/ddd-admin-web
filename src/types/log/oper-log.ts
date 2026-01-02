export interface OperLog {
  id: string
  title: string
  businessType: number
  method: string
  requestMethod: string
  operName: string
  operUrl: string
  operIp: string
  operParam: string
  jsonResult: string
  status: number
  errorMsg: string
  costTime: number
  createTime: string
  createBy: string
}

export interface OperLogQuery {
  title: string | null
  operName: string | null
  status: number | null
}
