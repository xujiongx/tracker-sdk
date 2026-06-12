import type { StorageAdapter, TrackEvent } from './types'
import { safeParse } from './utils'

export class EventQueue {
  private readonly events: TrackEvent[]

  constructor(
    private readonly storage: StorageAdapter,
    private readonly storageKey: string,
    private readonly maxQueueSize: number
  ) {
    this.events = safeParse<TrackEvent[]>(this.storage.getItem(this.storageKey), [])
  }

  enqueue(event: TrackEvent): void {
    this.events.push(event)

    if (this.events.length > this.maxQueueSize) {
      this.events.splice(0, this.events.length - this.maxQueueSize)
    }

    this.persist()
  }

  peek(size: number): TrackEvent[] {
    return this.events.slice(0, size)
  }

  remove(count: number): void {
    this.events.splice(0, count)
    this.persist()
  }

  size(): number {
    return this.events.length
  }

  clear(): void {
    this.events.length = 0
    this.persist()
  }

  toArray(): TrackEvent[] {
    return [...this.events]
  }

  private persist(): void {
    this.storage.setItem(this.storageKey, JSON.stringify(this.events))
  }
}
