import Image from "next/image";
import { ArrowLeft, InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CdLoader from "@/components/ui/custom/cd-loader";


interface PackageInfoProps {
  labPackage: any;
  onBack: () => void;
}

export default function PackageInfo({ labPackage, onBack }: PackageInfoProps) {
  if(!labPackage) return <CdLoader />;
  const parametersArray = labPackage?.parameters ? labPackage.parameters.split(",") : [];
  return (
    <div className="space-y-8 px-20">
      {/* Back Button */}
      <button onClick={onBack} className="inline-flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      {/* Package Info */}
      <div className="flex justify-between items-start border-b-2 mb-20">
        <div className="space-y-4 pb-8">
          <h1 className="text-3xl font-bold">{labPackage?.name}</h1>
          <p className="text-gray-600">{labPackage?.description}</p>
          <p className="text-gray-500">₹ {labPackage?.price}</p>
          <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <span>{parametersArray.length} Parameters</span>
                    {parametersArray.length > 0 && (
                        <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoIcon className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 text-white text-xs p-2 rounded-md">
                                {parametersArray.join(", ")}
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
        </div>
        <div className="relative w-48 h-48 rounded-lg overflow-hidden">
        <div className=" text-white px-3 py-5 flex items-center justify-center w-12 md:w-16">
                <p className="bg-gradient-to-r from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent text-4xl transform rotate-90 whitespace-nowrap">
                    {labPackage.name}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}