import HomeServiceBookingCard from "./HomeServiceBookingCard";

export default function ServiceCard() {
    return (
        <>
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
                    </>
    )
}