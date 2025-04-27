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
            <div id="privacy-policy" className="w-full py-4 flex  items-center justify-center">
                <h1 className="text-4xl font-bold text-custom-darkgreen">Contact Us</h1>
            </div>
            <div className="flex px-4 md:px-20 flex-col md:flex-row items-center justify-center sm:min-h-96 gap-10">
                {/* Left Text Content */}
                <div className=" space-y-6 leftSide text-center">
                    <h4 className="text-xl md:text-2xl font-bold text-custom-darkgreen ">
                        connect@carediabetics.com
                    </h4>
                    <p>Flat. No 10, Srushti Redsidency, Saraswati Nagar, Garkheda, Chhatrapati Sambhajinagar 431001</p>
                    <p>Maharashtra, India</p>
                    <p>connect@carediabetics.com</p>
                    <p>CIN: U47721MH2025PTC440504</p>
                </div>
            </div>

            <Footer />

        </div>
    );
};

export default PoliciesPage;