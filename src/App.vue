<template>
  <n-config-provider
    :theme="themeStore.isDark ? darkTheme : null"
    :theme-overrides="themeStore.isDark ? darkThemeOverrides : lightThemeOverrides"
  >
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
  import { useThemeStore } from './store/theme'
  import { darkTheme, NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
  import { lightThemeOverrides, darkThemeOverrides } from './utils/themeOverrides'

  const themeStore = useThemeStore()
  themeStore.toggleDark(themeStore.isDark)
</script>
