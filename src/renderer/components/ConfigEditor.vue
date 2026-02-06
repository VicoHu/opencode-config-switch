<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { ConfigFile } from '../stores/config'

interface Props {
  show: boolean
  config: ConfigFile | null
  content: any
  type: 'omo' | 'oc'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  'save': [config: ConfigFile & { content: any }]
}>()

const message = useMessage()

const name = ref('')
const description = ref('')
const jsonContent = ref('')
const jsonError = ref('')

const isEdit = computed(() => props.config !== null)
const title = computed(() => isEdit.value ? '编辑配置' : '新建配置')

watch(() => props.show, (visible) => {
  if (visible) {
    if (props.config) {
      name.value = props.config.name
      description.value = props.config.description
    } else {
      name.value = ''
      description.value = ''
    }
    jsonContent.value = JSON.stringify(props.content || {}, null, 2)
  }
})

function validateJson(): boolean {
  try {
    JSON.parse(jsonContent.value)
    jsonError.value = ''
    return true
  } catch (e) {
    jsonError.value = 'JSON 格式错误: ' + (e as Error).message
    return false
  }
}

function handleSave() {
  if (!name.value.trim()) {
    message.error('请输入配置名称')
    return
  }
  
  if (!validateJson()) {
    message.error('JSON 格式错误')
    return
  }
  
  const config: ConfigFile & { content: any } = {
    id: props.config?.id || `config_${Date.now()}`,
    name: name.value.trim(),
    description: description.value.trim(),
    type: props.type,
    createdAt: props.config?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: JSON.parse(jsonContent.value)
  }
  
  emit('save', config)
}

function handleClose() {
  emit('update:show', false)
}

function formatJson() {
  try {
    const parsed = JSON.parse(jsonContent.value)
    jsonContent.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = '无法格式化: ' + (e as Error).message
  }
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    :title="title"
    preset="card"
    style="width: 800px; max-width: 90vw;"
    :mask-closable="false"
  >
    <n-form label-placement="left" label-width="80" require-mark-placement="right-hanging">
      <n-form-item label="名称" required>
        <n-input v-model:value="name" placeholder="输入配置名称" />
      </n-form-item>
      
      <n-form-item label="描述">
        <n-input 
          v-model:value="description" 
          type="textarea" 
          placeholder="输入配置描述（可选）"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
      
      <n-form-item label="配置内容" required :feedback="jsonError" :validation-status="jsonError ? 'error' : undefined">
        <template #label-extra>
          <n-button text size="tiny" @click="formatJson">
            格式化 JSON
          </n-button>
        </template>
        <n-input 
          v-model:value="jsonContent" 
          type="textarea" 
          placeholder="输入 JSON 配置内容"
          :autosize="{ minRows: 15, maxRows: 30 }"
          :status="jsonError ? 'error' : undefined"
          @blur="validateJson"
        />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSave">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>