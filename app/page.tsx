'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-logo">
          <div className="landing-logo-box">
            <span className="landing-logo-text">R</span>
          </div>
        </div>
        <h1 className="landing-title">Welcome to Rontzen</h1>
        <p className="landing-subtitle">Choose an option to get started</p>
        
        <div className="landing-buttons">
          <Link href="/questionnaire" className="landing-button questionnaire-button">
            <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Questionnaire</span>
          </Link>
          
          <Link href="/business-copilot" className="landing-button copilot-button">
            <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Business Copilot</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
