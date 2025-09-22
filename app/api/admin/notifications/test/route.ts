import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Notifications API is working!",
    timestamp: new Date().toISOString(),
    testData: {
      highPriority: [
        {
          id: 'test-critical-lab',
          type: 'lab',
          title: 'Test Critical Lab Results',
          description: '1 critical lab result requiring immediate attention',
          count: 1,
          priority: 'high',
          icon: 'AlertTriangle',
          color: '#EF4444',
          bgColor: 'rgba(239,68,68,0.1)',
          timestamp: new Date().toISOString(),
          actionUrl: '/admin/lab-analysis',
          isRead: false
        }
      ],
      mediumPriority: [
        {
          id: 'test-appointments',
          type: 'appointment',
          title: 'Test Upcoming Appointments',
          description: '2 appointments in the next 2 hours',
          count: 2,
          priority: 'medium',
          icon: 'Calendar',
          color: '#F28A2E',
          bgColor: 'rgba(242,138,46,0.1)',
          timestamp: new Date().toISOString(),
          actionUrl: '/admin/appointments',
          isRead: false
        }
      ],
      lowPriority: [
        {
          id: 'test-signups',
          type: 'user',
          title: 'Test New Patient Signups',
          description: '3 new patients registered in the last 24 hours',
          count: 3,
          priority: 'low',
          icon: 'UserPlus',
          color: '#56A67C',
          bgColor: 'rgba(86,166,124,0.1)',
          timestamp: new Date().toISOString(),
          actionUrl: '/admin/patients',
          isRead: false
        }
      ]
    }
  });
}
