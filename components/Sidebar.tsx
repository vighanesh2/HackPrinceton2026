'use client'

import { Archive, TrendingUp } from 'lucide-react'

interface Stage {
  number: number
  name: string
  status: 'weak' | 'strong'
  isActive?: boolean
}

const stages: Stage[] = [
  { number: 1, name: 'Problem Clarity', status: 'weak', isActive: true },
  { number: 2, name: 'Solution Hypothesis', status: 'weak' },
  { number: 3, name: 'Validation', status: 'weak' },
  { number: 4, name: 'MVP Build Readiness', status: 'weak' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <div className="startup-label">STARTUP</div>
          <h1 className="sidebar-title">My Startup</h1>
          <span className="badge-active">
            <TrendingUp className="badge-icon" />
            <span>Active</span>
          </span>
        </div>

        {/* Divider */}
        <div className="sidebar-divider"></div>

        {/* Stages Section */}
        <div className="stages-section">
          <h2 className="stages-title">STAGES</h2>
          <div className="stages-list">
            {stages.map((stage) => (
              <div
                key={stage.number}
                className={`stage-item ${stage.isActive ? 'active' : ''}`}
              >
                <div className="stage-content">
                  <div
                    className={`stage-number-circle ${
                      stage.isActive ? 'active' : ''
                    }`}
                  >
                    {stage.number}
                  </div>
                  <span
                    className={`stage-name ${
                      stage.isActive ? 'active' : ''
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
                <div className="stage-badges">
                  <span className="badge-weak">Weak</span>
                  {stage.isActive && (
                    <svg
                      className="arrow-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Archive Section */}
      <div className="sidebar-footer">
        <button className="archive-button">
          <Archive className="archive-icon" />
          <span>Archive Startup</span>
        </button>
      </div>
    </aside>
  )
}
