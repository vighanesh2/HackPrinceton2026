import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext'
import { ModelProvider } from '@/contexts/ModelContext'
import ConditionalLayout from '@/components/ConditionalLayout'
import SmoothScroll from '@/components/SmoothScroll'
import { ThemeProvider } from '@/components/ThemeProvider'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'Rontzen',
  description: 'Understand your code without the jargon.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('rontzen-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t?t==='dark':d;document.documentElement.classList.toggle('dark',dark);})();`,
          }}
        />
      </head>
      <body className={`${outfit.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider>
        <SmoothScroll />
        <ModelProvider>
        <QuestionnaireProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </QuestionnaireProvider>
        </ModelProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
