import { PharmacyCard } from '@/components/patients/medicines/view/MedicineCard';

// Sample data for pharmacy stores
const pharmacyStores = [
  {
    id: 1,
    image: "/placeholder.svg?height=130&width=300",
    name: "Apollo Pharmacy Store",
    address: "JVQ3-66/67, Sector 69, Near Park",
    isNew: true,
    buttonText: "Book Medicines Here",
  },
  {
    id: 2,
    image: "/placeholder.svg?height=130&width=300",
    name: "Apollo Pharmacy Store",
    address: "JVQ3-66/67, Sector 69, Near Park",
    isNew: true,
    buttonText: "Book Medicines Here",
  },
  {
    id: 3,
    image: "/placeholder.svg?height=130&width=300",
    name: "Apollo Pharmacy Store",
    address: "JVQ3-66/67, Sector 69, Near Park",
    isNew: true,
    buttonText: "Book Medicines Here",
  },
  {
    id: 4,
    image: "/placeholder.svg?height=130&width=300",
    name: "Apollo Pharmacy Store",
    address: "JVQ3-66/67, Sector 69, Near Park",
    isNew: true,
    buttonText: "Book Medicines Here",
  },
]

export default function PharmacyGrid() {
  return (
    <div className="px-20 bg-muted py-4 flex justify-center w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pharmacyStores.map((store) => (
          <PharmacyCard
            key={store.id}
            image={store.image}
            name={store.name}
            address={store.address}
            isNew={store.isNew}
            buttonText={store.buttonText}
          />
        ))}
      </div>
    </div>
  )
}

