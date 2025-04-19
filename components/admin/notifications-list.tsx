"use client"

import { AlertCircle, Calendar, Clock, Users } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NotificationsList() {
  return (
    <div className="space-y-4">
      <Alert className="border-[#F28A2E] bg-[rgba(242,138,46,0.1)]">
        <Calendar className="h-4 w-4 text-[#F28A2E]" />
        <AlertTitle className="text-gray-800">Upcoming Appointments</AlertTitle>
        <AlertDescription>3 appointments scheduled in the next hour</AlertDescription>
      </Alert>

      <Alert className="border-[#56A67C] bg-[rgba(86,166,124,0.1)]">
        <AlertCircle className="h-4 w-4 text-[#134F30]" />
        <AlertTitle className="text-gray-800">Lab Samples</AlertTitle>
        <AlertDescription>2 lab samples pending collection today</AlertDescription>
      </Alert>

      <Alert className="border-[#F28A2E] bg-[rgba(242,138,46,0.1)]">
        <Clock className="h-4 w-4 text-[#F28A2E]" />
        <AlertTitle className="text-gray-800">Expiring Subscriptions</AlertTitle>
        <AlertDescription>5 subscriptions expiring within 7 days</AlertDescription>
      </Alert>

      <Alert className="border-[#56A67C] bg-[rgba(86,166,124,0.1)]">
        <Users className="h-4 w-4 text-[#134F30]" />
        <AlertTitle className="text-gray-800">User Status</AlertTitle>
        <AlertDescription>2 suspended user accounts require review</AlertDescription>
      </Alert>
    </div>
  )
}
