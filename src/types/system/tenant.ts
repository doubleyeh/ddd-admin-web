export interface TenantDTO {
  id: string
  tenantId: string
  name: string
  contactPerson: string
  contactPhone: string
  enabled: boolean
  packageId: string
  packageName: string
}

export interface TenantOptionDTO {
  id: string
  tenantId: string
  name: string
}

export interface TenantSaveDTO {
  id?: string
  tenantId: string
  name: string
  contactPerson: string
  contactPhone: string
  enabled: boolean
  packageId?: string
}

export interface TenantCreateResultDTO extends TenantDTO {
  initialAdminPassword: string
}
