import React from 'react';
import Image from 'next/image';
import ArrowButton from '@/components/ui/custom/cd-arrow-button';

const CareDiabeticsWorkflow = () => {
  const steps = [
    { number: '1', text: 'Login/Create an account' },
    { number: '2', text: 'Subscribe to Plan' },
    { number: '3', text: 'At Home Sample Collection' },
    { number: '4', text: 'Free BP check' },
    { number: '5', text: 'Free Body composition & BMI' },
    { number: '6', text: 'Free Biothesiometer test' },
    { number: '7', text: 'Get report on your phone' },
    { number: '8', text: 'Book an appointment with the doctor' },
    { number: '9', text: 'Seamless Teleconsultation + physical consultation' },
    { number: '10', text: 'Consultation with dietician (tailored diet plan)' },
    { number: '11', text: 'E-prescription in your dashboard' },
    { number: '12', text: 'At home medicine delivery on checkout' }
  ];

  return (
    <div className="bg-muted">
    <div className="container mx-auto py-12 px-4 ">
      <h1 className="text-4xl text-custom-darkgreen font-semibold text-center mb-10">How Care Diabetics Works?</h1>

      {/* Mobile view */}
      <div className="block md:hidden space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-4 rounded-sm bg-white m-2 p-2">
            <div className="flex-shrink-0 bg-custom-green text-white rounded-full w-12 h-12 flex items-center justify-center">
              {step.number}
            </div>
            <div className="flex flex-grow justify-left">
              <span className="font-bold text-lg">
                <Image
                  src={`/images/hcdw/hcdw-${step.number}.png`}
                  alt={step.text}
                  width={32}
                  height={32}
                  className="inline-block mr-2"
                />
              </span>
              <span className="text-lg ml-2">{step.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Non-mobile view (2 rows, 6 columns) */}
      <div className="hidden md:grid md:grid-cols-6 md:grid-rows-2 md:gap-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center space-y-4  p-6 ">
            <div className="flex-shrink-0 bg-custom-green text-white rounded-full w-12 h-12 flex items-center justify-center">
              {step.number}
            </div>
            <div className="flex flex-col items-center">
              <Image
                src={`/images/hcdw/hcdw-${step.number}.png`}
                alt={step.text}
                width={64}
                height={64}
                className="inline-block mb-4"
              />
              <span className="text-lg text-center">{step.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Non-mobile right arrow separator (for visual flow) */}


    <h1 className="text-3xl py-6 font-bold mb-6 text-center">Your Healthy  Lifestyle Journey Begins</h1>
      <div className="flex justify-center w-full">
        <ArrowButton buttonText="Join Us" href="/dashboard" />
      </div>
    </div>
    </div>
  );
};

export default CareDiabeticsWorkflow;