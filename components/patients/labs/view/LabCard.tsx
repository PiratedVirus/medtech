import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface LabCardProps {
    labPackage: {
        name: string;
        description: string;
        price: number;
        parameters?: string; // Assuming this is a comma-separated string
    };
    handleBookAppointment?: (labPackage: any) => void;
}

export default function LabCard({ labPackage, handleBookAppointment }: LabCardProps) {
    const parametersArray = labPackage.parameters ? labPackage.parameters.split(",") : [];

    return (
        <div className="flex  bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 w-fit">
            {/* Left Column: Rotated Package Name */}
            
            <div className=" text-white bg-custom-mutedgreen px-3 py-5 flex items-center justify-center w-12 md:w-16">
                <p className="bg-gradient-to-r from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent text-3xl transform -rotate-90 whitespace-nowrap">
                    {labPackage.name}
                </p>
            </div>

            {/* Right Column: Package Details */}
            <div className="flex-1 py-6 px-4 space-y-4">
                {/* Row 1: Package Name */}
                <h3 className="text-xl font-semibold text-primary">
                    <span className="text-black"> Care Diabetics </span>{labPackage.name} <span className="text-black">Package</span>
                </h3>

                {/* Row 2: Package Description */}
                <p className="text-gray-600 text-sm">{labPackage.description}</p>
                <Badge variant="outline" className="bg-red-400 text-white">Fasting Required</Badge>


                {/* Row 3: Parameters with Tooltip */}
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

                {/* Row 4: Price */}
                <p className="text-lg font-semibold text-green-600">₹{labPackage.price}</p>

                {/* Row 5: Book Appointment Button (Centered) */}
                <div className="flex justify-center gap-3">
                    <Button
                        onClick={() => handleBookAppointment?.(labPackage)}
                        className="px-6 py-2 rounded-full bg-primary text-white"
                    >
                        Book Package
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleBookAppointment?.(labPackage)}
                        className="px-6 py-2 rounded-full border-primary  text-primary"
                    >
                        View Parameters
                    </Button>
                </div>
            </div>
        </div>
    );
}