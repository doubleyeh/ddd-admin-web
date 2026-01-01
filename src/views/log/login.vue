<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4 w-full flex-nowrap">
      <n-space wrap-item class="w-4/6">
        <n-input v-model:value="query.username" placeholder="用户名" clearable class="w-40" />
        <div class="w-40">
          <n-select
            v-model:value="query.status"
            :options="statusOptions"
            placeholder="登录状态"
            clearable
          />
        </div>
        <n-date-picker
          v-model:formatted-value="query.startTime"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="datetime"
          class="w-52"
          clearable
        />
        <n-date-picker
          v-model:formatted-value="query.endTime"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="datetime"
          class="w-52"
          clearable
        />
      </n-space>

      <n-space class="ml-4">
        <n-button type="primary" @click="handleSearch">查询</n-button>
        <n-button @click="handleReset">重置</n-button>
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
      :row-key="(row: LoginLogDTO) => row.id"
      class="flex-1"
    />
  </n-card>
</template>

<script setup lang="ts">
  import { h, ref, reactive, onMounted, computed } from 'vue'
  import {
    NButton,
    NDataTable,
    NCard,
    NInput,
    NSpace,
    NSelect,
    NTag,
    NDatePicker,
    useMessage,
    type DataTableColumns,
  } from 'naive-ui'
  import * as LoginLogApi from '@/api/log/login-log'
  import type { LoginLogDTO, LoginLogQuery } from '@/types/log/login-log'
  import { useUserStore } from '@/store/user'
  import dayjs from 'dayjs'

  const userStore = useUserStore()
  const message = useMessage()

  const isSuperTenant = computed(() => {
    return userStore.isSuperTenant
  })

  const tableData = ref<LoginLogDTO[]>([])
  const loading = ref(false)

  const query = reactive<LoginLogQuery>({
    username: '',
    status: null,
    startTime: null,
    endTime: null,
  })

  const statusOptions = [
    { label: '成功', value: 'SUCCESS' },
    { label: '失败', value: 'FAILURE' },
  ]

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 30],
  })

  const createColumns = (): DataTableColumns<LoginLogDTO> => {
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
      ...(isSuperTenant
        ? [
            {
              title: '所属租户',
              key: 'tenant',
              width: 150,
              render(row: LoginLogDTO) {
                return row.tenantName || row.tenantId
              },
            },
          ]
        : []),
      { title: '用户名', key: 'username', width: 120 },
      { title: 'IP地址', key: 'ipAddress', width: 120 },
      {
        title: '状态',
        key: 'status',
        width: 80,
        render(row: LoginLogDTO) {
          return h(
            NTag,
            { type: row.status === 'SUCCESS' ? 'success' : 'error' },
            { default: () => (row.status === 'SUCCESS' ? '成功' : '失败') }
          )
        },
      },
      { title: '消息', key: 'message' },
      {
        title: '登录时间',
        key: 'createTime',
        width: 180,
        render(row) {
          const dateTimeStr = row.createTime
          if (dateTimeStr) {
            return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm:ss')
          }
          return ''
        },
      },
    ]
  }

  const columns = createColumns()

  async function fetchTableData() {
    loading.value = true
    try {
      const res = await LoginLogApi.findPage(pagination.page - 1, pagination.pageSize, {
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
    query.status = null
    query.startTime = null
    query.endTime = null
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

  onMounted(() => {
    fetchTableData()
  })
</script>

<style scoped>
  .h-full {
    height: 100%;
  }
</style>
