// components/Sidebar.tsx
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, CreditCard, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Sidebar({ consultationType }: any) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        {consultationType === "clinic" ? (
            <div className="clinic-info">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Hospital address
            </h2>
            <div className="relative h-48 rounded-lg overflow-hidden mb-4">
              <Image
                src="/placeholder.svg?height=192&width=400"
                alt="Hospital location"
                fill
                className="object-cover"
              />
            </div>
            <Link href="#" className="text-green-600 hover:underline">
              Get Directions
            </Link>
            <p className="mt-4 text-gray-600">
              AIIMS Hospital, Sector-9, Noida,
              <br />
              Opposite ICICI Bank, Road-1, Delhi
            </p>
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <div>
                <p>MON - SAT</p>
                <p>10:00 AM - 8:00 PM</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <CreditCard className="h-4 w-4" />
              <p>Online Payment Mode Available</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={`/placeholder.svg?height=100&width=100`}
                    alt={`Hospital facility ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="video-info">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-green-600" />
              Google Meet address
            </h2>
            <div className="relative h-48 rounded-lg overflow-hidden mb-4">
              <div className="white-wrapper flex justify-center items-center h-48 w-96 bg-white border-2 border-slate-100 rounded-lg">
              <Image
                src="/images/gmeet.png"
                alt="Hospital location"
                className="shadow-black"
                width={92}
                height={92}
              />
              </div>
        
            </div>
            <Link href="#" className="text-green-600 hover:underline">
              Get Link
            </Link>
           
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <div>
                <p>MON - SAT</p>
                <p>10:00 AM - 8:00 PM</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <CreditCard className="h-4 w-4" />
              <p>Online Payment Mode Available</p>
            </div>
            
          </div>
        )}
      
      
        <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">
          Instant Pay Available
        </Button>
      </Card>
    </div>
  );
}