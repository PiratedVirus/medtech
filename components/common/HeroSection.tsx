import Image from "next/image"

interface HeroSectionProps {
  branding?: {
    name?: string | null;
    subtitle?: string | null;
  };
}

export default function HeroSection({ branding }: HeroSectionProps) {
  const clinicName = branding?.name || "Care Diabetics";
  const clinicSubtitle = branding?.subtitle || null;

  return (
    <div className="w-7/12 flex flex-col relative bg-[#f9fafb]">
      {/* Background Image */}
      <Image
        src="/images/bg-blur.png"
        alt="Background"
        fill
        objectFit="cover"
        className="object-cover z-0"
        priority
      />

      {/* Content Container with backdrop overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top half */}
        <div className="flex-1 mb-4 px-10 mt-20">
          <h1 className="text-6xl font-semibold text-black-700">
            {clinicName}
          </h1>
          {clinicSubtitle && (
            <p className="text-3xl mt-9 text-black-500">{clinicSubtitle}</p>
          )}
        </div>

        {/* Bottom half with 3 columns */}
        <div className="flex h-1/2 gap-4">
          {/* 60% width column */}
          <div className="w-[60%] relative">
            <Image
              src="/images/brahmarx-laptop.png"
              alt="Large image"
              width={800}
              height={600}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
            />
          </div>

          {/* 20% width column */}
          <div className="w-[20%] relative mb-4">
            <Image
              src="/images/playstore.png"
              alt="Medium image"
              width={150}
              height={150}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
            />
          </div>

          {/* 20% width column */}
          <div className="w-[20%] relative mb-4">
            <Image
              src="/images/appstore.png"
              alt="Medium image"
              width={150}
              height={150}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

