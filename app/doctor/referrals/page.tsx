"use client";

import { useEffect, useState } from "react";
import { useDecryptedProfile } from "@/hooks/use-profile";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Users, Link as LinkIcon, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CdLoader from "@/components/ui/custom/cd-loader";
import { format } from "date-fns";

interface ReferredPatient {
  id: number;
  name: string;
  phoneNumber: string;
  registeredAt: string;
  appointments: {
    id: number;
    date: string;
    status: string;
  }[];
}

export default function ReferralsPage() {
  const { profile, isLoading: profileLoading } = useDecryptedProfile();
  const [doctorCode, setDoctorCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const [referredPatients, setReferredPatients] = useState<ReferredPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const [profileResponse, patientsResponse] = await Promise.all([
        axios.get("/api/doctor/profile"),
        axios.get("/api/doctor/referred-patients"),
      ]);

      if (profileResponse.data?.doctorCode) {
        setDoctorCode(profileResponse.data.doctorCode);
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/register?code=${profileResponse.data.doctorCode}`);
      }

      if (patientsResponse.data) {
        setReferredPatients(patientsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsCopied(true);
      toast.success("Referral link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleViewPatient = (patientId: number) => {
    router.push(`/doctor/patients/${patientId}`);
  };

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-md border">
                <p className="text-sm text-gray-600 break-all">{referralLink}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className={isCopied ? "text-green-600" : ""}
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Share this link with your patients to track referrals and manage their care
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referred Patients Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Referred Patients</CardTitle>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500">
                {referredPatients.length} patients
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {referredPatients.length > 0 ? (
            <div className="space-y-4">
              {referredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{patient.name}</h3>
                        <p className="text-sm text-gray-500">
                          Registered on{" "}
                          {format(new Date(patient.registeredAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.appointments.length} appointment
                          {patient.appointments.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPatient(patient.id)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No referred patients yet
              </h3>
              <p className="text-sm text-gray-500">
                Share your referral link to start tracking your patients
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 