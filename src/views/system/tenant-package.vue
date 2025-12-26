<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4 flex-nowrap">
      <n-space wrap-item>
        <n-input v-model:value="query.name" placeholder="套餐名称" clearable class="w-48" />
      </n-space>

      <n-space class="ml-4">
        <n-button type="primary" @click="handleSearch">查询</n-button>
        <n-button @click="handleReset">重置</n-button>
        <n-button
          v-if="userStore.hasPermission('tenantPackage:create')"
          type="success"
          @click="handleCreate"
        >
          新增套餐
        </n-button>
      </n-space>
    </div>

    <n-data-table
      remote
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      :row-key="(row: TenantPackageDTO) => row.id"
      class="flex-1"
    />

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      :title="isEdit ? '编辑套餐' : '新增套餐'"
      :style="{ width: '600px' }"
    >
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-placement="left"
        label-width="80"
      >
        <n-form-item label="套餐名称" path="name">
          <n-input v-model:value="formModel.name" placeholder="请输入套餐名称" />
        </n-form-item>
        <n-form-item label="状态" path="enabled">
          <n-switch v-model:value="formModel.enabled" />
        </n-form-item>
        <n-form-item label="备注" path="description">
          <n-input v-model:value="formModel.description" type="textarea" placeholder="请输入备注" />
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
  import { h, ref, reactive, onMounted, computed } from 'vue'
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
    NTree,
    useMessage,
    type DataTableColumns,
    type FormInst,
  } from 'naive-ui'
  import * as PackageApi from '@/api/system/tenant-package'
  import * as MenuApi from '@/api/system/menu'
  import type { TenantPackageDTO, TenantPackageSaveDTO } from '@/types/system/tenant-package'
  import type { MenuOptionDTO } from '@/types/system/menu'
  import { useUserStore } from '@/store/user'

  const userStore = useUserStore()
  const message = useMessage()

  const tableData = ref<TenantPackageDTO[]>([])
  const loading = ref(false)
  const showModal = ref(false)
  const isEdit = ref(false)
  const formRef = ref<FormInst | null>(null)
  const menuOptions = ref<MenuOptionDTO[]>([])
  const defaultExpandedKeys = ref<number[]>([])

  const query = reactive({
    name: '',
  })

  const initialForm: TenantPackageSaveDTO = {
    id: '',
    name: '',
    description: '',
    enabled: true,
    menuIds: [],
    permissionIds: [],
  }
  const formModel = ref<TenantPackageSaveDTO & { id?: string }>({ ...initialForm })

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 30],
  })

  const formRules = {
    name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  }

  const checkedKeys = computed(() => {
    return [...formModel.value.menuIds, ...formModel.value.permissionIds]
  })

  const columns: DataTableColumns<TenantPackageDTO> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, idx) => (pagination.page - 1) * pagination.pageSize + idx + 1,
    },
    { title: '套餐名称', key: 'name' },
    {
      title: '状态',
      key: 'enabled',
      render(row) {
        return h(NSwitch, {
          value: row.enabled,
          disabled: !userStore.hasPermission('tenantPackage:update'),
          'onUpdate:value': (v: boolean) => handleUpdateState(row.id, v),
        })
      },
    },
    { title: '备注', key: 'description' },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render(row) {
        return h(
          NSpace,
          {},
          {
            default: () =>
              [
                userStore.hasPermission('tenantPackage:update') &&
                  h(
                    NButton,
                    { size: 'small', onClick: () => handleEdit(row) },
                    { default: () => '编辑' }
                  ),
                userStore.hasPermission('tenantPackage:delete') &&
                  h(
                    NPopconfirm,
                    { onPositiveClick: () => handleDelete(row.id) },
                    {
                      trigger: () =>
                        h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
                      default: () => '确认删除该套餐吗？',
                    }
                  ),
              ].filter(Boolean),
          }
        )
      },
    },
  ]

  async function loadMenuOptions() {
    const res = await MenuApi.getMenuTreeOptions()
    menuOptions.value = res
    const allIds: number[] = []
    const collectIds = (list: any[]) => {
      list.forEach((item) => {
        allIds.push(item.id)
        if (item.children) collectIds(item.children)
      })
    }
    collectIds(res)
    defaultExpandedKeys.value = allIds
  }

  async function fetchTableData() {
    loading.value = true
    try {
      const res = await PackageApi.findPage(pagination.page - 1, pagination.pageSize, query)
      tableData.value = res.content
      pagination.itemCount = res.totalElements
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pagination.page = 1
    fetchTableData()
  }

  function handleReset() {
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
    formModel.value = { ...initialForm, menuIds: [], permissionIds: [] }
    showModal.value = true
  }

  async function handleEdit(row: TenantPackageDTO) {
    isEdit.value = true
    const detail = await PackageApi.getById(row.id)
    formModel.value = {
      id: detail.id,
      name: detail.name,
      description: detail.description,
      enabled: detail.enabled,
      menuIds: detail.menuIds || [],
      permissionIds: detail.permissionIds || [],
    }
    showModal.value = true
  }

  async function handleSave() {
    await formRef.value?.validate()
    try {
      if (isEdit.value && formModel.value.id) {
        await PackageApi.update(formModel.value.id, formModel.value)
      } else {
        await PackageApi.create(formModel.value)
      }
      message.success('保存成功')
      showModal.value = false
      fetchTableData()
    } catch (e: any) {
      message.error(e.message || '保存失败')
    }
  }

  async function handleUpdateState(id: string, state: boolean) {
    try {
      await PackageApi.updateState(id, state)
      message.success('状态更新成功')
      fetchTableData()
    } catch (e: any) {
      message.error(e.message || '状态更新失败')
    }
  }

  async function handleDelete(id: string) {
    try {
      await PackageApi.deleteById(id)
      message.success('删除成功')
      fetchTableData()
    } catch (e: any) {
      message.error(e.message || '删除失败')
    }
  }

  function handleCheckUpdate(
    keys: Array<string>,
    _options: any[],
    meta: { action: 'check' | 'uncheck'; node: any }
  ) {
    const newMenuIds = new Set<string>()
    const newPermissionIds = new Set<string>()

    const allNodes: MenuOptionDTO[] = []
    const flatten = (nodes: MenuOptionDTO[]) => {
      nodes.forEach((n) => {
        allNodes.push(n)
        if (n.children) flatten(n.children)
      })
    }
    flatten(menuOptions.value)

    keys.forEach((k) => {
      const node = allNodes.find((n) => n.id === k)
      if (node) {
        if (node.isPermission) {
          newPermissionIds.add(node.id)
        } else {
          newMenuIds.add(node.id)
        }
      }
    })

    if (meta.action === 'check' && meta.node) {
      const checkParent = (node: any) => {
        if (node.parentId && node.parentId !== 0) {
          newMenuIds.add(node.parentId)
          const parent = allNodes.find((n) => n.id === node.parentId)
          if (parent) checkParent(parent)
        }
      }
      checkParent(meta.node)
    }

    formModel.value.menuIds = Array.from(newMenuIds)
    formModel.value.permissionIds = Array.from(newPermissionIds)
  }

  onMounted(() => {
    fetchTableData()
    loadMenuOptions()
  })
</script>

<style scoped>
  .h-full {
    height: 100%;
  }
</style>
