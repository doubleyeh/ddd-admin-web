export interface TenantPackageDTO {
  id: string
  name: string
  description: string
  state: number
  permissions: any[]
  menus: any[]
  createTime?: string
  updateTime?: string
}

export interface TenantPackageSaveDTO {
  id?: string
  name: string
  description: string
  state: number
}

export interface TenantPackageGrantDTO {
  menuIds: string[]
  permissionIds: string[]
}

export interface TenantPackageOptionDTO {
  id: string
  name: string
}

export interface TenantPackageQuery {
  name?: string
}
