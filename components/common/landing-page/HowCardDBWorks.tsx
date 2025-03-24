import ArrowButton from '@/components/ui/custom/cd-arrow-button';
import React from 'react';

const HowWorks: React.FC = () => {
  return (
    <div className="bg-muted">

    <div className="px-20 pb-5 flex justify-center flex-col">
      {/* Title Row */}
      <h1 className="text-3xl py-6 font-bold mb-6 text-center">Book a Consultation with Care Diabetics</h1>

      {/* Images Row */}
      <div className="flex flex-col gap-6 sm:flex-row justify-between">
        <img
          src="/images/how-care-db-works.png"
          alt="Image 1"
          className="w-full  object-cover rounded-lg"
        />

      </div>

      <h1 className="text-3xl py-6 font-bold mb-6 text-center">Your Healthy  Lifestyle Journey Begins</h1>
      <div className="flex justify-center w-full">
        <ArrowButton buttonText="Join Us" href="/dashboard" />
      </div>

    </div>
    </div>

  );
};

export default HowWorks;