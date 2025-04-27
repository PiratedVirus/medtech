'use client'
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { AlignLeft } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="flex items-center justify-between w-full p-4 bg-[#f9fafb] text-white px-4 sm:px-20 ">
      {/* Logo for non-mobile screens */}
      <div className="hidden lg:flex items-center">
        <Link href="/" className="text-gray-900 hover:text-secondary">
          <Image
            src="/images/new-logo.png"
            alt="Logo"
            width={150}  // Adjust width as needed
            height={50}  // Adjust height as needed
          />
        </Link>
      </div>

      {/* Mobile Hamburger Menu Icon on Left */}
      <div className="lg:hidden flex items-center justify-between w-full">
      <button onClick={toggleMenu} className="text-gray-900 hover:text-secondary">
          <AlignLeft className="w-6 h-6" /> {/* Use AlignLeft icon */}
        </button>
        {/* Right side Login button */}
        <Link
          href="/dashboard"
          className="ml-auto text-white bg-primary hover:bg-primary-dark text-sm font-medium py-2 px-6 rounded-full"
        >
          Login
        </Link>
      </div>

      {/* Desktop Navigation - Links on the right */}
      <nav className="hidden lg:flex gap-6 ml-auto">
        <Link href="/" className="text-gray-900 hover:text-secondary">
          Home
        </Link>
        <Link href="/about" className="text-gray-900 hover:text-secondary">
          About
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

      </nav>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden z-10  absolute top-16 left-0 w-full bg-[#f9fafb] transition-all ${isMenuOpen ? "block" : "hidden"
          }`}
      >
        <nav className="flex flex-col gap-6 p-4">
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
          <Link href="/about" className="text-gray-900 hover:text-secondary">
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}