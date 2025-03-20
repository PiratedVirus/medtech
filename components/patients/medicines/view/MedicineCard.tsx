import Image from "next/image"
import { Button } from "@/components/ui/button"

interface PharmacyCardProps {
  image: string
  name: string
  address: string
  isNew: boolean
  buttonText: string
}

export function PharmacyCard({ image, name, address, isNew, buttonText }: PharmacyCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="relative h-[130px] w-full mb-3">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover rounded-md" />
      </div>
      <h3 className="font-medium text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-600 mb-1">{address}</p>
      {isNew && <p className="text-green-600 text-sm mb-3">New</p>}
      <Button className="w-full bg-orange-400 hover:bg-orange-500 text-white font-medium rounded-md">
        {buttonText}
      </Button>
    </div>
  )
}

