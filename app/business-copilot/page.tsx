'use client'

import Header from '@/components/Header'
import AppSidebar from '@/components/AppSidebar'
import MainContent from '@/components/MainContent'

export default function BusinessCopilot() {
  return (
    <>
      <AppSidebar />
      <div className="main-wrapper">
        <Header />
        <MainContent />
      </div>
    </>
  )
}

