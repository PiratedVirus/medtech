"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, X } from "lucide-react"

export default function FooterVideo() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div className="bg-muted">

    <section className="max-w-full mx-auto px-20 py-8 md:py-20 ">

      <div className="flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          Empowering Your <span className="text-[#56a67c]">Health</span>
        </h1>

        <div className="relative w-full max-w-4xl rounded-xl overflow-hidden shadow-lg mb-10">
          <Image
            src="/images/footer-video.png"
            alt="Doctor providing telehealth consultation"
            width={1200}
            height={675}
            className="w-full h-auto"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <button
              className="w-16 h-16 md:w-20 md:h-20 bg-[#d62626] rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d62626]"
              aria-label="Play video"
              onClick={openModal}
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white" fill="currentColor" />
            </button>
          </div>
        </div>

        <p className="text-lg md:text-xl text-[#2c2e38] text-center max-w-4xl">
          At our medical clinic, we believe in providing exceptional, personalized healthcare that empowers our patients
          to take an active role in their own well-being
        </p>
      </div>

      {/* Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-black rounded-lg overflow-hidden">
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center transition-colors hover:bg-opacity-30 focus:outline-none"
              onClick={closeModal}
              aria-label="Close video"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="aspect-video w-full">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Medical consultation video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
    </div>

  )
}

