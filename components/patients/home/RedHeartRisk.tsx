"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HeartRiskCardRed() {
  return (
    <Link href="/heart-risk-predictor" className="block w-full">
      <Card className="group relative w-full sm:h-[194px] md:h-[184px] overflow-hidden border-0 bg-gradient-to-br from-red-600 to-red-900 shadow-md transition-all duration-300 hover:shadow-lg">
        {/* Large heart outline in background */}
        <div className="absolute -right-12 -top-4 h-64 w-64 opacity-10">
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-white">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative flex h-full flex-col justify-between p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              {/* Heart with beating animation */}
              <Heart className="h-6 w-6 fill-red-200 animate-beat" />
            </div>
            <span className="text-sm font-medium text-red-200">Cardiac Assessment</span>
          </div>

          <div>
            <h3 className="mb-2 text-2xl font-bold">Heart Risk Predictor</h3>
            <p className="mb-4 text-sm text-red-200/90">
              Advanced analysis of your cardiovascular health metrics
            </p>

            <div className="flex items-center text-sm font-medium text-white transition-all duration-300 group-hover:translate-x-1">
              Evaluate your risk factors
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}