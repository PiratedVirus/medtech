"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"
import { useEffect, forwardRef } from "react"
import LoadingButton from "../ui/custom/cd-loading-button"

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  age: z.string().min(1, "Age must be at least 1."),
  gender: z.enum(["Male", "Female", "Other"]).refine((val) => val !== undefined, {
    message: "Please select a gender.",
  }),
  doctorCode: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    return /^[A-Z0-9]{6}$/.test(val); // 6 characters, alphanumeric, uppercase
  }, "Doctor code must be 6 characters long and contain only uppercase letters and numbers"),
})

interface RegistrationFormProps {
  onSubmit: (data: any) => void;
  preFilledDoctorCode?: string | null;
  isDoctorCodeDisabled?: boolean;
  isSubmitting?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const RegistrationForm = forwardRef<HTMLButtonElement, RegistrationFormProps>(({
  onSubmit,
  preFilledDoctorCode,
  isDoctorCodeDisabled = false,
  isSubmitting = false,
  buttonRef
}, ref) => {
  const form = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "Male" as "Male" | "Female" | "Other",
      doctorCode: preFilledDoctorCode || "",
    },
  });

  // Update form when preFilledDoctorCode changes
  useEffect(() => {
    if (preFilledDoctorCode) {
      form.setValue("doctorCode", preFilledDoctorCode);
    }
  }, [preFilledDoctorCode, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter your age" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <RadioGroupItem value="Male" id="male" />
                  <FormLabel htmlFor="male">Male</FormLabel>
                  <RadioGroupItem value="Female" id="female" />
                  <FormLabel htmlFor="female">Female</FormLabel>
                  <RadioGroupItem value="Other" id="other" />
                  <FormLabel htmlFor="other">Other</FormLabel>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doctorCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor Code {!isDoctorCodeDisabled && "(Optional)"}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter doctor code"
                  {...field}
                  maxLength={6}
                  disabled={isDoctorCodeDisabled}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && buttonRef?.current) {
                      e.preventDefault();
                      buttonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => buttonRef.current?.focus(), 500);
                    }
                  }}
                  className={isDoctorCodeDisabled ? "bg-gray-100" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton
          ref={buttonRef || ref}
          type="submit"
          className="w-full"
          onClick={form.handleSubmit(onSubmit)}
          loadingText="Registering..."
          disabled={isSubmitting}
        >
          Register
        </LoadingButton>
      </form>
    </Form>
  )
});

RegistrationForm.displayName = "RegistrationForm";

export default RegistrationForm;

