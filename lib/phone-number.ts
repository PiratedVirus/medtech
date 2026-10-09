/**
 * Normalize a phone number for India storage format.
 * Stored format: +91XXXXXXXXXX
 */
export function normalizeIndianPhoneNumber(phoneNumber: string): string {
  const digitsOnly = (phoneNumber || "").replace(/\D/g, "");

  let localNumber = digitsOnly;

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    localNumber = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    localNumber = digitsOnly.slice(1);
  } else if (digitsOnly.length > 10) {
    localNumber = digitsOnly.slice(-10);
  }

  if (!/^[6-9]\d{9}$/.test(localNumber)) {
    throw new Error("Invalid Indian mobile number. Expected 10 digits.");
  }

  return `+91${localNumber}`;
}
