import React from "react";
import Image from "next/image";

export default function ServicesSection() {
  return (
    <section className="max-w-screen-xl mx-auto px-4 py-12">
      {/* Heading + Subheading */}
      <div className="text-center mb-10">
        <h2 className="text-4xl text-green-900 font-semibold">Our Services</h2>
        <p className="mt-4 text-lg text-gray-800">
          Tailored diabetes programs for effective management and lasting results.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Card 1 */}
        <div className="group bg-custom-mutedgreen hover:bg-custom-darkgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)] transition-colors duration-300">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/pregnant.svg"
              alt="Pregnancy Care Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight group-hover:text-white">
            Diabetes in Pregnancy Care (GDM Care)
          </h3>
          <p className="text-gray-800 text-lg font-medium group-hover:text-gray-100">
            Expert care for managing gestational diabetes during pregnancy.
          </p>
        </div>

        {/* Card 2 */}
        <div className="group bg-custom-mutedgreen hover:bg-custom-darkgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)] transition-colors duration-300">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/medicine-pills.svg"
              alt="Medicine Pills Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight group-hover:text-white">
            Teleconsultation / Clinic Consultation
            <br />
            (Doctors &amp; Dieticians)
          </h3>
          <p className="text-gray-800 text-lg font-medium group-hover:text-gray-100">
            Access professional guidance conveniently via teleconsultation or in-clinic visits.
          </p>
        </div>

        {/* Card 3 */}
        <div className="group bg-custom-mutedgreen hover:bg-custom-darkgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)] transition-colors duration-300">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/virus-lab-research-test-tube.svg"
              alt="Lab Tests Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight group-hover:text-white">
            Lab Tests
          </h3>
          <p className="text-gray-800 text-lg font-medium group-hover:text-gray-100">
            Accurate, convenient diabetes-related lab tests.
          </p>
        </div>

        {/* Card 4 */}
        <div className="group bg-custom-mutedgreen hover:bg-custom-darkgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)] transition-colors duration-300">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/syrup-pills.svg"
              alt="Medicine Delivery Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight group-hover:text-white">
            Medicine Deliveries
          </h3>
          <p className="text-gray-800 text-lg font-medium group-hover:text-gray-100">
            Get diabetes medications delivered fast and hassle-free.
          </p>
        </div>
      </div>
    </section>
  );
}