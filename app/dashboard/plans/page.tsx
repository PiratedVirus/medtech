export default function PricingPage() {
    return (
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto gap-4 p-4">
        {/* Basic Plan */}
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col items-center flex-grow">
            <h2 className="text-3xl font-medium text-amber-400 mb-4">Basic</h2>
            <div className="space-y-4 w-full">
              <p className="text-center">Diabetologist Consultation - 1</p>
              <p className="text-center">Lab Test - 1</p>
              <p className="text-center text-green-500">3 Parameters</p>
              <p className="text-center">Dietician Consult - 0</p>
              <p className="text-center">Medicines Up to 15% off</p>
              <p className="text-center">Free Ophthalmologist Clinic Consult - 0</p>
            </div>
            <div className="mt-auto pt-8">
              <h3 className="text-4xl font-bold text-center">Rs.1200/-</h3>
            </div>
          </div>
          <div className="p-6 flex justify-center">
            <button className="border-2 border-gray-800 rounded-lg px-8 py-3 font-medium text-lg">Get Started</button>
          </div>
        </div>
  
        {/* Care Plan - Recommended */}
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col relative bg-green-50">
          <div className="bg-green-500 text-white py-2 text-center text-xl font-medium">Recommended</div>
          <div className="p-6 flex flex-col items-center flex-grow">
            <h2 className="text-3xl font-medium text-amber-500 mb-4">Care</h2>
            <div className="space-y-4 w-full">
              <p className="text-center">Diabetologist Consultation - 1</p>
              <p className="text-center">Lab Test - 1</p>
              <p className="text-center text-green-700">60 Parameters</p>
              <p className="text-center">Dietician Consult - 1</p>
              <p className="text-center">Medicines Up to 20% off</p>
              <p className="text-center">
                Free Ophthalmologist Clinic Consult -<br />6 Months - 1 visit, 12 Months - 2 visits
              </p>
            </div>
            <div className="mt-auto pt-8">
              <h3 className="text-4xl font-bold text-center">Rs.3000/-</h3>
            </div>
          </div>
          <div className="p-6 flex justify-center">
            <button className="bg-orange-400 hover:bg-orange-500 text-white rounded-lg px-8 py-3 font-medium text-lg">
              Get Started
            </button>
          </div>
        </div>
  
        {/* Care+ Plan */}
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col items-center flex-grow">
            <h2 className="text-3xl font-medium text-amber-400 mb-4">Care+</h2>
            <div className="space-y-4 w-full">
              <p className="text-center">Diabetologist Consultation - 2</p>
              <p className="text-center">Lab Test - 2</p>
              <p className="text-center text-green-500">80 Parameters</p>
              <p className="text-center">Dietician Consult - 2</p>
              <p className="text-center">Medicines Up to 30% off</p>
              <p className="text-center">
                Free Ophthalmologist Clinic Consult -<br />6 Months - 1 visit, 12 Months - 2 visits
              </p>
            </div>
            <div className="mt-auto pt-8">
              <h3 className="text-4xl font-bold text-center">Rs.4800/-</h3>
            </div>
          </div>
          <div className="p-6 flex justify-center">
            <button className="border-2 border-gray-800 rounded-lg px-8 py-3 font-medium text-lg">Get Started</button>
          </div>
        </div>
      </div>
    )
  }
  
  