import { EventQueue } from './queue'
import type {
  ExposureOptions,
  PlatformAdapter,
  QueueSnapshot,
  TrackEvent,
  TrackerConfig
} from './types'
import { createDeviceId, isRecord, safeParse } from './utils'

const SDK_VERSION = '0.1.0'
const DEFAULT_BATCH_SIZE = 20
const DEFAULT_FLUSH_INTERVAL = 5000
const DEFAULT_MAX_QUEUE_SIZE = 500
const IDENTITY_STORAGE_KEY = '__tracker_identity__'

interface IdentityState {
  deviceId: string
  userId?: string
}

export class Tracker {
  private readonly config: Required<Omit<TrackerConfig, 'headers' | 'commonContext'>> & Pick<TrackerConfig, 'headers' | 'commonContext'>
  private readonly queue: EventQueue
  private readonly identityKey: string
  private identity: IdentityState
  private flushTimer?: ReturnType<typeof setInterval>
  private onlineDisposer?: (() => void) | void
  private autoPageDisposer?: (() => void) | void
  private autoClickDisposer?: (() => void) | void
  private flushing = false
  private pageStartedAt?: number
  private activePage?: string

  constructor(private readonly adapter: PlatformAdapter, config: TrackerConfig) {
    this.config = {
      batchSize: DEFAULT_BATCH_SIZE,
      flushInterval: DEFAULT_FLUSH_INTERVAL,
      maxQueueSize: DEFAULT_MAX_QUEUE_SIZE,
      storageKey: '__tracker_events__',
      autoTrackPage: adapter.platform === 'h5',
      autoTrackClick: adapter.platform === 'h5',
      debug: false,
      ...config
    }

    this.identityKey = `${this.config.storageKey}:${IDENTITY_STORAGE_KEY}`
    this.queue = new EventQueue(this.adapter.storage, this.config.storageKey, this.config.maxQueueSize)
    this.identity = this.loadIdentity()
    this.startFlushTimer()
    this.setupOnlineFlush()
    this.installAutoCollectors()
  }

  identify(userId: string): void {
    this.identity.userId = userId
    this.persistIdentity()
  }

  resetIdentity(): void {
    this.identity = {
      deviceId: this.identity.deviceId
    }
    this.persistIdentity()
  }

  async track(event: string, properties: Record<string, unknown> = {}): Promise<TrackEvent> {
    const trackEvent = await this.buildEvent(event, properties)
    this.queue.enqueue(trackEvent)
    this.log('track', trackEvent)

    if (this.queue.size() >= this.config.batchSize) {
      void this.flush()
    }

    return trackEvent
  }

  async pageView(page = this.getCurrentPage(), properties: Record<string, unknown> = {}): Promise<TrackEvent> {
    this.activePage = page
    this.pageStartedAt = Date.now()
    return this.track('page_view', {
      ...properties,
      page
    })
  }

  async pageLeave(page = this.activePage, properties: Record<string, unknown> = {}): Promise<TrackEvent | null> {
    if (!page || !this.pageStartedAt) {
      return null
    }

    const duration = Date.now() - this.pageStartedAt
    this.pageStartedAt = undefined
    this.activePage = undefined

    return this.track('page_leave', {
      ...properties,
      page,
      duration
    })
  }

  async flush(): Promise<void> {
    if (this.flushing) {
      return
    }

    const batch = this.queue.peek(this.config.batchSize)

    if (batch.length === 0) {
      return
    }

    this.flushing = true

    try {
      await this.adapter.post(this.config.endpoint, { events: batch }, this.config.headers)
      this.queue.remove(batch.length)
      this.log('flush success', { size: batch.length })
    } catch (error) {
      this.log('flush failed', error)
    } finally {
      this.flushing = false
    }
  }

  async observeExposure(options: ExposureOptions): Promise<() => void> {
    if (!this.adapter.createExposureObserver) {
      throw new Error(`Exposure observer is not supported on ${this.adapter.platform}`)
    }

    return this.adapter.createExposureObserver(this, options)
  }

  async trackFromDataset(
    dataset?: Record<string, unknown>,
    extraProperties: Record<string, unknown> = {}
  ): Promise<TrackEvent | null> {
    if (!dataset) {
      return null
    }

    const event = typeof dataset.track === 'string' ? dataset.track : undefined

    if (!event) {
      return null
    }

    const datasetProperties = parseDatasetProps(dataset.trackProps)
    return this.track(event, {
      ...datasetProperties,
      ...extraProperties
    })
  }

  getSnapshot(): QueueSnapshot {
    return {
      pending: this.queue.size(),
      flushing: this.flushing
    }
  }

  destroy(): void {
    if (this.activePage) {
      void this.pageLeave(this.activePage)
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }

    this.onlineDisposer?.()
    this.autoPageDisposer?.()
    this.autoClickDisposer?.()
  }

  private async buildEvent(event: string, properties: Record<string, unknown>): Promise<TrackEvent> {
    const context = await this.resolveContext()
    const page = this.getCurrentPage()

    return {
      appId: this.config.appId,
      event,
      userId: this.identity.userId,
      deviceId: this.identity.deviceId,
      page,
      timestamp: this.adapter.platform === 'h5' ? Date.now() : this.adapterTimestamp(),
      properties,
      context
    }
  }

  private async resolveContext(): Promise<Record<string, unknown>> {
    const adapterContext = (await this.adapter.getCommonContext?.()) ?? {}

    return {
      sdkVersion: SDK_VERSION,
      platform: this.adapter.platform,
      ...adapterContext,
      ...(this.config.commonContext ?? {})
    }
  }

  private setupOnlineFlush(): void {
    this.onlineDisposer = this.adapter.subscribeOnline?.(() => {
      void this.flush()
    })
  }

  private installAutoCollectors(): void {
    if (this.config.autoTrackPage && this.adapter.installAutoPageTracking) {
      this.autoPageDisposer = this.adapter.installAutoPageTracking(this)
    }

    if (this.config.autoTrackClick && this.adapter.installAutoClickTracking) {
      this.autoClickDisposer = this.adapter.installAutoClickTracking(this)
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      void this.flush()
    }, this.config.flushInterval)
  }

  private getCurrentPage(): string | undefined {
    return this.adapter.getCurrentPage?.()
  }

  private adapterTimestamp(): number {
    return Date.now()
  }

  private loadIdentity(): IdentityState {
    const cache = safeParse<IdentityState | null>(this.adapter.storage.getItem(this.identityKey), null)

    if (cache?.deviceId) {
      return cache
    }

    const identity = {
      deviceId: createDeviceId(this.adapter.platform)
    }
    this.adapter.storage.setItem(this.identityKey, JSON.stringify(identity))
    return identity
  }

  private persistIdentity(): void {
    this.adapter.storage.setItem(this.identityKey, JSON.stringify(this.identity))
  }

  private log(label: string, payload: unknown): void {
    if (!this.config.debug) {
      return
    }

    console.log(`[tracker:${this.adapter.platform}] ${label}`, payload)
  }
}

function parseDatasetProps(input: unknown): Record<string, unknown> {
  if (typeof input === 'string') {
    return safeParse<Record<string, unknown>>(input, {})
  }

  if (isRecord(input)) {
    return input
  }

  return {}
}
