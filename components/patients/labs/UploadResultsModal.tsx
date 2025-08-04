"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "react-toastify";

interface UploadResultsModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: number;
  patientName: string;
  onUploaded: () => void;
}

export default function UploadResultsModal({
  open,
  onClose,
  bookingId,
  patientName,
  onUploaded,
}: UploadResultsModalProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!files || files.length === 0) {
      toast.warning("Please select at least one file");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    formData.append("bookingId", bookingId.toString());
    formData.append("patientName", patientName);
    try {
      const res = await fetch("/api/pathology/upload-lab-report", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Reports uploaded successfully");
      onUploaded();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload reports");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="mb-4 text-lg font-semibold text-gray-800">Upload Lab Reports</DialogTitle>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFiles(e.target.files)}
          className="w-full border p-2"
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            <Upload className="h-4 w-4 mr-1" /> {submitting ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
