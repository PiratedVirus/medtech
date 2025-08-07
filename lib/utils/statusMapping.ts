import { LabAssignmentStatus } from '@prisma/client';

// Status mapping for different user roles
export const statusMapping = {
  // Patient/Customer friendly statuses
  patient: {
    'PENDING': 'Scheduled',
    'ASSIGNED': 'Phlebotomist Assigned',
    'PHLEBOTOMIST_LEFT': 'Phlebotomist En Route',
    'SAMPLE_COLLECTED': 'Sample Collected',
    'IN_LAB': 'Processing in Lab',
    'ANALYZING': 'Analyzing Results',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  },
  
  // Pathology team statuses (more technical)
  pathology: {
    'PENDING': 'Pending Assignment',
    'ASSIGNED': 'Phlebotomist Assigned',
    'PHLEBOTOMIST_LEFT': 'Phlebotomist Left',
    'SAMPLE_COLLECTED': 'Sample Collected',
    'IN_LAB': 'In Lab Processing',
    'ANALYZING': 'Analyzing',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  },
  
  // Customer service statuses
  customerService: {
    'PENDING': 'Awaiting Assignment',
    'ASSIGNED': 'Assigned to Phlebotomist',
    'PHLEBOTOMIST_LEFT': 'Phlebotomist En Route',
    'SAMPLE_COLLECTED': 'Sample Collected',
    'IN_LAB': 'Processing',
    'ANALYZING': 'Processing',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  }
};

// Status colors for UI
export const statusColors = {
  'PENDING': 'bg-orange-100 text-orange-800',
  'ASSIGNED': 'bg-blue-100 text-blue-800',
  'PHLEBOTOMIST_LEFT': 'bg-yellow-100 text-yellow-800',
  'SAMPLE_COLLECTED': 'bg-green-100 text-green-800',
  'IN_LAB': 'bg-indigo-100 text-indigo-800',
  'ANALYZING': 'bg-purple-100 text-purple-800',
  'COMPLETED': 'bg-emerald-100 text-emerald-800',
  'CANCELLED': 'bg-red-100 text-red-800'
};

// Helper function to get user-friendly status
export function getStatusDisplay(status: LabAssignmentStatus, userRole: 'patient' | 'pathology' | 'customerService' = 'patient'): string {
  return statusMapping[userRole][status] || status;
}

// Helper function to get status color
export function getStatusColor(status: LabAssignmentStatus): string {
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

// Helper function to check if status is active/ongoing
export function isActiveStatus(status: LabAssignmentStatus): boolean {
  return ['ASSIGNED', 'PHLEBOTOMIST_LEFT', 'SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING'].includes(status);
}

// Helper function to check if status is completed
export function isCompletedStatus(status: LabAssignmentStatus): boolean {
  return status === 'COMPLETED';
}

// Helper function to check if status is pending
export function isPendingStatus(status: LabAssignmentStatus): boolean {
  return status === 'PENDING';
} 