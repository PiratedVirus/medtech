export const normalizeStatus = (value: string | undefined | null): string => {
  if (value == null) return "";
  return value.toString().trim().replace(/\s+/g, "_").toUpperCase();
};

export const isStatusEqual = (a?: string | null, b?: string | null): boolean => {
  return normalizeStatus(a) === normalizeStatus(b);
};


