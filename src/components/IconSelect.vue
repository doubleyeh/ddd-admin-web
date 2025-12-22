<template>
  <n-popover placement="bottom-start" trigger="click" scrollable style="max-height: 250px">
    <template #trigger>
      <n-input v-model:value="modelValue" placeholder="点击选择图标" readonly>
        <template #prefix>
          <n-icon v-if="modelValue" :component="renderIcon(modelValue)" />
        </template>
      </n-input>
    </template>
    <div class="grid grid-cols-6 gap-2 p-2">
      <n-button
        v-for="iconName in iconList"
        :key="iconName"
        quaternary
        style="padding: 4px"
        @click="selectIcon(iconName)"
      >
        <n-icon size="20" :component="renderIcon(iconName)" />
      </n-button>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
  import { NIcon } from 'naive-ui'
  import * as Icons from '@vicons/ionicons5'

  const props = defineProps<{ value: string | undefined }>()
  const emit = defineEmits(['update:value'])

  const modelValue = computed({
    get: () => props.value,
    set: (val) => emit('update:value', val),
  })

  const iconList = Object.keys(Icons).slice(0, 60)

  function renderIcon(iconName: string) {
    return (Icons as any)[iconName]
  }

  function selectIcon(name: string) {
    modelValue.value = name
  }
</script>
