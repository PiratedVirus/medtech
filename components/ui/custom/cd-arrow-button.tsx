"use client";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react"; 

interface ArrowButtonProps {
  buttonText: string;
  href?: string; 
}

export default function ArrowButton({ buttonText, href }: ArrowButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (href) router.push(href);
      }}
      className="flex items-center gap-2 bg-[#f28a2e] hover:bg-[#e07a20] text-white text-lg py-4 px-6 rounded-full"
    >
      {buttonText}
      <ArrowUpRight size={20} />
    </button>
  );
}