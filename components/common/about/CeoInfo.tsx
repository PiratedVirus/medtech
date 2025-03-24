import Image from "next/image"

export default function CeoInfo() {
  return (
    <section className="w-full bg-[#56a67c] text-white py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-medium">From the CEO's desk</h2>

            <p className="text-base md:text-lg leading-relaxed">
              Our sincere efforts in the field of Higher Education over the past 3 decades have paid off in the form of
              a very successful Alumni Network and a rich culture promoting Academic Excellence at care diabetics. Care
              Diabetics Institute of Medical Sciences has been established with the same vision, carrying the same
              sincerity towards Medical Education, promising the best equipment and the best environment for budding
              doctors to flourish and deliver competent professionals capable of handling challenges at the Global
              Level. The Institution is fully equipped with state of the art medical infrastructure and will be setting
              benchmarks in the field of quality medical education in the decades to come.
            </p>

            <div className="pt-4 border-t border-white/40">
              <p className="font-medium">Prof. Lorem ipsum</p>
              <p>Founder President</p>
              <p>Care Diabetics</p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center md:justify-end">
            <div className="relative">
              <Image
                src="/placeholder.svg?height=500&width=400"
                alt="CEO of Care Diabetics"
                width={400}
                height={500}
                className="object-cover"
                priority
              />

              {/* Logo Overlay */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-white text-2xl font-medium">Care Diabetics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

