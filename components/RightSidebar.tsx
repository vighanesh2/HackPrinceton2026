'use client'

import { Target, TrendingUp, Lightbulb } from 'lucide-react'

export default function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <div className="right-sidebar-content">
        {/* Header */}
        <div className="right-sidebar-header">
          <div className="guidance-label">GUIDANCE</div>
          <h2 className="guidance-title">Problem Clarity</h2>
        </div>

        {/* Cards */}
        <div className="guidance-cards">
          {/* Next Action Card */}
          <div className="guidance-card">
            <div className="card-icon next-action-icon">
              <Target className="icon" />
            </div>
            <div className="card-content">
              <h3 className="card-title">Next Action</h3>
              <p className="card-description">
                Provide a thoughtful answer to move forward.
              </p>
            </div>
          </div>

          {/* Stage Confidence Card */}
          <div className="guidance-card">
            <div className="card-icon stage-confidence-icon">
              <TrendingUp className="icon" />
            </div>
            <div className="card-content">
              <h3 className="card-title">Stage Confidence</h3>
              <div className="confidence-indicator">
                <span className="confidence-badge">Weak</span>
                <div className="confidence-dots">
                  <span className="dot active"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
              <p className="card-description">
                Most questions are incomplete or too brief.
              </p>
            </div>
          </div>

          {/* Rontzen Insight Card */}
          <div className="guidance-card">
            <div className="card-icon rontzen-insight-icon">
              <Lightbulb className="icon" />
            </div>
            <div className="card-content">
              <h3 className="card-title">Rontzen Insight</h3>
              <p className="card-quote">
                "You can't solve a problem you don't understand. Slow down."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="right-sidebar-footer">
        <p className="footer-text">Honest feedback, always.</p>
      </div>
    </aside>
  )
}

