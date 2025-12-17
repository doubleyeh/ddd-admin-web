<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4 w-full flex-nowrap">
      <n-space wrap-item class="w-4/6">
        <div class="w-40">
          <n-select
            v-if="isSuperTenant"
            v-model:value="query.tenantId"
            :options="allTenantOptions"
            placeholder="选择租户"
            clearable
            filterable
          />
        </div>
        <n-input v-model:value="query.username" placeholder="用户名" clearable class="w-28" />
        <n-input v-model:value="query.nickname" placeholder="昵称" clearable class="w-28" />
        <div class="w-28">
          <n-select
            v-model:value="query.state"
            :options="stateOptions"
            placeholder="用户状态"
            clearable
          />
        </div>
      </n-space>

      <n-space class="ml-4">
        <n-button type="primary" @click="handleSearch">查询</n-button>
        <n-button @click="handleReset">重置</n-button>
        <n-button
          v-if="userStore.hasPermission('user:create')"
          type="success"
          class="ml-auto"
          @click="handleCreate"
        >
          新增用户
        </n-button>
      </n-space>
    </div>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      remote
      @update:page="handlePageChange"
      @update:pageSize="handlePageSizeChange"
      :row-key="(row: UserDTO) => row.id"
      class="flex-1"
    />

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="dialog"
      :title="isEdit ? '编辑用户' : '新增用户'"
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
        <n-form-item v-if="isSuperTenant && !isEdit" label="所属租户" path="tenantId">
          <n-select
            v-model:value="formModel.tenantId"
            :options="allTenantOptions"
            placeholder="请选择所属租户"
            filterable
          />
        </n-form-item>
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formModel.username" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="昵称" path="nickname">
          <n-input v-model:value="formModel.nickname" />
        </n-form-item>
        <n-form-item label="用户状态" path="state">
          <n-select v-model:value="formModel.state" :options="stateOptions" />
        </n-form-item>
        <n-form-item v-if="!isEdit" label="密码" path="password">
          <n-input type="password" v-model:value="formModel.password" />
        </n-form-item>
      </n-form>
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
    NSelect,
    NSwitch,
    useMessage,
    type DataTableColumns,
    type FormInst,
  } from 'naive-ui'
  import * as UserApi from '@/api/system/user'
  import { getOptions } from '@/api/system/tenant'
  import type { UserDTO, UserPostDTO, UserPutDTO, UserQuery } from '@/types/system/user'
  import { useUserStore } from '@/store/user'
  import dayjs from 'dayjs'

  const userStore = useUserStore()
  const message = useMessage()

  const isSuperTenant = computed(() => {
    return userStore.isSuperTenant
  })

  const allTenantOptions = ref<{ label: string; value: string }[]>([])

  const tableData = ref<UserDTO[]>([])
  const loading = ref(false)
  const showModal = ref(false)
  const isEdit = ref(false)
  const formRef = ref<FormInst | null>(null)

  const query = reactive<UserQuery>({
    username: '',
    nickname: '',
    state: null,
    tenantId: null,
  })

  const stateOptions = [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]

  const initialForm: UserPostDTO = {
    username: '',
    nickname: '',
    state: 1,
    password: '',
    tenantId: userStore.tenantId,
  }
  const formModel = ref<UserPostDTO | UserPutDTO>({ ...initialForm })

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 30],
  })

  const formRules = {
    tenantId: [
      {
        required: true,
        validator: (value: string) => {
          if (isSuperTenant && !isEdit.value && !value) {
            return new Error('请选择所属租户')
          }
          return true
        },
        trigger: ['blur', 'change'],
      },
    ],
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 4, max: 50, message: '用户名长度需在4到50个字符之间', trigger: 'blur' },
    ],
    nickname: [{ max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }],
    state: [{ required: true, message: '请选择用户状态', trigger: 'change' }],
    password: [
      { required: true, message: '请输入密码', trigger: ['input', 'blur'] },
      { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
    ],
  }

  const createColumns = (): DataTableColumns<UserDTO> => {
    return [
      {
        title: '序号',
        key: 'index',
        width: 60,
        align: 'center',
        render(_, rowIndex: number) {
          const rowNum = (pagination.page - 1) * pagination.pageSize + rowIndex + 1
          return h('span', rowNum)
        },
      },
      ...(isSuperTenant ? [{ title: '所属租户', key: 'tenantName' }] : []),
      { title: '用户名', key: 'username' },
      { title: '昵称', key: 'nickname' },
      {
        title: '用户状态',
        key: 'state',
        render(row: UserDTO) {
          return h(NSwitch, {
            value: row.state === 1,
            disabled: !userStore.hasPermission('user:update'),
            'onUpdate:value': (value: boolean) => {
              handleUpdateState(row.id, value ? 1 : 0)
            },
          })
        },
      },
      {
        title: '创建时间',
        key: 'createTime',
        width: 120,
        render(row) {
          const dateTimeStr = row.createTime

          if (dateTimeStr) {
            return dayjs(dateTimeStr).format('YYYY-MM-DD')
          }
          return ''
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 300,
        render(row) {
          return h(
            NSpace,
            {},
            {
              default: () =>
                [
                  userStore.hasPermission('user:update') &&
                    h(
                      NButton,
                      {
                        size: 'small',
                        onClick: () => handleEdit(row),
                      },
                      { default: () => '编辑' }
                    ),
                  userStore.hasPermission('user:update') &&
                    h(
                      NPopconfirm,
                      {
                        onPositiveClick: () => handleResetPassword(row.id),
                        positiveText: '确认',
                        negativeText: '取消',
                      },
                      {
                        trigger: () =>
                          h(
                            NButton,
                            {
                              size: 'small',
                              type: 'warning',
                            },
                            { default: () => '重置密码' }
                          ),
                        default: () => '确认重置该用户密码吗？',
                      }
                    ),
                  userStore.hasPermission('user:delete') &&
                    h(
                      NPopconfirm,
                      {
                        onPositiveClick: () => handleDelete(row.id),
                        positiveText: '确认',
                        negativeText: '取消',
                      },
                      {
                        trigger: () =>
                          h(
                            NButton,
                            {
                              size: 'small',
                              type: 'error',
                            },
                            { default: () => '删除' }
                          ),
                        default: () => '确认删除该用户吗？',
                      }
                    ),
                ].filter(Boolean),
            }
          )
        },
      },
    ]
  }

  const columns = createColumns()

  async function handleUpdateState(id: string, state: 0 | 1) {
    const index = tableData.value.findIndex((item: UserDTO) => item.id === id)
    const row = tableData.value[index]
    if (row) {
      row.state = state
    }

    try {
      await UserApi.updateState(id, state)
      message.success(`${state === 1 ? '启用' : '禁用'}成功`)
    } catch (error: any) {
      message.error(error.message || `${state === 1 ? '启用' : '禁用'}失败`)
      if (index > -1 && tableData.value[index]) {
        tableData.value[index].state = state === 1 ? 0 : 1
      }
    }
  }

  async function fetchTenantOptions() {
    try {
      const tenantList = await getOptions('')
      allTenantOptions.value = [...tenantList.map((t) => ({ label: t.name, value: t.tenantId }))]
    } catch (error: any) {
      message.error(error.message || '获取租户列表失败')
    } finally {
    }
  }

  async function fetchTableData() {
    loading.value = true
    try {
      const res = await UserApi.findPage(pagination.page - 1, pagination.pageSize, {
        ...query,
      })

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
    query.username = ''
    query.nickname = ''
    query.state = null
    query.tenantId = null
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

  function handleEdit(row: UserDTO) {
    isEdit.value = true
    const { id, username, nickname, state } = row
    formModel.value = { id, username, nickname, state, password: '' }
    showModal.value = true
  }

  async function handleSave() {
    await formRef.value?.validate()

    const data: UserPostDTO | UserPutDTO = { ...formModel.value }
    let res: UserDTO | undefined

    try {
      if (isEdit.value && data.id) {
        res = await UserApi.update(data.id, data as UserPutDTO)
      } else {
        res = await UserApi.create(data as UserPostDTO)
      }
    } catch (error: any) {
      message.error(error.message || (isEdit.value ? '修改失败' : '新增失败'))
      return false
    }

    message.success(isEdit.value ? '修改成功' : '新增成功')

    showModal.value = false
    fetchTableData()
    return true
  }

  async function handleResetPassword(id: string) {
    try {
      const newPassword = await UserApi.resetPassword(id)
      message.success(`重置成功，新密码为: ${newPassword}`)
    } catch (error: any) {
      message.error(error.message || '重置密码失败')
    }
  }

  async function handleDelete(id: string) {
    try {
      await UserApi.deleteById(id)
      message.success('删除成功')
      fetchTableData()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  onMounted(() => {
    if (isSuperTenant) {
      fetchTenantOptions()
    }
    fetchTableData()
  })
</script>

<style scoped>
  .h-full {
    height: 100%;
  }
</style>
