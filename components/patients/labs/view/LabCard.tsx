import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EyeIcon } from "lucide-react";
import ViewParametersDialog from "@/components/common/ViewParametersDialog";
import { useState } from "react";
interface LabCardProps {
    labPackage: {
        name: string;
        description: string;
        shortDescription: string;
        price: number;
        parameters?: string; // Assuming this can be a JSON string or comma-separated string
        criticalRequirements?: string; // Assuming this is a comma-separated string
    };
    handleBookAppointment?: (labPackage: any) => void;
}

export default function LabCard({ labPackage, handleBookAppointment }: LabCardProps) {
    let parsedParameters: Record<string, string[]> = {};
    let parameterCount = 0;
    
    try {
      if (typeof labPackage.parameters === "string") {
        // Try to parse as JSON first
        parsedParameters = JSON.parse(labPackage.parameters);
      } else if (
        typeof labPackage.parameters === "object" &&
        labPackage.parameters !== null
      ) {
        parsedParameters = labPackage.parameters;
      }
      parameterCount = Object.values(parsedParameters).reduce((acc, arr) => acc + arr.length, 0);
    } catch (e) {
      // If JSON parsing fails, treat as comma-separated string (legacy format)
      console.warn("Failed to parse lab parameters as JSON, treating as comma-separated string", e);
      if (typeof labPackage.parameters === "string") {
        const params = labPackage.parameters.split(",").map(p => p.trim()).filter(p => p);
        parsedParameters = { "Parameters": params };
        parameterCount = params.length;
      }
    }
    
    const [open, setOpen] = useState(false);

    return (
        <div className="flex h-72 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 w-full md:w-96">
            {/* Left Column: Rotated Package Name */}
            
            <div className=" text-white bg-custom-mutedgreen px-3 py-5 flex items-center justify-center w-12 md:w-16">
                <p className="bg-gradient-to-r from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent text-3xl transform -rotate-90 whitespace-nowrap">
                    {labPackage.name}
                </p>
            </div>

            {/* Right Column: Package Details */}
            <div className="flex-1 py-6 px-4 flex flex-col justify-between">
                <div className="space-y-3">
                    {/* Row 1: Package Name */}
                    <h3 className="text-xl font-semibold text-primary">
                        {labPackage.name} <span className="text-black"></span>
                    </h3>

                    {/* Row 2: Package Description */}
                    <p className="text-gray-600 text-sm">{labPackage.shortDescription}</p>
                    {labPackage.criticalRequirements?.split(",").map((item, index) => (
                        <Badge key={index} variant="outline" className="bg-red-400 text-white shadow-none ">
                            {item.trim()}
                        </Badge>
                    ))}

                    {/* Row 3: Parameters with EyeIcon */}
                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <span>{parameterCount} Parameters</span>
                        {parameterCount > 0 && (
                            <>
                                <EyeIcon
                                    className="h-4 w-4 text-green-600 cursor-pointer"
                                    onClick={() => setOpen(true)}
                                />
                                <ViewParametersDialog
                                    open={open}
                                    onOpenChange={setOpen}
                                    parameters={parsedParameters}
                                />
                            </>
                        )}
                    </div>

                    {/* Row 4: Price */}
                    <p className="text-lg font-semibold mb-2 text-green-600">₹{labPackage.price}</p>
                </div>

                {/* Row 5: Book Appointment Button (Centered) */}
                <div className="flex justify-center gap-3">
                    <Button
                        onClick={() => handleBookAppointment?.(labPackage)}
                        size={"sm"}
                        className="px-6 py-2 rounded-full bg-primary text-white"
                    >
                        Book
                    </Button>
                    <Button
                        variant="outline"
                        size={"sm"}
                        onClick={() => setOpen(true)}
                        className="px-6 py-2 rounded-full border-primary  text-primary"
                    >
                        View Parameters
                    </Button>
                </div>
            </div>
        </div>
    );
}