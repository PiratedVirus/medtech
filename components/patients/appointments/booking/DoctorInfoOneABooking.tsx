import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ThumbsUp } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
interface DoctorInfoProps {
  doctor: any;
  onBack: () => void;
}

export function DoctorInfoOne({ doctor, onBack }: DoctorInfoProps) {
  const router = useRouter();
  const onBackClick = () => {
    router.push("/dashboard/doctors");
  };
  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={onBackClick}
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      {/* Doctor Info */}
      <div className="flex justify-between items-start border-b-2 mb-20">
        <div className="space-y-4 pb-8">
          <h1 className="text-3xl font-bold">{doctor?.name}</h1>
          <p className="text-gray-600">{doctor?.doctorProfile.specialty}</p>
          <p className="text-gray-500">
            {doctor?.doctorProfile.yearsOfExperience} years overall experience
          </p>
          <p className="text-gray-600">
            ₹ {doctor?.doctorProfile.consultationFee} Consultation fee at clinic
          </p>
          <div className="flex items-center gap-4">
            <ThumbsUp className="h-4 w-4 text-green-400" />
            <span className="text-green-600 font-semibold">
              {doctor?.doctorProfile.rating}
            </span>
          </div>
        </div>
        <div className="relative w-48 h-48 rounded-lg overflow-hidden">
          <Image
            src={doctor.userProfilePicture || "/images/doc.png"}
            alt="doctor"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
