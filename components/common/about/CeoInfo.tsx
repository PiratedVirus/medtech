import Image from "next/image"

export default function CeoInfo() {
  return (
    <section className="w-full bg-custom-green text-white py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">From the Founder's desk</h2>

            <p className="text-base md:text-lg leading-relaxed">
              The patient in the flight suffered from DKA an acute complication of diabetes which motivated me to create a tech based platform for providing proper protocol based care to diabetics and CareDiabetics was formed.
            </p>
            <p className="text-base md:text-lg leading-relaxed">
              I have also consulted in rural PHCs and Subdistrict hospital opd for 3 months in Faridabad where I came to know about the problems faced by diabetics regrading affordability and accessibility to quality care in this part of India.
            </p>

            <div className="pt-4 border-t border-white/40">
              <p className="font-medium">Dr. Abhinav Ram Aurange</p>
              <p>Founder President</p>
              <p>CareDiabetics</p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center md:justify-end">
            <div className="relative">
              <Image
                src="/images/ceo.png"
                alt="CEO of Care Diabetics"
                width={400}
                height={500}
                className="object-cover"
                priority
              />

              {/* Logo Overlay */}
              {/* <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-white text-2xl font-medium">Care Diabetics</p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

