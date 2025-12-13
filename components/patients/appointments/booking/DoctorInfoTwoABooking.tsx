import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { formatDateString } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store";


interface AppointmentDoctorInfoProps {
  slot: any;
  doctor: any;
  onBack: () => void;
}

export default function DoctorInfoTwo({
  slot,
  doctor,
  onBack,
}: AppointmentDoctorInfoProps) {
  const bookingData = useSelector((state: RootState) => state.appointment.bookingData);
  const imageSrc = doctor?.userProfilePicture || bookingData?.doctor?.userProfilePicture || "/images/doc.png";
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]">
        <div className="bg-muted pt-4 pb-0 px-4 sm:px-10 lg:px-20 lg:pb-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary mb-4 lg:mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[15px]">Back</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 justify-between">
            <div className="">
              <h1 className="text-[22px] sm:text-[28px] font-bold text-[#2C2E38] mb-2">
                {doctor?.name}
              </h1>
              <p className="text-[14px] sm:text-[15px] text-[#5F6377] mb-4 sm:mb-6">
                {doctor?.doctorProfile?.specialty}
              </p>
            </div>

            <div className="relative w-24 h-24 hidden sm:block rounded-full overflow-hidden shrink-0">
              <Image
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-3 max-w-md sm:space-y-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[#5F6377]">
                  {doctor?.doctorProfile?.yearsOfExperience} years overall
                  experience
                </span>{" "}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#5F6377]">
                  ₹ {doctor?.doctorProfile?.consultationFee} Consultation fee at
                  clinic
                </span>{" "}
              </div>
              {/* <div className="flex items-center gap-2">
                <span className="text-[#56A67C] font-medium">100%</span>
                <Link
                  href="#"
                  className="text-[#5F6377] underline hover:text-[#56A67C] transition-colors"
                >
                  69 Patient stories
                </Link>
              </div> */}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-t from-[#134F30] to-[#56A67C] px-4 py-4 sm:p-6 lg:p-8 pb-2 sm:pb-4 lg:pb-6 text-white">
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              <span className="text-[14px] sm:text-[15px] font-medium">
                On {formatDateString(slot?.date)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <span className="text-[14px] sm:text-[15px] font-medium">
                At {slot?.startTime} - {slot?.endTime}
              </span>
            </div>
          </div>

          <a onClick={onBack} className="w-full cursor-pointer text-[14px] sm:text-[15px] font-medium text-white  hover:bg-white/10 transition-colors mb-6">
            Change Date & Time
          </a>

          <h2 className="text-[16px] sm:text-[18px] font-medium">
            { (bookingData?.type === 'clinic') ? ('In-clinic Appointment') : ('Video Consultation') }
          </h2>
        </div>
      </div>
    </>
  );
}
