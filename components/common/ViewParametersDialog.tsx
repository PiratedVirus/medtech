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
  parameters: string[];
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
        <div className="grid grid-cols-5 gap-2">
          {parameters.map((param, index) => (
            <div
              key={index}
              className="p-2 bg-custom-mutedgreen font-semibold rounded flex items-center justify-center text-center"
              style={{ minHeight: "50px" }}
            >
              {param}
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