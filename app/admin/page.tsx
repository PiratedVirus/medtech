import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <ul className="space-y-2">
        <li>
          <Link href="/admin/users" className="text-blue-500 hover:underline">
            Users
          </Link>
        </li>
        <li>
          <Link href="/admin/clinics" className="text-blue-500 hover:underline">
            Clinics
          </Link>
        </li>
        <li>
          <Link href="/admin/appointments" className="text-blue-500 hover:underline">
            Appointments
          </Link>
        </li>
        <li>
          <Link href="/admin/dieticians" className="text-blue-500 hover:underline">
            Dieticians
          </Link>
        </li>
        <li>
          <Link href="/admin/doctors" className="text-blue-500 hover:underline">
            Doctors
          </Link>
        </li>
        <li>
          <Link href="/admin/labs" className="text-blue-500 hover:underline">
            Labs
          </Link>
        </li>
        <li>
          <Link href="/admin/medicines" className="text-blue-500 hover:underline">
            Medicines
          </Link>
        </li>
        <li>
          <Link href="/admin/payments" className="text-blue-500 hover:underline">
            Payments
          </Link>
        </li>
        <li>
          <Link href="/admin/prescriptions" className="text-blue-500 hover:underline">
            Prescriptions
          </Link>
        </li>
      </ul>
    </div>
  );
}
