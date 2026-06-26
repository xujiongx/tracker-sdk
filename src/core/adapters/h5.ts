import type { ExposureOptions, PlatformAdapter, PostPayload, StorageAdapter, TrackerLike } from '../types'

function createMemoryStorage(): StorageAdapter {
  const memory = new Map<string, string>()

  return {
    getItem(key) {
      return memory.get(key) ?? null
    },
    setItem(key, value) {
      memory.set(key, value)
    },
    removeItem(key) {
      memory.delete(key)
    }
  }
}

function resolveStorage(): StorageAdapter {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createMemoryStorage()
  }

  return {
    getItem(key) {
      return window.localStorage.getItem(key)
    },
    setItem(key, value) {
      window.localStorage.setItem(key, value)
    },
    removeItem(key) {
      window.localStorage.removeItem(key)
    }
  }
}

function getCurrentPage(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function createH5Adapter(mock?: boolean, mockStorageKey?: string): PlatformAdapter {
  const storage = resolveStorage()
  const MOCK_STORAGE_KEY = mockStorageKey || '__tracker_mock_events__'

  const mockPost = async (url: string, payload: PostPayload, headers?: Record<string, string>) => {
    const events = payload.events

    console.log('[Tracker Mock] Post Events:', {
      url,
      headers,
      eventCount: events.length,
      events
    })

    try {
      const existingData = storage.getItem(MOCK_STORAGE_KEY)
      const existingEvents = existingData ? JSON.parse(existingData) as unknown[] : []
      const newEvents = [...existingEvents, ...events]
      storage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newEvents))

      console.log('[Tracker Mock] Events saved to storage. Total:', newEvents.length)
    } catch (error) {
      console.error('[Tracker Mock] Failed to save events:', error)
    }
  }

  return {
    platform: 'h5',
    storage,
    async post(url, payload, headers) {
      if (mock) {
        return mockPost(url, payload, headers)
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`)
      }
    },
    getCurrentPage,
    getCommonContext() {
      if (typeof navigator === 'undefined') {
        return {}
      }

      const connection = (navigator as Navigator & {
        connection?: { effectiveType?: string }
      }).connection

      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        networkType: connection?.effectiveType,
        online: navigator.onLine
      }
    },
    subscribeOnline(callback) {
      if (typeof window === 'undefined') {
        return undefined
      }

      const handler = () => callback()
      window.addEventListener('online', handler)
      return () => window.removeEventListener('online', handler)
    },
    installAutoPageTracking(tracker) {
      if (typeof window === 'undefined') {
        return () => undefined
      }

      const onRouteChange = () => {
        void tracker.pageLeave()
        void tracker.pageView(getCurrentPage())
      }

      const originalPushState = window.history.pushState.bind(window.history)
      const originalReplaceState = window.history.replaceState.bind(window.history)

      window.history.pushState = function pushState(...args) {
        originalPushState(...args)
        onRouteChange()
      }

      window.history.replaceState = function replaceState(...args) {
        originalReplaceState(...args)
        onRouteChange()
      }

      window.addEventListener('popstate', onRouteChange)
      window.addEventListener('hashchange', onRouteChange)
      window.addEventListener('beforeunload', () => {
        void tracker.pageLeave()
      })

      void tracker.pageView(getCurrentPage())

      return () => {
        window.history.pushState = originalPushState
        window.history.replaceState = originalReplaceState
        window.removeEventListener('popstate', onRouteChange)
        window.removeEventListener('hashchange', onRouteChange)
      }
    },
    installAutoClickTracking(tracker) {
      if (typeof document === 'undefined') {
        return () => undefined
      }

      const handler = (event: Event) => {
        const target = event.target as HTMLElement | null
        const element = target?.closest?.('[data-track]') as HTMLElement | null

        if (!element) {
          return
        }

        const trackProps = element.getAttribute('data-track-props')
        void tracker.trackFromDataset({
          track: element.dataset.track,
          trackProps
        })
      }

      document.addEventListener('click', handler, true)
      return () => document.removeEventListener('click', handler, true)
    },
    createExposureObserver(tracker: TrackerLike, options: ExposureOptions) {
      if (typeof window === 'undefined' || typeof document === 'undefined' || !('IntersectionObserver' in window)) {
        throw new Error('IntersectionObserver is not available in current environment')
      }

      const element = document.querySelector(options.selector)

      if (!element) {
        throw new Error(`Target element not found: ${options.selector}`)
      }

      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }

          void tracker.track(options.event, options.properties)

          if (options.once !== false) {
            observer.disconnect()
          }
        }
      })

      observer.observe(element)
      return () => observer.disconnect()
    }
  }
}
