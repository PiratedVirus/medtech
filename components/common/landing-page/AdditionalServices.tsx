import { CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
export default function AdditionalServices() {
  return (
    <section className="py-12">
      <div className="container px-4 md:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-medium text-custom-darkgreen">We care for you to be free</h2>
        </div>

        <div className="text-center mb-10">
          <h3 className="text-2xl font-medium text-[#f28a2e]">Additional Services</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Programs Card */}
          <Link href="/dashboard">
          <div className="bg-custom-mutedgreen hover:bg-custom-darkgreen rounded-3xl p-8 max-w-md mx-auto md:mx-0 transition-colors duration-300 group">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-full p-4 w-24 h-24 flex items-center justify-center transition-colors duration-300 group-hover:bg-[#E6F4EA]">
                <Image
                  src="/icons/notepad.svg"
                  alt="Programs Icon"
                  width={48}
                  height={48}
                />
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#164e2f] mb-2 transition-colors duration-300 group-hover:text-white">
              Programs
              <br />
              (recommended)
            </h3>

            <p className="text-[#164e2f] transition-colors duration-300 group-hover:text-[#F0FDF4]">
              Tailored diabetes programs
              <br />
              for effective management
              <br />
              and lasting results.
            </p>
          </div>
          </Link>

          {/* Services List */}
          <div className="space-y-6 max-w-lg mx-auto md:mx-0 pt-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-custom-darkgreen">Free Ophthalmologist visit clinic</p>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-custom-darkgreen">Personalized diet coach counselling</p>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-custom-darkgreen">Exclusive discount at hospitals associated with us</p>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-custom-darkgreen">Exclusive discounts on USG/Doppler/CTS Scans</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

