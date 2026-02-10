<script setup lang="ts">
import { computed } from 'vue'
import { diffLines } from 'diff'

interface Props {
  show: boolean
  configName: string
  savedContent: any
  currentContent: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const diffResult = computed(() => {
  const savedStr = JSON.stringify(props.savedContent || {}, null, 2)
  const currentStr = JSON.stringify(props.currentContent || {}, null, 2)
  return diffLines(savedStr, currentStr)
})

const hasDifferences = computed(() => {
  return diffResult.value.some(part => part.added || part.removed)
})

function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    :title="`对比配置: ${configName}`"
    preset="card"
    style="width: 900px; max-width: 95vw;"
    :mask-closable="false"
    class="config-diff-modal"
  >
    <div v-if="!hasDifferences" class="no-diff">
      <n-empty description="配置相同" size="large">
        <template #icon>
          <n-icon size="48"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></n-icon>
        </template>
      </n-empty>
    </div>
    
    <div v-else class="diff-container">
      <div class="diff-header">
        <div class="diff-column-header">保存的配置</div>
        <div class="diff-column-header">当前系统配置</div>
      </div>
      
      <div class="diff-content">
        <div class="diff-side">
          <div
            v-for="(part, index) in diffResult"
            :key="`left-${index}`"
            :class="['diff-line', { 'diff-removed': part.removed }]"
          >
            <pre v-if="part.removed || (!part.added && !part.removed)">{{ part.value }}</pre>
          </div>
        </div>
        
        <div class="diff-side">
          <div
            v-for="(part, index) in diffResult"
            :key="`right-${index}`"
            :class="['diff-line', { 'diff-added': part.added }]"
          >
            <pre v-if="part.added || (!part.added && !part.removed)">{{ part.value }}</pre>
          </div>
        </div>
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
.diff-container {
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.diff-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #e2e8f0;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.diff-column-header {
  padding: 12px 16px;
  background: #f8fafc;
  font-weight: 600;
  text-align: center;
  color: #475569;
}

.diff-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #e2e8f0;
  border: 1px solid #e2e8f0;
  border-radius: 0 0 8px 8px;
  overflow: auto;
  max-height: 500px;
}

.diff-side {
  background: #ffffff;
  overflow-x: auto;
}

.diff-line {
  min-height: 20px;
  padding: 2px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre;
}

.diff-line pre {
  margin: 0;
  white-space: pre;
  word-wrap: normal;
  overflow-x: auto;
}

.diff-removed {
  background: #fee2e2;
  color: #991b1b;
}

.diff-added {
  background: #dcfce7;
  color: #166534;
}

.no-diff {
  padding: 60px 20px;
  text-align: center;
}
</style>
