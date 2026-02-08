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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col text-center items-center mt-16 mb-3">
        <Image
          src={clinicLogo}
          alt={`${clinicName} logo`}
          width={200}
          height={250}
          className="mb-4"
        />
        <h1 className="text-3xl font-bold text-black ">{clinicName}</h1>
        {clinicSubtitle && (
          <p className="text-lg mt-4 text-gray-600">{clinicSubtitle}</p>
        )}
      </div>

      {/* SignIn Component */}
      <div className="flex-1">
        <SignIn />
      </div>
    </div>
  );
}