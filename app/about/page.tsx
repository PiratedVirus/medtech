import CeoInfo from '@/components/common/about/CeoInfo';
import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';
import InfoBar from '@/components/common/landing-page/InfoBar';
import { Heart, Shield, Stethoscope, Brain, Plus, ArrowRight } from "lucide-react"

import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="">
      <InfoBar />
      <Header />
      {/* About Us Section */}
      <div className="w-full py-4 flex items-center justify-center">
        <h1 className="text-4xl font-bold text-custom-darkgreen">About Us</h1>
      </div>
      <div className="flex px-4 md:px-20 flex-col md:flex-row items-center md:items-start justify-between  gap-10">
        {/* Left Text Content */}
        <div className="md:w-1/2 space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-custom-darkgreen">
            Quality Healthcare for all
          </h2>
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

          <h4 className="text-xl font-semibold text-custom-darkgreen">
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
            src="/images/about-us.png"
            alt="Placeholder"
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </div>

      {/* CEO Info Section */}
      <CeoInfo />

      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-custom-darkgreen mb-12">Our Values</h2>

        <div className="space-y-10 mb-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg">
              <span className="font-bold text-emerald-700">Efficiency:</span> Patient service lies at the heart of our
              work. We strive to ensure that our medical knowledge and resources are optimally utilized to serve our
              patients in the most efficient manner.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-lg">
              <span className="font-bold text-emerald-700">Excellence:</span> This is the ultimate aim of all our efforts.
              We endeavor to ensure that all aspects of our systems reflect this value and our services surpass your
              expectations.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-lg">
              <span className="font-bold text-emerald-700">Trust:</span> Your health and safety is our topmost priority.
              We trust our exceptional caregivers to take care of you and your loved ones and their ability to provide
              them the highest standards of medical care
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-lg">
              <span className="font-bold text-emerald-700">Compassion:</span> People who come to us can expect staff
              members who will treat you with respect, dignity and compassion and will walk an extra mile to ensure that
              you receive the care you deserve.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-lg">
              <span className="font-bold text-emerald-700">Consistency:</span> We take great measures to make sure that
              highest level of patient care and satisfaction is met at every stage, every time. We believe that only
              through consistency, we can retain our patient's trust and fulfill our goals.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-lg">
              <span className="font-bold text-emerald-700">Accountability:</span> Ethics and accountability are integral
              part of our culture. We take pride in our accomplishments and take full responsibility for our shortcomings
              so that we can serve you better.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-custom-green flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <p className="text-lg font-medium">Patient-Centered Care</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-custom-green flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <p className="text-lg font-medium">Integrity and Ethics</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-custom-green flex items-center justify-center mb-4">
              <Stethoscope className="w-12 h-12 text-white" />
            </div>
            <p className="text-lg font-medium">Clinical Excellence</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-custom-green flex items-center justify-center mb-4">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <p className="text-lg font-medium">Innovation and Advancement</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-custom-green flex items-center justify-center mb-4">
              <Plus className="w-12 h-12 text-white" />
            </div>
            <p className="text-lg font-medium">Continuous Learning and Growth</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#e6f4ea] to-white rounded-b-[30px]">
        <div className="max-w-7xl mx-auto py-16 px-20 sm:px-20 lg:px-20">
          {/* Heading */}
          <div className="text-center mb-16">
            <h2 className="text-green-800 text-lg font-semibold tracking-widest mb-2">
              BRAND LEGACY
            </h2>
            <h1 className="text-4xl font-bold text-gray-900">Care Diabetics</h1>
          </div>

          {/* Mission and Vision Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Mission */}
            <div className="relative text-left">
              <div className="absolute top-0 left-0 w-full h-full flex justify-start items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-24 h-24 opacity-10 text-custom-green"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.17 6.17A4.99 4.99 0 005 10v2h4v8H3v-8a7 7 0 014.17-6.32zM17.17 6.17A4.99 4.99 0 0015 10v2h4v8h-6v-8a7 7 0 014.17-6.32z" />
                </svg>
              </div>
              <h3 className="text-green-800 text-2xl font-semibold mb-0">
                Mission
              </h3>
              <p className="text-green-800 italic mt-2">
                (What we are doing every day)
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mt-4">
                “To provide accessible, personalized, and evidence-based diabetes care through technology, community support, and continuous innovation.”
              </p>
            </div>

            {/* Vision */}
            <div className="relative text-left">
              <div className="absolute top-0 left-0 w-full h-full flex justify-start items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-24 h-24 opacity-10 text-custom-green"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.17 6.17A4.99 4.99 0 005 10v2h4v8H3v-8a7 7 0 014.17-6.32zM17.17 6.17A4.99 4.99 0 0015 10v2h4v8h-6v-8a7 7 0 014.17-6.32z" />
                </svg>
              </div>
              <h3 className="text-green-800 text-2xl font-semibold mb-0">
                Vision
              </h3>
              <p className="text-green-800 italic mt-2">
                (What future we are building)
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mt-4">
                “A future where diabetes is no longer a barrier to living fully — where every patient has the tools, knowledge, and care they need to thrive.”
              </p>
            </div>
          </div>

          {/* Our Promise */}
          <div className="relative mt-16 text-center">
            <h3 className="text-green-800 text-2xl font-semibold ">
              Our Promise 
            </h3>
            <p className="text-green-800 italic mt-2 mb-8">
            (What users can expect from us)
              </p>
            <p className="text-gray-700 font-semibold text-2xl leading-relaxed">
              “At CareDiabetics, we promise care that is compassionate, cutting-edge, and committed to your journey — every step of the way.”
            </p>
          </div>

          {/* Core Values */}
          <div className="relative mt-16 text-center">
            <h3 className="text-green-800 text-2xl font-semibold">
              Core Values 
            </h3>
            <p className="text-green-800 italic mt-2 mb-8">
            (The principles guiding us)
              </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-10 bg-custom-darkgreen text-white text-center flex flex-col justify-center items-center">
                <h4 className="text-xl font-semibold mb-2">Patient First</h4>
                <p className="text-base">We prioritize patient well-being above everything.</p>
              </div>
              <div className="p-10 bg-custom-mutedgreen text-custom-darkgreen text-center flex flex-col justify-center items-center">
                <h4 className="text-xl font-semibold mb-2">Innovation</h4>
                <p className="text-base">We harness the latest technology to deliver better care.</p>
              </div>
              <div className="p-10  bg-custom-mutedgreen text-custom-darkgreen text-center flex flex-col justify-center items-center">
                <h4 className="text-xl font-semibold mb-2">Empowerment</h4>
                <p className="text-base">We educate and equip patients to manage their health proactively.</p>
              </div>
              <div className="p-10 bg-custom-darkgreen text-white  text-center flex flex-col justify-center items-center">
                <h4 className="text-xl font-semibold mb-2">Trust</h4>
                <p className="text-base">We maintain confidentiality, transparency, and integrity.</p>
              </div>
              <div className="col-span-1 md:col-span-2 mt-10 p-6 bg-custom-darkgreen text-white text-center flex flex-col justify-center items-center">
                <h4 className="text-xl font-semibold mb-2">Community</h4>
                <p className="text-base">We believe healing is faster with support, empathy, and shared journeys.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center bg-custom-mutedgreen py-8 px-4 md:px-20">
      <h1 className="text-xl italic text-custom-darkgreen">A Product by</h1>
      <img src='/images/parent-logo-nobg.png' alt="Parent Logo" className="w-1/2 md:w-1/4 mx-auto mt-8" />
      <h1 className=" text-3xl font-bold text-custom-darkgreen mt-4">
        Padmaram Healthcare Private Limited

      </h1>
      <p className='mt-3 text-lg text-gray-800 text-pretty'><b>Padmaram Healthcare Private Limited</b> is driven by an unwavering commitment to revolutionize healthcare through innovation and technology. Our vision is to make advanced, personalized, and preventive healthcare accessible to all. By combining cutting-edge research, digital solutions, and patient-centric models, we strive to reshape the future of health and wellness.
      </p>
      <p  className='mt-3 text-lg text-gray-800 text-pretty'>      <b>CareDiabetics</b>, a flagship product of Padmaram Healthcare, was created with the same vision to provide holistic diabetes management, combining expert medical guidance, lifestyle support, and continuous patient engagement.</p>
      </div>

      {/* Policies Navigation Cards Section */}
      <div className="w-full text-center bg-custom-mutedbg py-10 px-4 md:px-20">
        <h1 className="text-4xl font-bold text-custom-darkgreen">Policies</h1>
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Privacy Policy Card */}
          <a href="/about/policies#privacy-policy" className="flex flex-col justify-between bg-custom-mutedgreen rounded-lg shadow-md p-4 hover:bg-custom-darkgreen transition-colors duration-300 group">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xl font-semibold text-custom-darkgreen group-hover:text-white">Privacy Policy</h3>
              <ArrowRight className="w-6 h-6 text-custom-darkgreen group-hover:text-white" />
            </div>
            <p className="mt-2 text-gray-600 group-hover:text-white text-sm">
              Understand how we protect and use your personal information.
            </p>
          </a>

          {/* Refund and Cancellation Policy Card */}
          <a href="/about/policies#refund-cancellation" className="flex flex-col justify-between bg-custom-mutedgreen rounded-lg shadow-md p-4 hover:bg-custom-darkgreen transition-colors duration-300 group">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xl font-semibold text-custom-darkgreen group-hover:text-white">Refund & Cancellation Policy</h3>
              <ArrowRight className="w-6 h-6 text-custom-darkgreen group-hover:text-white" />
            </div>
            <p className="mt-2 text-gray-600 group-hover:text-white text-sm">
              Learn about our refund process and cancellation terms.
            </p>
          </a>

          {/* Terms and Conditions Card */}
          <a href="/about/policies#terms-conditions" className="flex flex-col justify-between bg-custom-mutedgreen rounded-lg shadow-md p-4 hover:bg-custom-darkgreen transition-colors duration-300 group">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xl font-semibold text-custom-darkgreen group-hover:text-white">Terms & Conditions</h3>
              <ArrowRight className="w-6 h-6 text-custom-darkgreen group-hover:text-white" />
            </div>
            <p className="mt-2 text-gray-600 group-hover:text-white text-sm">
              Review the rules and guidelines for using our services.
            </p>
          </a>
        </div>
      </div>

      <Footer />

    </div>
  );
};

export default AboutPage;