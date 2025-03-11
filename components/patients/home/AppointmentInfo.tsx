import Image from "next/image"
import { ChevronRight } from "lucide-react"

export default function AppointmentInfo() {
  return (
    <section className="max-w-full mx-auto px-20 py-8">
      <div className="space-y-4 mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2c2e38]">
          Book an appointment for an in-clinic consultation
        </h2>
        <p className="text-xl text-[#696969]">Find experienced doctors across all specialties</p>
      </div>

      <div className="relative">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Diabetes Checkup Card */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            <div className="h-64 overflow-hidden">
              <Image
                src="/images/diabetes-checkup.png"
                alt="Doctor checking glucose levels with patient"
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-xl font-bold text-[#2c2e38]">Diabetes checkup</h3>
              <p className="text-[#696969]">
                Receive expert advice on managing blood sugar, maintaining a healthy weight.
              </p>
            </div>
          </div>

          {/* Dietician/Nutrition Card */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            <div className="h-64 overflow-hidden">
              <Image
                src="/images/nutrition.png"
                alt="Nutritionist with healthy food"
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-xl font-bold text-[#2c2e38]">Dietician/Nutrition</h3>
              <p className="text-[#696969]">Get guidance on eating right, weight management and sports nutrition.</p>
            </div>
          </div>

          {/* BP, Body composition & BMI Card */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            <div className="h-64 overflow-hidden">
              <Image
                src="/images/bp-body-bmi.png"
                alt="Healthy food and medical equipment"
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-xl font-bold text-[#2c2e38]">BP, Body composition & BMI</h3>
              <p className="text-[#696969]">Receive expert advice on managing blood sugar, and staying active.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

