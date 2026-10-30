import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/lib/auth-client'
import { Toaster } from '@/components/ui/sonner'
import { PwaProvider } from '@/components/pwa/pwa-provider'
import { InstallPrompt } from '@/components/pwa/install-prompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NoteKori - Personal Finance Tracker',
  description: 'Cloud-based personal finance tracker for income, expenses, and analytics',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'NoteKori', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#18181b',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              {children}
              <Toaster position="bottom-right" richColors />
              <PwaProvider />
              <InstallPrompt />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
