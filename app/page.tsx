import { Button } from "@/components/ui/button"
import SignIn from "./ui-comp/SignIn"
import FullPage from "./ui-comp/FullPage"
import GDMCard from "./ui-comp/BookingCard"
import HealthInsightsCard from "./ui-comp/HealthInsightsCard"
export default function Home() {
  return (
    <div>
      {/* <SignIn /> */}
      <FullPage/>
      {/* <GDMCard
        title="GDM Care"
        description="You can book the appointment from here.."
        iconSrc="/icons/mother.svg"
        buttonText="Explore our Plans"
      />
      <HealthInsightsCard/> */}
    </div>
  )
}
