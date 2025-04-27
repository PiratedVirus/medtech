import { Facebook, Instagram, Mail, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="text-black border-t-2">
      <div className="container px-4 py-12 mx-auto">
        {/* ✅ Responsive Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* ✅ Column 1 - Logo & Subscribe */}
          <div className="space-y-6 text-center md:text-left">
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <Image
                src="/images/new-logo.png"
                alt="Care Diabetics"
                width={250}
                height={50}
                className="mb-1"
              />
            </div>
            <p className="text-sm text-center md:text-left">
              Connecting Patients with Doctors, Seamlessly
            </p>
            {/* <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter Email"
                className="bg-white text-black"
              />
              <Button variant="secondary" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div> */}
          </div>

          {/* ✅ Column 2 & 3 - Care Diabetics & Quick Links (Side by Side on Mobile) */}
          <div className="grid grid-cols-2 gap-8 col-span-1 sm:col-span-2">
            {/* Care Diabetics Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Care Diabetics</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/about/policies#privacy-policy" className="text-sm hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/about/policies#terms-conditions" className="text-sm hover:underline">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/about/policies#refund-cancellation" className="text-sm hover:underline">
                  Refund and Cancellation Policy
                  </Link>
                </li>
                {/* <li>
                  <Link href="/faq" className="text-sm hover:underline">
                    FAQ
                  </Link>
                </li> */}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard/doctors" className="text-sm hover:underline">
                    Find a Doctor
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/appointments"
                    className="text-sm hover:underline"
                  >
                    Book Appointment
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* ✅ Column 4 - Contact Info (Full Width on Mobile) */}
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2 text-sm">
              {/* <p>Flat. No 10, Srushti Redsidency, Saraswati Nagar</p> */}
              {/* <p>Garkheda, Chhatrapati Sambhajinagar 431001 </p> */}
              {/* <p>Maharashtra, India</p> */}
              <p>connect@carediabetics.com</p>
              {/* <p>CIN: U47721MH2025PTC440504</p> */}
            </div>
          </div>
        </div>
      </div>



      {/* ✅ Bottom Bar */}
      <div className="border-t bg-[#134f30] text-white border-white/10">
        <div className="container px-4 py-4 mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">Copyright © 2024 | All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white/80">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="hover:text-white/80">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="hover:text-white/80">
              <Mail className="h-5 w-5" />
            </Link>
            <Link href="#" className="hover:text-white/80">
              <Youtube className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
