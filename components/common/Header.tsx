import Image from "next/image"
import Link from "next/link"

export default function Header() {
  return (
    <header className="flex items-center justify-between w-full p-4 bg-[#f9fafb] text-white px-16">
      <nav className="flex gap-6">
        <Link href="/" className="text-gray-900 hover:text-secondary">
          Home
        </Link>
        <Link href="/#services" className="text-gray-900 hover:text-secondary">
          Services
        </Link>
        <Link href="/#doctors" className="text-gray-900 hover:text-secondary">
         Doctors
        </Link>
        <Link href="/#blogs" className="text-gray-900 hover:text-secondary">
         Blogs
        </Link>
        {/* <Link href="#testimonials" className="text-gray-900 hover:text-secondary">
         Testimonials
        </Link> */}
        <Link href="/about" className="text-gray-900 hover:text-secondary">
         About
        </Link>
      </nav>
      <div>
        <Image src="/images/new-logo.png" alt="Logo" width={158} height={108} className="object-contain" />
      </div>
    </header>
  )
}

