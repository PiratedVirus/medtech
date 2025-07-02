"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Search } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Doctor {
  id: string;
  name: string;
  doctorProfile: {
    doctorCode: string;
    specialty: string;
  };
}

export default function DoctorReferralLinks() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("/api/admin/doctors");
      if (response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (error) {
      toast.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = async (doctorCode: string) => {
    try {
      const response = await axios.post("/api/admin/doctors/generate-referral-link", {
        doctorCode
      });
      
      if (response.data.success) {
        return response.data.referralLink;
      }
      throw new Error(response.data.error);
    } catch (error) {
      toast.error("Failed to generate referral link");
      return null;
    }
  };

  const copyToClipboard = async (text: string, doctorCode: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(doctorCode);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.doctorProfile.doctorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.doctorProfile.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Doctor Referral Links</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor Name</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead>Doctor Code</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>{doctor.name}</TableCell>
                <TableCell>{doctor.doctorProfile.specialty}</TableCell>
                <TableCell>{doctor.doctorProfile.doctorCode}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const link = await generateReferralLink(doctor.doctorProfile.doctorCode);
                      if (link) {
                        copyToClipboard(link, doctor.doctorProfile.doctorCode);
                      }
                    }}
                  >
                    {copiedCode === doctor.doctorProfile.doctorCode ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Link
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
} 