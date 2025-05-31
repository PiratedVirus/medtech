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

export default function RegistrationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "Male" as "Male" | "Female" | "Other",
      doctorCode: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
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
              <FormLabel>Doctor Code (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter doctor code (6 characters)" 
                  {...field} 
                  maxLength={6}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Register</Button>
      </form>
    </Form>
  )
}

