import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameters: Record<string, string[]>;
}

const ViewParametersDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  parameters,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>Parameters</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {Object.entries(parameters).map(([category, params]) => (
            <div key={category} className="border rounded-lg shadow-md p-4 bg-white">
              <h3 className="text-xl font-semibold text-green-800 mb-3 border-b pb-2">{category}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.isArray(params) ? params.map((param, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-custom-mutedgreen text-sm font-medium rounded flex items-center justify-center text-center"
                    style={{ minHeight: "50px" }}
                  >
                    {param}
                  </div>
                )) : null}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewParametersDialog;