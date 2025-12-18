<template>
  <n-card :bordered="false" class="h-full">
    <div class="flex items-center mb-4 w-full">
      <n-space>
        <n-button type="primary" @click="loadData">
          <template #icon>
            <n-icon><refresh-outline /></n-icon>
          </template>
          刷新
        </n-button>
      </n-space>
    </div>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :render-expand-content="renderExpandContent"
      :row-key="(row: OnlineUserDTO) => row.userId"
      :bordered="true"
      max-height="calc(100vh - 200px)"
    />
  </n-card>
</template>

<script setup lang="ts">
  import { ref, onMounted, h, computed } from 'vue'
  import {
    NButton,
    NSpace,
    NPopconfirm,
    useMessage,
    NIcon,
    NTag,
    NDataTable,
    type DataTableColumns,
  } from 'naive-ui'
  import { RefreshOutline } from '@vicons/ionicons5'
  import dayjs from 'dayjs'
  import * as onlineApi from '@/api/system/online-user'
  import { useUserStore } from '@/store/user'
  import type { OnlineUserDTO, SessionDetail } from '@/types/system/online-user'

  const userStore = useUserStore()
  const message = useMessage()
  const loading = ref(false)
  const tableData = ref<OnlineUserDTO[]>([])

  const columns = computed<DataTableColumns<OnlineUserDTO>>(() => {
    const cols: DataTableColumns<OnlineUserDTO> = [
      {
        type: 'expand',
        renderExpand: (row) => renderExpandContent(row),
      },
      {
        title: '用户名',
        key: 'username',
        render(row) {
          return h(NTag, { type: 'info', bordered: false }, { default: () => row.username })
        },
      },
    ]

    if (userStore.isSuperTenant()) {
      cols.push({ title: '所属租户', key: 'tenantName' })
    }

    cols.push({
      title: '在线终端数',
      key: 'sessions',
      align: 'center',
      render: (row) =>
        h(
          NTag,
          { type: 'success', round: true, bordered: false },
          { default: () => `${row.sessions.length} 个终端` }
        ),
    })

    return cols
  })

  const renderExpandContent = (row: OnlineUserDTO) => {
    return h(NDataTable, {
      columns: [
        {
          title: '序号',
          key: 'index',
          width: 60,
          align: 'center',
          render: (_, idx) => idx + 1,
        },
        { title: '登录IP', key: 'ip' },
        { title: '浏览器', key: 'browser', ellipsis: { tooltip: true } },
        {
          title: '登录时间',
          key: 'loginTime',
          render: (s: SessionDetail) => dayjs(Number(s.loginTime)).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          title: '操作',
          key: 'actions',
          width: 100,
          align: 'center',
          render: (s: SessionDetail) =>
            userStore.hasPermission('admin:online-user:kickout') &&
            h(
              NPopconfirm,
              { onPositiveClick: () => handleKickout(s.id) },
              {
                trigger: () =>
                  h(
                    NButton,
                    { size: 'small', type: 'error', ghost: true },
                    { default: () => '强退' }
                  ),
                default: () => '确定要强制该终端下线吗？',
              }
            ),
        },
      ],
      data: row.sessions,
      size: 'small',
    })
  }

  async function loadData() {
    loading.value = true
    try {
      const res: OnlineUserDTO[] = await onlineApi.list()
      tableData.value = res
    } catch (error: any) {
      message.error(error.message || '获取列表失败')
    } finally {
      loading.value = false
    }
  }

  async function handleKickout(token: string) {
    try {
      await onlineApi.kickout(token)
      message.success('已强制下线')
      loadData()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  onMounted(() => {
    loadData()
  })
</script>
