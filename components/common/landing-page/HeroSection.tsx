"use client";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import React from "react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="relative w-full h-[865px] bg-[#dbefed] grid grid-cols-3">
      {/* Left Side (1/3) */}
      <div className="leftSide col-span-1 relative">
        {/* Left-Side Images & Badges */}
        <div className="absolute left-[34px] top-[88px] w-[584px] h-[687px]">
          {/* Rotated container */}
          <div className="absolute left-[72px] top-0 w-[485px] h-[687px] rotate-180">
            <div className="relative w-full h-full">
              <img
                className="absolute h-[632px] top-0 left-6 -rotate-180"
                alt="Image"
                src="/images/doc-card.png"
              />
            </div>
          </div>

          {/* "Easy Appointment Booking" badge */}
          <div className="absolute shadow left-2 top-[544px] inline-flex items-center gap-3 px-6 py-2 bg-[#f5f7f9] rounded-[10px]">
            <img className="w-7 h-7" alt="Frame" src="/icons/star.svg" />
            <div className="text-[#164E2F] text-sm font-medium whitespace-nowrap">
              Easy Appointment Booking
            </div>
          </div>

          {/* "Regular Checkup" badge */}
          <div
            className="absolute left-[1px] top-[170px] inline-flex items-center gap-2 px-3 py-2 bg-[#f5f7f9] rounded-lg"
            style={{ boxShadow: "6px 6px 12px #0f27511c" }}
          >
            <div className="relative w-[26px] h-[26px]">
              <img
                className="absolute w-[21px] h-[21px] top-[3px] left-[3px]"
                alt="Icon"
                src="/icons/sheild.svg"
              />
            </div>
            <div className="text-[#164E2F] text-sm font-medium">Regular Checkup</div>
          </div>

          {/* Green circle at top-left */}
          <div className="absolute shadow bg-green-600 flex items-center justify-center left-44 top-12 w-14 h-14 rounded-full">
            <img className="w-6 h-6" alt="Xmlid" src="/icons/heart.svg" />
          </div>

          {/* White circle at top-right */}
          <div className="absolute shadow left-[470px] top-[144px] w-14 h-14 bg-white flex items-center justify-center rounded-full">
            <img className="w-6 h-6" alt="Fi" src="/icons/pulse.svg" />
          </div>
        </div>
      </div>

      {/* Right Side (2/3) */}
      <div className="col-span-2 relative">
        {/* Top portion: heading, logo, subheading */}
        <div className="rightCenter">
          <div className="absolute left-[802px] top-[-8px] w-[630px] h-[437px]">
            <p className="absolute w-[630px] top-[321px] left-0 text-right text-[#2C2E38] text-[48px] font-bold leading-normal">
              Programs tailored for your
              <br />
              diabetics care
            </p>
            <Image
              className="absolute top-0 left-[178px] object-cover"
              alt="Brand Logo"
              width={250}
              height={50}
              src="/images/logo.png"
            />
          </div>

          <div className="absolute left-[797px] top-[446px] w-[635px] h-[38px]">
            <p className="absolute w-[489px] top-[-1px] left-0 text-[#2C2E38] text-[32px] font-medium leading-normal">
              Trusted Experts Dedicated to Your
            </p>
            <div className="absolute w-[146px] h-[38px] left-[489px] top-0 overflow-hidden">
              {/* Gradient text */}
              <div className="absolute bg-gradient-to-r from-[#164E2F] to-[#33B46C] bg-clip-text text-transparent text-[32px] font-medium leading-normal">
                Wellbeing
              </div>
            </div>
          </div>
        </div>

        {/* Bottom portion: iPhone image, store badges, CTA */}
        <div className="rightBottom">
          {/* iPhone Pro Image */}
          <div className="absolute left-[819px] top-[640px] w-[220px] h-[225px] flex items-center justify-center">
            <img className="object-cover" alt="iPhone Pro" src="/images/iphone-large.png" />
          </div>

          {/* App Store & Play Store badges */}
          <div className="absolute left-[1061px] top-[787px] inline-flex items-center gap-[14px]">
            <div
              className="w-[178.57px] h-[52.68px] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://c.animaapp.com/qvLtwVco/img/playstore-png@2x.png')",
              }}
            />
            <div
              className="w-[178.56px] h-[52.68px] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://c.animaapp.com/qvLtwVco/img/appstore-png@2x.png')",
              }}
            />
          </div>

          {/* "Join our program" CTA */}
          <div className="absolute left-[1105px] top-[518px] w-[327px] h-[88px] rounded-[71px]">
            <ArrowButton buttonText="Join our program" />
          </div>
        </div>
      </div>
    </div>
  );
}