import React from 'react';
import Image from 'next/image';

export default function DoctorHomeHeader() {
  return (
    <header className="w-full bg-white shadow-sm py-4 px-6 flex items-center justify-between rounded-b-2xl">
      {/* Navigation */}
      <nav className="flex gap-6">
        <a href="#" className="text-green-900 font-semibold border-b-2 border-green-700 pb-1">Home</a>
        <a href="#" className="text-gray-700 hover:text-green-700">Earning</a>
        <a href="#" className="text-gray-700 hover:text-green-700">Patients</a>
        <a href="#" className="text-gray-700 hover:text-green-700">Manage Date</a>
        <a href="#" className="text-gray-700 hover:text-green-700">Appointments</a>
      </nav>
      {/* Right: Icons and Profile */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-1.7 1.7A1 1 0 0 0 5 20h14a1 1 0 0 0 .7-1.7L18 16Z"/></svg>
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/></svg>
        </button>
        <div className="flex items-center gap-2 bg-[#F5F7F6] px-3 py-1 rounded-lg cursor-pointer">
          <Image src="/images/doc.png" alt="Profile" width={32} height={32} className="rounded-full" />
          <span className="text-gray-800 font-medium">My profile</span>
        </div>
      </div>
    </header>
  );
} 