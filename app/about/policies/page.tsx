import CeoInfo from '@/components/common/about/CeoInfo';
import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';
import { Heart, Shield, Stethoscope, Brain, Plus } from "lucide-react"

import React from 'react';

const PoliciesPage: React.FC = () => {
    return (
        <div className="space-y-12">
            <Header />
            {/* About Us Section */}
            <div id="privacy-policy" className="w-full py-4 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-custom-darkgreen">Privacy Policy</h1>
            </div>
            <div className="flex px-4 md:px-20 flex-col md:flex-row items-center md:items-start justify-between  gap-10">
                {/* Left Text Content */}
                <div className=" space-y-6 leftSide md:w-1/2">
                    <h4 className="text-xl md:text-2xl font-bold text-custom-darkgreen">
                    Care Diabetics respects your privacy and is committed to protecting your personal and health information.
                    </h4>
                    <p> <span className='text-custom-darkgreen font-semibold'>Information We collect: </span>Personal details (name, contact info), health records, and payment details.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">How We Use Information:</span> To deliver healthcare services, improve user experience, process payments, and communicate with you.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Data Sharing:</span> Information may be shared with trusted medical professionals for service delivery. We do not sell or rent your data to third parties.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Data Security:</span> We implement strong security measures to protect your information, including SSL encryption and secure payment processing through Razorpay.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Cookies:</span> Our website uses cookies to enhance user experience.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">User Rights:</span> You may request access, correction, or deletion of your personal information at any time.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Consent:</span> By using our platform, you consent to our privacy practices as described.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Contact:</span> For any privacy-related queries, please contact us at connect@carediabetics.com</p>
                </div>
                {/* Right Image */}
                <div className="md:w-1/2 flex justify-center md:justify-end">
                    <img
                        src="/images/privacy.png"
                        alt="Placeholder"
                        className="max-w-full h-full rounded-lg shadow-md"
                    />
                </div>

            </div>

            <div id="refund-cancellation" className="w-full px-4 md:px-20 py-4 flex items-center justify-center">
                <h1 className="text-4xl text-center font-bold text-custom-darkgreen">Refund and Cancellation Policy</h1>
            </div>
            
            <div className="flex px-4 md:px-20 flex-col md:flex-row items-center md:items-start justify-between gap-10">
            <div className="md:w-1/2 flex justify-center md:justify-end">
                    <img
                        src="/images/refund.png"
                        alt="Refund Policy"
                        className="max-w-full h-full rounded-lg shadow-md"
                    />
                </div>
                <div className="space-y-6 leftSide md:w-1/2">
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Subscription Cancellation:</span> Users can cancel their subscription at any time by contacting customer support.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Refund Eligibility:</span> Refunds will only be considered if there is a proven case of service failure, such as non-delivery of promised services from Care Diabetics.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Non-refundable Cases:</span> Subscriptions are generally non-refundable once services are availed, except in cases of service failure from Care Diabetics.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Refund Request Process:</span> To request a refund, users must email connect@carediabetics.com with complete details and proof of the service issue.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Refund Timeline:</span> Once the complaint is validated and refund is approved, the amount will be processed within 7–10 business days through the original method of payment.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Cancellation Process:</span> Users wishing to cancel without claiming a refund can do so by contacting customer support anytime.</p>
                    <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Contact for Refund Queries:</span> connect@carediabetics.com</p>
                </div>
  
            </div>

            <div id="terms-conditions" className="w-full py-4 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-custom-darkgreen">Terms and Conditions</h1>
            </div>
            <div className="flex flex-col md:flex-row px-4 md:px-20 gap-10 items-center md:items-start justify-between">
              {/* Left Image */}
  

              {/* Right Content */}
              <div className="space-y-6 md:w-1/2">
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Welcome:</span> Welcome to Care Diabetics. By using our website, mobile application, or services, you agree to the following terms:</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Business Name:</span> Padmaram Healthcare Private Limited</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Address:</span> Flat No. 10, Srushti Residency, Saraswati Nagar, Garkheda, Aurangabad, Maharashtra, India. 431001</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Contact:</span> connect@carediabetics.com</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Services:</span> Care Diabetics offers subscription-based diabetic healthcare services including doctor consultations, lab tests, and health management tools.</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Payments:</span> All payments are processed securely through Razorpay. Subscription charges are billed in advance and must be paid in full to access services.</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">User Obligations:</span> Users agree to provide accurate and complete information. Users are responsible for maintaining confidentiality of their account credentials.</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Limitation of Liability:</span> Care Diabetics is not liable for any damages arising from misuse of services, delays, or service interruptions.</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Dispute Resolution:</span> Any disputes shall be governed by the laws of India and subject to the exclusive jurisdiction of courts located in Aurangabad, Maharashtra.</p>
                <p className="text-gray-700 text-justify"><span className="text-custom-darkgreen font-semibold">Changes to Terms:</span> Care Diabetics reserves the right to modify these terms at any time without prior notice.</p>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <img
                  src="/images/tnc.png"
                  alt="Terms and Conditions"
                  className="max-w-full h-full rounded-lg shadow-md"
                />
              </div>
            </div>

            <Footer />

        </div>
    );
};

export default PoliciesPage;