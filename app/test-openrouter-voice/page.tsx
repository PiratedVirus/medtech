"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function TestOpenRouterVoicePage() {
  const [testText, setTestText] = useState("Patient has fever and headache, blood pressure 120 over 80, prescribe paracetamol 500 milligrams twice daily for 5 days");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testOpenRouter = async () => {
    if (!testText.trim()) {
      toast({
        title: "No Text",
        description: "Please enter some test text",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/llm-process/voice-prescription-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: testText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process text');
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Success",
        description: "OpenRouter API processed the text successfully!",
      });
    } catch (error) {
      console.error('Error testing OpenRouter:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test OpenRouter API",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test OpenRouter Voice Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Text (Prescription Description):
            </label>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter prescription description here..."
              rows={4}
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={testOpenRouter}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Testing OpenRouter API...
              </div>
            ) : (
              "Test OpenRouter Processing"
            )}
          </Button>

          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Processed Result:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">Try these examples:</p>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => setTestText("Patient has fever and headache, blood pressure 120 over 80, prescribe paracetamol 500 milligrams twice daily for 5 days")}
                className="block w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                Fever and headache case
              </button>
              <button
                onClick={() => setTestText("Patient complains of chest pain, prescribe aspirin 75 milligrams once daily, advise rest and follow up in 7 days")}
                className="block w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                Chest pain case
              </button>
              <button
                onClick={() => setTestText("Patient has diabetes, blood sugar high, prescribe metformin 500 milligrams twice daily with meals, order HbA1c test")}
                className="block w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                Diabetes case
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
