import Image from "next/image";
import { ArrowLeft, EyeIcon } from "lucide-react";
import CdLoader from "@/components/ui/custom/cd-loader";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ViewParametersDialog from "@/components/common/ViewParametersDialog";


interface PackageInfoProps {
  labPackage: any;
  onBack: () => void;
}

export default function PackageInfo({ labPackage, onBack }: PackageInfoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!labPackage) return <CdLoader />;
  // Normalize parameters: can be object (grouped), array, or string
  let parametersArray: string[] = [];
  try {
    const raw = labPackage?.parameters;
    if (Array.isArray(raw)) {
      parametersArray = raw.map((p: any) => String(p).trim()).filter(Boolean);
    } else if (raw && typeof raw === 'object') {
      const values = Object.values(raw as Record<string, any>).flat();
      parametersArray = (values as any[]).map((p: any) => String(p).trim()).filter(Boolean);
    } else if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          parametersArray = Array.isArray(parsed) ? parsed.map((p: any) => String(p).trim()) : [String(parsed).trim()];
        } catch {
          parametersArray = trimmed.split(',').map((p: string) => p.trim()).filter(Boolean);
        }
      } else {
        parametersArray = trimmed.split(',').map((p: string) => p.trim()).filter(Boolean);
      }
    }
  } catch {
    parametersArray = [];
  }
  return (
    <div className="space-y-8 px-5 sm:px-20">
      {/* Back Button */}
      <button onClick={() => router.push("/dashboard/labs")} className="inline-flex pt-5 items-center text-primary">
        <ArrowLeft className="h-4 w-4 mr-2 " />
        Back
      </button>
      {/* Package Info */}
      <div className="flex justify-between items-start border-b-2 mb-20">
        <div className="space-y-4 pb-8">
          <h1 className="text-3xl font-bold">{labPackage?.name}</h1>
          <p className="text-gray-600">{labPackage?.description}</p>
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            <span>{parametersArray.length} Parameters</span>
            {parametersArray.length > 0 && (
              <>
                <EyeIcon
                  className="h-4 w-4 text-green-600 cursor-pointer"
                  onClick={() => setOpen(true)}
                />
                <ViewParametersDialog
                  open={open}
                  onOpenChange={setOpen}
                  parameters={parametersArray}
                />
              </>
            )}
          </div>
          <h2 className="text-primary text-2xl font-semibold">₹ {labPackage?.price}</h2>

        </div>
     
      </div>
    </div>
  );
}