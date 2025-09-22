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
import { EditIcon, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface LabBooking {
  id: number;
  labDate: string;
  status: string;
  labResult: string[];
  patient: { name: string };
  labPackage: { name: string };
}

const statusOptions = [
  "pending",
  "confirmed",
  "assigned to lab admin",
  "sample collected",
  "result generated",
  "completed",
];

const fetchLabBookings = async (pageIndex: number, pageSize: number) => {
  const res = await axios.get(
    `/api/admin/optimized/lab-bookings?page=${pageIndex + 1}&pageSize=${pageSize}`
  );
  return res.data as { data: LabBooking[]; total: number };
};

const updateStatus = async (id: number, status: string) => {
  await axios.put(`/api/admin/optimized/lab-bookings`, { id, status });
};

export default function AdminLabBookingsPage() {
  const [data, setData] = useState<{ bookings: LabBooking[]; total: number }>({
    bookings: [],
    total: 0,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [uploadingBookingId, setUploadingBookingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      id: "reports",
      header: "Reports",
      cell: ({ row }) => (
        <div>
          {row.original.labResult && row.original.labResult.length > 0 ? (
            row.original.labResult.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="m-1">
                  View {idx + 1}
                </Button>
              </a>
            ))
          ) : (
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
              setEditStatus(row.original.status.toLowerCase());
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
  }

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

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

      const res = await axios.patch(`/api/admin/optimized/lab-bookings`, {
        id,
        links: uploadedLinks,
      });

      await fetchData();
      setSelectedBooking(res.data.data);
      setUploadSuccess(true);
      toast.success("Lab reports uploaded successfully.");
      setTimeout(() => {
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
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

  return (
    <div className="container mx-auto p-4 space-y-4 bg-white">
      <ToastContainer />
      <h2 className="text-2xl font-bold">Lab Bookings</h2>
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
                <SelectValue className="capitalize" placeholder="Select status">{editStatus}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedBooking?.labResult && selectedBooking.labResult.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Existing Reports</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.labResult.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="whitespace-nowrap">View {idx + 1}</Button>
                      </a>
                      <Button variant="destructive" size="icon" onClick={() => removeReport(selectedBooking.id, url)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Upload Reports</h4>
              <UploadDropZone bookingId={uploadingBookingId} />
              {uploading && <p>Uploading...</p>}
              {uploadSuccess && (
                <p className="text-green-600 text-sm text-center mt-2">Upload successful!</p>
              )}
            </div>

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
    </div>
  );
}
