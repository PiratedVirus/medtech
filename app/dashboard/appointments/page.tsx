import UpcomingAppointment from "@/components/ui/custom/cd-upcoming-appointment-card";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";

export default function Page() {
    return (
        <div className="py-7 md:px-20 bg-muted">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-7">
                <div className="md:col-span-8 ">
                    <UpcomingAppointment />
                </div>

                <div className="md:col-span-4 p-6 rounded-3xl relative overflow-hidden bg-custom-mutedgreen flex items-center justify-center">
                    <ArrowButton buttonText="Book an Appointment" />
                </div>
            </div>
            <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
        <div>
          <p className="text-4xl font-bold text-gray-800">
            Past Appointments
          </p>
          <div className="flex items-center gap-2 mt-5">
            <p className="text-lg">
            Here you can view your previous appointments
            </p>
          </div>
        </div>

  
      </div>
        </div>
    );
}