"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useKeenSlider } from "keen-slider/react"
import "keen-slider/keen-slider.min.css"
import { Arrow } from "@radix-ui/react-dropdown-menu"
import ArrowButton from "@/components/ui/custom/cd-arrow-button"

const slides = [
  {
    type: "image",
    title: "Curated Medical support",
    src: "/images/overview-col.png",
    gradient: "from-blue-900/80",
    buttonText: "Explore our Docotrs",
  },
  {
    type: "video",
    title: "Innovative Digital Solutions",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    gradient: "from-emerald-900/80",
    buttonText: "Watch Full Video",
  },
  {
    type: "image",
    title: "Cutting-Edge Technology",
    src: "/images/bp-body-bmi.png",
    gradient: "from-purple-900/80",
    buttonText: "Discover More",
  },
]

export default function MedicalCarousel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel)
    },
    created(slider) {
      // Autoplay loop
      setInterval(() => {
        slider.next()
      }, 10000)
    },
  })

  useEffect(() => {
    if (slides[currentSlide].type === "video" && videoRef.current) {
      videoRef.current.play().catch((e) => console.error("Video failed to play", e))
    }
  }, [currentSlide])

  return (
    <div className="flex flex-col items-center justify-center">
      <div ref={sliderRef} className="keen-slider w-[250px]">
        {slides.map((slide, idx) => (
          <div className="keen-slider__slide" key={idx}>
            <Card className="border-0 overflow-hidden rounded-xl shadow-lg">
              <CardContent className="p-0 relative h-[398px]">
                {slide.type === "image" ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${slide.src})` }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  >
                    <source src={slide.src} type="video/mp4" />
                  </video>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradient} to-transparent`} />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-3">{slide.title}</h3>
                  <Button
                    variant="outline"
                    className="w-fit border-white rounded-full text-black hover:bg-white/20 hover:text-white transition-all"
                  >
                    {slide.buttonText} <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  {/* <ArrowButton size="small" buttonText={slide.buttonText} href="#" /> */}
                  
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Indicators */}

    </div>
  )
}