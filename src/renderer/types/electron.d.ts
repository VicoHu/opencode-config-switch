import { API } from '../../preload/index'

declare global {
  interface Window {
    electronAPI: API
  }
}