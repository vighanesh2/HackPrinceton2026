'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import RightSidebar from './RightSidebar'

export default function ConditionalSidebars() {
  const pathname = usePathname()
  // Hide questionnaire sidebars on landing page and business copilot page
  // Business copilot has its own layout with AppSidebar
  const shouldHide = pathname === '/' || pathname === '/business-copilot'

  if (shouldHide) {
    return null
  }

  return (
    <>
      <Sidebar />
    </>
  )
}

export function ConditionalRightSidebar() {
  const pathname = usePathname()
  // Hide questionnaire sidebars on landing page and business copilot page
  // Business copilot has its own layout
  const shouldHide = pathname === '/' || pathname === '/business-copilot'

  if (shouldHide) {
    return null
  }

  return <RightSidebar />
}

