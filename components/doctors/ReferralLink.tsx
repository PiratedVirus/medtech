"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

interface ReferralLinkProps {
  doctorCode: string;
}

export default function ReferralLink({ doctorCode }: ReferralLinkProps) {
  const [referralLink, setReferralLink] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateLink = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/admin/doctors/generate-referral-link", {
        doctorCode
      });
      
      if (response.data.success) {
        setReferralLink(response.data.referralLink);
      } else {
        toast.error(response.data.error || "Failed to generate link");
      }
    } catch (error) {
      toast.error("Failed to generate referral link");
    } finally {
      setIsLoading(false);
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

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Patient Referral Link</h3>
        <p className="text-sm text-gray-500">
          Share this link with your patients to register with your doctor code
        </p>
      </div>

      {!referralLink ? (
        <Button 
          onClick={generateLink} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Generating..." : "Generate Referral Link"}
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
    </Card>
  );
} 