<script setup lang="ts">
import { onMounted } from 'vue'
import { useConfigStore } from './stores/config'
import ConfigManager from './views/ConfigManager.vue'

const store = useConfigStore()

onMounted(async () => {
  await store.loadConfigs()
  store.loadPresets()
  await store.loadCurrentConfigs()
})
</script>

<template>
  <n-config-provider :theme-overrides="{
    common: {
      primaryColor: '#6366f1',
      primaryColorHover: '#818cf8',
      primaryColorPressed: '#4f46e5'
    }
  }">
    <n-message-provider>
      <n-dialog-provider>
        <ConfigManager />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>