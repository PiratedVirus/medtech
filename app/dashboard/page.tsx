import Overview from "@/components/patients/Overview";
import BookingCard from "@/components/ui/custom/cd-booking-card";
import HealthInsightsCard from "@/components/ui/custom/cd-health-insights-card";


export default function Home() {
    return (
        <div className="">
            <Overview />
            <div className="pr-20 bg-muted py-4 flex flex-wrap justify-center gap-6">
                {/* <HealthInsightsCard /> */}
                <BookingCard 
                    title="GDM Care"
                    description="You can book the appointment from here.."
                    buttonText="Explore our Plans"
                    iconSrc="/icons/mother.svg"
                />
                <BookingCard 
                    title="Lab Test"
                    description="You can book the appointment from here.."
                    buttonText="Book a Lab Test"
                    iconSrc="/images/lab-test.png"
                />
                <BookingCard 
                    title="Consultation"
                    description="You can book the appointment from here.."
                    buttonText="Book Consultation"
                    iconSrc="/images/consultation.png"
                />
                <BookingCard 
                    title="Medicine Delivery"
                    description="You can book the appointment from here.."
                    buttonText="Book Medicines"
                    iconSrc="/images/medicines-delivery.png"
                />
            </div>
        </div>
    )
}

