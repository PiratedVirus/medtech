import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phoneNumber);
};
// utils/appointmentUtils.ts
export function formatDateString(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  const todayStr = today.toDateString();
  const tomorrowStr = tomorrow.toDateString();
  const dStr = d.toDateString();

  if (dStr === todayStr) return "Today";
  if (dStr === tomorrowStr) return "Tomorrow";
  return dStr; // e.g. "Thu Feb 27 2025"
}

export function parseTimeTo24Hour(time12h: string): number {
  const [time, meridiem] = time12h.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour + minute / 60;
}

export function getTimeSegment(timeString: string): "morning" | "afternoon" | "evening" {
  let hour24: number;
  
  // Handle both 24-hour format (HH:MM) and 12-hour format (HH:MM AM/PM)
  if (timeString.includes("AM") || timeString.includes("PM")) {
    // 12-hour format with AM/PM
    hour24 = parseTimeTo24Hour(timeString);
  } else {
    // 24-hour format (HH:MM)
    const [hourStr, minuteStr] = timeString.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr || "0", 10);
    hour24 = hour + minute / 60;
  }
  
  // Morning: 6am-12pm (6:00 to 11:59)
  // Afternoon: 12pm-4pm (12:00 to 15:59)
  // Evening: 4pm-11pm (16:00 to 22:59)
  if (hour24 >= 6 && hour24 < 12) return "morning";
  if (hour24 >= 12 && hour24 < 16) return "afternoon";
  if (hour24 >= 16 && hour24 < 23) return "evening";
  // For times outside 6am-11pm, default to evening (shouldn't happen in normal flow)
  return "evening";
}

export async function loadRazorpay() {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve((window as any).Razorpay);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve((window as any).Razorpay);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

// Format name for display in header - show more than just first name for doctors
export function formatDisplayName(fullName: string): string {
  if (!fullName) return "";
  
  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(/\s+/);
  
  // If name starts with "Dr." or "Dr", show first two parts (Dr. + First Name)
  if (nameParts[0].toLowerCase() === "dr." || nameParts[0].toLowerCase() === "dr") {
    return nameParts.slice(0, 2).join(" ");
  }
  
  // For regular names, show first name only
  return nameParts[0];
}

// Check if the name is a doctor name (starts with Dr. or Dr)
export function isDoctorName(fullName: string): boolean {
  if (!fullName) return false;
  
  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(/\s+/);
  
  return nameParts[0].toLowerCase() === "dr." || nameParts[0].toLowerCase() === "dr";
}

// Ensure "Dr." prefix is present exactly once for display.
export function ensureDoctorPrefix(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Doctor";
  if (/^dr\.?\s+/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
}
