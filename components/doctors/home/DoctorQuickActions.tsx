import { Calendar, HelpCircle, DollarSign, FileText } from 'lucide-react';
import DoctorEarningsWidget from './DoctorEarningsWidget';
import DoctorManageSlotsWidget from './DoctorManageSlotsWidget';

const actions = [
  {
    label: 'Manage Date',
    icon: <Calendar className="w-7 h-7 text-[#56A67C]" />, // green
    bg: 'bg-[#F2F9F6]'
  },
  {
    label: 'Earning',
    icon: <DollarSign className="w-7 h-7 text-[#F9B233]" />, // yellow
    bg: 'bg-[#FFF8EC]'
  },
  {
    label: 'Help & Support',
    icon: <HelpCircle className="w-7 h-7 text-[#F97B22]" />, // orange
    bg: 'bg-[#FFF3ED]'
  },
  {
    label: 'Prescription',
    icon: <FileText className="w-7 h-7 text-[#4D9DE0]" />, // blue
    bg: 'bg-[#EDF6FF]'
  },
];

export default function DoctorQuickActions({ type }: { type: 'earnings' | 'slots' }) {
  if (type === 'earnings') {
    return <DoctorEarningsWidget />;
  }
  if (type === 'slots') {
    return <DoctorManageSlotsWidget />;
  }
  return null;
} 