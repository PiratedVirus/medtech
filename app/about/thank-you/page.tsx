import CeoInfo from '@/components/common/about/CeoInfo';
import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';
import { Heart, Shield, Stethoscope, Brain, Plus } from "lucide-react"
import Link from 'next/link';

import React from 'react';

const ThankYou: React.FC = () => {
    return (
        <div className="space-y-12">
            <Header />
            {/* About Us Section */}
            <div id="privacy-policy" className="w-full min-h-96 py-4 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-custom-darkgreen">Thanks! </h1>
            </div>
            <div className="flex justify-center items-center text-primary">

                <Link href="/">Go back to Homepage</Link>
            </div>



            <Footer />

        </div>
    );
};

export default ThankYou;