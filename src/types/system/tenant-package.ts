export interface TenantPackageDTO {
  id: string
  name: string
  description: string
  enabled: boolean
  menuIds: string[]
  permissionIds: string[]
  createTime?: string
  updateTime?: string
}

export interface TenantPackageSaveDTO {
  id: string | undefined
  name: string
  description: string
  enabled: boolean
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
