'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

export function useNavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Complete progress when route changes
    NProgress.done()
  }, [pathname, searchParams])

  // Utility functions for manual control
  const startProgress = () => NProgress.start()
  const setProgress = (progress: number) => NProgress.set(progress)
  const incProgress = (amount?: number) => NProgress.inc(amount)
  const doneProgress = () => NProgress.done()

  return {
    startProgress,
    setProgress,
    incProgress,
    doneProgress,
  }
}
