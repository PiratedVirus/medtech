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
        <div className="bg-custom-mutedgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)]">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/pregnant.svg"
              alt="Pregnancy Care Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight">
            Diabetes in Pregnancy Care (GDM Care)
          </h3>
          <p className="text-gray-800 text-lg font-medium">
            Expert care for managing gestational diabetes during pregnancy.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-custom-mutedgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)]">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/medicine-pills.svg"
              alt="Medicine Pills Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight">
            Teleconsultation / Clinic Consultation
            <br />
            (Doctors &amp; Dieticians)
          </h3>
          <p className="text-gray-800 text-lg font-medium">
            Access professional guidance conveniently via teleconsultation or in-clinic visits.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-custom-mutedgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)]">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/virus-lab-research-test-tube.svg"
              alt="Lab Tests Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight">
            Lab Tests
          </h3>
          <p className="text-gray-800 text-lg font-medium">
            Accurate, convenient diabetes-related lab tests.
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-custom-mutedgreen rounded-[30px] p-6 flex flex-col items-center text-center shadow-[0_10px_15px_rgba(151,151,151,0.08)]">
          <div className="w-28 h-28 bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
            <Image
              src="/icons/syrup-pills.svg"
              alt="Medicine Delivery Icon"
              width={48}
              height={48}
            />
          </div>
          <h3 className="text-green-900 text-2xl font-bold mb-2 leading-tight">
            Medicine Deliveries
          </h3>
          <p className="text-gray-800 text-lg font-medium">
            Get diabetes medications delivered fast and hassle-free.
          </p>
        </div>
      </div>
    </section>
  );
}