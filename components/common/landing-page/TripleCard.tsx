import React from 'react';

const TripleCard: React.FC = () => {
  return (
    <div className="px-20 pb-5">
      {/* Title Row */}
      <h1 className="text-3xl py-6 font-bold mb-6 text-center">Book a Consultation with Care Diabetics</h1>

      {/* Images Row */}
      <div className="flex flex-col gap-6 sm:flex-row justify-between">
        <img
          src="/images/consult-1.png"
          alt="Image 1"
          className="w-80  object-cover rounded-lg"
        />
        <img
          src="/images/consult-2.png"
          alt="Image 2"
          className="w-80 object-cover rounded-lg"
        />
        <img
          src="/images/consult-3.png"
          alt="Image 3"
          className="w-80 object-cover rounded-lg"
        />
      </div>
    </div>
  );
};

export default TripleCard;