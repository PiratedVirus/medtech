'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WorksStepProps {
  icon: React.ReactNode
  title: string
}

const WorksStep = ({ icon, title }: WorksStepProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
    </div>
  )
}

export default function HowCareDiabeticsWorks() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Steps data with icons
  const steps = [
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>, 
      title: "Consultation" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>, 
      title: "Assessment" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>, 
      title: "Care Plan" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>, 
      title: "Treatment" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, 
      title: "Follow-up" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>, 
      title: "App Support" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>, 
      title: "Diet Plan" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /><path d="M14 2v4h4" /><path d="m16 13-3.5 3.5-2-2L8 17" /></svg>, 
      title: "Exercise" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>, 
      title: "Monitoring" 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>, 
      title: "Goals" 
    },
  ]

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // Handle navigation
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? steps.length - 1 : prevIndex - 1
    )
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === steps.length - 1 ? 0 : prevIndex + 1
    )
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-green-700">How Care Diabetics Works?</h2>
        </div>
        
        {/* Mobile view - single card with navigation */}
        <div className={cn("md:hidden", isMobile ? "block" : "hidden")}>
          <div className="flex items-center justify-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="mr-4" 
              onClick={handlePrev}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 flex justify-center">
              <WorksStep 
                icon={steps[currentIndex].icon} 
                title={steps[currentIndex].title} 
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="ml-4" 
              onClick={handleNext}
              aria-label="Next step"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Pagination dots */}
          <div className="flex justify-center mt-6 gap-1">
            {steps.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  currentIndex === index ? "bg-green-600" : "bg-gray-300"
                )}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Desktop view - grid layout */}
        <div className={cn("hidden md:block", isMobile ? "hidden" : "block")}>
          <div 
            ref={sliderRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
          >
            {steps.map((step, index) => (
              <WorksStep 
                key={index} 
                icon={step.icon} 
                title={step.title} 
              />
            ))}
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-lg font-medium text-gray-700">Your Healthy Lifestyle Journey Begins</p>
        </div>
      </div>
    </section>
  )
}
