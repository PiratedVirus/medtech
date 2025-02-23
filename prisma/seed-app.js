/**
 * prisma/seedDoctorAvailability.js
 *
 * Usage:
 *   node prisma/seedDoctorAvailability.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// CONFIG: Adjust as needed
const DOCTOR_IDS = [3,4,5];           // Which doctors to seed
const START_HOUR = 9;               // 9 AM
const END_HOUR = 17;                // 5 PM
const SLOT_DURATION_MINUTES = 30;   // half-hour slots
const BREAK_START = 12.5;           // 12:30 PM
const BREAK_END = 14;               // 2:00 PM
const DAYS_TO_SEED = 5;            // Next 10 days

async function main() {
  console.log("Seeding half-hour availability slots...");

  // Optionally, clear out old availability so we don’t re-insert duplicates
  // (Only do this if you do NOT need historical data!)
  // await prisma.doctorAvailability.deleteMany({});
  // console.log("Deleted old doctor availability records...");

  // We'll pick "today" as a seed starting point
  const today = new Date();

  // Collect all availability records in a list to create them at once
  const allAvailabilities = [];

  for (let d = 0; d < DAYS_TO_SEED; d++) {
    // We'll create a date offset by `d` days from "today"
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + d);

    // You might store date in dayOfWeek field, e.g. "2023-09-01"
    // Or store the actual day name. Up to you. 
    // Here, let's store the date string:
    const dateString = slotDate.toISOString().split("T")[0]; // e.g. "2023-09-01"

    // For each half-hour block
    for (let hour = START_HOUR; hour < END_HOUR; hour += (SLOT_DURATION_MINUTES / 60)) {
      // Convert numeric hour to an actual start/end time string, e.g. "09:00 AM"
      // We'll make a small helper:
      const [startTimeStr, endTimeStr] = buildTimeRange(hour, SLOT_DURATION_MINUTES);

      // Skip if it falls within the break (12:30 PM to 2:00 PM here)
      const hourFloat = hour; // e.g. 12.5 means 12:30
      const endFloat = hour + (SLOT_DURATION_MINUTES / 60);
      if ((hourFloat >= BREAK_START && hourFloat < BREAK_END) ||
          (endFloat > BREAK_START && endFloat <= BREAK_END)) {
        // This slot is considered a break. Skip it
        continue;
      }

      // Create availability for each DOCTOR
      DOCTOR_IDS.forEach((doctorId) => {
        allAvailabilities.push({
          doctorId,
          dayOfWeek: dateString,  // Storing the date string
          startTime: startTimeStr,
          endTime: endTimeStr,
        });
      });
    }
  }

  // Now, we can insert in bulk:
  await prisma.doctorAvailability.createMany({
    data: allAvailabilities,
  });

  console.log(`Seeded availability for next ${DAYS_TO_SEED} days!`);
}

main()
  .catch((err) => {
    console.error("Error seeding doctor availability:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Helper: Given a starting hour (e.g. 9.5 => 9:30 AM) and a duration in minutes,
 * return [startTimeString, endTimeString] in "HH:MM AM/PM" format.
 */
function buildTimeRange(hourFloat, slotDurationMinutes) {
  // Convert e.g. 9.5 => 9 hr, 30 min
  const startHour = Math.floor(hourFloat);
  const startMin = (hourFloat - startHour) * 60;

  const endFloat = hourFloat + slotDurationMinutes / 60;
  const endHour = Math.floor(endFloat);
  const endMin = (endFloat - endHour) * 60;

  const startTimeStr = toAmPmString(startHour, startMin);
  const endTimeStr = toAmPmString(endHour, endMin);

  return [startTimeStr, endTimeStr];
}

/**
 * Helper: Convert 24hr numeric hour/minute to e.g. "09:30 AM"
 */
function toAmPmString(hour24, minute) {
  // e.g. 13 => 1 PM
  const suffix = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  const paddedMin = String(minute).padStart(2, "0");
  return `${hour12.toString().padStart(2, "0")}:${paddedMin} ${suffix}`;
}