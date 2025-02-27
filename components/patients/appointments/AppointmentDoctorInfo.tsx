// components/DoctorInfo.tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ThumbsUp } from "lucide-react";

interface DoctorInfoProps {
  doctor: any;
  onBack: () => void;
}

export function DoctorInfo({ doctor, onBack }: DoctorInfoProps) {
  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="#" onClick={onBack} className="inline-flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Link>
      {/* Doctor Info */}
      <div className="flex justify-between items-start border-b-2 mb-20">
        <div className="space-y-4 pb-8">
          <h1 className="text-3xl font-bold">{doctor?.name}</h1>
          <p className="text-gray-600">{doctor?.doctorProfile.specialty}</p>
          <p className="text-gray-500">{doctor?.doctorProfile.yearsOfExperience} years overall experience</p>
          <p className="text-gray-600">₹ {doctor?.doctorProfile.consultationFee} Consultation fee at clinic</p>
          <div className="flex items-center gap-4">
            <ThumbsUp className="h-4 w-4 text-green-400" />
            <span className="text-green-600 font-semibold">{doctor?.doctorProfile.rating}</span>
          </div>
        </div>
        <div className="relative w-48 h-48 rounded-lg overflow-hidden">
          <Image
            src="/images/doc.png?height=192&width=192"
            alt="doctor"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}