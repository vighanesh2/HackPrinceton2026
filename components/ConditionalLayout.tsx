'use client'

import { usePathname } from 'next/navigation'
import ConditionalSidebars, { ConditionalRightSidebar } from './ConditionalSidebars'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBusinessCopilot = pathname === '/business-copilot'
  const isLandingPage = pathname === '/'

  // For business copilot, it has its own complete layout structure
  // For landing page, no sidebars
  // For questionnaire, use the standard layout with sidebars
  if (isBusinessCopilot || isLandingPage) {
    return (
      <div className="app-container">
        {children}
      </div>
    )
  }

  // For questionnaire and other pages
  return (
    <div className="app-container">
      <ConditionalSidebars />
      <main className="main-content">{children}</main>
      <ConditionalRightSidebar />
    </div>
  )
}

