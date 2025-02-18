import Image from "next/image"
import Link from "next/link"

export default function Header() {
  return (
    <header className="flex items-center justify-between w-full p-4 bg-[#f9fafb] text-white px-16">
      <nav className="flex gap-6">
        <Link href="#" className="text-gray-900 hover:text-white">
          Home
        </Link>
        <Link href="#" className="text-gray-900 hover:text-white">
          Services
        </Link>
        <Link href="#" className="text-gray-900 hover:text-white">
         Doctors
        </Link>
        <Link href="#" className="text-gray-900 hover:text-white">
         Blogs
        </Link>
        <Link href="#" className="text-gray-900 hover:text-white">
         Testimonials
        </Link>
        <Link href="#" className="text-gray-900 hover:text-white">
         About
        </Link>
      </nav>
      <div>
        <Image src="/logo.png" alt="Logo" width={144} height={96} className="object-contain" />
      </div>
    </header>
  )
}

