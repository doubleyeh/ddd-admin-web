<template>
  <div class="p-4">
    <n-card>
      <n-form inline :model="queryModel" label-placement="left" class="flex-wrap">
        <n-form-item label="角色名称">
          <n-input v-model:value="queryModel.name" placeholder="请输入" />
        </n-form-item>
        <n-form-item label="角色编码">
          <n-input v-model:value="queryModel.code" placeholder="请输入" />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
            <n-button type="primary" ghost @click="handleCreate">新增角色</n-button>
          </n-space>
        </n-form-item>
      </n-form>

      <n-data-table
        remote
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        class="mt-2"
      />
    </n-card>

    <n-modal
      v-model:show="showModal"
      :title="isEdit ? '编辑角色' : '新增角色'"
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
        <n-form-item label="角色名称" path="name">
          <n-input v-model:value="formModel.name" />
        </n-form-item>
        <n-form-item label="角色编码" path="code">
          <n-input v-model:value="formModel.code" :disabled="isEdit" />
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
            @update:checked-keys="(keys) => (formModel.menuIds = keys)"
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
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, reactive, h } from 'vue'
  import { NButton, NSpace, NPopconfirm, NTag, useMessage } from 'naive-ui'
  import * as roleApi from '@/api/system/role'
  import type { RoleDTO, RoleSaveDTO, RoleQuery } from '@/types/system/role'

  const message = useMessage()
  const loading = ref(false)
  const showModal = ref(false)
  const isEdit = ref(false)
  const formRef = ref()
  const tableData = ref<RoleDTO[]>([])
  const menuOptions = ref([])

  const queryModel = reactive<RoleQuery>({ name: '', code: '' })
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 50],
  })
  const formModel = ref<RoleSaveDTO>({
    name: '',
    code: '',
    description: '',
    sort: 1,
    enabled: true,
    permissionIds: [],
    menuIds: [],
  })

  const rules = {
    name: { required: true, message: '请输入角色名称', trigger: 'blur' },
    code: { required: true, message: '请输入角色编码', trigger: 'blur' },
  }

  const columns = [
    { title: '角色名称', key: 'name' },
    { title: '角色编码', key: 'code' },
    { title: '排序', key: 'sort' },
    {
      title: '状态',
      key: 'enabled',
      render: (row: RoleDTO) =>
        h(
          NTag,
          { type: row.enabled ? 'success' : 'error' },
          { default: () => (row.enabled ? '启用' : '禁用') }
        ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (row: RoleDTO) =>
        h(
          NSpace,
          {},
          {
            default: () => [
              h(
                NButton,
                { size: 'small', onClick: () => handleEdit(row) },
                { default: () => '编辑' }
              ),
              h(
                NPopconfirm,
                { onPositiveClick: () => handleDelete(row.id) },
                {
                  trigger: () =>
                    h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
                  default: () => '确认删除该角色吗？',
                }
              ),
            ],
          }
        ),
    },
  ]

  async function loadData() {
    loading.value = true
    try {
      const res = await roleApi.findPage(pagination.page, pagination.pageSize, queryModel)
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
    handleSearch()
  }
  function handlePageChange(page: number) {
    pagination.page = page
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

  async function handleSave() {
    formRef.value?.validate(async (errors: any) => {
      if (!errors) {
        isEdit.value && formModel.value.id
          ? await roleApi.update(formModel.value.id, formModel.value)
          : await roleApi.create(formModel.value)
        message.success('保存成功')
        showModal.value = false
        loadData()
      }
    })
  }

  async function handleDelete(id: string) {
    await roleApi.deleteById(id)
    message.success('删除成功')
    loadData()
  }

  onMounted(() => loadData())
</script>
