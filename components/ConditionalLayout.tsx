'use client'

import { usePathname } from 'next/navigation'
import ConditionalSidebars, { ConditionalRightSidebar } from './ConditionalSidebars'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isQuestionnaire = pathname === '/questionnaire'
  const isLandingPage = pathname === '/'

  // Only show sidebars on questionnaire page
  if (isQuestionnaire) {
    return (
      <div className="app-container">
        <ConditionalSidebars />
        <main className="main-content">{children}</main>
        <ConditionalRightSidebar />
      </div>
    )
  }

  // Landing page should not be wrapped in app-container
  if (isLandingPage) {
    return <>{children}</>
  }

  // For all other pages (business copilot, prototype builder, etc.), no sidebars
  return (
    <div className="app-container">
      {children}
    </div>
  )
}

