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
      <div class="diff-content">
        <div
          v-for="(part, index) in diffResult"
          :key="`diff-${index}`"
          :class="['diff-line', { 
            'diff-removed': part.removed, 
            'diff-added': part.added 
          }]"
        >
          <span class="diff-marker">
            {{ part.removed ? '-' : part.added ? '+' : ' ' }}
          </span>
          <pre class="diff-text">{{ part.value }}</pre>
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
}

.diff-content {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.diff-line {
  display: flex;
  min-height: 20px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.diff-line:hover {
  filter: brightness(0.97);
}

.diff-marker {
  flex-shrink: 0;
  width: 20px;
  padding: 2px 6px;
  text-align: center;
  font-weight: 600;
  user-select: none;
}

.diff-text {
  flex: 1;
  margin: 0;
  padding: 2px 8px;
  white-space: pre;
  word-wrap: normal;
  overflow-x: auto;
}

.diff-removed {
  background: #fee2e2;
}

.diff-removed .diff-marker {
  color: #991b1b;
  background: #fecaca;
}

.diff-removed .diff-text {
  color: #991b1b;
}

.diff-added {
  background: #dcfce7;
}

.diff-added .diff-marker {
  color: #166534;
  background: #bbf7d0;
}

.diff-added .diff-text {
  color: #166534;
}

.diff-line:not(.diff-removed):not(.diff-added) .diff-marker {
  color: #94a3b8;
  background: #f8fafc;
}

.no-diff {
  padding: 60px 20px;
  text-align: center;
}
</style>
