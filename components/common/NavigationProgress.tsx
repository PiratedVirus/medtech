'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NProgress from 'nprogress'

export default function NavigationProgress() {
  const router = useRouter()

  useEffect(() => {
    // Override the default router.push to show progress
    const originalPush = router.push
    const originalReplace = router.replace
    const originalBack = router.back
    const originalForward = router.forward

    router.push = (href: string, options?: any) => {
      NProgress.start()
      return originalPush.call(router, href, options)
    }

    router.replace = (href: string, options?: any) => {
      NProgress.start()
      return originalReplace.call(router, href, options)
    }

    router.back = () => {
      NProgress.start()
      return originalBack.call(router)
    }

    router.forward = () => {
      NProgress.start()
      return originalForward.call(router)
    }

    // Handle browser back/forward buttons
    const handlePopState = () => {
      NProgress.start()
    }

    window.addEventListener('popstate', handlePopState)

    // Cleanup
    return () => {
      router.push = originalPush
      router.replace = originalReplace
      router.back = originalBack
      router.forward = originalForward
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  return null
}
