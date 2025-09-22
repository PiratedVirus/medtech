'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProgressBar } from '@/components/common/ProgressBarUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestProgressPage() {
  const router = useRouter()
  const { startProgress, setProgress, incProgress, doneProgress } = useProgressBar()
  const [isLoading, setIsLoading] = useState(false)

  const testManualProgress = async () => {
    setIsLoading(true)
    startProgress()
    
    try {
      // Simulate different stages of progress
      await new Promise(resolve => setTimeout(resolve, 500))
      setProgress(0.3)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setProgress(0.6)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setProgress(0.9)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      doneProgress()
    } finally {
      setIsLoading(false)
    }
  }

  const testNavigation = () => {
    router.push('/dashboard')
  }

  const testReplace = () => {
    router.replace('/dashboard')
  }

  const testBack = () => {
    router.back()
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Progress Bar Testing</CardTitle>
          <CardDescription>
            Test the progress bar implementation across different scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Manual Progress Control</h3>
              <Button 
                onClick={testManualProgress} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Test Manual Progress'}
              </Button>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => startProgress()} 
                  variant="outline" 
                  className="w-full"
                >
                  Start Progress
                </Button>
                <Button 
                  onClick={() => incProgress(0.1)} 
                  variant="outline" 
                  className="w-full"
                >
                  Increment (+10%)
                </Button>
                <Button 
                  onClick={() => setProgress(0.5)} 
                  variant="outline" 
                  className="w-full"
                >
                  Set to 50%
                </Button>
                <Button 
                  onClick={() => doneProgress()} 
                  variant="outline" 
                  className="w-full"
                >
                  Complete Progress
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Navigation Testing</h3>
              <Button 
                onClick={testNavigation} 
                className="w-full"
              >
                Navigate to Dashboard (Push)
              </Button>
              <Button 
                onClick={testReplace} 
                variant="outline" 
                className="w-full"
              >
                Replace with Dashboard
              </Button>
              <Button 
                onClick={testBack} 
                variant="outline" 
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Test Scenarios</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Server-side redirects:</strong> Try accessing /admin or /dashboard without authentication</p>
              <p><strong>Client-side navigation:</strong> Use the navigation buttons above</p>
              <p><strong>Browser navigation:</strong> Use browser back/forward buttons</p>
              <p><strong>Manual control:</strong> Use the manual progress buttons</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
