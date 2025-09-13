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

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState)
      document.head.removeChild(style)
    }
  }, [])

  return <>{children}</>
}

// Utility functions for manual progress control
export const startProgress = () => NProgress.start()
export const setProgress = (progress: number) => NProgress.set(progress)
export const incProgress = (amount?: number) => NProgress.inc(amount)
export const doneProgress = () => NProgress.done()
