import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext'
import { ModelProvider } from '@/contexts/ModelContext'
import ConditionalLayout from '@/components/ConditionalLayout'
import SmoothScroll from '@/components/SmoothScroll'

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
        <SmoothScroll />
        <ModelProvider>
        <QuestionnaireProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </QuestionnaireProvider>
        </ModelProvider>
      </body>
    </html>
  )
}
