"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { forwardRef, useImperativeHandle } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useProfile } from "@/hooks/context/ProfileContext";

// Define Zod Schema
const formSchema = z.object({
  appointmentFor: z.enum(["self", "other"]),
  fullName: z.string().min(1, { message: "Full name is required" }),
  mobile: z.string().min(1, { message: "Mobile number is required" }),
  email: z
  .string()
  .email({ message: "Please enter a valid email" })
  .or(z.literal(""))
  .optional(),
});

export const PatientForm = forwardRef(({ }, ref) => {
  const { profile } = useProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointmentFor: "self",
      fullName: profile?.name || "",
      mobile: profile?.phoneNumber || "",
      email: profile?.email ?? "",
    },
  });

  // ✅ Watch appointmentFor value
  const appointmentFor = form.watch("appointmentFor");
  const isSelf = appointmentFor === "self";

  useImperativeHandle(ref, () => ({
    submitForm: form.handleSubmit,
  }));

  return (
    <div className="max-w-2xl pt-6">
      <h1 className="text-[#2c2e38] text-lg font-medium mb-6">
        This in-clinic appointment is for:
      </h1>

      <Form {...form}>
        <form className="space-y-8">
          {/* ✅ Radio Group: Choose Appointment For */}
          <FormField
            control={form.control}
            name="appointmentFor"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center gap-8 mb-12"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="self" id="self" className="h-6 w-6 border-0" />
                      <Label htmlFor="self" className="text-[#2c2e38] text-lg">
                        {profile?.name}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" className="h-6 w-6 border-0" />
                      <Label htmlFor="other" className="text-[#2c2e38] text-lg">
                        Someone else
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          <h2 className="text-[#2c2e38] text-lg font-medium mb-8">
            Please provide the following information about the patient:
          </h2>

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[#2c2e38] text-lg">
                  Full Name<span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isSelf} 
                    className="w-full p-4 bg-[#f5f7f9] rounded-md text-lg h-auto border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[#2c2e38] text-lg">
                  Mobile<span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    disabled={isSelf}
                    className="w-full p-4 bg-[#f5f7f9] rounded-md text-lg h-auto border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[#2c2e38] text-lg">
                  Email<span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    disabled={isSelf} 
                    placeholder="Enter your mail id here"
                    className="w-full p-4 bg-[#f5f7f9] rounded-md text-lg h-auto border-0 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
});