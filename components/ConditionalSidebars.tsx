'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import RightSidebar from './RightSidebar'

export default function ConditionalSidebars() {
  const pathname = usePathname()
  // Only show sidebars on questionnaire page
  const isQuestionnaire = pathname === '/questionnaire'

  if (!isQuestionnaire) {
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
  // Only show sidebars on questionnaire page
  const isQuestionnaire = pathname === '/questionnaire'

  if (!isQuestionnaire) {
    return null
  }

  return <RightSidebar />
}

