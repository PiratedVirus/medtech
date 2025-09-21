export const normalizeStatus = (value: string | undefined | null): string => {
  if (value == null) return "";
  return value.toString().trim().replace(/\s+/g, "_").toUpperCase();
};

// Type-safe status normalization for LabAssignmentStatus
export const normalizeLabAssignmentStatus = (value: string | undefined | null): "PENDING" | "ASSIGNED" | "PHLEBOTOMIST_LEFT" | "SAMPLE_COLLECTED" | "IN_LAB" | "ANALYZING" | "COMPLETED" | "CANCELLED" | undefined => {
  if (value == null) return undefined;
  const normalized = value.toString().trim().replace(/\s+/g, "_").toUpperCase();
  
  const validStatuses = ["PENDING", "ASSIGNED", "PHLEBOTOMIST_LEFT", "SAMPLE_COLLECTED", "IN_LAB", "ANALYZING", "COMPLETED", "CANCELLED"];
  
  if (validStatuses.includes(normalized)) {
    return normalized as "PENDING" | "ASSIGNED" | "PHLEBOTOMIST_LEFT" | "SAMPLE_COLLECTED" | "IN_LAB" | "ANALYZING" | "COMPLETED" | "CANCELLED";
  }
  
  return undefined;
};

export const isStatusEqual = (a?: string | null, b?: string | null): boolean => {
  return normalizeStatus(a) === normalizeStatus(b);
};


