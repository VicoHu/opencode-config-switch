import { contextBridge, ipcRenderer } from 'electron'

export interface API {
  // 配置管理
  getAllConfigs: () => Promise<{ success: boolean; data?: any[]; error?: string }>
  getConfigById: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>
  saveConfig: (config: any) => Promise<{ success: boolean; error?: string }>
  deleteConfig: (id: string) => Promise<{ success: boolean; error?: string }>
  getConfigContent: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>
  activateConfig: (type: 'omo' | 'oc', configId: string) => Promise<{ success: boolean; error?: string }>
  getCurrentConfigs: () => Promise<{ success: boolean; data?: { omo: any; oc: any }; error?: string }>
  importFromSystem: (type: 'omo' | 'oc') => Promise<{ success: boolean; data?: any; error?: string }>
  
  // 预设管理
  getAllPresets: () => Promise<{ success: boolean; data?: any[]; error?: string }>
  savePresets: (presets: any[]) => Promise<{ success: boolean; error?: string }>
  applyPreset: (preset: any) => Promise<{ success: boolean; error?: string }>
}

const api: API = {
  getAllConfigs: () => ipcRenderer.invoke('config:getAll'),
  getConfigById: (id: string) => ipcRenderer.invoke('config:getById', id),
  saveConfig: (config: any) => ipcRenderer.invoke('config:save', config),
  deleteConfig: (id: string) => ipcRenderer.invoke('config:delete', id),
  getConfigContent: (id: string) => ipcRenderer.invoke('config:getContent', id),
  activateConfig: (type: 'omo' | 'oc', configId: string) => 
    ipcRenderer.invoke('config:activate', { type, configId }),
  getCurrentConfigs: () => ipcRenderer.invoke('config:getCurrentConfigs'),
  importFromSystem: (type: 'omo' | 'oc') => ipcRenderer.invoke('config:importFromSystem', type),
  
  getAllPresets: () => ipcRenderer.invoke('preset:getAll'),
  savePresets: (presets: any[]) => ipcRenderer.invoke('preset:save', presets),
  applyPreset: (preset: any) => ipcRenderer.invoke('preset:apply', preset)
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type { API }