'use client';

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  patientDetails: {
    doctorAppointments: {
      payment?: {
        amount: number;
      };
    }[];
    plans: {
      amount?: number;
    }[];
    labBookings: {
      paymentOption?: string;
    }[];
  };
}

const TotalEarningsCard = ({ patientDetails }: Props) => {
  const appointments = patientDetails.doctorAppointments || [];
  const subscriptions = patientDetails.plans || [];
  const labs = patientDetails.labBookings || [];

  const appointmentTotal = appointments.reduce((sum, a) => sum + (a.payment?.amount || 0), 0);
  const subscriptionTotal = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
  const labTotal = 0; // Placeholder for future lab earnings

  const total = appointmentTotal + subscriptionTotal + labTotal;

  const [displayedTotal, setDisplayedTotal] = useState(0);
  useEffect(() => {
    setDisplayedTotal(total);
  }, [total]);

  return (
    <Card className="group relative w-full h-[184px] overflow-hidden bg-custom-mutedgreen shadow-none transition-all duration-300">
      <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
        <TrendingUp size={160} />
      </div>

      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F28A2E]/10 to-[#56A67C]/10">
            <TrendingUp className="h-5 w-5 text-[#134F30]" />
          </div>
          <span className="text-xl font-semibold">Total Earnings</span>
        </div>

        <div className="flex justify-end items-end px-3 text-3xl font-bold text-[#134F30]">
          ₹&nbsp;
          <CountUp end={displayedTotal / 100} duration={1.5} decimals={2} />
        </div>
      </div>
    </Card>
  );
};

export default TotalEarningsCard;