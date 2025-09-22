'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  speed: 500,
  minimum: 0.1,
  trickleSpeed: 200,
})

export default function ProgressProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Custom CSS for better styling
    const style = document.createElement('style')
    style.textContent = `
      #nprogress {
        pointer-events: none;
      }
      
      #nprogress .bar {
        background: hsl(var(--secondary));
        position: fixed;
        z-index: 1031;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        box-shadow: 0 0 10px hsl(var(--secondary)), 0 0 5px hsl(var(--secondary));
      }
      
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px hsl(var(--secondary)), 0 0 5px hsl(var(--secondary));
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }
      
      /* Dark mode support */
      .dark #nprogress .bar {
        background: hsl(var(--secondary));
        box-shadow: 0 0 10px hsl(var(--secondary)), 0 0 5px hsl(var(--secondary));
      }
      
      .dark #nprogress .peg {
        box-shadow: 0 0 10px hsl(var(--secondary)), 0 0 5px hsl(var(--secondary));
      }
    `
    document.head.appendChild(style)

    // Handle browser back/forward navigation
    const handlePopState = () => {
      NProgress.start()
      setTimeout(() => NProgress.done(), 100)
    }

    window.addEventListener('popstate', handlePopState)

    // Global safety mechanism: Ensure progress bar completes after page load
    const handleLoad = () => {
      setTimeout(() => NProgress.done(), 200)
    }

    const handleBeforeUnload = () => {
      NProgress.done()
    }

    // Listen for page load events
    window.addEventListener('load', handleLoad)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Additional safety: Complete progress after DOM is ready
    if (document.readyState === 'complete') {
      setTimeout(() => NProgress.done(), 100)
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => NProgress.done(), 100)
      })
    }

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('load', handleLoad)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.head.removeChild(style)
      // Ensure progress is completed on cleanup
      NProgress.done()
    }
  }, [])

  return <>{children}</>
}

// Utility functions for manual progress control
export const startProgress = () => NProgress.start()
export const setProgress = (progress: number) => NProgress.set(progress)
export const incProgress = (amount?: number) => NProgress.inc(amount)
export const doneProgress = () => NProgress.done()
