'use client'

import { ChevronDown, Folder, Search, Sun, Settings, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-container">
          <div className="logo-box">
            <span className="logo-text">E</span>
            <div className="logo-overlay"></div>
          </div>
          <span className="brand-name">Elevatr.</span>
        </div>
        
        <div className="version-dropdown">
          <span className="version-text">Core 7.1</span>
          <ChevronDown className="header-icon" />
        </div>
        
        <div className="header-icons">
          <Folder className="header-icon" />
          <Search className="header-icon" />
        </div>
      </div>

      <div className="header-center">
        <a href="#" className="nav-link">Launchpad</a>
        <a href="#" className="nav-link">VentureDesk</a>
        <a href="#" className="nav-link">Help & Support</a>
      </div>

      <div className="header-right">
        <Sun className="header-icon" />
        <Settings className="header-icon" />
        <div className="profile-container">
          <div className="profile-avatar">
            <User className="profile-icon" />
          </div>
          <div className="pro-badge">PRO</div>
        </div>
      </div>
    </header>
  )
}
