import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { readFile, writeFile, copyFile, mkdir, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'

const CONFIG_DIR = join(homedir(), '.config', 'opencode')
const OMO_CONFIG_FILE = join(CONFIG_DIR, 'oh-my-opencode.json')
const OC_CONFIG_FILE = join(CONFIG_DIR, 'opencode.json')
const APP_CONFIG_DIR = join(app.getPath('userData'), 'configs')
const BACKUP_DIR = join(app.getPath('userData'), 'backups')

// 类型定义
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

let mainWindow: BrowserWindow | null = null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  // 等待窗口准备好再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 确保配置目录存在
async function ensureDirectories() {
  try {
    await mkdir(APP_CONFIG_DIR, { recursive: true })
    await mkdir(CONFIG_DIR, { recursive: true })
    await mkdir(BACKUP_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create directories:', error)
  }
}

// IPC 处理器
ipcMain.handle('config:getAll', async () => {
  try {
    const configs: ConfigFile[] = []
    const files = await readdir(APP_CONFIG_DIR).catch(() => [])
    
    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('preset')) {
        const configPath = join(APP_CONFIG_DIR, file)
        const content = await readFile(configPath, 'utf-8')
        const config = JSON.parse(content)
        configs.push(config)
      }
    }
    
    return { success: true, data: configs }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('config:getById', async (_, id: string) => {
  try {
    const configPath = join(APP_CONFIG_DIR, `${id}.json`)
    const content = await readFile(configPath, 'utf-8')
    return { success: true, data: JSON.parse(content) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('config:save', async (_, config: ConfigFile & { content: any }) => {
  try {
    const { content, ...configMeta } = config
    const configPath = join(APP_CONFIG_DIR, `${config.id}.json`)
    
    await writeFile(configPath, JSON.stringify(configMeta, null, 2))
    
    // 同时保存配置内容
    const contentPath = join(APP_CONFIG_DIR, `${config.id}.content.json`)
    await writeFile(contentPath, JSON.stringify(content, null, 2))
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('config:delete', async (_, id: string) => {
  try {
    const configPath = join(APP_CONFIG_DIR, `${id}.json`)
    const contentPath = join(APP_CONFIG_DIR, `${id}.content.json`)
    
    await unlink(configPath).catch(() => {})
    await unlink(contentPath).catch(() => {})
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('config:getContent', async (_, id: string) => {
  try {
    const contentPath = join(APP_CONFIG_DIR, `${id}.content.json`)
    const content = await readFile(contentPath, 'utf-8')
    return { success: true, data: JSON.parse(content) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('config:activate', async (_, { type, configId }: { type: 'omo' | 'oc', configId: string }) => {
  try {
    const contentPath = join(APP_CONFIG_DIR, `${configId}.content.json`)
    const targetPath = type === 'omo' ? OMO_CONFIG_FILE : OC_CONFIG_FILE
    const filename = type === 'omo' ? 'oh-my-opencode.json' : 'opencode.json'

    const backupPath = join(BACKUP_DIR, `${filename}.backup.${Date.now()}`)
    if (existsSync(targetPath)) {
      await copyFile(targetPath, backupPath)
    }

    // 复制新配置
    await copyFile(contentPath, targetPath)

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('config:getCurrentConfigs', async () => {
  try {
    const result: { omo: any | null; oc: any | null } = { omo: null, oc: null }
    
    if (existsSync(OMO_CONFIG_FILE)) {
      result.omo = JSON.parse(await readFile(OMO_CONFIG_FILE, 'utf-8'))
    }
    if (existsSync(OC_CONFIG_FILE)) {
      result.oc = JSON.parse(await readFile(OC_CONFIG_FILE, 'utf-8'))
    }
    
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('config:importFromSystem', async (_, type: 'omo' | 'oc') => {
  try {
    const targetPath = type === 'omo' ? OMO_CONFIG_FILE : OC_CONFIG_FILE
    
    if (!existsSync(targetPath)) {
      return { success: false, error: '配置文件不存在' }
    }
    
    const content = JSON.parse(await readFile(targetPath, 'utf-8'))
    
    return { 
      success: true, 
      data: {
        content,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 预设管理
ipcMain.handle('preset:getAll', async () => {
  try {
    const presetPath = join(APP_CONFIG_DIR, 'presets.json')
    if (!existsSync(presetPath)) {
      return { success: true, data: [] }
    }
    const content = await readFile(presetPath, 'utf-8')
    return { success: true, data: JSON.parse(content) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('preset:save', async (_, presets: ConfigPreset[]) => {
  try {
    const presetPath = join(APP_CONFIG_DIR, 'presets.json')
    await writeFile(presetPath, JSON.stringify(presets, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('preset:apply', async (_, preset: ConfigPreset) => {
  try {
    if (preset.omoConfigId) {
      const omoPath = join(APP_CONFIG_DIR, `${preset.omoConfigId}.content.json`)
      const backupPath = join(BACKUP_DIR, `oh-my-opencode.json.backup.${Date.now()}`)
      if (existsSync(OMO_CONFIG_FILE)) {
        await copyFile(OMO_CONFIG_FILE, backupPath)
      }
      await copyFile(omoPath, OMO_CONFIG_FILE)
    }
    if (preset.ocConfigId) {
      const ocPath = join(APP_CONFIG_DIR, `${preset.ocConfigId}.content.json`)
      const backupPath = join(BACKUP_DIR, `opencode.json.backup.${Date.now()}`)
      if (existsSync(OC_CONFIG_FILE)) {
        await copyFile(OC_CONFIG_FILE, backupPath)
      }
      await copyFile(ocPath, OC_CONFIG_FILE)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

app.whenReady().then(async () => {
  await ensureDirectories()
  await createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})