import DietDetails from "@/components/patients/home/DietDetails";
import FooterVideo from "@/components/patients/home/FooterVideo";
import AppointmentInfo from "@/patients/home/AppointmentInfo";
import ArticlesSection from "@/patients/home/ArticleSection";
import HealthInsightsPanel from "@/patients/home/HealthInsightsPanel";
import HomeOverview from "@/patients/home/HomeOverview";
import HomeServiceBookingCard from "@/patients/home/HomeServiceBookingCard";
import MakeScheduleInfo from "@/patients/home/MakeScheduleInfo";
import Image from "next/image";

export default function Home() {
    return (
        <div className="">
            <HomeOverview />

            <div className="px-4 md:px-20 bg-muted py-4 w-full">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-4 w-full">
                    <div className="w-full">
                        <HomeServiceBookingCard
                            title="GDM Care"
                            description="You can book the appointment from here.."
                            buttonText="Explore our Plans"
                            iconSrc="/icons/mother.svg"
                            href="/dashboard/plans"
                        />
                    </div>
                    <div className="w-full">
                        <HomeServiceBookingCard
                            title="Lab Test"
                            description="You can book the appointment from here.."
                            buttonText="Book a Lab Test"
                            iconSrc="/images/lab-test.png"
                            href="/dashboard/labs"
                        />
                    </div>
                    <div className="w-full">
                        <HomeServiceBookingCard
                            title="Consultation"
                            description="You can book the appointment from here.."
                            buttonText="Book Consultation"
                            iconSrc="/images/consultation.png"
                            href="/dashboard/doctors"
                        />
                    </div>
                    <div className="w-full">
                        <HomeServiceBookingCard
                            title="Medicine Delivery"
                            description="You can book the appointment from here.."
                            buttonText="Book Medicines"
                            iconSrc="/images/medicines-delivery.png"
                            href="/dashboard/medicines"
                        />
                    </div>
                </div>
            </div>

            {/* <HealthInsightsPanel /> */}

            <div className="px-20 py-4 flex justify-center w-full">
                <div className="flex flex-col flex-grow bg-muted justify-start items-center gap-5 rounded-r-lg">
                    <div className="py-10 justify-items-center flex flex-col items-center gap-5">
                        <Image width={16} height={16} className="w-16 h-16" src="/images/hand-heart.svg" alt="Hand holding a heart" />
                        <div className="w-full justify-start text-gray-800 text-base font-normal font-['Lato']">Heart Attack Risk Predictor</div>

                    </div>
                </div>
            </div>
            <DietDetails />

            <MakeScheduleInfo />
            <AppointmentInfo />
            <ArticlesSection />
            <FooterVideo />
        </div>
    )
}
