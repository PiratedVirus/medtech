"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, EditIcon, Trash } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, X } from "lucide-react";
type PlanFeatureFormData = {
  featureName: string;
  occurrencesPerInterval?: number;
  intervalInMonths?: number;
  parameters?: number;
  notes?: string;
};

type PlanFormData = {
  id?: number;
  name: string;
  duration: string;
  price: number;
  discountPercentage?: number;
  planFeatures: PlanFeatureFormData[];
};

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanFormData[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanFormData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);

  // Table states for filtering, sorting, pagination, column visibility, etc.
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
  } = useForm<PlanFormData>({
    defaultValues: {
      planFeatures: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "planFeatures",
  });

  const fetchPlans = async () => {
    try {
      const res = await axios.get("/api/admin/plans");
      setPlans(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load plans");
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Columns definition for React Table
  const columns: ColumnDef<PlanFormData>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Duration <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Price <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "discountPercentage",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Discount % <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.discountPercentage ?? "-",
      enableSorting: true,
    },
    {
      id: "toggle",
      header: () => null,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-primary"
          onClick={() =>
            setExpandedPlanId(expandedPlanId === row.original.id ? null : row.original.id)
          }
        >
          {expandedPlanId === row.original.id ? "Hide Features" : "Show Features"}
        </Button>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedPlan(row.original);
              reset(row.original);
              setDialogOpen(true);
            }}
            className="bg-transparent text-primary border-0 shadow-none mr-2"
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deletePlan(row.original.id!)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: plans,
    columns,
    pageCount: Math.ceil(plans.length / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const onSubmit = async (formData: PlanFormData) => {
    try {
      if (selectedPlan) {
        await axios.put("/api/admin/plans", { ...formData, id: selectedPlan.id });
        toast.success("Plan updated");
      } else {
        await axios.post("/api/admin/plans", formData);
        toast.success("Plan created");
      }
      fetchPlans();
      reset();
      setDialogOpen(false);
      setSelectedPlan(null);
    } catch (err: any) {
      toast.error("Error saving plan");
    }
  };

  const deletePlan = async (id: number) => {
    try {
      await axios.delete("/api/admin/plans", { data: { id } });
      toast.success("Plan deleted");
      fetchPlans();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search plans..."
            value={
              (table.getColumn("name")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("name")?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white text-black" align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <Button
            onClick={() => {
              setDialogOpen(true);
              setSelectedPlan(null);
              reset({ planFeatures: [] });
            }}
          >
            Add Plan
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-custom-mutedgreen text-gray-950">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="text-center">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-black text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow className="text-center" data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedPlanId === row.original.id && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-2 items-center">
                        <div className="overflow-x-auto flex gap-4 justify-center whitespace-nowrap py-2">
                          {row.original.planFeatures.map((feature, index) => (
                            <div
                              key={index}
                              className="border rounded-lg bg-custom-mutedgreen p-4 space-y-2 min-w-[200px]"
                            >
                              <h4 className="font-semibold">{feature.featureName}</h4>
                              <p>Occurrences: {feature.occurrencesPerInterval}</p>
                              <p>Interval (Months): {feature.intervalInMonths}</p>
                              <p>Parameters: {feature.parameters}</p>
                              <p>Notes: {feature.notes}</p>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, plans.length)} of {plans.length} plans
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => {
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number(value),
                  pageIndex: 0,
                }));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination.pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      </div>

      <Dialog  open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <Input {...field} placeholder="Plan Name" />}
            />
            <Controller
              name="duration"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <Input {...field} placeholder="Duration" />}
            />
            <Controller
              name="price"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <Input {...field} type="number" placeholder="Price" />}
            />
            <Controller
              name="discountPercentage"
              control={control}
              rules={{}}
              render={({ field }) => <Input {...field} type="number" placeholder="Discount %" />}
            />
            <div>
              {/* Header row with "Features" and the plus icon on the right */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Features</h4>
                <Button
                  type="button"
                  onClick={() =>
                    append({
                      featureName: "",
                      occurrencesPerInterval: undefined,
                      intervalInMonths: undefined,
                      parameters: undefined,
                      notes: "",
                    })
                  }
                  variant="null"
                  className="hover:bg-transparent  p-1"
                >
                  <Plus className="h-4 w-4 hover:text-green" />
                </Button>
              </div>

              {/* Render each feature entry */}
              {fields.map((field, index) => (
                <div key={field.id} className="mb-2 border p-2 rounded space-y-2 relative">
                  {/* Top row: cross icon button aligned right */}
                  <div className="flex justify-between items-center">
                    <p className="text-primary">Insert Feature details</p>
                    <Button
                      type="button"
                      variant="null"
                      onClick={() => remove(index)}
                      className="p-1"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  {/* First row: featureName, Occurrences, Interval on a single row */}
                  <div className="flex space-x-2">
                    <Controller
                      name={`planFeatures.${index}.featureName`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Feature Name" className="w-full" />
                      )}
                    />
                    <Controller
                      name={`planFeatures.${index}.occurrencesPerInterval`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Occurrences" type="number" className="w-full" />
                      )}
                    />
                    <Controller
                      name={`planFeatures.${index}.intervalInMonths`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Interval (months)" type="number" className="w-full" />
                      )}
                    />
                  </div>
                  {/* Second row: Parameters and Notes each on a separate row */}
                  <div className="space-y-2">
                    <Controller
                      name={`planFeatures.${index}.parameters`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Parameters" type="text" className="w-full" />
                      )}
                    />
                    <Controller
                      name={`planFeatures.${index}.notes`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Notes" className="w-full" />
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false);
                setSelectedPlan(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedPlan ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}