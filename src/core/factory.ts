import { Tracker } from './tracker'
import type { PlatformAdapter, TrackerConfig } from './types'

export function createTracker(adapter: PlatformAdapter, config: TrackerConfig): Tracker {
  return new Tracker(adapter, config)
}
