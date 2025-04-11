"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  useForm,
  Controller,
  useFieldArray,
} from "react-hook-form";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast, ToastContainer } from "react-toastify";
import { ArrowUpDown, EditIcon, Trash } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

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
    } catch (err) {
      toast.error("Failed to load plans");
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

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
    } catch (err) {
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
    <div className="p-4">
      <ToastContainer />
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Plans</h2>
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Discount %</TableHead>
            <TableHead></TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <React.Fragment key={plan.id}>
              <TableRow>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{plan.duration}</TableCell>
                <TableCell>{plan.price}</TableCell>
                <TableCell>{plan.discountPercentage ?? "-"}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                  >
                    {expandedPlanId === plan.id ? "Hide Features" : "Show Features"}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPlan(plan);
                      reset(plan);
                      setDialogOpen(true);
                    }}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePlan(plan.id!)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              {expandedPlanId === plan.id && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="overflow-x-auto flex gap-4 text-center whitespace-nowrap">
                      {plan.planFeatures.map((feature, index) => (
                        <div key={index} className="border rounded-lg bg-custom-mutedgreen p-4 space-y-2">
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
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <h4 className="font-semibold">Features</h4>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-1 mb-2 border p-2 rounded">
                  <Controller
                    name={`planFeatures.${index}.featureName`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Feature Name" />}
                  />
                  <Controller
                    name={`planFeatures.${index}.occurrencesPerInterval`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Occurrences" type="number" />}
                  />
                  <Controller
                    name={`planFeatures.${index}.intervalInMonths`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Interval (months)" type="number" />}
                  />
                  <Controller
                    name={`planFeatures.${index}.parameters`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Parameters" type="number" />}
                  />
                  <Controller
                    name={`planFeatures.${index}.notes`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Notes" />}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                    className="mt-1"
                  >
                    Remove
                  </Button>
                </div>
              ))}
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
              >
                Add Feature
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setDialogOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button type="submit">{selectedPlan ? "Save Changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}