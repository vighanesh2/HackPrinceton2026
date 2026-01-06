'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import RightSidebar from './RightSidebar'

export default function ConditionalSidebars() {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  if (isLandingPage) {
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
  const isLandingPage = pathname === '/'

  if (isLandingPage) {
    return null
  }

  return <RightSidebar />
}

