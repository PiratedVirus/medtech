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

export function getTimeSegment(time12h: string): "morning" | "afternoon" | "evening" {
  const hour24 = parseTimeTo24Hour(time12h);
  if (hour24 < 12) return "morning";
  if (hour24 < 17) return "afternoon";
  return "evening";
}