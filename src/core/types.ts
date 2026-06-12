export type PlatformName = 'h5' | 'taro-weapp' | 'taro-alipay'

export interface TrackEvent {
  appId: string
  event: string
  userId?: string
  deviceId: string
  page?: string
  timestamp: number
  properties?: Record<string, unknown>
  context?: Record<string, unknown>
}

export interface TrackerConfig {
  appId: string
  endpoint: string
  batchSize?: number
  flushInterval?: number
  maxQueueSize?: number
  storageKey?: string
  autoTrackPage?: boolean
  autoTrackClick?: boolean
  debug?: boolean
  headers?: Record<string, string>
  commonContext?: Record<string, unknown>
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
}
