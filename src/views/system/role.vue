<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4 w-full flex-nowrap">
      <n-space wrap-item class="w-4/6">
        <div class="w-40">
          <n-select
            v-if="isSuperTenant"
            v-model:value="queryModel.tenantId"
            :options="allTenantOptions"
            placeholder="选择租户"
            clearable
            filterable
          />
        </div>
        <n-input v-model:value="queryModel.name" placeholder="角色名称" clearable class="w-40" />
        <n-input v-model:value="queryModel.code" placeholder="角色编码" clearable class="w-40" />
      </n-space>

      <n-space class="ml-4">
        <n-button type="primary" @click="handleSearch">查询</n-button>
        <n-button @click="handleReset">重置</n-button>
        <n-button
          v-if="userStore.hasPermission('role:create')"
          type="success"
          @click="handleCreate"
        >
          新增角色
        </n-button>
      </n-space>
    </div>

    <n-data-table
      remote
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      max-height="calc(100vh - 250px)"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      class="flex-1"
    />

    <n-modal
      v-model:show="showModal"
      :title="isEdit ? '编辑角色' : '新增角色'"
      preset="card"
      style="width: 600px"
      :mask-closable="false"
    >
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="left"
        label-width="80"
      >
        <n-form-item v-if="isSuperTenant && !isEdit" label="所属租户" path="tenantId">
          <n-select
            v-model:value="formModel.tenantId"
            :options="allTenantOptions"
            placeholder="请选择所属租户"
            filterable
            :disabled="isEdit"
          />
        </n-form-item>
        <n-form-item label="角色名称" path="name">
          <n-input v-model:value="formModel.name" @input="handleNameInput" />
        </n-form-item>
        <n-form-item label="角色编码" path="code">
          <n-input
            v-model:value="formModel.code"
            :disabled="isEdit"
            placeholder="自动生成或手动输入"
          />
        </n-form-item>
        <n-form-item label="显示排序" path="sort">
          <n-input-number v-model:value="formModel.sort" />
        </n-form-item>
        <n-form-item label="状态" path="enabled">
          <n-switch v-model:value="formModel.enabled" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input v-model:value="formModel.description" type="textarea" />
        </n-form-item>
        <n-form-item label="菜单权限">
          <n-tree
            block-line
            checkable
            expand-on-click
            :data="menuOptions"
            :checked-keys="formModel.menuIds"
            @update:checked-keys="(keys: any) => (formModel.menuIds = keys)"
            style="max-height: 250px; overflow: auto"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
  import { ref, onMounted, reactive, h, computed } from 'vue'
  import {
    NButton,
    NSpace,
    NPopconfirm,
    useMessage,
    type DataTableColumns,
    type FormInst,
  } from 'naive-ui'
  import { pinyin } from 'pinyin-pro'
  import * as roleApi from '@/api/system/role'
  import { getOptions } from '@/api/system/tenant'
  import type { RoleDTO, RoleSaveDTO } from '@/types/system/role'
  import { useUserStore } from '@/store/user'

  const userStore = useUserStore()
  const message = useMessage()
  const isSuperTenant = computed(() => userStore.isSuperTenant)

  const loading = ref(false)
  const showModal = ref(false)
  const isEdit = ref(false)
  const formRef = ref<FormInst | null>(null)
  const tableData = ref<RoleDTO[]>([])
  const menuOptions = ref([])
  const allTenantOptions = ref<{ label: string; value: string }[]>([])

  const queryModel = reactive({ name: '', code: '', tenantId: null })
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 30],
  })

  const formModel = ref<RoleSaveDTO & { tenantId?: string }>({
    name: '',
    code: '',
    description: '',
    sort: 1,
    enabled: true,
    permissionIds: [],
    menuIds: [],
    tenantId: userStore.tenantId,
  })

  const rules = {
    name: { required: true, message: '请输入角色名称', trigger: 'blur' },
    code: { required: true, message: '请输入角色编码', trigger: 'blur' },
    tenantId: { required: true, message: '请选择租户', trigger: 'change' },
  }

  const columns: DataTableColumns<RoleDTO> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, idx) => (pagination.page - 1) * pagination.pageSize + idx + 1,
    },
    ...(isSuperTenant ? [{ title: '所属租户', key: 'tenantName' }] : []),
    { title: '角色名称', key: 'name' },
    { title: '角色编码', key: 'code' },
    { title: '排序', key: 'sort' },
    {
      title: '状态',
      key: 'enabled',
      render(row: RoleDTO) {
        return h(NSwitch, {
          value: row.enabled,
          disabled: !userStore.hasPermission('role:update'),
          'onUpdate:value': (value: boolean) => {
            handleUpdateState(row.id, value)
          },
        })
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (row) =>
        h(
          NSpace,
          {},
          {
            default: () =>
              [
                userStore.hasPermission('role:update') &&
                  h(
                    NButton,
                    { size: 'small', onClick: () => handleEdit(row) },
                    { default: () => '编辑' }
                  ),
                userStore.hasPermission('role:delete') &&
                  h(
                    NPopconfirm,
                    { onPositiveClick: () => handleDelete(row.id) },
                    {
                      trigger: () =>
                        h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
                      default: () => '确认删除该角色吗？',
                    }
                  ),
              ].filter(Boolean),
          }
        ),
    },
  ]

  function handleNameInput(val: string) {
    if (isEdit.value) return
    formModel.value.code = pinyin(val, { toneType: 'none', type: 'array' })
      .join('_')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '')
  }

  async function fetchTenantOptions() {
    const list = await getOptions('')
    allTenantOptions.value = list.map((t) => ({ label: t.name, value: t.tenantId }))
  }

  async function loadData() {
    loading.value = true
    try {
      const res = await roleApi.findPage(pagination.page - 1, pagination.pageSize, queryModel)
      tableData.value = res.content
      pagination.itemCount = res.totalElements
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pagination.page = 1
    loadData()
  }
  function handleReset() {
    queryModel.name = ''
    queryModel.code = ''
    queryModel.tenantId = null
    handleSearch()
  }
  function handlePageChange(page: number) {
    pagination.page = page
    loadData()
  }
  function handlePageSizeChange(size: number) {
    pagination.pageSize = size
    pagination.page = 1
    loadData()
  }

  function handleCreate() {
    isEdit.value = false
    formModel.value = {
      name: '',
      code: '',
      description: '',
      sort: 1,
      enabled: true,
      permissionIds: [],
      menuIds: [],
      tenantId: userStore.tenantId,
    }
    showModal.value = true
  }

  async function handleEdit(row: RoleDTO) {
    isEdit.value = true
    const detail = await roleApi.getById(row.id)
    formModel.value = {
      id: detail.id,
      name: detail.name,
      code: detail.code,
      description: detail.description,
      sort: detail.sort,
      enabled: detail.enabled,
      menuIds: detail.menus?.map((m: any) => m.id) || [],
      permissionIds: detail.permissions?.map((p: any) => p.id) || [],
    }
    showModal.value = true
  }

  async function handleUpdateState(id: string, state: boolean) {
    const index = tableData.value.findIndex((item: RoleDTO) => item.id === id)
    const row = tableData.value[index]
    if (row) {
      row.enabled = state
    }

    try {
      await roleApi.updateState(id, state)
      message.success(`${state ? '启用' : '禁用'}成功`)
    } catch (error: any) {
      message.error(error.message || `${state ? '启用' : '禁用'}失败`)
      if (index > -1 && tableData.value[index]) {
        tableData.value[index].enabled = state
      }
    }
  }

  async function handleSave() {
    await formRef.value?.validate()
    if (isEdit.value && formModel.value.id) {
      await roleApi.update(formModel.value.id, formModel.value)
    } else {
      await roleApi.create(formModel.value)
    }
    message.success('操作成功')
    showModal.value = false
    loadData()
  }

  async function handleDelete(id: string) {
    try {
      await roleApi.deleteById(id)
      message.success('删除成功')
      loadData()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  onMounted(() => {
    if (isSuperTenant) fetchTenantOptions()
    loadData()
  })
</script>
