"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { put } from "@vercel/blob";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock3, EditIcon, FileText, ReceiptIndianRupee, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useReportUploadNotifications } from "@/hooks/context/ReportUploadNotificationsContext";

interface LabBooking {
  id: number;
  labDate: string;
  status: string;
  labResult: string[];
  payment?: {
    id: number;
    amount: number;
    paymentStatus: string;
    createdAt: string;
  } | null;
  patient: { name: string };
  labPackage: { name: string };
}

interface LabBookingSummary {
  paymentPending: number;
  paymentDone: number;
  reportsUploaded: number;
  reportsPending: number;
  paymentPendingAmount: number;
  paymentDoneAmount: number;
}

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "PHLEBOTOMIST_LEFT", label: "Phlebotomist Left" },
  { value: "SAMPLE_COLLECTED", label: "Sample Collected" },
  { value: "IN_LAB", label: "In Lab" },
  { value: "ANALYZING", label: "Analyzing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const fetchLabBookings = async (pageIndex: number, pageSize: number) => {
  const res = await axios.get(
    `/api/admin/optimized/lab-bookings?page=${pageIndex + 1}&pageSize=${pageSize}`
  );
  return res.data as { data: LabBooking[]; total: number; summary?: LabBookingSummary };
};

const updateStatus = async (id: number, status: string) => {
  await axios.put(`/api/admin/optimized/lab-bookings`, { id, status });
};

function getReportLabelFromUrl(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").pop();
    if (!filename) return `Report ${index + 1}`;
    return decodeURIComponent(filename);
  } catch {
    return `Report ${index + 1}`;
  }
}

function toUploadNamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function buildReportUploadFileName(patientName: string, originalName: string): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const extension = originalName.split(".").pop();
  const fileNameWithoutExt = toUploadNamePart(originalName.replace(/\.[^/.]+$/, "")) || "report";
  const patientPart = toUploadNamePart(patientName) || "patient";
  return `${patientPart}_${fileNameWithoutExt}_${datePart}.${extension}`;
}

