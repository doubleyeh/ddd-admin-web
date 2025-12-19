export interface MenuDTO {
  id: string
  parentId: string | null
  name: string
  path: string
  component: string
  icon: string
  sort: number
  isHidden: boolean
  permissionIds: string[]
  children?: MenuDTO[]
}

export interface MenuSaveDTO {
  id?: string | null
  parentId: string | null
  name: string
  path: string
  component: string
  icon: string
  sort: number
  isHidden: boolean
  permissionIds: string[]
}
