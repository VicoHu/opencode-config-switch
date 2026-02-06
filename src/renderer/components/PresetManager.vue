<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useConfigStore, type ConfigPreset } from '../stores/config'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const store = useConfigStore()
const message = useMessage()
const dialog = useDialog()

const showCreateModal = ref(false)
const editingPreset = ref<ConfigPreset | null>(null)
const presetName = ref('')
const presetDescription = ref('')
const selectedOmo = ref<string | null>(null)
const selectedOc = ref<string | null>(null)

const isEdit = computed(() => editingPreset.value !== null)

function openCreateModal() {
  editingPreset.value = null
  presetName.value = ''
  presetDescription.value = ''
  selectedOmo.value = null
  selectedOc.value = null
  showCreateModal.value = true
}

function openEditModal(preset: ConfigPreset) {
  editingPreset.value = preset
  presetName.value = preset.name
  presetDescription.value = preset.description
  selectedOmo.value = preset.omoConfigId
  selectedOc.value = preset.ocConfigId
  showCreateModal.value = true
}

async function handleSavePreset() {
  if (!presetName.value.trim()) {
    message.error('请输入组合名称')
    return
  }
  
  if (!selectedOmo.value && !selectedOc.value) {
    message.error('请至少选择一个配置')
    return
  }
  
  let success: boolean
  
  if (isEdit.value && editingPreset.value) {
    const updated = {
      ...editingPreset.value,
      name: presetName.value.trim(),
      description: presetDescription.value.trim(),
      omoConfigId: selectedOmo.value,
      ocConfigId: selectedOc.value
    }
    success = await store.updatePreset(updated)
    if (success) {
      message.success('更新成功')
    }
  } else {
    success = await store.createPreset(
      presetName.value.trim(),
      presetDescription.value.trim(),
      selectedOmo.value,
      selectedOc.value
    )
    if (success) {
      message.success('创建成功')
    }
  }
  
  if (success) {
    showCreateModal.value = false
    await store.loadPresets()
  } else {
    message.error('操作失败')
  }
}

async function handleApplyPreset(preset: ConfigPreset) {
  dialog.success({
    title: '应用配置组合',
    content: `确定要应用 "${preset.name}" 吗？这将覆盖当前的系统配置。`,
    positiveText: '应用',
    negativeText: '取消',
    onPositiveClick: async () => {
      const success = await store.applyPreset(preset)
      if (success) {
        message.success('配置组合已应用')
        await store.loadCurrentConfigs()
      } else {
        message.error('应用失败')
      }
    }
  })
}

function handleDeletePreset(preset: ConfigPreset) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除组合 "${preset.name}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const success = await store.deletePreset(preset.id)
      if (success) {
        message.success('删除成功')
        await store.loadPresets()
      } else {
        message.error('删除失败')
      }
    }
  })
}

function getConfigName(type: 'omo' | 'oc', configId: string | null): string {
  if (!configId) return '未选择'
  const configs = type === 'omo' ? store.omoConfigs : store.ocConfigs
  const config = configs.find(c => c.id === configId)
  return config ? config.name : '未找到'
}

function handleClose() {
  emit('update:show', false)
}

function closeCreateModal() {
  showCreateModal.value = false
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    title="配置组合管理"
    preset="card"
    style="width: 900px; max-width: 90vw;"
  >
    <div class="preset-header">
      <n-button type="primary" @click="openCreateModal">
        <template #icon>
          <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></n-icon>
        </template>
        新建组合
      </n-button>
    </div>
    
    <n-empty v-if="store.presets.length === 0" description="暂无配置组合" />
    
    <n-list v-else>
      <n-list-item v-for="preset in store.presets" :key="preset.id">
        <n-thing :title="preset.name" :description="preset.description">
          <template #avatar>
            <n-avatar :style="{ background: '#10b981' }">
              {{ preset.name.charAt(0).toUpperCase() }}
            </n-avatar>
          </template>
          <template #header-extra>
            <n-text depth="3" style="font-size: 12px;">
              {{ new Date(preset.updatedAt).toLocaleString('zh-CN') }}
            </n-text>
          </template>
          <template #description>
            <n-space vertical size="small" style="margin-top: 8px;">
              <n-tag size="small" :type="preset.omoConfigId ? 'info' : 'default'">
                Oh My OpenCode: {{ getConfigName('omo', preset.omoConfigId) }}
              </n-tag>
              <n-tag size="small" :type="preset.ocConfigId ? 'warning' : 'default'">
                OpenCode: {{ getConfigName('oc', preset.ocConfigId) }}
              </n-tag>
            </n-space>
          </template>
          <template #action>
            <n-space>
              <n-button size="small" type="primary" @click="handleApplyPreset(preset)">
                一键应用
              </n-button>
              <n-button size="small" @click="openEditModal(preset)">
                编辑
              </n-button>
              <n-button size="small" type="error" ghost @click="handleDeletePreset(preset)">
                删除
              </n-button>
            </n-space>
          </template>
        </n-thing>
      </n-list-item>
    </n-list>
  </n-modal>
  
  <n-modal
    v-model:show="showCreateModal"
    :title="isEdit ? '编辑配置组合' : '新建配置组合'"
    preset="card"
    style="width: 600px; max-width: 90vw;"
    :mask-closable="false"
  >
    <n-form label-placement="left" label-width="100" require-mark-placement="right-hanging">
      <n-form-item label="名称" required>
        <n-input v-model:value="presetName" placeholder="输入组合名称" />
      </n-form-item>
      
      <n-form-item label="描述">
        <n-input 
          v-model:value="presetDescription" 
          type="textarea" 
          placeholder="输入组合描述（可选）"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
      
      <n-form-item label="Oh My OpenCode">
        <n-select 
          v-model:value="selectedOmo" 
          :options="store.omoConfigs.map(c => ({ label: c.name, value: c.id }))"
          placeholder="选择配置（可选）"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="OpenCode">
        <n-select 
          v-model:value="selectedOc" 
          :options="store.ocConfigs.map(c => ({ label: c.name, value: c.id }))"
          placeholder="选择配置（可选）"
          clearable
        />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="closeCreateModal">取消</n-button>
        <n-button type="primary" @click="handleSavePreset">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.preset-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}
</style>