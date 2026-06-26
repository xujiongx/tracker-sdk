export type PlatformName = 'h5' | 'taro-weapp' | 'taro-alipay'

export interface TenantInfo {
  tenantId: string
  [key: string]: unknown
}

export interface TrackEvent {
  appId: string
  event: string
  userId?: string
  tenantId?: string
  deviceId: string
  page?: string
  timestamp: number
  properties?: Record<string, unknown>
  context?: Record<string, unknown>
  [key: string]: unknown
}

export interface TrackerConfig {
  appId: string
  endpoint: string
  batchSize?: number
  flushInterval?: number
  maxQueueSize?: number
  /** 上报失败时的重试次数，不含首次请求。默认 3 */
  retryCount?: number
  /** 重试间隔（毫秒），默认 4000 */
  retryInterval?: number
  storageKey?: string
  autoTrackPage?: boolean
  autoTrackClick?: boolean
  debug?: boolean
  headers?: Record<string, string>
  commonContext?: Record<string, unknown>
  mock?: boolean
  mockStorageKey?: string
  deviceId?: string
}

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface PostPayload {
  events: TrackEvent[]
}

export interface PlatformAdapter {
  platform: PlatformName
  storage: StorageAdapter
  post(url: string, payload: PostPayload, headers?: Record<string, string>): Promise<void>
  getCurrentPage?(): string | undefined
  getCommonContext?(): Promise<Record<string, unknown>> | Record<string, unknown>
  subscribeOnline?(callback: () => void): (() => void) | void
  installAutoPageTracking?(tracker: TrackerLike): () => void
  installAutoClickTracking?(tracker: TrackerLike): () => void
  createExposureObserver?(tracker: TrackerLike, options: ExposureOptions): () => void
}

export interface ExposureOptions {
  event: string
  selector: string
  once?: boolean
  properties?: Record<string, unknown>
}

export interface TrackerLike {
  track(event: string, properties?: Record<string, unknown>): Promise<TrackEvent>
  pageView(page?: string, properties?: Record<string, unknown>): Promise<TrackEvent>
  pageLeave(page?: string, properties?: Record<string, unknown>): Promise<TrackEvent | null>
  trackFromDataset(dataset?: Record<string, unknown>, extraProperties?: Record<string, unknown>): Promise<TrackEvent | null>
}

export interface QueueSnapshot {
  pending: number
  flushing: boolean
  /** 重试耗尽后自动上报已暂停，需调用 resume() 恢复 */
  paused: boolean
}
