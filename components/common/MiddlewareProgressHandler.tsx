'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'

export default function MiddlewareProgressHandler() {
  const pathname = usePathname()

  useEffect(() => {
    // Check if we're coming from a middleware redirect
    // This is indicated by the presence of certain URL parameters or referrer
    const urlParams = new URLSearchParams(window.location.search)
    const isRedirect = urlParams.get('redirect') === 'true'
    const hasReferrer = document.referrer && document.referrer !== window.location.href

    // If this is a redirect (either from middleware or external), show progress briefly
    if (isRedirect || hasReferrer) {
      NProgress.start()
      
      // Complete progress after a short delay to show the redirect happened
      const timer = setTimeout(() => {
        NProgress.done()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [pathname])

  return null
}
