export interface TenantDTO {
  id: number
  tenantId: string
  name: string
  contactPerson: string
  contactPhone: string
  enabled: boolean
}

export interface TenantSaveDTO {
  id?: number
  tenantId: string
  name: string
  contactPerson: string
  contactPhone: string
  enabled: boolean
}

export interface TenantCreateResultDTO extends TenantDTO {
  initialAdminPassword: string
}
