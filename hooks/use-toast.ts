"use client";

// React-Toastify based toast hook (shim for previous in-house toast API)

import { toast as toastify, ToastOptions, TypeOptions } from "react-toastify";

interface ToastArgs {
  /** Large bold text */
  title?: string;
  /** Smaller secondary line */
  description?: string;
  /** Visual style – kept for backward-compat */
  variant?: "default" | "success" | "destructive";
  /** Extra options forwarded to React-Toastify */
  options?: ToastOptions;
}

function toast({ title, description, variant = "default", options }: ToastArgs) {
  const message = title && description ? `${title}: ${description}` : title ?? description ?? "";
  const typeMap: Record<string, TypeOptions | undefined> = {
    success: "success",
    destructive: "error",
    default: "success",
  };

  toastify(message, { type: typeMap[variant], ...options });
}

export function useToast() {
  return {
    toast,
    dismiss: toastify.dismiss,
  } as const;
}

// Named export kept for legacy direct `import { toast }` usages
export { toast };
