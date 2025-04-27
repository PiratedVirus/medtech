"use client";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import Image from "next/image";
import React from "react";

export default function HeroSection() {
  return (
    <div className="bg-custom-mutedgreen">
      <div className="relative w-full px-6 md:px-20 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 py-16 md:py-0">
        {/* Left Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side - Doctor Image and Badges */}
        <div className="leftSide col-span-1 flex flex-col items-center relative w-full">
          {/* Image and Badges Container - Responsive on mobile, exact positioning on desktop */}
          <div className="relative w-full max-w-md mx-auto md:max-w-none md:mx-0 md:absolute md:left-[34px] md:top-[88px] md:w-[584px] md:h-[687px]">
            {/* Doctor Image Container with rotation on desktop */}
            <div className="relative w-full h-full md:absolute md:left-[72px] md:top-0 md:w-[485px] md:h-[687px] md:rotate-180">
              <img
                className="w-full h-auto object-cover md:absolute md:h-[682px] md:top-0 md:left-6 md:-rotate-180"
                alt="Doctor"
                src="/images/doc-card.png"
              />
            </div>

            {/* "Easy Appointment Booking" badge */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:transform-none md:left-2  inline-flex items-center gap-3 px-6 py-2 bg-[#f5f7f9] rounded-[10px] shadow">
              <img className="w-7 h-7" alt="Star" src="/icons/star.svg" />
              <div className="text-[#164E2F] text-base md:text-sm font-medium whitespace-nowrap">
                Easy Appointment Booking
              </div>
            </div>

            {/* "Regular Checkup" badge */}
            <div
              className="absolute top-10 left-1/2 transform -translate-x-1/2 md:transform-none md:left-[1px] md:top-[170px] inline-flex items-center gap-3 md:gap-2 px-6 md:px-3 py-2 bg-[#f5f7f9] rounded-[10px] md:rounded-lg shadow"
              style={{ boxShadow: "6px 6px 12px #0f27511c" }}
            >
              <div className="relative w-[30px] h-[30px] md:w-[26px] md:h-[26px]">
                <img
                  className="absolute w-[24px] h-[24px] md:w-[21px] md:h-[21px] top-[3px] left-[3px]"
                  alt="Shield"
                  src="/icons/sheild.svg"
                />
              </div>
              <div className="text-[#164E2F] text-base md:text-sm font-medium">Regular Checkup</div>
            </div>

            {/* Green Heart Circle - Hidden on mobile, visible on desktop */}
            <div className="hidden md:flex absolute shadow bg-green-600 items-center justify-center left-32 top-8 w-14 h-14 rounded-full">
              <img className="w-6 h-6" alt="Heart" src="/icons/heart.svg" />
            </div>

            {/* White Pulse Circle - Hidden on mobile, visible on desktop */}
            <div className="hidden md:flex absolute shadow left-[470px] top-[144px] w-14 h-14 bg-white items-center justify-center rounded-full">
              <img className="w-6 h-6" alt="Pulse" src="/icons/pulse.svg" />
            </div>
          </div>
        </div>

        {/* Right Side - Doctor Details and Booking */}

      </div>

        {/* Right Side */}
        <div className="rightSide col-span-2 flex flex-col items-end text-right w-full">
          <div className="flex flex-col gap-8 items-end text-right w-full md:pr-14">
            {/* Logo */}
            <div className="flex mt-10 justify-center md:justify-end">
              <Image
                className="object-cover"
                alt="Brand Logo"
                width={420}
                height={320}
                src="/images/new-logo.png"
              />
            </div>

            {/* Main Heading */}
            <p className="text-[32px] md:text-[48px] font-bold leading-normal text-[#2C2E38] w-full md:w-[630px]">
              Programs tailored for your
              <br />
              diabetics care
            </p>

            {/* Subheading */}
            <div className="text-[24px] md:text-[32px] font-medium leading-normal text-[#2C2E38]">
              Trusted Experts Dedicated to Your{" "}
              <span className="bg-gradient-to-r from-[#164E2F] to-[#33B46C] bg-clip-text text-transparent">
                Wellbeing
              </span>
            </div>

            {/* CTA Button */}
            <ArrowButton buttonText="Join our program" href="/dashboard" />
          </div>

          {/* iPhone + App Stores */}
          <div className="flex flex-col md:flex-row justify-center md:justify-end items-center gap-6 mt-10 pr-8">
            <img
              className="object-cover w-[220px] h-[225px]"
              alt="iPhone Pro"
              src="/images/iphone-large.png"
            />

            {/* Store badges */}
            <div className="flex gap-4">
              <div
                className="w-[160px] h-[48px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://c.animaapp.com/qvLtwVco/img/playstore-png@2x.png')",
                }}
              />
              <div
                className="w-[160px] h-[48px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://c.animaapp.com/qvLtwVco/img/appstore-png@2x.png')",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}