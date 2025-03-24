import React from "react";
import { MapPin, Clock } from "lucide-react";

export default function InfoBar() {
  return (
    <div className="bg-green-900 text-white px-20 py-2 flex justify-between items-center">
      {/* Left side: Map pin + address */}
      <div className="flex items-center space-x-2">
        <MapPin className="w-5 h-5" />
        <span>121 Ambedkar St, Kanpur VIC-110085, India</span>
      </div>

      {/* Right side: Clock + hours */}
      <div className="flex items-center space-x-2">
        <Clock className="w-5 h-5" />
        <span>9am - 5pm EST, Monday - Friday</span>
      </div>
    </div>
  );
}