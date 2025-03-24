import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function BestDoctorsBanner() {
  return (
    <section className="w-full">
      <div className="relative">
        {/* Doctors Image */}
        <div className="w-full h-[700px] md:h-[800px] relative">
          <Image
            src="/images/best-doc.png?height=700&width=1200"
            alt="Team of medical professionals"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Green Wave and Content Section */}
        <div className="relative mt-[-120px]">
          {" "}
          {/* Negative margin to create overlap */}
          {/* SVG Wave with background */}
          <svg
            width="1512"
            height="364"
            viewBox="0 0 1512 364"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <rect x="-5" y="124" width="1522" height="240" fill="#56A67C" />
            <path
              d="M726.901 45.6759C450.555 -13.964 123.823 20.8259 -5 45.6759V248.85C159.838 220.325 536.991 180.39 726.901 248.85C916.811 317.31 1333.1 277.375 1517.5 248.85V140.175V0C1369.11 40.0753 1003.25 105.316 726.901 45.6759Z"
              fill="#56A67C"
            />
            <rect x="805" y="294" width="100" height="30" fill="#56A67C" />
          </svg>
          {/* Content positioned on top of the SVG */}
          <div className="absolute top-[180px] left-0 w-full text-white px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium mb-6">
                Best Doctors, Across all specialties
              </h2>

              <p className="text-base md:text-lg mb-10 leading-relaxed">
                From routine check-ups and preventive screenings to the management of chronic conditions and specialized
                treatments, our clinic offers a wide range of services designed to address your unique healthcare needs.
              </p>

              <Button className="bg-[#f28a2e] hover:bg-[#e07a20] text-white rounded-full px-8 py-2 text-lg font-medium border-0">
                Join Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

