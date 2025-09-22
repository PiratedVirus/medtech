'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationTestPanelProps {
  patients: Array<{ id: number; name: string; phoneNumber: string }>;
}

const NotificationTestPanel: React.FC<NotificationTestPanelProps> = ({ patients }) => {
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [notificationType, setNotificationType] = useState<string>('');
  const [customData, setCustomData] = useState<string>('{}');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const notificationTypes = [
    { value: 'appointment_reminder', label: 'Appointment Reminder', data: { appointmentId: 1 } },
    { value: 'appointment_confirmed', label: 'Appointment Confirmed', data: { appointmentId: 1 } },
    { value: 'appointment_cancelled', label: 'Appointment Cancelled', data: { appointmentId: 1, reason: 'Doctor unavailable' } },
    { value: 'diet_plan_ready', label: 'Diet Plan Ready', data: { dieticianName: 'Dr. Sarah', dietPlanId: 1 } },
    { value: 'diet_plan_request_status', label: 'Diet Plan Request Status', data: { status: 'APPROVED', dieticianName: 'Dr. Sarah' } },
    { value: 'lab_booking_confirmed', label: 'Lab Booking Confirmed', data: { labPackageName: 'Complete Blood Count', labDate: '2024-01-15' } },
    { value: 'lab_sample_collection', label: 'Lab Sample Collection', data: { phlebotomistName: 'John Doe', estimatedTime: '2:00 PM' } },
    { value: 'lab_results_ready', label: 'Lab Results Ready', data: { labPackageName: 'Complete Blood Count', hasAbnormalResults: false } },
    { value: 'prescription_ready', label: 'Prescription Ready', data: { doctorName: 'Dr. Smith', prescriptionId: 1 } },
    { value: 'medicine_reminder', label: 'Medicine Reminder', data: { medicineName: 'Metformin', dosage: '500mg', time: '8:00 AM' } },
    { value: 'plan_expiry_warning', label: 'Plan Expiry Warning', data: { planName: 'Basic Plan', daysLeft: 7 } },
    { value: 'plan_renewed', label: 'Plan Renewed', data: { planName: 'Basic Plan', newEndDate: '2024-12-31' } },
    { value: 'consultation_reminder', label: 'Consultation Reminder', data: { consultationDate: '2024-01-20', consultationType: 'Doctor' } },
    { value: 'health_alert', label: 'Health Alert', data: { metricName: 'Blood Sugar', value: '180', status: 'high' } },
    { value: 'ai_summary_ready', label: 'AI Summary Ready', data: { summaryType: 'Monthly Health Report' } },
    { value: 'payment_success', label: 'Payment Success', data: { amount: 500, service: 'Consultation' } },
    { value: 'payment_failed', label: 'Payment Failed', data: { amount: 500, service: 'Consultation', reason: 'Insufficient funds' } },
  ];

  const handleSendNotification = async () => {
    if (!selectedPatient || !notificationType) {
      toast({
        title: 'Error',
        description: 'Please select a patient and notification type',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      let data;
      try {
        data = JSON.parse(customData);
      } catch (e) {
        // Use default data if custom data is invalid
        const selectedType = notificationTypes.find(t => t.value === notificationType);
        data = selectedType?.data || {};
      }

      const response = await fetch('/api/test/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: notificationType,
          patientId: parseInt(selectedPatient),
          data,
        }),
      });

      const result = await response.json();
      setLastResult(result);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Notification sent to patient ${patients.find(p => p.id === parseInt(selectedPatient))?.name}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setNotificationType(value);
    const selectedType = notificationTypes.find(t => t.value === value);
    if (selectedType) {
      setCustomData(JSON.stringify(selectedType.data, null, 2));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Test Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Selection */}
        <div className="space-y-2">
          <Label htmlFor="patient">Select Patient</Label>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a patient to test with" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.name} ({patient.phoneNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notification Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Notification Type</Label>
          <Select value={notificationType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select notification type" />
            </SelectTrigger>
            <SelectContent>
              {notificationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Data */}
        <div className="space-y-2">
          <Label htmlFor="data">Custom Data (JSON)</Label>
          <Textarea
            id="data"
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            placeholder="Enter custom data as JSON"
            rows={4}
            className="font-mono text-sm"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendNotification}
          disabled={isLoading || !selectedPatient || !notificationType}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Notification
            </>
          )}
        </Button>

        {/* Result Display */}
        {lastResult && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">
                {lastResult.success ? 'Success' : 'Error'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Type:</strong> {lastResult.type}</p>
              <p><strong>Patient ID:</strong> {lastResult.patientId}</p>
              {lastResult.message && (
                <p><strong>Message:</strong> {lastResult.message}</p>
              )}
              {lastResult.error && (
                <p className="text-red-600"><strong>Error:</strong> {lastResult.error}</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Test Buttons */}
        <div className="space-y-2">
          <Label>Quick Tests</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotificationType('appointment_reminder');
                setCustomData(JSON.stringify({ appointmentId: 1 }, null, 2));
              }}
            >
              Appointment Reminder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotificationType('health_alert');
                setCustomData(JSON.stringify({ metricName: 'Blood Sugar', value: '180', status: 'high' }, null, 2));
              }}
            >
              Health Alert
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotificationType('lab_results_ready');
                setCustomData(JSON.stringify({ labPackageName: 'Complete Blood Count', hasAbnormalResults: true }, null, 2));
              }}
            >
              Lab Results
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotificationType('plan_expiry_warning');
                setCustomData(JSON.stringify({ planName: 'Basic Plan', daysLeft: 3 }, null, 2));
              }}
            >
              Plan Expiry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTestPanel;
