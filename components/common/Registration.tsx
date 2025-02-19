"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  age: z.string().min(1, "Age must be at least 1."),
  gender: z.enum(["Male", "Female", "Other"]).refine((val) => val !== undefined, {
    message: "Please select a gender.",
  }),
})

export default function RegistrationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "Male" as "Male" | "Female" | "Other",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-600 text-sm font-medium">Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your name"
                  {...field}
                  className="h-14 px-6 rounded-[16px] border-gray-200 bg-white text-lg placeholder:text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-custom-green"
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-600 text-sm font-medium">Age</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter your age"
                  {...field}
                  className="h-14 px-6 rounded-[16px] border-gray-200 bg-white text-lg placeholder:text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-custom-green"
                />
              </FormControl>
              <FormMessage className="text-sm" />
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
        <Button
          type="submit"
          className="w-full mt-3 h-14 bg-[#f28a2e] hover:bg-[#f28a2e]/90 rounded-[16px] text-white text-lg font-normal shadow-[0px_12px_21px_4px_rgba(224,126,41,0.33)]"
        >
          Register
        </Button>
      </form>
    </Form>
  )
}

