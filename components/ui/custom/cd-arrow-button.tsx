import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";

interface ArrowButtonProps {
  buttonText: string;
  href: string; // Make href required for Link
  size?: "small" | "large";
}

export default function ArrowButton({ buttonText, href, size = "large" }: ArrowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isSmall = size === "small";

  return (
    <Link
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${isSmall ? "w-40 h-12" : "w-64 h-20"} pl-6 pr-3 rounded-full flex items-center justify-between transition-all duration-500 ease-in-out`}
      style={{ backgroundColor: isHovered ? "#F28A2E" : "white" }}
    >
      <span
        className={`${isSmall ? "text-sm" : "text-lg"} font-semibold transition-colors duration-500 ${
          isHovered ? "text-white" : "text-slate-500"
        }`}
      >
        {buttonText}
      </span>
      <div className={`relative flex items-center justify-center ${isSmall ? "w-10 h-10" : "w-16 h-16"} pr-1`}>
        <div
          className={`absolute pl-1 rounded-full flex items-center justify-center transition-all duration-500 ease-in-out`}
          style={{
            backgroundColor: isHovered ? "white" : "#F28A2E",
            width: isSmall ? "40px" : "64px",
            height: isSmall ? "40px" : "64px",
          }}
        >
          <ArrowUpRight
            className={`absolute ${isSmall ? "w-6 h-6" : "w-8 h-8"} text-white transition-all duration-500 transform ${
              isHovered ? "opacity-0 translate-x-4 scale-90" : "opacity-100 translate-x-0 scale-100"
            }`}
            strokeWidth={2}
          />
          <ArrowRight
            className={`absolute ${isSmall ? "w-6 h-6" : "w-8 h-8"} text-primary transition-all duration-500 transform ${
              isHovered ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-4 scale-90"
            }`}
            strokeWidth={2}
          />
        </div>
      </div>
    </Link>
  );
}