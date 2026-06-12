export function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function createDeviceId(prefix = 'tracker'): string {
  // 兼容不同的运行环境
  const getGlobal = () => {
    if (typeof globalThis !== 'undefined') return globalThis
    if (typeof global !== 'undefined') return global
    if (typeof window !== 'undefined') return window
    if (typeof self !== 'undefined') return self
    return {}
  }
  
  const g = getGlobal()
  const cryptoApi = g.crypto || g.msCrypto

  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}_${cryptoApi.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
