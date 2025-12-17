export interface RoleDTO {
  id: string
  name: string
  code: string
  description: string
  sort: number
  enabled: boolean
  permissions: any[]
  menus: any[]
}

export interface RoleSaveDTO {
  id?: string
  name: string
  code: string
  description?: string
  sort?: number
  enabled?: boolean
  permissionIds: string[]
  menuIds: string[]
}

export interface RoleQuery {
  name?: string
  code?: string
}
