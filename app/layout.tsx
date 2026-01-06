import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext'
import ConditionalSidebars, { ConditionalRightSidebar } from '@/components/ConditionalSidebars'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Rontzen Prototype',
  description: 'A Next.js application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <QuestionnaireProvider>
          <div className="app-container">
            <ConditionalSidebars />
            <main className="main-content">{children}</main>
            <ConditionalRightSidebar />
          </div>
        </QuestionnaireProvider>
      </body>
    </html>
  )
}
