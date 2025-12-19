export interface PermissionDTO {
  id: string | null
  menuId: string
  name: string
  code: string
  url: string
  method: string
  description: string
}

export interface PermissionOptionDTO {
  id: string
  name: string
  isPermission: boolean
}
