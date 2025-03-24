import CeoInfo from '@/components/common/about/CeoInfo';
import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="px-4 md:px-20 py-10 space-y-12">
      {/* About Us Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between min-h-screen gap-10">
        {/* Left Text Content */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Quality Healthcare for all
          </h1>
          <p className="text-gray-700 text-justify">
            The Hon’ble Prime Minster of India, laid down a vision for the country to tackle the
            biggest challenge that modern day India faces, Quality Healthcare for all. Ayushman
            Bharat was a revolutionary step in ensuring the availability of healthcare to all,
            and Care Diabetics Institute of Medical Sciences is a proud believer and follower
            of that vision. Care Diabetics currently caters to a huge geographical area starting
            from Yamunotri at the China Border to Dehradun, being the only major tertiary care
            centre for the entire population in this stretch. We have been accumulating the
            largest number of patients under Ayushman Bharat amongst the private entities in
            the state by providing them state-of-the-art healthcare services.
          </p>

          <h4 className="text-xl font-semibold text-gray-800">
            More than anything else we love creating happy, healthy smiles.
          </h4>
          <p className="text-gray-700 text-justify">
            At Care Diabetics Institute of Medical Sciences, we are committed to redefining
            patient care through innovation and compassion. Our team of expert doctors and
            healthcare professionals work tirelessly to ensure that every patient receives
            personalized attention and world-class treatment. With a state-of-the-art facility
            and a focus on continuous research and development, we are proud to be at the
            forefront of diabetes care in the region. Our goal is simple—empowering individuals
            to lead healthier lives through accessible, quality healthcare.
          </p>
        </div>

        {/* Right Image */}
        <div className="md:w-1/2 flex justify-center md:justify-end">
          <img
            src="/placeholder.svg"
            alt="Placeholder"
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </div>

      {/* CEO Info Section */}
      <CeoInfo />
    </div>
  );
};

export default AboutPage;