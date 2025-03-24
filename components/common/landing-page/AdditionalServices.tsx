import { CheckCircle } from "lucide-react"

export default function AdditionalServices() {
  return (
    <section className="py-12 bg-white">
      <div className="container px-4 md:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-medium text-[#56a67c]">We care for you to be free</h2>
        </div>

        <div className="text-center mb-10">
          <h3 className="text-2xl font-medium text-[#f28a2e]">Additional Services</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Programs Card */}
          <div className="bg-[#d9f4f1] rounded-3xl p-8 max-w-md mx-auto md:mx-0">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-full p-4 w-24 h-24 flex items-center justify-center">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#56a67c]"
                >
                  <path
                    d="M36 8H12C9.79086 8 8 9.79086 8 12V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V12C40 9.79086 38.2091 8 36 8Z"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 18H24"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 24H24"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 30H20"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M32 18V32L40 40"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#164e2f] mb-2">
              Programs
              <br />
              (recommended)
            </h3>

            <p className="text-[#164e2f]">
              Tailored diabetes programs
              <br />
              for effective management
              <br />
              and lasting results.
            </p>
          </div>

          {/* Services List */}
          <div className="space-y-6 max-w-lg mx-auto md:mx-0">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-[#2c2e38]">Free Ophthalmologist visit clinic</p>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-[#2c2e38]">Personalized diet coach counselling</p>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-[#2c2e38]">Exclusive discount at hospitals associated with us</p>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#56a67c] mt-1 flex-shrink-0" />
              <p className="text-xl text-[#2c2e38]">Exclusive discounts on USG/Doppler/CTS Scans</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

