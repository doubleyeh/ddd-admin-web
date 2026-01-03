<template>
  <div class="p-4">
    <n-card title="字典管理" :bordered="false" content-style="padding: 20px;">
      <!-- 搜索及操作区域 -->
      <div class="flex items-center justify-between mb-4">
        <n-space>
          <n-input v-model:value="searchParams.name" placeholder="字典名称" clearable />
          <n-input v-model:value="searchParams.code" placeholder="字典编码" clearable />
        </n-space>
        <n-space>
          <n-button type="primary" @click="handleSearch">搜索</n-button>
          <n-button @click="resetSearch">重置</n-button>
          <n-button type="success" @click="handleCreate">新增字典类型</n-button>
        </n-space>
      </div>

      <!-- 数据表格 -->
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: DictTypeDTO) => row.id"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

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
        :label-width="100"
      >
        <n-form-item label="字典名称" path="name">
          <n-input v-model:value="modalForm.name" placeholder="请输入字典名称" />
        </n-form-item>
        <n-form-item label="字典编码" path="code">
          <n-input
            v-model:value="modalForm.code"
            placeholder="请输入字典编码"
            :disabled="!!modalForm.id && modalForm.isSystem"
          />
          <template #feedback>
            {{ modalForm.isSystem ? '系统内置字典，编码不可修改' : '保存后不可修改' }}
          </template>
        </n-form-item>
        <n-form-item label="排序" path="sort">
          <n-input-number
            v-model:value="modalForm.sort"
            :min="0"
            placeholder="请输入排序"
            style="width: 100%"
          />
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

    <!-- 字典数据配置抽屉 -->
    <dict-data-drawer
      v-model:show="drawerVisible"
      :type-code="selectedTypeCode"
      :is-system-type="selectedIsSystem"
    />
  </div>
</template>

<script setup lang="ts">
  import { h, onMounted, reactive, ref } from 'vue'
  import {
    NButton,
    NSpace,
    NTag,
    useDialog,
    useMessage,
    type DataTableColumns,
    type FormInst,
    type FormRules,
    type PaginationProps,
  } from 'naive-ui'
  import { getDictTypePage, saveDictType, deleteDictType } from '@/api/system/dict'
  import type { DictTypeDTO, DictTypeSaveDTO } from '@/types/system/dict'
  import DictDataDrawer from '@/components/system/DictDataDrawer.vue'

  const message = useMessage()
  const dialog = useDialog()

  // -- 搜索逻辑 --
  const searchParams = reactive({
    name: '',
    code: '',
  })

  const handleSearch = () => {
    pagination.page = 1
    fetchData()
  }

  const resetSearch = () => {
    searchParams.name = ''
    searchParams.code = ''
    handleSearch()
  }

  // -- 表格与分页逻辑 --
  const loading = ref(false)
  const tableData = ref<DictTypeDTO[]>([])
  const pagination = reactive<PaginationProps>({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [5, 10, 20, 50],
  })

  const handlePageChange = (page: number) => {
    pagination.page = page
    fetchData()
  }

  const handlePageSizeChange = (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchData()
  }

  const fetchData = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.page - 1,
        size: pagination.pageSize!,
        name: searchParams.name,
        code: searchParams.code,
      }
      const data = await getDictTypePage(params)
      tableData.value = data.content
      pagination.itemCount = data.totalElements
    } catch (error) {
      console.error('获取字典类型列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchData)

  // -- 弹窗表单逻辑 --
  const modalVisible = ref(false)
  const saving = ref(false)
  const modalTitle = ref('')
  const modalFormRef = ref<FormInst | null>(null)

  // 在表单 DTO 中加入 isSystem，用于判断编码是否可编辑
  type ModalFormDTO = DictTypeSaveDTO & { isSystem?: boolean }
  const defaultForm = (): ModalFormDTO => ({
    name: '',
    code: '',
    sort: 10,
    remark: '',
    isSystem: false,
  })
  const modalForm = ref<ModalFormDTO>(defaultForm())

  const rules: FormRules = {
    name: { required: true, message: '字典名称不能为空', trigger: 'blur' },
    code: { required: true, message: '字典编码不能为空', trigger: 'blur' },
  }

  const resetModalForm = () => {
    modalForm.value = defaultForm()
  }

  const handleCreate = () => {
    modalTitle.value = '新增字典类型'
    modalVisible.value = true
  }

  const handleEdit = (row: DictTypeDTO) => {
    modalTitle.value = '编辑字典类型'
    modalForm.value = { ...row }
    modalVisible.value = true
  }

  const handleSave = async () => {
    try {
      await modalFormRef.value?.validate()
      saving.value = true
      await saveDictType(modalForm.value)
      message.success('保存成功')
      modalVisible.value = false
      await fetchData()
    } catch (error) {
      console.log('保存失败:', error)
    } finally {
      saving.value = false
    }
  }

  const handleDelete = (row: DictTypeDTO) => {
    if (row.isSystem) {
      message.error('系统内置字典，不允许删除！')
      return
    }
    dialog.warning({
      title: '警告',
      content: '确定要删除此字典类型吗？其下的所有字典数据也将被一并清除。',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteDictType(row.id)
          message.success('删除成功')
          await fetchData()
        } catch (error) {
          console.error('删除失败:', error)
        }
      },
    })
  }

  // -- 抽屉逻辑 --
  const drawerVisible = ref(false)
  const selectedTypeCode = ref('')
  const selectedIsSystem = ref(false)

  const handleDataConfig = (row: DictTypeDTO) => {
    selectedTypeCode.value = row.code
    selectedIsSystem.value = row.isSystem
    drawerVisible.value = true
  }

  // -- 表格列定义 --
  const columns: DataTableColumns<DictTypeDTO> = [
    { title: '字典名称', key: 'name', ellipsis: { tooltip: true } },
    { title: '字典编码', key: 'code', ellipsis: { tooltip: true } },
    { title: '排序', key: 'sort', width: 80 },
    {
      title: '系统内置',
      key: 'isSystem',
      width: 100,
      align: 'center',
      render(row) {
        return h(
          NTag,
          { type: row.isSystem ? 'success' : 'default', size: 'small' },
          { default: () => (row.isSystem ? '是' : '否') }
        )
      },
    },
    { title: '创建时间', key: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      align: 'center',
      render(row) {
        const editButton = h(
          NButton,
          { text: true, type: 'primary', onClick: () => handleEdit(row) },
          { default: () => '编辑' }
        )
        const deleteButton = h(
          NButton,
          { text: true, type: 'error', disabled: row.isSystem, onClick: () => handleDelete(row) },
          { default: () => '删除' }
        )
        const configButton = h(
          NButton,
          { text: true, type: 'primary', onClick: () => handleDataConfig(row) },
          { default: () => '数据配置' }
        )

        return h(NSpace, null, { default: () => [editButton, configButton, deleteButton] })
      },
    },
  ]
</script>
