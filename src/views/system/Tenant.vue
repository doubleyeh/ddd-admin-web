<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4">
      <n-input
        v-model:value="query.tenantId"
        placeholder="租户ID"
        clearable
        class="w-40 mr-4"
      />
      <n-input
        v-model:value="query.name"
        placeholder="租户名称"
        clearable
        class="w-40 mr-4"
      />
      <n-space>
        <n-button type="primary" @click="handleSearch">查询</n-button>
        <n-button @click="handleReset">重置</n-button>
      </n-space>

      <n-button
        v-if="userStore.hasPermission('tenant:create')"
        type="success"
        class="ml-auto"
        @click="handleCreate"
      >
        新增租户
      </n-button>
    </div>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      remote
      @update:page="handlePageChange"
      @update:pageSize="handlePageSizeChange"
      :row-key="(row) => row.id"
      class="flex-1"
    />

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="dialog"
      :title="isEdit ? '编辑租户' : '新增租户'"
      :style="{ width: '500px' }"
      positive-text="确认"
      negative-text="取消"
      @positive-click="handleSave"
    >
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-placement="top"
        class="mt-4"
      >
        <n-form-item label="租户ID" path="tenantId">
          <n-input v-model:value="formModel.tenantId" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="租户名称" path="name">
          <n-input v-model:value="formModel.name" />
        </n-form-item>
        <n-form-item label="联系人" path="contactPerson">
          <n-input v-model:value="formModel.contactPerson" />
        </n-form-item>
        <n-form-item label="联系电话" path="contactPhone">
          <n-input v-model:value="formModel.contactPhone" />
        </n-form-item>
        <n-form-item label="是否启用" path="enabled">
          <n-switch v-model:value="formModel.enabled" />
        </n-form-item>
      </n-form>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { h, ref, reactive, onMounted } from 'vue'
import {
  NButton,
  NDataTable,
  NCard,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NPopconfirm,
  NSpace,
  NSwitch,
  useMessage,
  type DataTableColumns,
  type FormInst
} from 'naive-ui'
import * as TenantApi from '@/api/system/tenant'
import type { TenantDTO, TenantSaveDTO, TenantCreateResultDTO } from '@/types/system/tenant'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const message = useMessage()

const tableData = ref<TenantDTO[]>([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInst | null>(null)

const query = reactive({
  tenantId: '',
  name: ''
})

const initialForm: TenantSaveDTO = {
  tenantId: '',
  name: '',
  contactPerson: '',
  contactPhone: '',
  enabled: true
}
const formModel = ref<TenantSaveDTO>({ ...initialForm })

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30]
})

const formRules = {
  tenantId: [
    { required: true, message: '请输入租户ID', trigger: 'blur' },
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { max: 100, message: '长度不能超过100个字符', trigger: 'blur' }
  ]
}

const createColumns = (): DataTableColumns<TenantDTO> => {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '租户ID', key: 'tenantId' },
    { title: '租户名称', key: 'name' },
    { title: '联系人', key: 'contactPerson' },
    { title: '联系电话', key: 'contactPhone' },
    {
      title: '是否启用',
      key: 'enabled',
      render(row) {
        return h(NSwitch, { value: row.enabled, disabled: true })
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render(row) {
        return h(
          NSpace,
          {},
          {
            default: () => [
              userStore.hasPermission('tenant:update') &&
                h(
                  NButton,
                  {
                    size: 'small',
                    onClick: () => handleEdit(row)
                  },
                  { default: () => '编辑' }
                ),
              userStore.hasPermission('tenant:delete') &&
                h(
                  NPopconfirm,
                  {
                    onPositiveClick: () => handleDelete(row.id),
                    positiveText: '确认',
                    negativeText: '取消'
                  },
                  {
                    trigger: () =>
                      h(
                        NButton,
                        {
                          size: 'small',
                          type: 'error'
                        },
                        { default: () => '删除' }
                      ),
                    default: () => '确认删除该租户吗？'
                  }
                )
            ].filter(Boolean)
          }
        )
      }
    }
  ]
}

const columns = createColumns()

async function fetchTableData() {
  loading.value = true
  try {
    const res = await TenantApi.findPage(
      pagination.page - 1,
      pagination.pageSize,
      {
        ...query
      }
    )
    
    tableData.value = res.content
    pagination.itemCount = res.totalElements
    
  } catch (error: any) {
    message.error(error.message || '查询失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchTableData()
}

function handleReset() {
  query.tenantId = ''
  query.name = ''
  handleSearch()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchTableData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchTableData()
}

function handleCreate() {
  isEdit.value = false
  formModel.value = { ...initialForm }
  showModal.value = true
}

function handleEdit(row: TenantDTO) {
  isEdit.value = true
  formModel.value = { ...row, id: row.id }
  showModal.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  
  const data: TenantSaveDTO = { ...formModel.value }
  let res: TenantDTO | TenantCreateResultDTO | undefined
  
  try {
    if (isEdit.value && data.id) {
      res = await TenantApi.update(data.id, data)
    } else {
      res = await TenantApi.create(data)
    }
  } catch(error: any) {
    message.error(error.message || (isEdit.value ? '修改失败' : '新增失败'))
    return false
  }

  message.success(isEdit.value ? '修改成功' : '新增成功')
  
  if (!isEdit.value && res) {
    const resultData = res as TenantCreateResultDTO
    message.info(
      `租户创建成功，默认管理员密码: ${resultData.initialAdminPassword}，请妥善保管！`,
      { duration: 10000 }
    )
  }

  showModal.value = false
  fetchTableData()
  return true
}

async function handleDelete(id: number) {
  try {
    await TenantApi.deleteById(id)
    message.success('删除成功')
    fetchTableData()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<style scoped>
.h-full {
  height: 100%;
}
</style>