<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4 w-full flex-nowrap">
      <n-space wrap-item class="w-4/6">
        <n-input v-model:value="query.title" placeholder="系统模块" clearable class="w-40" />
        <n-input v-model:value="query.operName" placeholder="操作人员" clearable class="w-40" />
        <div class="w-40">
          <n-select
            v-model:value="query.status"
            :options="statusOptions"
            placeholder="操作状态"
            clearable
          />
        </div>
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
      :row-key="(row: OperLog) => row.id"
      class="flex-1"
    />
  </n-card>
</template>

<script setup lang="ts">
  import { h, ref, reactive, onMounted } from 'vue'
  import {
    NButton,
    NDataTable,
    NCard,
    NInput,
    NSpace,
    NSelect,
    NTag,
    useMessage,
    type DataTableColumns,
  } from 'naive-ui'
  import * as OperLogApi from '@/api/log/oper-log'
  import type { OperLog, OperLogQuery } from '@/types/log/oper-log'
  import dayjs from 'dayjs'

  const message = useMessage()

  const tableData = ref<OperLog[]>([])
  const loading = ref(false)

  const query = reactive<OperLogQuery>({
    title: '',
    operName: '',
    status: null,
  })

  const statusOptions = [
    { label: '成功', value: 1 },
    { label: '异常', value: 0 },
  ]

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 30],
  })

  const createColumns = (): DataTableColumns<OperLog> => {
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
      { title: '系统模块', key: 'title', width: 120 },
      { title: '操作类型', key: 'businessType', width: 100 },
      { title: '请求方式', key: 'requestMethod', width: 100 },
      { title: '操作人员', key: 'operName', width: 120 },
      { title: 'IP地址', key: 'operIp', width: 120 },
      {
        title: '状态',
        key: 'status',
        width: 80,
        render(row: OperLog) {
          return h(
            NTag,
            { type: row.status === 1 ? 'success' : 'error' },
            { default: () => (row.status === 1 ? '成功' : '异常') }
          )
        },
      },
      {
        title: '操作日期',
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
      { title: '消耗时间', key: 'costTime', width: 100, render: (row) => `${row.costTime}ms` },
    ]
  }

  const columns = createColumns()

  async function fetchTableData() {
    loading.value = true
    try {
      const res = await OperLogApi.findPage(pagination.page - 1, pagination.pageSize, {
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
    query.title = null
    query.operName = null
    query.status = null
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
