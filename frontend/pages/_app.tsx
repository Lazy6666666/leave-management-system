import type { AppProps } from 'next/app'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/ui/toaster'
import { SkipLink } from '@/components/ui/skip-link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import '@/pages/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Create QueryClient instance once per app
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Check if current route needs dashboard layout
  const isDashboardRoute = router.pathname.startsWith('/dashboard')

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#navigation">Skip to navigation</SkipLink>
        {isDashboardRoute ? (
          <DashboardLayout>
            <Component {...pageProps} />
          </DashboardLayout>
        ) : (
          <Component {...pageProps} />
        )}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}