<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4">
      <n-space class="ml-auto">
        <n-button v-if="userStore.isSuperAdmin" type="success" @click="handleCreate(undefined)">
          新增根菜单
        </n-button>
      </n-space>
    </div>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :row-key="(row: MenuDTO) => row.id"
      default-expand-all
      :scroll-x="1100"
    />

    <n-modal
      v-model:show="showModal"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      preset="card"
      style="width: 600px"
    >
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="left"
        label-width="80"
      >
        <n-form-item label="上级菜单">
          <n-tree-select
            v-model:value="formModel.parentId"
            :options="treeOptions"
            label-field="name"
            key-field="id"
            clearable
          />
        </n-form-item>
        <n-form-item label="名称" path="name">
          <n-input v-model:value="formModel.name" />
        </n-form-item>
        <n-form-item label="路径" path="path">
          <n-input v-model:value="formModel.path" />
        </n-form-item>
        <n-form-item label="组件" path="component">
          <n-input v-model:value="formModel.component" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">确认</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showPermModal"
      :title="currentMenu?.name"
      preset="card"
      style="width: 800px"
    >
      <n-space class="mb-4">
        <n-button type="primary" size="small" @click="handleAddPerm">单个新增</n-button>
        <n-input-group>
          <n-input
            v-model:value="permForm.code"
            size="small"
            placeholder="编码前缀"
            style="width: 150px"
          />
          <n-button type="warning" size="small" @click="handleQuickGenPerm">快速生成CRUD</n-button>
        </n-input-group>
      </n-space>
      <n-data-table
        :columns="permColumns"
        :data="permTableData"
        :loading="permLoading"
        max-height="400"
      />
    </n-modal>

    <n-modal v-model:show="showPermEditModal" title="权限配置" preset="card" style="width: 400px">
      <n-form :model="permForm" label-placement="left" label-width="70">
        <n-form-item label="名称"><n-input v-model:value="permForm.name" /></n-form-item>
        <n-form-item label="编码"><n-input v-model:value="permForm.code" /></n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" @click="handleSavePerm">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
  import { ref, onMounted, reactive, h } from 'vue'
  import { NButton, NSpace, NPopconfirm, useMessage, type DataTableColumns } from 'naive-ui'
  import * as menuApi from '@/api/system/menu'
  import * as permApi from '@/api/system/permission'
  import type { MenuDTO } from '@/types/system/menu'
  import type { PermissionDTO } from '@/types/system/permission'
  import { useUserStore } from '@/store/user'

  const userStore = useUserStore()
  const message = useMessage()
  const loading = ref(false)
  const showModal = ref(false)
  const isEdit = ref(false)
  const tableData = ref<MenuDTO[]>([])
  const treeOptions = ref<MenuDTO[]>([])
  const showPermModal = ref(false)
  const showPermEditModal = ref(false)
  const permLoading = ref(false)
  const permTableData = ref<PermissionDTO[]>([])
  const currentMenu = ref<MenuDTO | null>(null)

  const permForm = reactive({
    id: undefined as string | undefined,
    menuId: '',
    name: '',
    code: '',
    url: '',
    method: '*',
  })
  const formModel = reactive({
    id: undefined as string | undefined,
    parentId: undefined as string | undefined,
    name: '',
    path: '',
    component: '',
  })
  const rules = { name: { required: true }, path: { required: true } }

  const columns: DataTableColumns<MenuDTO> = [
    { title: '菜单名称', key: 'name', minWidth: 250 },
    { title: '路由路径', key: 'path', minWidth: 150, ellipsis: { tooltip: true } },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (row) => {
        const isDir = !row.component || row.component === 'Layout'
        return h(NSpace, null, {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'success',
                onClick: () => handleCreate(row.id),
              },
              { default: () => '新增下级' }
            ),
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'info',
                disabled: isDir,
                onClick: () => handleManagePerm(row),
              },
              { default: () => '权限' }
            ),
            h(
              NButton,
              { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
              { default: () => '编辑' }
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => handleDelete(row.id) },
              {
                trigger: () =>
                  h(
                    NButton,
                    { size: 'small', quaternary: true, type: 'error' },
                    { default: () => '删除' }
                  ),
                default: () => '确定删除？',
              }
            ),
          ],
        })
      },
    },
  ]

  const permColumns: DataTableColumns<any> = [
    { title: '名称', key: 'name' },
    { title: '编码', key: 'code' },
    {
      title: '操作',
      key: 'actions',
      render: (row: any) =>
        h(NSpace, null, {
          default: () => [
            h(
              NButton,
              {
                size: 'tiny',
                onClick: () => {
                  Object.assign(permForm, row)
                  showPermEditModal.value = true
                },
              },
              { default: () => '编辑' }
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => handleDeletePerm(row.id) },
              {
                trigger: () =>
                  h(NButton, { size: 'tiny', type: 'error' }, { default: () => '删除' }),
                default: () => '删除？',
              }
            ),
          ],
        }),
    },
  ]

  async function loadData() {
    loading.value = true
    tableData.value = await menuApi.getMenuTree()
    treeOptions.value = tableData.value
    loading.value = false
  }

  async function handleManagePerm(row: MenuDTO) {
    currentMenu.value = row
    showPermModal.value = true
    permLoading.value = true
    permTableData.value = await permApi.findByMenuId(row.id)
    permLoading.value = false
  }

  async function handleQuickGenPerm() {
    const prefix = permForm.code.trim()
    if (!prefix || !currentMenu.value) return
    const crud = [
      { n: '查询', s: 'list' },
      { n: '新增', s: 'create' },
      { n: '修改', s: 'update' },
      { n: '删除', s: 'delete' },
    ]
    permLoading.value = true
    try {
      for (const t of crud) {
        await permApi.save({
          menuId: currentMenu.value.id,
          name: `${currentMenu.value.name}${t.n}`,
          code: `${prefix}:${t.s}`,
          url: '',
          method: '*',
        })
      }
      permTableData.value = await permApi.findByMenuId(currentMenu.value.id)
    } finally {
      permLoading.value = false
    }
  }

  function handleAddPerm() {
    Object.assign(permForm, {
      id: undefined,
      menuId: currentMenu.value?.id,
      name: '',
      code: '',
      url: '',
      method: '*',
    })
    showPermEditModal.value = true
  }

  async function handleSavePerm() {
    await permApi.save(permForm)
    showPermEditModal.value = false
    handleManagePerm(currentMenu.value!)
  }

  async function handleDeletePerm(id: string) {
    await permApi.deleteById(id)
    handleManagePerm(currentMenu.value!)
  }

  function handleCreate(parentId: string | undefined) {
    isEdit.value = false
    Object.assign(formModel, { id: undefined, parentId, name: '', path: '', component: '' })
    showModal.value = true
  }

  function handleEdit(row: MenuDTO) {
    isEdit.value = true
    Object.assign(formModel, row)
    showModal.value = true
  }

  async function handleSave() {
    isEdit.value
      ? await menuApi.updateMenu(formModel.id!, formModel)
      : await menuApi.createMenu(formModel as any)
    showModal.value = false
    loadData()
  }

  async function handleDelete(id: string) {
    await menuApi.deleteMenu(id)
    loadData()
  }

  onMounted(loadData)
</script>
