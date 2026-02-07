'use client'

import { Lato } from 'next/font/google'
import "./globals.css";
import { Provider } from "react-redux";
import store from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { initializeUserProfile, fetchUserProfile } from "@/store/userSlice";
import CdLoader from '@/components/ui/custom/cd-loader';
import ProgressProvider from '@/components/common/ProgressProvider';
import NavigationProgress from '@/components/common/NavigationProgress';
import MiddlewareProgressHandler from '@/components/common/MiddlewareProgressHandler';
import SmartProgressBar from '@/components/common/SmartProgressBar';
import { suppressExtensionErrors } from '@/lib/error-suppression';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
})

// Client-side only component to wrap children once localStorage is available
function ClientSideWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10 * 60 * 1000,       // 10 minutes - keep data fresh longer
          gcTime: 30 * 60 * 1000,          // 30 minutes - keep in cache much longer
          refetchOnWindowFocus: false,     // Prevent unnecessary refetches on tab focus
          refetchOnMount: false,           // Use cached data when component mounts
          refetchOnReconnect: false,       // Don't refetch on network reconnect for better UX
          refetchInterval: false,          // No automatic refetching
          networkMode: 'offlineFirst',     // Prioritize cache over network
          retry: (failureCount, error: any) => {
            // Smart retry logic - don't retry auth errors
            if (error?.response?.status === 401 || error?.response?.status === 403) {
              return false;
            }
            return failureCount < 1; // Reduce retry attempts for faster response
          },
          retryDelay: 1000, // Fixed 1 second delay instead of exponential backoff
        },
        mutations: {
          retry: 1, // Retry mutations only once
          retryDelay: 1000,
        },
      },
    });
    
    // Store queryClient globally for cache invalidation in hooks
    if (typeof window !== 'undefined') {
      (window as any).__REACT_QUERY_CLIENT__ = client;
    }
    
    return client;
  });
  const [persister, setPersister] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Check if we're on a superadmin route
  const isSuperAdminRoute = pathname?.startsWith('/superadmin');

  useEffect(() => {
    // Suppress browser extension errors
    suppressExtensionErrors();
    
    // Only run once the component is mounted on the client
    setPersister(createSyncStoragePersister({ 
      storage: window.localStorage 
    }));
    setIsReady(true);
    
    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      }).then((registration) => {
        console.log('Service Worker registered successfully:', registration);
      }).catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
    }
    
    // Profile initialization is now handled by React Query in useCentralizedProfile
  }, []);

  // For superadmin routes, don't show loading spinner
  if (!isReady && !isSuperAdminRoute) {
    return <CdLoader />;
  }

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      <ProgressProvider>
        <NavigationProgress />
        <MiddlewareProgressHandler />
        <SmartProgressBar />
        {children}
      </ProgressProvider>
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
          <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop pauseOnFocusLoss={false} draggable pauseOnHover theme="colored" />
          <ClientSideWrapper>
            {children}
          </ClientSideWrapper>
        </Provider>
      </body>
    </html>
  );
}