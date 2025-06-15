"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { put } from "@vercel/blob";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface LabBooking {
  id: number;
  labDate: string;
  status: string;
  labResult: string[];
  patient: { name: string };
  labPackage: { name: string };
}

export default function AdminLabBookingsPage() {
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
  const [uploadingBookingId, setUploadingBookingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("/api/admin/dashboard/lab-bookings");
      setLabBookings(res.data);
    } catch (err) {
      console.error("Failed to fetch lab bookings", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleMultipleFilesUpload = async (files: FileList, id: number) => {
    if (!files || !id) return;
    setUploading(true);
    try {
      const uploadedLinks: string[] = [];
      for (const file of Array.from(files)) {
        const arrayBuffer = await file.arrayBuffer();
        const fileName = `lab-${id}-${file.name}`;
        const { url } = await put(fileName, arrayBuffer, {
          access: "public",
          token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
        });
        uploadedLinks.push(url);
      }

      await axios.put(`/api/admin/dashboard/patients-details`, {
        labBookingId: id,
        links: uploadedLinks,
      });

      await fetchBookings();
      setUploadSuccess(true);
      toast.success("Lab reports uploaded successfully.");
      setTimeout(() => {
        setUploadingBookingId(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const UploadDropZone = () => (
    <div
      className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition"
      onDrop={async (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && uploadingBookingId) {
          await handleMultipleFilesUpload(files, uploadingBookingId);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 16v-4m0 0l-2 2m2-2l2 2m6 4H6a2 2 0 01-2-2V7a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0012 7h8a2 2 0 012 2v7a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-gray-600">Drag & drop PDF here or click below</p>
        <label className="cursor-pointer bg-muted px-3 py-1 text-sm rounded border border-gray-300 mt-2 hover:bg-primary hover:text-white transition">
          Browse files
          <input
            type="file"
            accept="application/pdf"
            multiple
            hidden
            onChange={async (e) => {
              if (uploadingBookingId && e.target.files) {
                await handleMultipleFilesUpload(e.target.files, uploadingBookingId);
              }
            }}
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 bg-white space-y-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold">Lab Bookings</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-custom-mutedgreen text-gray-950">
            <TableRow className="text-center">
              <TableHead className="text-black">Patient</TableHead>
              <TableHead className="text-black">Package</TableHead>
              <TableHead className="text-black">Date</TableHead>
              <TableHead className="text-black">Status</TableHead>
              <TableHead className="text-black">Reports</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labBookings.map((booking) => (
              <TableRow key={booking.id} className="text-center">
                <TableCell>{booking.patient?.name}</TableCell>
                <TableCell>{booking.labPackage?.name}</TableCell>
                <TableCell>{new Date(booking.labDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge>{booking.status}</Badge>
                </TableCell>
                <TableCell>
                  {booking.labResult && booking.labResult.length > 0 ? (
                    booking.labResult.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="m-1">View {idx + 1}</Button>
                      </a>
                    ))
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setUploadingBookingId(booking.id)}>
                          Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Upload Lab Report PDF</DialogTitle>
                        <UploadDropZone />
                        {uploading && <p>Uploading...</p>}
                        {uploadSuccess && (
                          <p className="text-green-600 text-sm text-center mt-2">Upload successful!</p>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
