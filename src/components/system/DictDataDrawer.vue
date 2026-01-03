<template>
  <n-drawer :show="show" :width="800" @update:show="emit('update:show', $event)">
    <n-drawer-content :title="`数据配置 - ${typeCode}`">
      <n-card :bordered="false" content-style="padding: 0;">
        <template #header>
          <n-button type="primary" @click="handleCreate">新增数据</n-button>
        </template>
        <!-- 数据表格 -->
        <n-data-table
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :row-key="(row: DictDataDTO) => row.id"
        />
      </n-card>
    </n-drawer-content>
  </n-drawer>

  <!-- 新增/编辑弹窗 -->
  <n-modal
    v-model:show="modalVisible"
    preset="card"
    :title="modalTitle"
    style="width: 600px"
    @after-leave="resetModalForm"
  >
    <n-form
      ref="modalFormRef"
      :model="modalForm"
      :rules="rules"
      label-placement="left"
      :label-width="80"
    >
      <n-form-item label="数据标签" path="label">
        <n-input v-model:value="modalForm.label" placeholder="请输入数据标签" />
      </n-form-item>
      <n-form-item label="数据值" path="value">
        <n-input v-model:value="modalForm.value" placeholder="请输入数据值" />
      </n-form-item>
      <n-form-item label="回显样式" path="listClass">
        <n-select
          v-model:value="modalForm.listClass"
          :options="listClassOptions"
          placeholder="请选择回显样式"
        />
      </n-form-item>
      <n-form-item label="样式预览">
        <n-tag :type="modalForm.listClass || 'default'">{{ modalForm.label || '预览' }}</n-tag>
      </n-form-item>
      <n-form-item label="排序" path="sort">
        <n-input-number
          v-model:value="modalForm.sort"
          :min="0"
          placeholder="请输入排序"
          style="width: 100%"
        />
      </n-form-item>
      <n-form-item label="默认" path="isDefault">
        <n-switch v-model:value="modalForm.isDefault" />
      </n-form-item>
      <n-form-item label="CSS Class" path="cssClass">
        <n-input v-model:value="modalForm.cssClass" placeholder="请输入CSS类名" />
      </n-form-item>
      <n-form-item label="备注" path="remark">
        <n-input v-model:value="modalForm.remark" type="textarea" placeholder="请输入备注" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="modalVisible = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="handleSave">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
  import { ref, watch, h } from 'vue'
  import {
    NButton,
    NSpace,
    NTag,
    useMessage,
    useDialog,
    type DataTableColumns,
    type FormInst,
    type FormRules,
    type SelectOption,
  } from 'naive-ui'
  import { getDictDataList, saveDictData, deleteDictData } from '@/api/system/dict'
  import type { DictDataDTO, DictDataSaveDTO } from '@/types/system/dict'

  // -- Props & Emits --
  const props = defineProps<{
    show: boolean
    typeCode: string
    isSystemType: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
  }>()

  // -- 基本状态 --
  const message = useMessage()
  const dialog = useDialog()
  const loading = ref(false)
  const saving = ref(false)
  const tableData = ref<DictDataDTO[]>([])

  // -- 数据加载 --
  const fetchData = async () => {
    if (!props.typeCode) return
    loading.value = true
    try {
      tableData.value = await getDictDataList(props.typeCode)
    } catch (error) {
      console.error('获取字典数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 监听抽屉显示状态，打开时加载数据
  watch(
    () => props.show,
    (newValue) => {
      if (newValue) {
        fetchData()
      }
    },
    { immediate: true }
  )

  // -- 弹窗表单逻辑 --
  const modalVisible = ref(false)
  const modalTitle = ref('')
  const modalFormRef = ref<FormInst | null>(null)

  const defaultForm = (): DictDataSaveDTO => ({
    typeCode: props.typeCode,
    label: '',
    value: '',
    sort: 10,
    listClass: 'default',
    isDefault: false,
    cssClass: '',
    remark: '',
  })
  const modalForm = ref<DictDataSaveDTO>(defaultForm())

  const rules: FormRules = {
    label: { required: true, message: '数据标签不能为空', trigger: 'blur' },
    value: { required: true, message: '数据值不能为空', trigger: 'blur' },
  }

  // 回显样式的选项
  const listClassOptions: SelectOption[] = [
    { label: '默认', value: 'default' },
    { label: '主要', value: 'primary' },
    { label: '成功', value: 'success' },
    { label: '警告', value: 'warning' },
    { label: '危险', value: 'danger' },
  ]

  const resetModalForm = () => {
    modalForm.value = defaultForm()
  }

  const handleCreate = () => {
    if (props.isSystemType) {
      message.warning('系统内置字典不建议进行修改')
    }
    modalTitle.value = '新增数据'
    modalVisible.value = true
  }

  const handleEdit = (row: DictDataDTO) => {
    if (props.isSystemType) {
      message.warning('系统内置字典不建议进行修改')
    }
    modalTitle.value = '编辑数据'
    modalForm.value = { ...row }
    modalVisible.value = true
  }

  const handleSave = async () => {
    try {
      await modalFormRef.value?.validate()
      saving.value = true
      await saveDictData(modalForm.value)
      message.success('保存成功')
      modalVisible.value = false
      await fetchData()
    } catch (error) {
      console.log('保存失败:', error)
    } finally {
      saving.value = false
    }
  }

  const handleDelete = (id: string) => {
    dialog.warning({
      title: '警告',
      content: '确定要删除这条数据吗？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        if (props.isSystemType) {
          message.error('系统内置字典，禁止删除数据！')
          return
        }
        try {
          await deleteDictData(id)
          message.success('删除成功')
          await fetchData()
        } catch (error) {
          console.error('删除失败:', error)
        }
      },
    })
  }

  // -- 表格列定义 --
  const columns: DataTableColumns<DictDataDTO> = [
    { title: '数据标签', key: 'label', ellipsis: { tooltip: true } },
    { title: '数据值', key: 'value', width: 120 },
    { title: '排序', key: 'sort', width: 80 },
    {
      title: '回显样式',
      key: 'listClass',
      width: 100,
      render(row) {
        return h(NTag, { type: row.listClass || 'default' }, { default: () => row.label })
      },
    },
    {
      title: '默认',
      key: 'isDefault',
      width: 80,
      align: 'center',
      render(row) {
        return h(
          NTag,
          { type: row.isDefault ? 'success' : 'default', size: 'small' },
          { default: () => (row.isDefault ? '是' : '否') }
        )
      },
    },
    { title: '创建时间', key: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      align: 'center',
      render(row) {
        return h(NSpace, null, {
          default: () => [
            h(
              NButton,
              { text: true, type: 'primary', onClick: () => handleEdit(row) },
              { default: () => '编辑' }
            ),
            h(
              NButton,
              { text: true, type: 'error', onClick: () => handleDelete(row.id) },
              { default: () => '删除' }
            ),
          ],
        })
      },
    },
  ]
</script>
