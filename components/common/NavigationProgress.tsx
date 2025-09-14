'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import NProgress from 'nprogress'

export default function NavigationProgress() {
  const router = useRouter()
  const pathname = usePathname()

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

  // Complete progress when route changes (pathname changes)
  useEffect(() => {
    // Wait for the page to actually finish loading
    const completeProgress = () => {
      NProgress.done()
    }

    // Check if page is already loaded
    if (document.readyState === 'complete') {
      // Page is already loaded, complete immediately
      setTimeout(completeProgress, 50)
    } else {
      // Wait for page to finish loading
      const handleLoad = () => {
        setTimeout(completeProgress, 100)
      }
      
      const handleDOMContentLoaded = () => {
        // DOM is ready, but resources might still be loading
        setTimeout(completeProgress, 200)
      }

      // Listen for page load events
      window.addEventListener('load', handleLoad)
      document.addEventListener('DOMContentLoaded', handleDOMContentLoaded)

      // Safety timeout - complete after maximum 3 seconds regardless
      const safetyTimer = setTimeout(completeProgress, 3000)

      return () => {
        window.removeEventListener('load', handleLoad)
        document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded)
        clearTimeout(safetyTimer)
      }
    }
  }, [pathname])

  return null
}
