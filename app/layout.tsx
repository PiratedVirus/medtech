import type { Metadata } from "next";
import { Lato } from 'next/font/google'
import "./globals.css";

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
})


export const metadata: Metadata = {
  title: "Care Diabetics",
  description: "India’s leading virtual platform for diabetes care.",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
