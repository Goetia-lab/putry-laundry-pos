'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  // Warm cache on mount — fetch essentials immediately
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ['branches'] })
    queryClient.prefetchQuery({ queryKey: ['services', undefined] })
    queryClient.prefetchQuery({ queryKey: ['dashboard', undefined] })
  }, [queryClient])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
      </ThemeProvider>
  )
}
