"use client";

import { useEffect, useState } from "react";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { toast } from "react-toastify";
import CdLoader from "@/components/ui/custom/cd-loader";

interface DoctorProfile {
  specialty: string;
  yearsOfExperience: number;
  consultationFee: number;
  doctorCode: string | null;
  user: {
    name: string;
    email: string;
    phoneNumber: string;
    userProfilePicture?: string;
  };
}

export default function DoctorProfilePage() {
  const { profile, isDoctor, isLoading: profileLoading } = useDecryptedProfile();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralLink, setReferralLink] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profile?.id) return;
      try {
        const response = await axios.get(`/api/profile?userId=${profile.id}`);
        if (response.data?.data) {
          const raw = response.data.data;
          setDoctorProfile({
            specialty: raw.doctorProfile.specialty,
            yearsOfExperience: raw.doctorProfile.yearsOfExperience,
            consultationFee: raw.doctorProfile.consultationFee,
            doctorCode: raw.doctorProfile.doctorCode,
            user: {
              name: raw.name,
              email: raw.email,
              phoneNumber: raw.phoneNumber,
              userProfilePicture: raw.userProfilePicture,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [profile]);

  const generateReferralLink = async () => {
    if (!doctorProfile?.doctorCode) {
      toast.error("No doctor code available");
      return;
    }

    try {
      const response = await axios.post("/api/admin/doctors/generate-referral-link", {
        doctorCode: doctorProfile.doctorCode
      });
      
      if (response.data.success) {
        setReferralLink(response.data.referralLink);
      } else {
        toast.error(response.data.error || "Failed to generate link");
      }
    } catch (error) {
      toast.error("Failed to generate referral link");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  if (!isDoctor) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-gray-600">This page is only accessible to doctors.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Doctor Profile</h1>
      
      {/* Profile Information */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Name:</span> {doctorProfile?.user.name}</p>
                <p><span className="font-medium">Email:</span> {doctorProfile?.user.email}</p>
                <p><span className="font-medium">Phone:</span> {doctorProfile?.user.phoneNumber}</p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Professional Information</h2>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Specialty:</span> {doctorProfile?.specialty}</p>
                <p><span className="font-medium">Experience:</span> {doctorProfile?.yearsOfExperience} years</p>
                <p><span className="font-medium">Consultation Fee:</span> ₹{doctorProfile?.consultationFee}</p>
                <p><span className="font-medium">Doctor Code:</span> {doctorProfile?.doctorCode || "Not assigned"}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Referral Link Section */}
      {doctorProfile?.doctorCode && (
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Patient Referral Link</h2>
            <p className="text-sm text-gray-500">
              Share this link with your patients to register with your doctor code
            </p>

            {!referralLink ? (
              <Button 
                onClick={generateReferralLink}
                className="w-full"
              >
                Generate Referral Link
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
