import Taro from '@tarojs/taro'

import type { PlatformAdapter, StorageAdapter } from '../types'

function createTaroStorage(): StorageAdapter {
  return {
    getItem(key) {
      const value = Taro.getStorageSync(key)
      return typeof value === 'string' ? value : value ? JSON.stringify(value) : null
    },
    setItem(key, value) {
      Taro.setStorageSync(key, value)
    },
    removeItem(key) {
      Taro.removeStorageSync(key)
    }
  }
}

function getCurrentMiniPage(): string | undefined {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const current = pages[pages.length - 1]
  return current?.route
}

async function getNetworkType(): Promise<string | undefined> {
  if (typeof Taro.getNetworkType !== 'function') {
    return undefined
  }

  try {
    const result = await Taro.getNetworkType()
    return result.networkType
  } catch {
    return undefined
  }
}

export function createTaroAdapter(platform: 'taro-weapp' | 'taro-alipay'): PlatformAdapter {
  return {
    platform,
    storage: createTaroStorage(),
    async post(url, payload, headers) {
      const response = await Taro.request({
        url,
        method: 'POST',
        data: payload,
        header: {
          'content-type': 'application/json',
          ...headers
        }
      })

      const statusCode = response.statusCode ?? 500

      if (statusCode < 200 || statusCode >= 300) {
        throw new Error(`Upload failed with status ${statusCode}`)
      }
    },
    getCurrentPage: getCurrentMiniPage,
    async getCommonContext() {
      const systemInfo = typeof Taro.getSystemInfoSync === 'function' ? Taro.getSystemInfoSync() : undefined
      const networkType = await getNetworkType()

      return {
        system: systemInfo?.system,
        model: systemInfo?.model,
        appVersion: systemInfo?.version,
        networkType
      }
    },
    subscribeOnline(callback) {
      if (typeof Taro.onNetworkStatusChange !== 'function') {
        return undefined
      }

      const handler = (result: { isConnected?: boolean }) => {
        if (result.isConnected) {
          callback()
        }
      }

      Taro.onNetworkStatusChange(handler)

      return () => {
        if (typeof Taro.offNetworkStatusChange === 'function') {
          Taro.offNetworkStatusChange(handler)
        }
      }
    }
  }
}
