import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import RightSidebar from '@/components/RightSidebar'
import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext'

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
            <Sidebar />
            <main className="main-content">{children}</main>
            <RightSidebar />
          </div>
        </QuestionnaireProvider>
      </body>
    </html>
  )
}
