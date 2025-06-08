'use client'

import { Lato } from 'next/font/google'
import "./globals.css";
import { Provider } from "react-redux";
import store from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, useEffect } from "react";
import { initializeUserProfile, fetchUserProfile } from "@/store/userSlice";
import CdLoader from '@/components/ui/custom/cd-loader';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
})

// Client-side only component to wrap children once localStorage is available
function ClientSideWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [persister, setPersister] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only run once the component is mounted on the client
    setPersister(createSyncStoragePersister({ 
      storage: window.localStorage 
    }));
    setIsReady(true);
    
    // Initialize user profile from sessionStorage if available
    const initializeProfile = async () => {
      const storedProfile = await store.dispatch(initializeUserProfile());
      if (!storedProfile) {
        // Only fetch if not in storage
        await store.dispatch(fetchUserProfile());
      }
    };
    
    initializeProfile();
  }, []);

  if (!isReady) {
    return <CdLoader />;
  }

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics Script */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FVBPV9ZVNF"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-FVBPV9ZVNF');
            `,
          }}
        />
      </head>
      <body className={`${lato.variable} antialiased min-h-screen flex flex-col`}>
        <Provider store={store}>
          <ClientSideWrapper>
            {children}
          </ClientSideWrapper>
        </Provider>
      </body>
    </html>
  );
}