export default function AdminLabBookingsPage() {
  const {
    createUploadNotification,
    markLabBookingUploadSucceeded,
    markUploadFailed,
  } = useReportUploadNotifications();
  const [data, setData] = useState<{ bookings: LabBooking[]; total: number }>({
    bookings: [],
    total: 0,
  });
  const [summary, setSummary] = useState<LabBookingSummary>({
    paymentPending: 0,
    paymentDone: 0,
    reportsUploaded: 0,
    reportsPending: 0,
    paymentPendingAmount: 0,
    paymentDoneAmount: 0,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [uploadingBookingId, setUploadingBookingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [collectingPaymentId, setCollectingPaymentId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<LabBooking | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");

  const columns: ColumnDef<LabBooking>[] = [
    {
      accessorFn: (row) => row.patient?.name,
      id: "patient.name",
      header: "Patient",
    },
    {
      accessorFn: (row) => row.labPackage?.name,
      id: "labPackage.name",
      header: "Package",
    },
    {
      accessorKey: "labDate",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Date</Button>
      ),
      cell: ({ row }) => new Date(row.getValue("labDate")).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "payment",
      header: "Payment",
      cell: ({ row }) => {
        const payment = row.original.payment;
        if (!payment) {
          return <Badge variant="outline">No Payment</Badge>;
        }

        const isPaid = String(payment.paymentStatus).toUpperCase() === "PAID";

        return (
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant={isPaid ? "default" : String(payment.paymentStatus).toUpperCase() === "PENDING" ? "destructive" : "outline"}
              className={isPaid ? "bg-green-600 hover:bg-green-600" : ""}
            >
              {payment.paymentStatus}
            </Badge>
            <span className="text-xs text-gray-600">₹{(payment.amount / 100).toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      id: "collectPayment",
      header: "Collect",
      cell: ({ row }) => {
        const payment = row.original.payment;
        const isPending = payment && String(payment.paymentStatus).toUpperCase() === "PENDING";

        if (!payment || !isPending) {
          return <span className="inline-block w-[92px]" aria-hidden="true" />;
        }

        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCollectPayment(payment.id)}
            disabled={collectingPaymentId === payment.id}
            className="min-w-[92px]"
          >
            {collectingPaymentId === payment.id ? "Collecting..." : "Collect"}
          </Button>
        );
      },
    },
    {
      id: "reports",
      header: "Reports",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {row.original.labResult && row.original.labResult.length > 0 ? (
            <>
              {row.original.labResult.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="max-w-[220px] truncate">
                    {getReportLabelFromUrl(url, idx)}
                  </Button>
                </a>
              ))}
              <Button
                size="icon"
                variant="outline"
                title="Manage reports"
                onClick={() => {
                  setSelectedBooking(row.original);
                  setReportsDialogOpen(true);
                }}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setUploadingBookingId(row.original.id)}>
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Upload Lab Report PDF</DialogTitle>
                  <UploadDropZone bookingId={uploadingBookingId} />
                  {uploading && <p>Uploading...</p>}
                  {uploadSuccess && (
                    <p className="text-green-600 text-sm text-center mt-2">Upload successful!</p>
                  )}
                </DialogContent>
              </Dialog>
              <Button
                size="icon"
                variant="outline"
                title="Manage reports"
                onClick={() => {
                  setSelectedBooking(row.original);
                  setReportsDialogOpen(true);
                }}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button
            size="sm"
            className="bg-transparent text-primary border-0 shadow-none"
            onClick={() => {
              setSelectedBooking(row.original);
              setEditStatus(String(row.original.status).toUpperCase());
              setUploadingBookingId(row.original.id);
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteBooking(row.original.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data.bookings,
    columns,
    pageCount: Math.ceil(data.total / pagination.pageSize),
    state: { sorting, pagination },
    manualPagination: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  async function fetchData() {
    const result = await fetchLabBookings(pagination.pageIndex, pagination.pageSize);
    setData({ bookings: result.data, total: result.total });
    if (result.summary) {
      setSummary(result.summary);
    }
  }

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  const handleMultipleFilesUpload = async (files: FileList, id: number) => {
    if (!files || !id) return;
    setUploading(true);
    const pendingNotifications: Array<{ notificationId: string; labResultIndex: number }> = [];
    try {
      const uploadedLinks: string[] = [];
      const booking = data.bookings.find((b) => b.id === id) || selectedBooking;
      const existingCount = booking?.labResult?.length || 0;

      for (const file of Array.from(files)) {
        const renamedFileName = buildReportUploadFileName(booking?.patient?.name || "patient", file.name);
        const notificationId = createUploadNotification({
          fileName: renamedFileName,
          reportType: "lab_report",
          patientId: 0,
          source: "lab-booking",
        });
        try {
          const arrayBuffer = await file.arrayBuffer();
          const { url } = await put(renamedFileName, arrayBuffer, {
            access: "public",
            token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
          });
          uploadedLinks.push(url);
          pendingNotifications.push({
            notificationId,
            labResultIndex: existingCount + pendingNotifications.length,
          });
        } catch (error) {
          markUploadFailed(notificationId, `Failed to upload ${file.name}`);
          throw error;
        }
      }

      const res = await axios.patch(`/api/admin/optimized/lab-bookings`, {
        id,
        links: uploadedLinks,
      });

      pendingNotifications.forEach(({ notificationId, labResultIndex }) => {
        markLabBookingUploadSucceeded(notificationId, id, labResultIndex);
      });

      await fetchData();
      setSelectedBooking(res.data.data);
      setUploadSuccess(true);
      toast.success("Lab reports uploaded successfully.");
      setTimeout(() => {
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
      pendingNotifications.forEach(({ notificationId }) => {
        markUploadFailed(notificationId, "Failed to register report for analysis.");
      });
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const UploadDropZone = ({ bookingId }: { bookingId: number | null }) => (
    <div
      className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition"
      onDrop={async (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && bookingId) {
          await handleMultipleFilesUpload(files, bookingId);
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
              if (bookingId && e.target.files) {
                await handleMultipleFilesUpload(e.target.files, bookingId);
              }
            }}
          />
        </label>
      </div>
    </div>
  );

  const removeReport = async (id: number, url: string) => {
    try {
      const res = await axios.patch(`/api/admin/optimized/lab-bookings`, { id, remove: url });
      toast.success("Report removed");
      await fetchData();
      setSelectedBooking(res.data.data);
    } catch (err) {
      console.error("Remove failed", err);
      toast.error("Failed to remove report");
    }
  };

  const deleteBooking = async (id: number) => {
    try {
      await axios.delete("/api/admin/optimized/lab-bookings", { data: { id } });
      toast.success("Lab booking deleted successfully");
      await fetchData();
    } catch (error) {
      console.error("Error deleting lab booking:", error);
      toast.error("Failed to delete lab booking");
    }
  };

  const handleCollectPayment = async (paymentId: number) => {
    try {
      setCollectingPaymentId(paymentId);
      await axios.put("/api/admin/optimized/dashboard/patients-details", { paymentId });
      toast.success("Payment collected successfully.");
      await fetchData();
    } catch (error) {
      console.error("Payment collection failed:", error);
      toast.error("Failed to collect payment.");
    } finally {
      setCollectingPaymentId(null);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4 bg-white">
      <ToastContainer />
      <h2 className="text-2xl font-bold">Lab Bookings</h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">Payment Pending</p>
            <Clock3 className="h-4 w-4 text-amber-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{summary.paymentPending}</p>
          <p className="text-xs text-amber-700">₹{(summary.paymentPendingAmount / 100).toFixed(2)} pending</p>
        </div>

        <div className="rounded-lg border bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-800">Payment Done</p>
            <CheckCircle2 className="h-4 w-4 text-green-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green-900">{summary.paymentDone}</p>
          <p className="text-xs text-green-700">₹{(summary.paymentDoneAmount / 100).toFixed(2)} collected</p>
        </div>

        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-800">Reports Uploaded</p>
            <FileText className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">{summary.reportsUploaded}</p>
          <p className="text-xs text-blue-700">Bookings with uploaded reports</p>
        </div>

        <div className="rounded-lg border bg-rose-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-rose-800">Reports Pending</p>
            <ReceiptIndianRupee className="h-4 w-4 text-rose-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">{summary.reportsPending}</p>
          <p className="text-xs text-rose-700">Bookings without report uploads</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-custom-mutedgreen text-gray-950">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="text-center" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-black text-center">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="text-center">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="text-center">
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.pageIndex * pagination.pageSize + 1}-
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total} bookings
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setUploadingBookingId(null); }}>
        <DialogContent>
          <DialogTitle>Edit Booking</DialogTitle>
          <div className="space-y-4">
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status">{editStatus}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (selectedBooking) {
                    await updateStatus(selectedBooking.id, editStatus);
                    setDialogOpen(false);
                    setSelectedBooking(null);
                    setUploadingBookingId(null);
                    await fetchData();
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen}>
        <DialogContent>
          <DialogTitle>Manage Reports</DialogTitle>
          <div className="space-y-4">
            {selectedBooking?.labResult && selectedBooking.labResult.length > 0 ? (
              <div className="space-y-2">
                {selectedBooking.labResult.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded border p-2">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="truncate">
                      <Button variant="outline" size="sm" className="max-w-[280px] truncate">
                        {getReportLabelFromUrl(url, idx)}
                      </Button>
                    </a>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeReport(selectedBooking.id, url)}
                      title="Delete report"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reports available for this booking.</p>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setReportsDialogOpen(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
