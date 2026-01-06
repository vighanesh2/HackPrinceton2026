'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Folder, Search, Sun, Settings, User } from 'lucide-react'
import { useModel } from '@/contexts/ModelContext'

export default function Header() {
  const { selectedModel, setSelectedModel } = useModel()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const models = [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ]

  const currentModelLabel = models.find((m) => m.value === selectedModel)?.label || 'Core 7.1'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

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
        
        <div className="version-dropdown" ref={dropdownRef}>
          <button
            className="version-dropdown-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="version-text">{currentModelLabel}</span>
            <ChevronDown className={`header-icon ${isDropdownOpen ? 'rotated' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="version-dropdown-menu">
              {models.map((model) => (
                <button
                  key={model.value}
                  className={`version-dropdown-item ${selectedModel === model.value ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedModel(model.value as 'gemini-2.5-pro' | 'gemini-2.0-flash')
                    setIsDropdownOpen(false)
                  }}
                >
                  {model.label}
                </button>
              ))}
            </div>
          )}
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
