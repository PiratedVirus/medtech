"use client";

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type AlertType = "success" | "error" | "info" | "warning";

interface ModalAlertProps {
  open: boolean;
  text: string;
  type?: AlertType;
  onClose: () => void;
  isLoading?: boolean;
}

const iconMap: Record<AlertType, JSX.Element> = {
  success: <CheckCircle className="w-12 h-12 text-green-600" />,
  error: <AlertCircle className="w-12 h-12 text-red-600" />,
  info: <Info className="w-12 h-12 text-blue-600" />,
  warning: <AlertTriangle className="w-12 h-12 text-yellow-600" />,
};

export default function ModalAlert({ open, text, type = "success", onClose, isLoading = false }: ModalAlertProps) {
  useEffect(() => {
    if (open && !isLoading) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, isLoading]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#f28a2e]" />
              <h2 className="text-lg font-semibold">{text}</h2>
            </>
          ) : (
            <>
              {iconMap[type]}
              <h2 className="text-lg font-semibold">{text}</h2>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
