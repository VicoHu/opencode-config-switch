<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { ConfigFile } from '../stores/config'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

interface Props {
  show: boolean
  config: ConfigFile | null
  content: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const message = useMessage()
const highlightedCode = ref('')

const formattedContent = computed(() => {
  if (!props.content) return ''
  return JSON.stringify(props.content, null, 2)
})

const configTypeLabel = computed(() => {
  if (!props.config) return ''
  return props.config.type === 'omo' ? 'Oh My OpenCode' : 'OpenCode'
})

// 监听内容变化，重新高亮
watch(() => formattedContent.value, (newContent) => {
  if (newContent) {
    highlightCode(newContent)
  }
}, { immediate: true })

function highlightCode(code: string) {
  try {
    const result = hljs.highlight(code, { language: 'json' })
    highlightedCode.value = result.value
  } catch (e) {
    highlightedCode.value = code
  }
}

function handleClose() {
  emit('update:show', false)
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedContent.value)
    message.success('已复制到剪贴板')
  } catch (e) {
    message.error('复制失败')
  }
}

function downloadConfig() {
  if (!props.config || !props.content) return
  
  const blob = new Blob([formattedContent.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.config.name}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('已开始下载')
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    title="配置预览"
    preset="card"
    style="width: 900px; max-width: 95vw;"
    :mask-closable="true"
  >
    <div v-if="config" class="preview-container">
      <div class="preview-header">
        <div class="config-info">
          <h3 class="config-name">{{ config.name }}</h3>
          <p class="config-description" v-if="config.description">{{ config.description }}</p>
          <n-space style="margin-top: 8px;">
            <n-tag :type="config.type === 'omo' ? 'info' : 'warning'" size="small">
              {{ configTypeLabel }}
            </n-tag>
            <n-text depth="3" style="font-size: 12px;">
              更新于: {{ new Date(config.updatedAt).toLocaleString('zh-CN') }}
            </n-text>
          </n-space>
        </div>
        <n-space>
          <n-button size="small" @click="copyToClipboard">
            <template #icon>
              <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></n-icon>
            </template>
            复制
          </n-button>
          <n-button size="small" type="primary" ghost @click="downloadConfig">
            <template #icon>
              <n-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></n-icon>
            </template>
            下载
          </n-button>
        </n-space>
      </div>
      
      <n-divider style="margin: 12px 0;" />
      
      <div class="code-container">
        <n-scrollbar style="max-height: 60vh;">
          <pre class="code-block"><code v-html="highlightedCode"></code></pre>
        </n-scrollbar>
      </div>
    </div>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.config-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.config-description {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #64748b;
}

.code-container {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.code-block {
  margin: 0;
  padding: 16px;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  white-space: pre;
  word-wrap: normal;
  overflow-x: auto;
}

.code-block :deep(.hljs) {
  background: transparent;
  padding: 0;
}

.code-block :deep(.hljs-property) {
  color: #9cdcfe;
}

.code-block :deep(.hljs-string) {
  color: #ce9178;
}

.code-block :deep(.hljs-number) {
  color: #b5cea8;
}

.code-block :deep(.hljs-keyword) {
  color: #569cd6;
}

.code-block :deep(.hljs-null) {
  color: #569cd6;
}

.code-block :deep(.hljs-punctuation) {
  color: #d4d4d4;
}
</style>