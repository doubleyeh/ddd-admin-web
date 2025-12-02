export interface TenantDTO {
  id: string
  tenantId: string
  name: string
  contactPerson: string
  contactPhone: string
  enabled: boolean
}

export interface TenantSaveDTO {
  id?: string
  tenantId: string
  name: string
  contactPerson: string
  contactPhone: string
  enabled: boolean
}

export interface TenantCreateResultDTO extends TenantDTO {
  initialAdminPassword: string
}
