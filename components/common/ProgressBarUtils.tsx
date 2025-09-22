'use client'

import { useCallback } from 'react'
import NProgress from 'nprogress'

// Custom hook for progress bar utilities
export function useProgressBar() {
  const startProgress = useCallback(() => {
    NProgress.start()
  }, [])

  const setProgress = useCallback((progress: number) => {
    NProgress.set(progress)
  }, [])

  const incProgress = useCallback((amount?: number) => {
    NProgress.inc(amount)
  }, [])

  const doneProgress = useCallback(() => {
    NProgress.done()
  }, [])

  return {
    startProgress,
    setProgress,
    incProgress,
    doneProgress,
  }
}

// Utility functions for direct use
export const progressBar = {
  start: () => NProgress.start(),
  set: (progress: number) => NProgress.set(progress),
  inc: (amount?: number) => NProgress.inc(amount),
  done: () => NProgress.done(),
}

// Higher-order component for wrapping async operations with progress
export function withProgress<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    NProgress.start()
    try {
      const result = await fn(...args)
      return result
    } finally {
      NProgress.done()
    }
  }
}
