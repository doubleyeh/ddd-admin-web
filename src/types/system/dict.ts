// Page response wrapper class
export interface Page<T> {
  content: T[]
  totalElements: number
  size: number
  number: number
}

// Dictionary type (main table)
export interface DictTypeDTO {
  id: string // Note: The ID is of type string to be compatible with the long type of the backend
  name: string
  code: string
  sort: number

  remark: string
  isSystem: boolean
  createTime: string
}

export interface DictTypeSaveDTO {
  id?: string
  name: string
  code: string
  sort?: number
  remark?: string
}

// Dictionary data (from table - specific option values)
export interface DictDataDTO {
  id: string // Note: The ID is of type string to be compatible with the long type of the backend
  typeCode: string
  label: string
  value: string
  sort: number
  cssClass: string
  listClass: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  isDefault: boolean
  remark: string
  createTime: string
}

export interface DictDataSaveDTO {
  id?: string
  typeCode: string
  label: string
  value: string
  sort?: number
  cssClass?: string
  listClass?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  isDefault?: boolean
  remark?: string
}
