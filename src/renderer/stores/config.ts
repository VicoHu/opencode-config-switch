import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ConfigFile {
  id: string
  name: string
  description: string
  type: 'omo' | 'oc'
  createdAt: string
  updatedAt: string
}

export interface ConfigPreset {
  id: string
  name: string
  description: string
  omoConfigId: string | null
  ocConfigId: string | null
  createdAt: string
  updatedAt: string
}

export const useConfigStore = defineStore('config', () => {
  const configs = ref<ConfigFile[]>([])
  const presets = ref<ConfigPreset[]>([])
  const currentConfigs = ref<{ omo: any | null; oc: any | null }>({ omo: null, oc: null })
  const activeConfigIds = ref<{ omo: string | null; oc: string | null }>({ omo: null, oc: null })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const omoConfigs = computed(() => configs.value.filter(c => c.type === 'omo'))
  const ocConfigs = computed(() => configs.value.filter(c => c.type === 'oc'))
  const activeOmoConfig = computed(() => configs.value.find(c => c.id === activeConfigIds.value.omo))
  const activeOcConfig = computed(() => configs.value.find(c => c.id === activeConfigIds.value.oc))

  async function loadConfigs() {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.getAllConfigs()
      if (result.success && result.data) {
        configs.value = result.data
      } else {
        error.value = result.error || '加载配置失败'
      }
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function loadPresets() {
    try {
      const result = await window.electronAPI.getAllPresets()
      if (result.success && result.data) {
        presets.value = result.data
      }
    } catch (e) {
      console.error('加载预设失败:', e)
    }
  }

  async function loadCurrentConfigs() {
    try {
      const result = await window.electronAPI.getCurrentConfigs()
      if (result.success && result.data) {
        currentConfigs.value = result.data

        if (configs.value.length > 0) {
          if (result.data.omo) {
            for (const config of omoConfigs.value) {
              const contentResult = await window.electronAPI.getConfigContent(config.id)
              if (contentResult.success && contentResult.data) {
                if (JSON.stringify(contentResult.data) === JSON.stringify(result.data.omo)) {
                  activeConfigIds.value.omo = config.id
                  break
                }
              }
            }
          }

          if (result.data.oc) {
            for (const config of ocConfigs.value) {
              const contentResult = await window.electronAPI.getConfigContent(config.id)
              if (contentResult.success && contentResult.data) {
                if (JSON.stringify(contentResult.data) === JSON.stringify(result.data.oc)) {
                  activeConfigIds.value.oc = config.id
                  break
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('加载当前配置失败:', e)
    }
  }

  async function saveConfig(config: ConfigFile & { content: any }) {
    loading.value = true
    try {
      const result = await window.electronAPI.saveConfig(config)
      if (result.success) {
        await loadConfigs()
        return true
      } else {
        error.value = result.error || '保存失败'
        return false
      }
    } catch (e) {
      error.value = String(e)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteConfig(id: string) {
    try {
      const result = await window.electronAPI.deleteConfig(id)
      if (result.success) {
        await loadConfigs()
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  async function activateConfig(type: 'omo' | 'oc', configId: string) {
    try {
      const result = await window.electronAPI.activateConfig(type, configId)
      if (result.success) {
        activeConfigIds.value[type] = configId
        await loadCurrentConfigs()
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  async function importFromSystem(type: 'omo' | 'oc') {
    try {
      const result = await window.electronAPI.importFromSystem(type)
      if (result.success && result.data) {
        return result.data
      }
      return null
    } catch (e) {
      return null
    }
  }

  async function savePresets() {
    try {
      const result = await window.electronAPI.savePresets(presets.value)
      return result.success
    } catch (e) {
      return false
    }
  }

  async function applyPreset(preset: ConfigPreset) {
    try {
      const result = await window.electronAPI.applyPreset(preset)
      if (result.success) {
        if (preset.omoConfigId) {
          activeConfigIds.value.omo = preset.omoConfigId
        }
        if (preset.ocConfigId) {
          activeConfigIds.value.oc = preset.ocConfigId
        }
        await loadCurrentConfigs()
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  function createPreset(name: string, description: string, omoConfigId: string | null, ocConfigId: string | null) {
    const preset: ConfigPreset = {
      id: `preset_${Date.now()}`,
      name,
      description,
      omoConfigId,
      ocConfigId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    presets.value.push(preset)
    return savePresets()
  }

  function updatePreset(preset: ConfigPreset) {
    const index = presets.value.findIndex(p => p.id === preset.id)
    if (index !== -1) {
      presets.value[index] = { ...preset, updatedAt: new Date().toISOString() }
      return savePresets()
    }
    return false
  }

  function deletePreset(id: string) {
    const index = presets.value.findIndex(p => p.id === id)
    if (index !== -1) {
      presets.value.splice(index, 1)
      return savePresets()
    }
    return false
  }

  return {
    configs,
    presets,
    currentConfigs,
    activeConfigIds,
    loading,
    error,
    omoConfigs,
    ocConfigs,
    activeOmoConfig,
    activeOcConfig,
    loadConfigs,
    loadPresets,
    loadCurrentConfigs,
    saveConfig,
    deleteConfig,
    activateConfig,
    importFromSystem,
    createPreset,
    updatePreset,
    deletePreset,
    applyPreset
  }
})