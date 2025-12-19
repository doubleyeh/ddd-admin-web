export interface RoleDTO {
  id: string
  name: string
  code: string
  description: string
  sort: number
  enabled: boolean
  permissions: any[]
  menus: any[]
  tenantId: string
  tenantName: string
}

export interface RoleSaveDTO {
  id?: string
  name: string
  code: string
  description?: string
  sort?: number
  enabled?: boolean
  tenantId: string
}

export interface RoleGrantDTO {
  menuIds: string[]
  permissionIds: string[]
}

export interface RoleOptionDTO {
  id: string
  name: string
}

export interface RoleQuery {
  name?: string
  code?: string
  tenantId?: string
}
