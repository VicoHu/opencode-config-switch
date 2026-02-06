<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useConfigStore, type ConfigFile } from '../stores/config'
import ConfigEditor from '../components/ConfigEditor.vue'
import ConfigPreview from '../components/ConfigPreview.vue'
import PresetManager from '../components/PresetManager.vue'

const store = useConfigStore()
const message = useMessage()
const dialog = useDialog()

const activeTab = ref<'omo' | 'oc'>('omo')
const showEditor = ref(false)
const editingConfig = ref<ConfigFile | null>(null)
const editingContent = ref<any>(null)
const showPreview = ref(false)
const previewConfig = ref<ConfigFile | null>(null)
const previewContent = ref<any>(null)
const showPresetManager = ref(false)

const currentTabConfigs = computed(() => {
  return activeTab.value === 'omo' ? store.omoConfigs : store.ocConfigs
})

function openCreateDialog() {
  editingConfig.value = null
  editingContent.value = activeTab.value === 'omo' 
    ? { opencode: { models: {}, agents: {} } }
    : { model: '', apiKey: '' }
  showEditor.value = true
}

async function openEditDialog(config: ConfigFile) {
  const result = await window.electronAPI.getConfigContent(config.id)
  if (result.success && result.data) {
    editingConfig.value = config
    editingContent.value = result.data
    showEditor.value = true
  } else {
    message.error('加载配置内容失败')
  }
}

async function openPreviewDialog(config: ConfigFile) {
  const result = await window.electronAPI.getConfigContent(config.id)
  if (result.success && result.data) {
    previewConfig.value = config
    previewContent.value = result.data
    showPreview.value = true
  } else {
    message.error('加载配置内容失败')
  }
}

async function handleSave(config: ConfigFile & { content: any }) {
  const success = await store.saveConfig(config)
  if (success) {
    message.success('保存成功')
    showEditor.value = false
  } else {
    message.error(store.error || '保存失败')
  }
}

function handleDelete(config: ConfigFile) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除配置 "${config.name}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const success = await store.deleteConfig(config.id)
      if (success) {
        message.success('删除成功')
      } else {
        message.error('删除失败')
      }
    }
  })
}

async function handleActivate(config: ConfigFile) {
  const success = await store.activateConfig(config.type, config.id)
  if (success) {
    message.success(`已激活配置: ${config.name}`)
  } else {
    message.error('激活失败')
  }
}

