'use client';
import HealthInsightsCard from "@/components/ui/custom/cd-health-insights-card";
import { useRouter } from "next/navigation";
const healthMetrics = [
    {
        title: "Blood Glucose Level",
        reading: 80,
        unit: "mg/dL",
        statusLabel: "Normal",
        color: "#F8E5D3",
        imageSrc: "/icons/blood.svg",
        data: [{ value: 65 }, { value: 75 }, { value: 70 }, { value: 85 }, { value: 75 }, { value: 80 }, { value: 75 }],
    },
    {
        title: "Body Fat",
        reading: 18.9,
        unit: "%",
        statusLabel: "Normal",
        color: "#FAD4D4",
        imageSrc: "/icons/body-fat.svg",
        data: [{ value: 16 }, { value: 17 }, { value: 18 }, { value: 19 }, { value: 20 }, { value: 18.9 }, { value: 18 }],
    },
    {
        title: "Muscle Mass",
        reading: 63.3,
        unit: "%",
        statusLabel: "Normal",
        color: "#D4F1F9",
        imageSrc: "/icons/muscle.svg",
        data: [{ value: 60 }, { value: 61 }, { value: 62 }, { value: 63 }, { value: 64 }, { value: 63.3 }, { value: 63 }],
    },
    {
        title: "BMI",
        reading: 26,
        unit: "",
        statusLabel: "Normal",
        color: "#F9D4D4",
        imageSrc: "/icons/bmi.svg",
        data: [{ value: 24 }, { value: 25 }, { value: 25.5 }, { value: 26 }, { value: 27 }, { value: 26 }, { value: 26 }],
    },
    {
        title: "Body Water",
        reading: 45.9,
        unit: "%",
        statusLabel: "Normal",
        color: "#E0C6FC",
        imageSrc: "/icons/water.svg",
        data: [{ value: 44 }, { value: 45 }, { value: 45.5 }, { value: 46 }, { value: 45.9 }, { value: 45.5 }, { value: 45 }],
    },
    {
        title: "Visceral Fat",
        reading: 9,
        unit: "%",
        statusLabel: "Normal",
        color: "#C6DAFC",
        imageSrc: "/icons/v-fat.svg",
        data: [{ value: 8 }, { value: 8.5 }, { value: 9 }, { value: 9.2 }, { value: 9 }, { value: 9 }, { value: 9 }],
    },
];

export default function HealthInsightsPanel() {
    const router = useRouter();
    return (
        <div className="px-20 py-4 bg-custom-mutedbg flex flex-col justify-center">
            <div className="flex items-end w-full pb-5 justify-between my-3">
                <h2 className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-3xl font-semibold bg-clip-text text-transparent">
                    Health Insights
                </h2>
                <button
                    className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                    onClick={() => router.push("/dashboard/insights")}
                >
                    View Insights
                </button>

            </div>

            <div className="flex flex-row gap-3">
                {healthMetrics.map((metric, index) => (
                    <HealthInsightsCard key={index} {...metric} />
                ))}
            </div>

        </div>
    )
}