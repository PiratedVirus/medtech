import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";interface ArrowButtonProps {
    buttonText: string;
    href?: string; 
}
export default function ArrowButton({ buttonText, href}: ArrowButtonProps) {
  const router = useRouter();
  return (
    <button  
      onClick={() => { if (href) router.push(href);}}
      className="w-64 h-20 pl-6 pr-3 bg-white rounded-full flex items-center justify-between">
      <span className="text-slate-500 text-lg font-semibold font-['Lato']">
        {buttonText}
      </span>
      <div className="relative w-16 h-16 pr-5">
        <div className="w-16 h-16 absolute bg-orange-400 rounded-full flex items-center justify-center">
          <ArrowUpRight className="w-8 h-8 text-white" strokeWidth={2} />
        </div>
      </div>
    </button>
  );
}