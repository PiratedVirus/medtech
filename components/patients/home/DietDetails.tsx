"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { dietPlanData } from "@/lib/diet-plan" // Fallback data

export default function DietDetails() {
  const [dietPlan, setDietPlan] = useState(dietPlanData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDietPlan = async () => {
      try {
        setLoading(true)
        // In a real application, this would be an API call
        // const response = await fetch('/api/diet-plan');
        // const data = await response.json();

        // Simulating API call with timeout
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Using our local data for demonstration
        setDietPlan(dietPlanData)
        setLoading(false)
      } catch (err) {
        setError("Failed to load diet plan data")
        setLoading(false)
        console.error("Error fetching diet plan:", err)
      }
    }

    fetchDietPlan()
  }, [])

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12 bg-white rounded-xl shadow-sm">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading diet plan...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12 bg-white rounded-xl shadow-sm">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-500">{error}</p>
        </div>
      </section>
    )
  }

  const { meals, nutrition } = dietPlan

  return (
    <section className="max-w-full  mx-auto px-20 py-12 bg-white rounded-xl shadow-sm">
      <div className="grid md:grid-cols-4 gap-8 bg-muted p-8 rounded-xl">
        {/* Main content - 3/4 width */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-8 h-8">
              <Image
                src="/icons/diet-plan.svg"
                alt="Diet plan icon"
                width={64}
                height={64}
                className="w-full h-full"
              />
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-[#2c2e38]">Current Diet Plan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Breakfast Column */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#2c2e38] pb-2 border-b border-gray-200">Breakfast</h3>
              {meals.breakfast.map((item, index) => (
                <p key={`breakfast-${index}`} className="py-2 text-[#696969]">
                  {item}
                </p>
              ))}
            </div>

            {/* Lunch Column */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#2c2e38] pb-2 border-b border-gray-200">Lunch</h3>
              {meals.lunch.map((item, index) => (
                <p key={`lunch-${index}`} className="py-2 text-[#696969]">
                  {item}
                </p>
              ))}
            </div>

            {/* Dinner Column */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#2c2e38] pb-2 border-b border-gray-200">Dinner</h3>
              {meals.dinner.map((item, index) => (
                <p key={`dinner-${index}`} className="py-2 text-[#696969]">
                  {item}
                </p>
              ))}
            </div>

            {/* Snacks Column */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#2c2e38] pb-2 border-b border-gray-200">Snacks</h3>
              {meals.snacks.map((item, index) => (
                <p key={`snacks-${index}`} className="py-2 text-[#696969]">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - 1/4 width */}
        <div className="md:col-span-1 border-l border-gray-200 pl-6">
        <div className="flex items-center gap-4 mb-8">
            <div className="relative w-16 h-16">
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-[#2c2e38]">Daily Total</h2>
          </div>

          <div className="space-y-6 mb-10">
            {Object.entries(nutrition).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-lg font-medium text-[#2c2e38]">
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </span>
                <span className="text-lg font-bold text-[#2c2e38]">{value}</span>
              </div>
            ))}
          </div>

          <Button className="w-full bg-[#f28a2e] hover:bg-[#f28a2e]/90 text-white py-6 rounded-lg text-lg font-medium">
            Request New Diet Plan
          </Button>
        </div>
      </div>
    </section>
  )
}

