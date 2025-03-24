import Image from "next/image"

export default function DoctorsAndConsultationsGrid() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-12 grid-rows-2 h-[500px] md:h-[600px]">
        {/* Top Left - Doctor Consultation Image */}
        <div className="col-span-4 row-span-1 relative overflow-hidden">
          <Image
            src="/placeholder.svg?height=300&width=400"
            alt="Doctor consultation with patient"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Top Center - Top Doctors */}
        <div className="col-span-4 row-span-1 bg-[#164e2f] flex flex-col items-center justify-center text-white p-6 text-center">
          <h2 className="text-2xl md:text-3xl font-medium mb-3">Top Doctors</h2>
          <p className="text-sm md:text-base">Best Doctor's from AIIMS & Other Institutions</p>
        </div>

        {/* Right Side - Telehealth Doctor (spans both rows) */}
        <div className="col-span-4 row-span-2 relative overflow-hidden">
          <Image
            src="/placeholder.svg?height=600&width=400"
            alt="Doctor providing telehealth consultation"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Bottom Left - Video Consultations */}
        <div className="col-span-4 row-span-1 bg-[#56a67c] flex flex-col items-center justify-center text-white p-6 text-center">
          <h2 className="text-2xl md:text-3xl font-medium mb-3">Video Consultations</h2>
          <p className="text-sm md:text-base">Video Consults with top doctors 24x7</p>
        </div>

        {/* Bottom Center - Female Doctor with Laptop */}
        <div className="col-span-4 row-span-1 relative overflow-hidden">
          <Image
            src="/placeholder.svg?height=300&width=400"
            alt="Female doctor with telehealth laptop"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}

