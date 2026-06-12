import { createTracker } from '../core'
import { createTaroAdapter } from '../core/adapters/taro'
import type { TrackEvent, TrackerConfig } from '../core'

export function createTaroAlipayTracker(config: TrackerConfig) {
  return createTracker(createTaroAdapter('taro-alipay', config.mock, config.mockStorageKey), {
    autoTrackPage: false,
    autoTrackClick: false,
    ...config
  })
}

export function createTaroPageLifecycle(
  tracker: ReturnType<typeof createTaroAlipayTracker>,
  resolvePage?: () => string | undefined
) {
  const getPage = () => resolvePage?.()

  return {
    onShow() {
      void tracker.pageView(getPage())
    },
    onHide() {
      void tracker.pageLeave(getPage())
    },
    onUnload() {
      void tracker.pageLeave(getPage())
    }
  }
}

export async function trackTaroTap(
  tracker: ReturnType<typeof createTaroAlipayTracker>,
  event: {
    currentTarget?: {
      dataset?: Record<string, unknown>
    }
  },
  extraProperties?: Record<string, unknown>
): Promise<TrackEvent | null> {
  return tracker.trackFromDataset(event.currentTarget?.dataset, extraProperties)
}

export type { ExposureOptions, QueueSnapshot, TrackEvent, TrackerConfig } from '../core'
export { Tracker } from '../core'
