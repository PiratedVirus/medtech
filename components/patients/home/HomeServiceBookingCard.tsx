"use client"
import React from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import ArrowButton from "../../ui/custom/cd-arrow-button";
import { Link } from "lucide-react";

interface HomeServiceBookingCardProps {
  title: string;
  description: string;
  iconSrc: string;
  buttonText: string;
  gradientFrom?: string;
  gradientTo?: string;
  href?: string;
}

export default function HomeServiceBookingCard({
  title,
  description,
  iconSrc,
  buttonText,
  gradientFrom = "#134F30",
  gradientTo = "#56A67C",
  href,
}: HomeServiceBookingCardProps) {
  return (
    <Card
      className={`min-w-[18rem] max-w-[20rem] h-72 bg-gradient-to-b from-[#134F30] to-[#56A67C] border-0 rounded-lg flex flex-col justify-center items-center gap-2.5`}
    >
      <div className="h-60 flex flex-col justify-start items-start gap-10 pl-3">
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
          <ArrowButton buttonText={buttonText} href={href}/>
        </div>
      </div>
    </Card>
  );
}