import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ArrowButtonProps {
  buttonText: string;
  href?: string;
}

export default function ArrowButton({ buttonText, href }: ArrowButtonProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => {
        if (href) router.push(href);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-64 h-20 pl-6 pr-3 rounded-full flex items-center justify-between transition-all duration-500 ease-in-out"
      style={{
        backgroundColor: isHovered ? "#F28A2E" : "white",
      }}
    >
      <span
        className={`text-lg font-semibold font-['Lato'] transition-colors duration-500 ${
          isHovered ? "text-white" : "text-slate-500"
        }`}
      >
        {buttonText}
      </span>
      <div className="relative w-16 h-16 pr-5">
        <div
          className={`w-16 h-16 absolute rounded-full flex items-center justify-center transition-all duration-500 ease-in-out`}
          style={{
            backgroundColor: isHovered ? "white" : "#F28A2E",
          }}
        >
          {/* Smooth Arrow Transition */}
          <div className="relative w-8 h-8">
            <ArrowUpRight
              className={`absolute w-8 h-8 text-white transition-all duration-500 transform ${
                isHovered ? "opacity-0 translate-x-4 scale-90" : "opacity-100 translate-x-0 scale-100"
              }`}
              strokeWidth={2}
            />
            <ArrowRight
              className={`absolute w-8 h-8 text-primary transition-all duration-500 transform ${
                isHovered ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-4 scale-90"
              }`}
              strokeWidth={2}
            />
          </div>
        </div>
      </div>
    </button>
  );
}