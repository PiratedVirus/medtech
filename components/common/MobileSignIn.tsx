import SignIn from "@/components/common/SignIn";
import Image from "next/image";

interface MobileSignInProps {
  branding?: {
    name?: string | null;
    subtitle?: string | null;
    logo?: string | null;
  };
}

export default function MobileSignInPage({ branding }: MobileSignInProps) {
  const clinicName = branding?.name || "Care Diabetics";
  const clinicSubtitle = branding?.subtitle || null;
  const clinicLogo = branding?.logo || "/images/new-logo.png";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col text-center items-center mt-8 mb-2 md:mt-16 md:mb-4">
        <Image
          src={clinicLogo}
          alt={`${clinicName} logo`}
          width={120}
          height={120}
          className="mb-3 h-20 w-20 md:h-28 md:w-28 object-contain"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-black ">{clinicName}</h1>
        {clinicSubtitle && (
          <p className="text-sm md:text-lg mt-2 md:mt-4 text-gray-600 px-4">
            {clinicSubtitle}
          </p>
        )}
      </div>

      {/* SignIn Component */}
      <div className="flex-1 overflow-y-auto">
        <SignIn />
      </div>
    </div>
  );
}