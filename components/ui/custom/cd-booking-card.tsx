"use client"
import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

interface BookingCardProps {
  title: string;
  description: string;
  iconSrc: string;
  buttonText: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function BookingCard({
  title,
  description,
  iconSrc,
  buttonText,
  gradientFrom = "#134F30",
  gradientTo = "#56A67C",
}: BookingCardProps) {
  return (
    <Card
      className={`w-80 h-72 bg-gradient-to-b from-[${gradientFrom}] to-[${gradientTo}] border-0 rounded-lg flex flex-col justify-center items-center gap-2.5`}
    >
      <div className="h-60 flex flex-col justify-start items-start gap-10">
        <div className="h-28 flex flex-col justify-start items-start gap-5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Image width={40} height={40} src={iconSrc} alt={title} />
            </div>
            <span className="text-neutral-100 text-2xl font-medium font-['Lato']">
              {title}
            </span>
          </div>
          <p className="self-stretch text-neutral-100 text-base font-normal font-['Lato']">
            {description}
          </p>
        </div>

        <div className="h-20 rounded-lg flex justify-center items-center">
          <div className="w-64 h-20 pl-6 pr-1 bg-neutral-100 rounded-full flex items-center justify-between">
            <span className="text-slate-500 text-lg font-semibold font-['Lato']">
              {buttonText}
            </span>
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 absolute bg-orange-400 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}