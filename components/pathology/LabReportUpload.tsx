"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle, TestTube } from "lucide-react";

interface LabTest {
  id: number;
  name: string;
  code: string;
  parameters: any[];
  normalRange: any;
  unit: string;
}

interface LabReportUploadProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onUploadComplete: () => void;
}

export default function LabReportUpload({
  isOpen,
  onClose,
  assignment,
  onUploadComplete,
}: LabReportUploadProps) {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchLabTests();
    }
  }, [isOpen]);

  const fetchLabTests = async () => {
    try {
      const response = await fetch("/api/pathology/lab-tests");
      const data = await response.json();
      setLabTests(data.labTests || []);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleTestResultChange = (index: number, field: string, value: any) => {
    const updatedResults = [...testResults];
    updatedResults[index] = {
      ...updatedResults[index],
      [field]: value,
    };
    setTestResults(updatedResults);
  };

  const addTestResult = () => {
    if (selectedTest) {
      const test = labTests.find(t => t.id.toString() === selectedTest);
      if (test) {
        setTestResults([
          ...testResults,
          {
            labTestId: test.id,
            testName: test.name,
            result: "",
            unit: test.unit,
            normalRange: test.normalRange,
            isAbnormal: false,
            remarks: "",
          },
        ]);
        setSelectedTest("");
      }
    }
  };

  const removeTestResult = (index: number) => {
    setTestResults(testResults.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (testResults.length === 0 && !uploadedFile) {
      alert("Please add test results or upload a file");
      return;
    }

    setLoading(true);
    try {
      // Upload file if present
      let fileUrl = "";
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("assignmentId", assignment.id.toString());
        
        const fileResponse = await fetch("/api/pathology/upload-report", {
          method: "POST",
          body: formData,
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          fileUrl = fileData.fileUrl;
        }
      }

      // Upload test results
      if (testResults.length > 0) {
        for (const result of testResults) {
          await fetch(`/api/pathology/lab-tests/${result.labTestId}/update-results`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              parameters: [{
                name: result.testName,
                result: result.result,
                unit: result.unit,
                normalRange: result.normalRange,
                isAbnormal: result.isAbnormal,
                remarks: result.remarks,
              }],
              labAssignmentId: assignment.id,
            }),
          });
        }
      }

      setStep(2);
      onUploadComplete();
    } catch (error) {
      console.error("Error uploading report:", error);
      alert("Error uploading report");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTest("");
    setTestResults([]);
    setUploadedFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {step === 1 ? "Upload Lab Report" : "Upload Complete"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6">
            {/* Assignment Information */}
            <div className="bg-custom-mutedgreen p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Assignment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{assignment?.patient?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Test:</span>
                  <span className="ml-2 font-medium">{assignment?.appointment?.appointmentFor}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{assignment?.assignedDate}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800">{assignment?.status}</Badge>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Upload Report File (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your lab report file here, or click to browse
                </p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" className="mt-2">
                    Choose File
                  </Button>
                </Label>
                {uploadedFile && (
                  <div className="mt-2 flex items-center justify-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">{uploadedFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Results Entry */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Add Test Results</Label>
              
              {/* Test Selection */}
              <div className="flex space-x-2">
                <Select value={selectedTest} onValueChange={setSelectedTest}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a test to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {labTests.map((test) => (
                      <SelectItem key={test.id} value={test.id.toString()}>
                        {test.name} ({test.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addTestResult} disabled={!selectedTest}>
                  Add Test
                </Button>
              </div>

              {/* Test Results List */}
              {testResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Test Results</h4>
                  {testResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-800">{result.testName}</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestResult(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Result</Label>
                          <Input
                            value={result.result}
                            onChange={(e) => handleTestResultChange(index, "result", e.target.value)}
                            placeholder="Enter result"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Unit</Label>
                          <Input
                            value={result.unit}
                            onChange={(e) => handleTestResultChange(index, "unit", e.target.value)}
                            placeholder="Unit"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Normal Range</Label>
                          <Input
                            value={result.normalRange}
                            onChange={(e) => handleTestResultChange(index, "normalRange", e.target.value)}
                            placeholder="Normal range"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Status</Label>
                          <Select
                            value={result.isAbnormal ? "abnormal" : "normal"}
                            onValueChange={(value) => handleTestResultChange(index, "isAbnormal", value === "abnormal")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="abnormal">Abnormal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Remarks</Label>
                        <Textarea
                          value={result.remarks}
                          onChange={(e) => handleTestResultChange(index, "remarks", e.target.value)}
                          placeholder="Add any remarks about this test result"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Uploading..." : "Upload Report"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Lab Report Uploaded Successfully!
              </h3>
              <p className="text-gray-600">
                The lab report for {assignment?.patient?.name} has been uploaded and processed.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{assignment?.patient?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tests Added:</span>
                  <span className="ml-2 font-medium">{testResults.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">File Uploaded:</span>
                  <span className="ml-2 font-medium">{uploadedFile ? "Yes" : "No"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">Completed</Badge>
                </div>
              </div>
            </div>
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 