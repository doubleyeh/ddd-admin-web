export interface RestResponse<T> {
  code: number
  state: boolean
  message: string
  data: T
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
}