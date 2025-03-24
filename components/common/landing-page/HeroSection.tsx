"use client";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import React from "react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="bg-custom-mutedgreen">
      <div className="relative w-full px-20 h-[865px] grid grid-cols-3">
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

        <div className="col-span-2 flex flex-col h-full">
          <div className="flex justify-end md:mr-14 mt-8">
            <Image
              className="object-cover"
              alt="Brand Logo"
              width={420}
              height={320}
              src="/images/logo-large.png"
            />
          </div>

          <div className="flex-1 flex w-full justify-end px-8 pt-8">
            <div className="flex flex-col items-end text-right gap-6">
              {/* Main heading */}
              <p className="w-[630px] text-[48px] font-bold leading-normal text-[#2C2E38]">
                Programs tailored for your
                <br />
                diabetics care
              </p>

              {/* Subheading with gradient text */}
              <div className="text-[32px] font-medium leading-normal text-[#2C2E38]">
                Trusted Experts Dedicated to Your{" "}
                <span className="bg-gradient-to-r from-[#164E2F] to-[#33B46C] bg-clip-text text-transparent">
                  Wellbeing
                </span>
              </div>

              {/* CTA Button */}
              <ArrowButton buttonText="Join our program" href="/dashboard" />
            </div>
          </div>

          <div className="flex justify-end  items-end gap-6 pr-8">
            {/* iPhone Pro Image */}
            <img
              className="object-cover w-[220px] h-[225px]"
              alt="iPhone Pro"
              src="/images/iphone-large.png"
            />

            {/* Store badges */}
            <div className="inline-flex items-center gap-[14px]">
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
          </div>
        </div>
      </div>
    </div>
  );
}