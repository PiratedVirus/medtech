import HomeOverview from "@/components/patients/home/HomeOverview";
import HomeServiceBookingCard from "@/components/patients/home/HomeServiceBookingCard";
import HealthInsightsCard from "@/components/patients/home/cd-health-insights-card";


export default function Home() {
    return (
        <div className="">
            <HomeOverview />
            <div className="pr-20 bg-muted py-4 flex flex-wrap justify-center gap-6">
                {/* <HealthInsightsCard /> */}
                <HomeServiceBookingCard 
                    title="GDM Care"
                    description="You can book the appointment from here.."
                    buttonText="Explore our Plans"
                    iconSrc="/icons/mother.svg"
                    href="/dashboard/plans"
                />
                <HomeServiceBookingCard 
                    title="Lab Test"
                    description="You can book the appointment from here.."
                    buttonText="Book a Lab Test"
                    iconSrc="/images/lab-test.png"
                    href="/dashboard/labs"
                />
                <HomeServiceBookingCard 
                    title="Consultation"
                    description="You can book the appointment from here.."
                    buttonText="Book Consultation"
                    iconSrc="/images/consultation.png"
                    href="/dashboard/doctors"
                />
                <HomeServiceBookingCard 
                    title="Medicine Delivery"
                    description="You can book the appointment from here.."
                    buttonText="Book Medicines"
                    iconSrc="/images/medicines-delivery.png"
                    href="/dashboard/medicines"
                />
            </div>
        </div>
    )
}

