'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'

/**
 * SmartProgressBar - Intelligently manages progress bar completion
 * Waits for actual page load events and React rendering cycles
 */
export default function SmartProgressBar() {
  const pathname = usePathname()
  const progressStartedRef = useRef(false)
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Mark that progress has started for this route
    progressStartedRef.current = true

    const completeProgress = () => {
      if (progressStartedRef.current) {
        NProgress.done()
        progressStartedRef.current = false
      }
    }

    const clearExistingTimeout = () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
        completionTimeoutRef.current = null
      }
    }

    // Clear any existing timeout
    clearExistingTimeout()

    // Check current page state
    const checkPageState = () => {
      if (document.readyState === 'complete') {
        // Page is fully loaded
        completionTimeoutRef.current = setTimeout(completeProgress, 100)
      } else if (document.readyState === 'interactive') {
        // DOM is ready, wait a bit more for resources
        completionTimeoutRef.current = setTimeout(completeProgress, 300)
      } else {
        // Page is still loading, wait for events
        const handleLoad = () => {
          clearExistingTimeout()
          completionTimeoutRef.current = setTimeout(completeProgress, 100)
        }
        
        const handleDOMContentLoaded = () => {
          clearExistingTimeout()
          completionTimeoutRef.current = setTimeout(completeProgress, 200)
        }

        window.addEventListener('load', handleLoad, { once: true })
        document.addEventListener('DOMContentLoaded', handleDOMContentLoaded, { once: true })

        // Safety timeout - complete after maximum 4 seconds
        completionTimeoutRef.current = setTimeout(completeProgress, 4000)

        return () => {
          window.removeEventListener('load', handleLoad)
          document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded)
          clearExistingTimeout()
        }
      }
    }

    // Wait for next React render cycle to ensure components have started rendering
    const timeoutId = setTimeout(checkPageState, 50)

    return () => {
      clearTimeout(timeoutId)
      clearExistingTimeout()
      completeProgress() // Ensure progress completes on cleanup
    }
  }, [pathname])

  // Additional safety: Complete progress when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && progressStartedRef.current) {
        // Page became visible, complete progress if it's still running
        setTimeout(() => NProgress.done(), 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}

/**
 * Hook for components to signal when they're done loading
 * Useful for pages with async data fetching
 */
export function usePageLoadSignal() {
  const signalRef = useRef<(() => void) | null>(null)

  const signalComplete = () => {
    if (signalRef.current) {
      signalRef.current()
      signalRef.current = null
    }
  }

  useEffect(() => {
    // Register this component's completion signal
    signalRef.current = () => {
      NProgress.done()
    }

    return () => {
      signalRef.current = null
    }
  }, [])

  return { signalComplete }
}
