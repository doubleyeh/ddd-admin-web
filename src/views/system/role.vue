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
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">确认</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showGrantModal" title="角色授权" preset="card" style="width: 500px">
      <n-scrollbar style="max-height: 500px" trigger="none">
        <n-tree
          block-line
          checkable
          expand-on-click
          :cascade="false"
          label-field="name"
          key-field="id"
          :data="menuOptions"
          v-model:checked-keys="grantForm.menuIds"
          v-model:expanded-keys="defaultExpandedKeys"
          @update:checked-keys="handleCheckUpdate"
          :node-props="nodeProps"
        />
      </n-scrollbar>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showGrantModal = false">取消</n-button>
          <n-button type="primary" @click="handleGrantSave">确认授权</n-button>
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
    NSwitch,
    useMessage,
    type DataTableColumns,
    type FormInst,
  } from 'naive-ui'
  import { pinyin } from 'pinyin-pro'
  import * as roleApi from '@/api/system/role'
  import * as menuApi from '@/api/system/menu'
  import { getOptions } from '@/api/system/tenant'
  import type { RoleDTO, RoleSaveDTO } from '@/types/system/role'
  import type { MenuOptionDTO } from '@/types/system/menu'
  import { useUserStore } from '@/store/user'

  const userStore = useUserStore()
  const message = useMessage()
  const isSuperTenant = computed(() => userStore.isSuperTenant)
  const loading = ref(false)
  const showModal = ref(false)
  const showGrantModal = ref(false)
  const isEdit = ref(false)
  const formRef = ref<FormInst | null>(null)
  const tableData = ref<RoleDTO[]>([])
  const menuOptions = ref<MenuOptionDTO[]>([])
  const allTenantOptions = ref<{ label: string; value: string }[]>([])
  const queryModel = reactive({ name: '', code: '', tenantId: null })
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 30],
  })

  const formModel = ref<RoleSaveDTO>({
    name: '',
    code: '',
    description: '',
    sort: 1,
    enabled: true,
    tenantId: userStore.tenantId,
  })

  const grantForm = reactive({ roleId: '', menuIds: [] as string[] })

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
    {
      title: '状态',
      key: 'enabled',
      render(row) {
        return h(NSwitch, {
          value: row.enabled,
          disabled: !userStore.hasPermission('role:update'),
          'onUpdate:value': (v) => handleUpdateState(row.id, v),
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
            default: () => [
              userStore.hasPermission('role:update') &&
                h(
                  NButton,
                  { size: 'small', onClick: () => handleEdit(row) },
                  { default: () => '编辑' }
                ),
              userStore.hasPermission('role:update') &&
                h(
                  NButton,
                  { size: 'small', type: 'info', onClick: () => handleOpenGrant(row) },
                  { default: () => '授权' }
                ),
              userStore.hasPermission('role:delete') &&
                h(
                  NPopconfirm,
                  { onPositiveClick: () => handleDelete(row.id) },
                  {
                    trigger: () =>
                      h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
                    default: () => '确认删除吗？',
                  }
                ),
            ],
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
  function handlePageChange(p: number) {
    pagination.page = p
    loadData()
  }
  function handlePageSizeChange(s: number) {
    pagination.pageSize = s
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
      tenantId: row.tenantId,
    }
    showModal.value = true
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

  async function handleUpdateState(id: string, state: boolean) {
    await roleApi.updateState(id, state)
    message.success('更新成功')
    loadData()
  }

  async function handleDelete(id: string) {
    await roleApi.deleteById(id)
    message.success('删除成功')
    loadData()
  }

  //--------授权部分---------
  const defaultExpandedKeys = ref<string[]>([])
  async function handleOpenGrant(row: RoleDTO) {
    grantForm.roleId = row.id
    const [tree, detail] = await Promise.all([
      menuApi.getMenuTreeOptions(),
      roleApi.getById(row.id),
    ])

    const injectParentId = (nodes: any[], pId: string | null) => {
      nodes.forEach((node) => {
        node.parentId = pId
        if (node.children) {
          injectParentId(node.children, String(node.id))
        }
      })
    }
    injectParentId(tree, null)

    menuOptions.value = tree

    const selectedIds: string[] = []
    if (detail.menus) {
      detail.menus.forEach((m: any) => selectedIds.push(String(m.id)))
    }
    if (detail.permissions) {
      detail.permissions.forEach((p: any) => selectedIds.push(String(p.id)))
    }

    grantForm.menuIds = selectedIds

    const allIds: string[] = []
    const collectIds = (list: any[]) => {
      list.forEach((item) => {
        allIds.push(String(item.id))
        if (item.children) collectIds(item.children)
      })
    }
    collectIds(tree)
    defaultExpandedKeys.value = allIds

    showGrantModal.value = true
  }

  const nodeProps = ({ option }: { option: any }) => {
    return {
      onClick() {
        if (!option.isPermission) return

        const targetKey = String(option.id)
        const currentKeys = new Set(grantForm.menuIds.map((v) => String(v)))

        if (currentKeys.has(targetKey)) {
          const nextKeys = Array.from(currentKeys).filter((k) => k !== targetKey)
          handleCheckUpdate(nextKeys, [], { action: 'uncheck', node: option })
        } else {
          const nextKeys = Array.from(currentKeys)
          nextKeys.push(targetKey)
          handleCheckUpdate(nextKeys, [], { action: 'check', node: option })
        }
      },
    }
  }

  function handleCheckUpdate(
    keys: Array<string | number>,
    _options: any[],
    meta: { action: 'check' | 'uncheck'; node: any }
  ) {
    const newKeys = new Set(keys.map((v) => String(v)))
    const node = meta.node as any
    if (!node) return

    if (meta.action === 'check') {
      const checkParent = (pId: string | null) => {
        if (!pId || pId === '0' || pId === 'null') return
        newKeys.add(String(pId))
        const parentNode = findNodeById(menuOptions.value, String(pId))
        if (parentNode) {
          checkParent(parentNode.parentId)
        }
      }
      checkParent(node.parentId)

      if (!node.isPermission && node.children) {
        const queryBtn = node.children.find(
          (child: any) =>
            child.isPermission && (child.name.includes('查询') || child.name.includes('列表'))
        )
        if (queryBtn) newKeys.add(String(queryBtn.id))
      }
    } else {
      const uncheckChildren = (children: any[]) => {
        children.forEach((child) => {
          newKeys.delete(String(child.id))
          if (child.children) uncheckChildren(child.children)
        })
      }
      if (node.children) uncheckChildren(node.children)

      const uncheckParentIfEmpty = (pId: string | null) => {
        if (!pId || pId === '0' || pId === 'null') return
        const parentNode = findNodeById(menuOptions.value, String(pId))
        if (!parentNode || !parentNode.children) return

        const hasActiveChild = parentNode.children.some((child: any) =>
          newKeys.has(String(child.id))
        )
        if (!hasActiveChild) {
          newKeys.delete(String(pId))
          uncheckParentIfEmpty(parentNode.parentId)
        }
      }
      uncheckParentIfEmpty(node.parentId)
    }

    grantForm.menuIds = Array.from(newKeys)
  }

  function findNodeById(nodes: MenuOptionDTO[], id: string): MenuOptionDTO | null {
    for (const node of nodes) {
      if (String(node.id) === id) return node
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  async function handleGrantSave() {
    const menuIds: string[] = []
    const permissionIds: string[] = []

    const allNodes: MenuOptionDTO[] = []
    const flatten = (nodes: MenuOptionDTO[]) => {
      nodes.forEach((n) => {
        allNodes.push(n)
        if (n.children) flatten(n.children)
      })
    }
    flatten(menuOptions.value)

    grantForm.menuIds.forEach((id) => {
      const node = allNodes.find((n) => String(n.id) === String(id))
      if (node) {
        if (node.isPermission) {
          permissionIds.push(String(node.id))
        } else {
          menuIds.push(String(node.id))
        }
      }
    })

    await roleApi.grant(grantForm.roleId, { menuIds, permissionIds })
    message.success('操作成功')
    showGrantModal.value = false
  }

  onMounted(() => {
    if (isSuperTenant)
      getOptions('').then(
        (l) => (allTenantOptions.value = l.map((t) => ({ label: t.name, value: t.tenantId })))
      )
    loadData()
  })
</script>

<styel scoped>
</styel>
