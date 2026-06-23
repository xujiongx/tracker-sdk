import { createTracker } from '../core'
import { createH5Adapter } from '../core/adapters/h5'
import type { TrackerConfig } from '../core'

export function createH5Tracker(config: TrackerConfig) {
  return createTracker(createH5Adapter(config.mock, config.mockStorageKey), config)
}

export type { ExposureOptions, QueueSnapshot, TrackEvent, TrackerConfig } from '../core'
export { Tracker } from '../core'
