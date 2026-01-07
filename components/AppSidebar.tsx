'use client'

import { MessageSquare, Wrench, MessageCircle, Globe, UserCircle, X, Palette, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AppSidebar() {
  const pathname = usePathname()
  const historyItems = [
    'Create a pitch deck for a mental...',
    'Generate 3 MVP feature sets fo...',
    'How to make a good invest strat...',
    'Help me find a startup name an...',
    'Draft a cold email to potential be...',
    'Turn this idea into a problem/sol...',
    'What KPIs should i track for my...',
  ]

  const isPrototypeBuilder = pathname === '/Prototype-Builder'
  const isPitchCreation = pathname === '/business-copilot'
  const isMarketInsights = pathname === '/Market-Insights'

  return (
    <aside className="sidebar app-sidebar">
      <div className="sidebar-content">
        <button className="new-chat-button">
          <MessageSquare className="new-chat-icon" />
          <span>New Chat</span>
        </button>

        <div className="features-section">
          <h3 className="section-title">FEATURES</h3>
          <Link href="/Prototype-Builder" className={`feature-item ${isPrototypeBuilder ? 'active' : ''}`}>
            <Wrench className="feature-icon" />
            <span className="feature-text">Prototype Builder</span>
          </Link>
          <Link href="/business-copilot" className={`feature-item ${isPitchCreation ? 'active' : ''}`}>
            <MessageCircle className="feature-icon" />
            <span className="feature-text">Pitch Creation</span>
          </Link>
          <Link href="/Market-Insights" className={`feature-item ${isMarketInsights ? 'active' : ''}`}>
            <Search className="feature-icon" />
            <span className="feature-text">Market Insights</span>
          </Link>
          <div className="feature-item">
            <Globe className="feature-icon" />
            <span className="feature-text">SWOT Insights</span>
          </div>
          <div className="feature-item">
            <UserCircle className="feature-icon" />
            <span className="feature-text">User Personas</span>
          </div>
          <div className="feature-item">
            <Palette className="feature-icon" />
            <span className="feature-text">Brand kit generator</span>
          </div>
        </div>

        <div className="history-section">
          <div className="history-header">
            <h3 className="section-title">HISTORY</h3>
            <a href="#" className="see-all-link">See all &gt;</a>
          </div>
          <div className="history-list">
            {historyItems.map((item, index) => (
              <div key={index} className="history-item">
                <p className="history-text">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="share-container">
          <div className="share-icon-wrapper">
            <X className="share-x-icon" />
            <div className="share-profile share-profile-1"></div>
            <div className="share-profile share-profile-2"></div>
            <div className="share-profile share-profile-3"></div>
          </div>
        </div>
        <button className="share-button">Share result in X</button>
      </div>
    </aside>
  )
}

