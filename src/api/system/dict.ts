import { http } from '@/utils/http'
import type {
  Page,
  DictTypeDTO,
  DictTypeSaveDTO,
  DictDataDTO,
  DictDataSaveDTO,
} from '@/types/system/dict'

// ======================= 字典类型API =======================

/**
 * 获取字典类型分页列表
 * @param params 查询参数
 */
export function getDictTypePage(params: {
  name?: string
  code?: string
  page: number
  size: number
}) {
  return http.get<Page<DictTypeDTO>>('/dict/type', { params })
}

/**
 * 保存字典类型 (新增/编辑)
 * @param data 字典类型信息
 */
export function saveDictType(data: DictTypeSaveDTO) {
  if (data.id) {
    return http.put('/dict/type', data)
  }
  return http.post('/dict/type', data)
}

/**
 * 删除字典类型
 * @param id 字典类型ID
 */
export function deleteDictType(id: string) {
  return http.delete(`/dict/type/${id}`)
}

// ======================= 字典数据API =======================

/**
 * 根据字典类型编码获取字典数据列表
 * @param typeCode 字典类型编码
 */
export function getDictDataList(typeCode: string) {
  return http.get<DictDataDTO[]>(`/dict/data/${typeCode}`)
}

/**
 * 保存字典数据 (新增/编辑)
 * @param data 字典数据信息
 */
export function saveDictData(data: DictDataSaveDTO) {
  if (data.id) {
    return http.put('/dict/data', data)
  }
  return http.post('/dict/data', data)
}

/**
 * 删除字典数据
 * @param id 字典数据ID
 */
export function deleteDictData(id: string) {
  return http.delete(`/dict/data/${id}`)
}
