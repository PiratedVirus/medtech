import React, { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ onClick, children, className, loadingText, ...rest }, ref) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
      setLoading(true);
      try {
        await onClick();
      } finally {
        setLoading(false);
      }
    };

    return (
      <Button
        {...rest}
        ref={ref}
        className={`relative ${className} ${loading ? "cursor-not-allowed" : ""}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
            <Loader2 className="animate-spin w-5 h-5 mr-2" />
        ) : (
          children
        )}
      </Button>
    );
  }
);

export default LoadingButton;