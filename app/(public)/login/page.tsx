import SignIn from "@/components/common/SignIn";
import HeroSection from "@/components/common/HeroSection";
import MobileSignIn from "@/components/common/MobileSignIn";
import prisma from "@/lib/prisma";
import { extractSubdomain } from "@/lib/subdomain-utils";
import { headers } from "next/headers";

type LoginBranding = {
  name: string;
  subtitle: string | null;
  logo: string | null;
};

const defaultBranding: LoginBranding = {
  name: "Care Diabetics",
  subtitle: "Your Partner in Diabetes Care",
  logo: "/images/new-logo.png",
};

async function getLoginBranding(): Promise<LoginBranding> {
  const host = (await headers()).get("host") || "";
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    return defaultBranding;
  }

  const clinic = await prisma.clinic.findFirst({
    where: {
      subdomain: subdomain.toLowerCase(),
      deletedAt: null,
    },
    select: {
      name: true,
      subtitle: true,
      logo: true,
    },
  });

  if (!clinic) {
    return defaultBranding;
  }

  return {
    name: clinic.name || defaultBranding.name,
    subtitle: clinic.subtitle,
    logo: clinic.logo || defaultBranding.logo,
  };
}

export default async function Page() {
  const branding = await getLoginBranding();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex flex-1 overflow-hidden">
        {/* For larger screens */}
        <div className="hidden md:flex w-full">
          <HeroSection branding={branding} />
          <div className="w-5/1">
            <SignIn />
          </div>
        </div>

        {/* For mobile screens */}
        <div className="flex md:hidden w-full">
          <MobileSignIn branding={branding} />
          {/* <p>Mobile View</p> */}
        </div>
      </main>
    </div>
  );
}