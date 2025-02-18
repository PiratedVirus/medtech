"use client";

import Link from "next/link";
import { cn } from "@/lib/utils"; // Import ShadCN's utility if using it

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link href={href} className="group relative">
      <span
        className={cn(
          "text-white hover:text-gray-300 transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 group-hover:after:w-full"
        )}
      >
        {children}
      </span>
    </Link>
  );
}