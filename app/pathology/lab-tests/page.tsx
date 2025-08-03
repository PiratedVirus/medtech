"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar, X, FileText } from "lucide-react";

interface LabTest {
  id: number;
  name: string;
  code: string;
  parameters: TestParameter[];
}

interface TestParameter {
  id: number;
  name: string;
  result: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
}

interface LabAssignment {
  id: number;
  patient: {
    name: string;
  };
  status: string;
  assignedDate: string;
  assignedTime: string;
}

export default function LabTestsPage() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labAssignments, setLabAssignments] = useState<LabAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch lab tests
      const testsResponse = await fetch("/api/pathology/lab-tests");
      const testsData = await testsResponse.json();
      setLabTests(testsData.tests || []);

      // Fetch lab assignments
      const assignmentsResponse = await fetch("/api/pathology/lab-assignments");
      const assignmentsData = await assignmentsResponse.json();
      setLabAssignments(assignmentsData.assignments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTest = (test: LabTest) => {
    setSelectedTest(test);
    setShowUpdateModal(true);
  };

  const handleUpdateResults = async () => {
    if (!selectedTest) return;

    try {
      const response = await fetch(`/api/pathology/lab-tests/${selectedTest.id}/update-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parameters: selectedTest.parameters,
        }),
      });

      if (response.ok) {
        setShowUpdateModal(false);
        setSelectedTest(null);
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Error updating test results:", error);
    }
  };

  const filteredTests = labTests.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Lab Tests</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("en-GB")} | {new Date().toLocaleTimeString("en-US", { hour12: true })} <Calendar className="inline ml-1 h-4 w-4" />
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search lab tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lab Tests Table */}
      <Card className="bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Test Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Test Code</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Patient</TableHead>
                <TableHead className="font-semibold text-gray-700">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.map((test) => (
                <TableRow key={test.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-800">
                    {test.name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {test.code}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800">
                      In Progress
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    Mr. Sameer Reddy
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleUpdateTest(test)}
                      variant="outline"
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                    >
                      Update Results
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Test Results Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-green-600">
                Update Test Report
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpdateModal(false)}
                className="text-orange-500 hover:text-orange-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-6">
              {/* Test Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Test Parameter:</span> {selectedTest.name} (GOD/POD Method)
                  </div>
                  <div>
                    <span className="font-semibold">Test Code:</span> {selectedTest.code}
                  </div>
                </div>
              </div>

              {/* Test Parameters Table */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Test Parameters</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50">
                      <TableHead className="font-semibold text-gray-700">Test Parameter</TableHead>
                      <TableHead className="font-semibold text-gray-700">Result</TableHead>
                      <TableHead className="font-semibold text-gray-700">Units</TableHead>
                      <TableHead className="font-semibold text-gray-700">Biological Ref. Interval</TableHead>
                      <TableHead className="font-semibold text-gray-700">Act.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTest.parameters.map((parameter) => (
                      <TableRow key={parameter.id}>
                        <TableCell className="font-medium text-gray-800">
                          {parameter.name}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={parameter.result}
                            onChange={(e) => {
                              const updatedTest = {
                                ...selectedTest,
                                parameters: selectedTest.parameters.map(p =>
                                  p.id === parameter.id ? { ...p, result: e.target.value } : p
                                )
                              };
                              setSelectedTest(updatedTest);
                            }}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {parameter.unit}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          <div>Normal: 70 - 99 mg/dL</div>
                          <div>Pre Diabetes: 100 - 125 mg/dL</div>
                          <div>Diabetes: &gt;126 mg/dL</div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Range
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Remarks */}
              <div>
                <Button variant="link" className="text-orange-500 p-0 h-auto">
                  Add Remarks
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateResults}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Update Results
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 