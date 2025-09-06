import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Navigation } from '@/components/hockey/navigation'
import { Footer } from '@/components/layout/Footer'
import '@/styles/globals.css'
import '@/styles/design-tokens.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hockey Directory - Find Hockey Advisors, Coaches & Resources',
  description: 'Connect with verified hockey advisors, coaches, tournaments, and prep schools. Your comprehensive resource for youth hockey development aged 13-15.',
  keywords: 'hockey advisors, hockey coaches, youth hockey, hockey tournaments, prep schools, hockey development',
  authors: [{ name: 'Hockey Directory' }],
  openGraph: {
    title: 'Hockey Directory - Find Hockey Advisors & Resources',
    description: 'Connect with verified hockey advisors, coaches, tournaments, and prep schools.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}