'use client'
import type { Metadata } from "next";
import { Lato } from 'next/font/google'
import "./globals.css";
import { Provider } from "react-redux";
import store from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
})


// export const metadata: Metadata = {
//   title: "Care Diabetics",
//   description: "India’s leading virtual platform for diabetes care.",
// };

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <html lang="en">
      <body className={`${lato.variable} antialiased min-h-screen flex flex-col`}>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            {children}
          </Provider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
