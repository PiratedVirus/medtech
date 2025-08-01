"use client";

import { Button } from "@/components/ui/button";
import { testPDFGeneration, testReactPDFOnly } from "@/components/prescription/PrescriptionPDF";
import { useToast } from "@/hooks/use-toast";

export default function TestPDFPage() {
  const { toast } = useToast();

  const handleTestPDF = async () => {
    try {
      const result = await testPDFGeneration();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "PDF generated and downloaded successfully!",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to generate PDF: ${(result as any).error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Test PDF error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleReactPDFOnly = async () => {
    try {
      const result = await testReactPDFOnly();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "React-PDF generated and downloaded successfully!",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: `React-PDF failed: ${(result as any).error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("React-PDF test error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">PDF Generation Test</h1>
        <p className="text-gray-600 mb-6">
          Test different PDF generation methods with sample data.
        </p>
        <div className="space-y-4">
          <Button onClick={handleTestPDF} className="w-full">
            Generate PDF (with fallback)
          </Button>
          <Button onClick={handleReactPDFOnly} className="w-full" variant="outline">
            Generate PDF (React-PDF only)
          </Button>
          <div className="text-center space-y-2">
            <a href="/test-pdf-simple" className="text-blue-600 hover:underline text-sm block">
              Test Simple PDF
            </a>
            <a href="/test-integration" className="text-blue-600 hover:underline text-sm block">
              Test Integration (Real Data)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 