async function handleImport() {
  const type = activeTab.value as 'omo' | 'oc'
  const data = await store.importFromSystem(type)
  if (data) {
    dialog.success({
      title: '导入成功',
      content: '已读取当前系统配置，是否保存为新配置？',
      positiveText: '保存',
      negativeText: '取消',
      onPositiveClick: () => {
        editingConfig.value = null
        editingContent.value = data.content
        showEditor.value = true
      }
    })
  } else {
    message.error('导入失败: 配置文件不存在')
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getConfigTypeLabel(type: string) {
  return type === 'omo' ? 'Oh My OpenCode' : 'OpenCode'
}
</script>

<template>
  <div class="config-manager">
    <div class="header">
      <div class="title">
        <h1>OpenCode Config Switch</h1>
        <p class="subtitle">灵活切换 Oh My OpenCode 和 OpenCode 配置</p>
      </div>
      <div class="actions">
        <n-button type="primary" @click="showPresetManager = true">
          <template #icon>
            <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></n-icon>
          </template>
          配置组合
        </n-button>
      </div>
    </div>

    <div class="current-status">
      <n-card title="当前激活配置" size="small">
        <n-space vertical>
          <n-space>
            <n-tag v-if="store.activeOmoConfig" type="success" size="large">
              <template #icon>
                <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></n-icon>
              </template>
              Oh My OpenCode: {{ store.activeOmoConfig.name }}
            </n-tag>
            <n-tag v-else-if="store.currentConfigs.omo" type="warning" size="large">
              Oh My OpenCode: 外部配置
            </n-tag>
            <n-tag v-else type="default" size="large">Oh My OpenCode: 未配置</n-tag>
          </n-space>
          <n-space>
            <n-tag v-if="store.activeOcConfig" type="success" size="large">
              <template #icon>
                <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></n-icon>
              </template>
              OpenCode: {{ store.activeOcConfig.name }}
            </n-tag>
            <n-tag v-else-if="store.currentConfigs.oc" type="warning" size="large">
              OpenCode: 外部配置
            </n-tag>
            <n-tag v-else type="default" size="large">OpenCode: 未配置</n-tag>
          </n-space>
        </n-space>
      </n-card>
    </div>

    <n-tabs v-model:value="activeTab" type="segment" class="main-tabs">
      <n-tab-pane name="omo" tab="Oh My OpenCode">
        <div class="config-list">
          <div class="list-header">
            <n-button type="primary" @click="openCreateDialog">
              <template #icon>
                <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></n-icon>
              </template>
              新建配置
            </n-button>
            <n-button @click="handleImport">
              <template #icon>
                <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></n-icon>
              </template>
              从系统导入
            </n-button>
          </div>

          <n-spin :show="store.loading">
            <n-empty v-if="currentTabConfigs.length === 0" description="暂无配置" />
            <n-list v-else>
              <n-list-item v-for="config in currentTabConfigs" :key="config.id">
                <n-thing :title="config.name" :description="config.description">
                  <template #avatar>
                    <n-avatar :style="{ background: '#6366f1' }">
                      {{ config.name.charAt(0).toUpperCase() }}
                    </n-avatar>
                  </template>
                  <template #header-extra>
                    <n-space>
                      <n-tag size="small" :type="config.type === 'omo' ? 'info' : 'warning'">
                        {{ getConfigTypeLabel(config.type) }}
                      </n-tag>
                      <n-text depth="3" style="font-size: 12px;">
                        {{ formatDate(config.updatedAt) }}
                      </n-text>
                    </n-space>
                  </template>
                  <template #action>
                    <n-space>
                      <n-tag
                        v-if="store.activeConfigIds[activeTab] === config.id"
                        type="success"
                        size="small"
                      >
                        <template #icon>
                          <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></n-icon>
                        </template>
                        当前激活
                      </n-tag>
                      <n-button size="small" @click="openPreviewDialog(config)">
                        预览
                      </n-button>
                      <n-button size="small" type="primary" @click="handleActivate(config)">
                        激活
                      </n-button>
                      <n-button size="small" @click="openEditDialog(config)">
                        编辑
                      </n-button>
                      <n-button size="small" type="error" ghost @click="handleDelete(config)">
                        删除
                      </n-button>
                    </n-space>
                  </template>
                </n-thing>
              </n-list-item>
            </n-list>
          </n-spin>
        </div>
      </n-tab-pane>

      <n-tab-pane name="oc" tab="OpenCode">
        <div class="config-list">
          <div class="list-header">
            <n-button type="primary" @click="openCreateDialog">
              <template #icon>
                <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></n-icon>
              </template>
              新建配置
            </n-button>
            <n-button @click="handleImport">
              <template #icon>
                <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></n-icon>
              </template>
              从系统导入
            </n-button>
          </div>

          <n-spin :show="store.loading">
            <n-empty v-if="currentTabConfigs.length === 0" description="暂无配置" />
            <n-list v-else>
              <n-list-item v-for="config in currentTabConfigs" :key="config.id">
                <n-thing :title="config.name" :description="config.description">
                  <template #avatar>
                    <n-avatar :style="{ background: '#f59e0b' }">
                      {{ config.name.charAt(0).toUpperCase() }}
                    </n-avatar>
                  </template>
                  <template #header-extra>
                    <n-space>
                      <n-tag size="small" :type="config.type === 'omo' ? 'info' : 'warning'">
                        {{ getConfigTypeLabel(config.type) }}
                      </n-tag>
                      <n-text depth="3" style="font-size: 12px;">
                        {{ formatDate(config.updatedAt) }}
                      </n-text>
                    </n-space>
                  </template>
                  <template #action>
                    <n-space>
                      <n-tag
                        v-if="store.activeConfigIds[activeTab] === config.id"
                        type="success"
                        size="small"
                      >
                        <template #icon>
                          <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></n-icon>
                        </template>
                        当前激活
                      </n-tag>
                      <n-button size="small" @click="openPreviewDialog(config)">
                        预览
                      </n-button>
                      <n-button size="small" type="primary" @click="handleActivate(config)">
                        激活
                      </n-button>
                      <n-button size="small" @click="openEditDialog(config)">
                        编辑
                      </n-button>
                      <n-button size="small" type="error" ghost @click="handleDelete(config)">
                        删除
                      </n-button>
                    </n-space>
                  </template>
                </n-thing>
              </n-list-item>
            </n-list>
          </n-spin>
        </div>
      </n-tab-pane>
    </n-tabs>

    <ConfigPreview
      v-model:show="showPreview"
      :config="previewConfig"
      :content="previewContent"
    />

    <ConfigEditor
      v-model:show="showEditor"
      :config="editingConfig"
      :content="editingContent"
      :type="activeTab"
      @save="handleSave"
    />

    <PresetManager
      v-model:show="showPresetManager"
    />
  </div>
</template>

<style scoped>
.config-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f8fafc;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  margin: -20px -20px 16px -20px;
  padding-top: 32px;
  -webkit-app-region: drag;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.header .title h1 {
  color: white;
}

.header .subtitle {
  color: rgba(255, 255, 255, 0.8);
}

.header .actions {
  -webkit-app-region: no-drag;
}

.title h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  margin-top: 4px;
}

.current-status {
  margin-bottom: 16px;
}

.main-tabs {
  flex: 1;
  overflow: hidden;
}

.main-tabs :deep(.n-tabs-pane-wrapper) {
  height: calc(100% - 40px);
}

.config-list {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.list-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}
</style>