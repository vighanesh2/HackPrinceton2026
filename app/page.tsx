'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="hero-landing-page">
      {/* Header */}
      <header className="hero-header">
        <div className="hero-header-content">
          <div className="hero-logo-container">
            <div className="hero-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L22 20H2L12 2Z" fill="url(#logoGradient)"/>
                <defs>
                  <linearGradient id="logoGradient" x1="12" y1="2" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60A5FA"/>
                    <stop offset="1" stopColor="#3B82F6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="hero-brand-name">Rontzen</span>
          </div>
          
          <nav className="hero-nav">
            <Link href="#features" className="hero-nav-link">Features</Link>
            <Link href="#pricing" className="hero-nav-link">Pricing</Link>
            <Link href="#reviews" className="hero-nav-link">Reviews</Link>
          </nav>
          
          <div className="hero-header-actions">
            <Link href="/login" className="hero-login-link">Login</Link>
            <button className="hero-header-cta">Sign up for free</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-headline">
            Your AI Co-Founder
            <br />
            for Growth &amp;
            <br />
            Strategy
          </h1>
          
          <p className="hero-description">
            From validating ideas to closing your first deal. Streamline your networking, automate cold outreach, and build data-backed pricing models—all in one platform.
          </p>
          
          <div className="hero-cta-buttons">
            <button className="hero-cta-primary">Get 14 Days Free Trial</button>
            <button className="hero-cta-secondary">Book A Free Demo</button>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="dashboard-preview-section">
        <div className="dashboard-image-box"></div>
        {/* Header Tags */}
        <div className="dashboard-header-tags">
          <div className="dashboard-tag active">
            <svg className="tag-icon verified-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#111827"/>
              <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Private & Secure</span>
          </div>
          <div className="dashboard-tag">
            <div className="tag-dot"></div>
            <span>Real-Time Insights</span>
          </div>
          <div className="dashboard-tag">
            <div className="tag-dot"></div>
            <span>Automated Follow-Ups</span>
          </div>
        </div>
        <div className="dashboard-container">

          <div className="dashboard-content-wrapper">
            {/* Left Sidebar */}
            <aside className="dashboard-sidebar">
              <nav className="sidebar-nav">
                <a href="#" className="sidebar-item">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Inbox</span>
                  <span className="notification-badge">4</span>
                </a>
                <a href="#" className="sidebar-item">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Project</span>
                </a>
                <a href="#" className="sidebar-item">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Activity</span>
                </a>
                <a href="#" className="sidebar-item">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>My task</span>
                </a>
                <a href="#" className="sidebar-item">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Teams</span>
                </a>
                <a href="#" className="sidebar-item">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Message</span>
                </a>
                <a href="#" className="sidebar-item">
                  <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </a>
              </nav>
            </aside>

            {/* Main Content Area */}
            <div className="dashboard-main-content">
              {/* Top Row */}
              <div className="dashboard-top-row">
                {/* Prompt Card */}
                <div className="dashboard-card prompt-card">
                  <div className="card-header">
                    <div className="card-title">
                      <svg className="card-icon blue-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span>Prompt</span>
                    </div>
                  </div>
                  <div className="prompt-content">
                    <div className="prompt-message">
                      <p>Hi, how can i help you?</p>
                    </div>
                    <div className="user-message-bubble">
                      <div className="user-avatar-small"></div>
                      <div className="message-text">How do i update my account information?</div>
                    </div>
                    <div className="prompt-input-wrapper">
                      <input type="text" placeholder="Ask me anything..." className="prompt-input" />
                      <button className="send-button">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sales Analyzing Card */}
                <div className="dashboard-card sales-card">
                  <div className="card-header">
                    <div className="card-title">
                      <span>Sales Analyzing</span>
                    </div>
                  </div>
                  <div className="chart-container">
                    <svg className="sales-chart" viewBox="0 0 400 200">
                      {/* Grid lines */}
                      <line x1="0" y1="160" x2="400" y2="160" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="120" x2="400" y2="120" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="80" x2="400" y2="80" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="40" x2="400" y2="40" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                      
                      {/* Chart line */}
                      <polyline
                        points="40,140 80,130 120,100 160,40 200,60 240,80 280,70 320,90 360,100"
                        fill="none"
                        stroke="url(#chartGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Peak point */}
                      <circle cx="160" cy="40" r="6" fill="#3B82F6" />
                      <text x="160" y="25" fill="#3B82F6" fontSize="12" fontWeight="600" textAnchor="middle">$540,50,000</text>
                      
                      {/* X-axis labels */}
                      <text x="40" y="180" fill="#6b7280" fontSize="11" textAnchor="middle">May</text>
                      <text x="80" y="180" fill="#6b7280" fontSize="11" textAnchor="middle">Jun</text>
                      <text x="120" y="180" fill="#6b7280" fontSize="11" textAnchor="middle">Jul</text>
                      <text x="160" y="180" fill="#111827" fontSize="12" fontWeight="600" textAnchor="middle">Aug</text>
                      <text x="200" y="180" fill="#6b7280" fontSize="11" textAnchor="middle">Sep</text>
                      <text x="240" y="180" fill="#6b7280" fontSize="11" textAnchor="middle">Oct</text>
                      
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#60A5FA" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Calendar Card */}
              <div className="dashboard-card calendar-card">
                <div className="card-header">
                  <div className="card-title">
                    <svg className="card-icon blue-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Calendar</span>
                    <select className="month-selector">
                      <option>July</option>
                    </select>
                  </div>
                </div>
                <div className="calendar-content">
                  <div className="date-strip">
                    <button className="date-nav-arrow">‹</button>
                    <div className="date-list">
                      <div className="date-item">Fri<div className="date-number">04</div></div>
                      <div className="date-item active">Fri<div className="date-number">04</div></div>
                      <div className="date-item">Sat<div className="date-number">05</div></div>
                      <div className="date-item">Sun<div className="date-number">06</div></div>
                      <div className="date-item">Mon<div className="date-number">07</div></div>
                    </div>
                    <button className="date-nav-arrow">›</button>
                  </div>
                  <div className="event-item">
                    <div className="event-details">
                      <div className="event-title">Meeting with UI/UX team</div>
                      <div className="event-time">Today 10.00 - 11.00 am</div>
                    </div>
                    <div className="event-actions">
                      <button className="google-meet-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" fill="#00832D"/>
                          <path d="M5.5 8l2-2 2 2 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Google Meet</span>
                      </button>
                      <div className="attendees">
                        <div className="attendee-avatar"></div>
                        <div className="attendee-avatar"></div>
                        <div className="attendee-avatar"></div>
                        <div className="attendee-more">+2</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Move 10x faster from "Idea" to "Revenue"</h2>
        
        <div className="features-cards-container">
          {/* AI Assist Card */}
          <div className="feature-card ai-assist-card">
            <div className="card-label">
              <img src="/sparkle.png" alt="Sparkle" className="star-icon" />
              <span>AI Assist</span>
            </div>
            <div className="ai-assist-metric">
              Outreach momentum:<br />
              +86% reply rate this week
            </div>
            <div className="ai-assist-actions">
              <button className="action-button">Generate summary</button>
              <button className="action-button">How to increase sales next week?</button>
              <button className="action-button">What the item should we ewduce?</button>
            </div>
          </div>

          {/* Profile and Tags Card */}
          <div className="feature-card profile-card">
            <div className="profile-image-container">
              <img src="/manonlaptop.jpg" alt="Person on laptop" className="profile-image" />
              <div className="profile-tag tag-1">Smart Networking</div>
              <div className="profile-tag tag-2">Price Modeling</div>
              <div className="profile-tag tag-3">SWOT Analysis</div>
              <div className="profile-tag tag-4">Lead Gen</div>
              <div className="profile-tag tag-5">Competitor Study</div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovative AI Solutions Section */}
      <section className="ai-solutions-section">
        <h2 className="solutions-title">Innovative AI solutions that helps</h2>
        
        <div className="solutions-card">
          <div className="solutions-content">
            <h3 className="solutions-heading">Intelligent Networking</h3>
            <p className="solutions-description">
              Stop cold messaging into the void. Identify and connect with the right investors, mentors, and partners based on your industry and stage.
            </p>
            <ul className="solutions-list">
              <li className="solutions-list-item">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Match with relevant investors</span>
              </li>
              <li className="solutions-list-item">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Find potential co-founders</span>
              </li>
              <li className="solutions-list-item">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automated connection requests</span>
              </li>
            </ul>
          </div>
          
          <div className="solutions-visual">
            <div className="productivity-card">
              <div className="productivity-header">
                <div>
                  <h4 className="productivity-title">Productivity</h4>
                  <p className="productivity-subtitle">Today</p>
                </div>
                <div className="progress-circle">
                  <svg className="progress-svg" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                    <circle className="progress-bg" cx="50" cy="50" r="45" />
                    <circle className="progress-bar" cx="50" cy="50" r="45" />
                  </svg>
                  <span className="progress-text">+29%</span>
                </div>
              </div>
              <button className="manage-button">Manage</button>
            </div>
          </div>
        </div>
      </section>

      {/* Cold Outreach Section */}
      <section className="cold-outreach-section">
        <div className="outreach-card">
          <div className="outreach-container">
            {/* Left Side - Background with Chat Window */}
            <div className="outreach-left-side">
              <div className="outreach-chat-card">
                <div className="chat-card-header">
                  <img src="/sparkle.png" alt="Sparkle" className="chat-sparkle-icon" />
                  <span className="chat-card-title">Prompt</span>
                </div>
                <div className="chat-card-content">
                  <div className="chat-bubble left-bubble">
                    <p>Hi, how can i help you?</p>
                  </div>
                  <div className="chat-bubble right-bubble">
                    <p>How do i update my account information?</p>
                    <div className="chat-avatar"></div>
                  </div>
                </div>
                <div className="chat-input-container">
                  <input type="text" placeholder="Ask me anything..." className="chat-input-field" />
                  <button className="chat-send-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="outreach-content">
              <h3 className="outreach-title">Cold Outreach Pilot</h3>
              <p className="outreach-description">
                Secure your first 100 customers without a marketing team. Generate hyper-personalized emails that land in the primary inbox, not spam.
              </p>
              <ul className="outreach-features">
                <li className="outreach-feature-item">
                  <svg className="feature-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-personalized subject lines</span>
                </li>
                <li className="outreach-feature-item">
                  <svg className="feature-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Automated follow-up sequences</span>
                </li>
                <li className="outreach-feature-item">
                  <svg className="feature-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-time open & reply tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Business Modeling Section */}
      <section className="solutions-section">
        <div className="solutions-card">
          {/* Left Content */}
          <div className="solutions-content">
            <h2 className="solutions-heading">Strategic Business<br />Modeling</h2>
            <p className="solutions-description">
              Validate your business logic instantly. Create comprehensive SWOT analyses and simulate pricing models to maximize your margins.
            </p>
            <ul className="solutions-list">
              <li className="solutions-list-item">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-Time Collaboration</span>
              </li>
              <li className="solutions-list-item">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Centralized Communication</span>
              </li>
              <li className="solutions-list-item">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
                <span>Integrated File Sharing</span>
              </li>
            </ul>
          </div>

          {/* Right Side - Background with Stats Window */}
          <div className="solutions-visual stats-visual">
            <div className="stats-card">
              <h4 className="stats-card-title">Sales Funnel Optimization</h4>
              <div className="stats-chart">
                <div className="stat-bar-container">
                  <div className="stat-bar-wrapper">
                    <div className="stat-bar" style={{ height: '78%' }}>
                      <span className="stat-value">78%</span>
                    </div>
                    <span className="stat-month">Jan</span>
                  </div>
                  <div className="stat-bar-wrapper">
                    <div className="stat-bar" style={{ height: '34%' }}>
                      <span className="stat-value">34%</span>
                    </div>
                    <span className="stat-month">Feb</span>
                  </div>
                  <div className="stat-bar-wrapper">
                    <div className="stat-bar stat-bar-highlighted" style={{ height: '88%' }}>
                      <span className="stat-value">88%</span>
                    </div>
                    <span className="stat-month stat-month-highlighted">Mar</span>
                  </div>
                  <div className="stat-bar-wrapper">
                    <div className="stat-bar" style={{ height: '35%' }}>
                      <span className="stat-value">35%</span>
                    </div>
                    <span className="stat-month">Apr</span>
                  </div>
                  <div className="stat-bar-wrapper">
                    <div className="stat-bar" style={{ height: '55%' }}>
                      <span className="stat-value">55%</span>
                    </div>
                    <span className="stat-month">May</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligent Work Management Section */}
      <section className="work-management-section">
        <h2 className="work-management-title">The Founder's Workflow</h2>
        <div className="work-management-cards">
          <div className="work-management-card">
            <h3 className="work-card-title">Analyze the Market</h3>
            <p className="work-card-description">Input your idea and let the Co-Pilot generate a full SWOT analysis and market gap report.</p>
          </div>
          <div className="work-management-card">
            <h3 className="work-card-title">Set Your Pricing</h3>
            <p className="work-card-description">Use our data-driven modeler to find the sweet spot between profit margin and customer value.</p>
          </div>
          <div className="work-management-card">
            <h3 className="work-card-title">Automate Outreach</h3>
            <p className="work-card-description">Launch cold email campaigns to a targeted list of potential users and investors.</p>
          </div>
          <div className="work-management-card">
            <h3 className="work-card-title">Network & Scale</h3>
            <p className="work-card-description">Get introduced to key players in your niche and turn conversations into contracts.</p>
        </div>
        </div>
      </section>

      {/* Opportunity Insights Section */}
      <section className="opportunity-section">
        <div className="opportunity-card">
          <h2 className="opportunity-title">Deep insights for smarter decisions</h2>
          <div className="opportunity-grid">
            {/* Card 1: AI-Powered Lead Scoring */}
            <div className="opportunity-item-wrapper">
              <div className="opportunity-item-card">
                <div className="opportunity-visual-window">
                  <div className="lead-score-gauge">
                    <div className="gauge-circle">
                      <svg className="gauge-svg" viewBox="0 0 100 100">
                        <circle className="gauge-bg" cx="50" cy="50" r="45" />
                        <circle className="gauge-progress" cx="50" cy="50" r="45" strokeDasharray="283" strokeDashoffset="79" />
                      </svg>
                      <span className="gauge-value">72%</span>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="opportunity-item-label">SWOT Engine</h3>
              <p className="opportunity-item-description">Instantly visualize Strengths, Weaknesses, Opportunities, and Threats based on live market data.</p>
            </div>

            {/* Card 2: Team Productivity Insights */}
            <div className="opportunity-item-wrapper">
              <div className="opportunity-item-card">
                <div className="opportunity-visual-window">
                  <div className="productivity-modules">
                    <div className="productivity-module">
                      <span className="module-label">New Task</span>
                      <div className="module-icon orange-icon">
                        <svg fill="none" stroke="white" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                    <div className="productivity-module">
                      <span className="module-label">Pending Task</span>
                      <div className="module-icon black-icon">
                        <svg fill="none" stroke="white" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="opportunity-item-label">Network Tracker</h3>
              <p className="opportunity-item-description">A CRM built for networking. Track who you met, when to follow up, and relationship warmth.</p>
            </div>

            {/* Card 3: Sales Playbook Automation */}
            <div className="opportunity-item-wrapper">
              <div className="opportunity-item-card">
                <div className="opportunity-visual-window">
                  <div className="sales-chart">
                    <div className="chart-header">
                      <span className="chart-value">$540,50,000</span>
                    </div>
                    <div className="chart-container">
                      <svg className="line-chart" viewBox="0 0 200 100">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                        <path className="chart-area" d="M 20 80 L 40 70 L 60 50 L 80 30 L 100 20 L 120 25 L 140 35 L 160 50 L 180 60 L 200 55 L 200 100 L 20 100 Z" />
                        <path className="chart-line" d="M 20 80 L 40 70 L 60 50 L 80 30 L 100 20 L 120 25 L 140 35 L 160 50 L 180 60 L 200 55" />
                        <line className="chart-marker" x1="100" y1="0" x2="100" y2="100" />
                        <text className="chart-label" x="100" y="95" textAnchor="middle" fontSize="8">Jul</text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="opportunity-item-label">Pricing Simulator</h3>
              <p className="opportunity-item-description">Adjust variables like CAC and Churn to see how different pricing tiers affect your runway.</p>
            </div>

            {/* Card 4: Performance Tracking & KPIs */}
            <div className="opportunity-item-wrapper">
              <div className="opportunity-item-card">
                <div className="opportunity-visual-window">
                  <div className="performance-chart">
                    <svg className="multi-line-chart" viewBox="0 0 200 120">
                      <path className="chart-line black-line" d="M 20 80 L 50 60 L 80 70 L 110 50 L 140 40 L 170 30 L 200 25" />
                      <path className="chart-line orange-line" d="M 20 90 L 50 85 L 80 80 L 110 75 L 140 70 L 170 65 L 200 60" />
                      <path className="chart-line grey-line" d="M 20 100 L 50 95 L 80 90 L 110 85 L 140 80 L 170 75 L 200 70" />
                    </svg>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <span className="legend-dot orange-dot"></span>
                        <span className="legend-text">Pending</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot black-dot"></span>
                        <span className="legend-text">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="opportunity-item-label">Campaign Analytics</h3>
              <p className="opportunity-item-description">Track the health of your cold emails with clear KPIs on open rates and conversion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="pricing-container">
          <h2 className="pricing-title">Plans that scale with your startup</h2>
          <p className="pricing-subtitle">Supporters receive a 30% discount on early access<br />plus an extra 20% off the yearly plan.</p>
          
          <div className="pricing-toggle-container">
            <div className="pricing-toggle">
              <button className="toggle-option active">Monthly</button>
              <button className="toggle-option">
                Yearly
                <span className="save-badge">SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="pricing-cards">
            {/* Bootstrap Plan */}
            <div className="pricing-card">
              <h3 className="plan-name">Bootstrap</h3>
              <p className="plan-tagline">Best for: Solo Founders</p>
              <div className="plan-price">
                <span className="price-amount">$29</span>
                <span className="price-period">/month</span>
              </div>
              <button className="pricing-button silver-button">Book A Free Demo</button>
              <div className="features-section">
                <h4 className="features-heading">Features Included:</h4>
                <ul className="features-list">
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>5 SWOT Analyses</span>
                  </li>
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>Basic Price Modeling</span>
                  </li>
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>200 Cold Emails / mo</span>
                  </li>
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>Community Support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Growth Plan */}
            <div className="pricing-card gold-card">
              <span className="popular-badge">Most Popular</span>
              <h3 className="plan-name">Growth</h3>
              <p className="plan-tagline">Best for: Seed Stage Teams</p>
              <div className="plan-price">
                <span className="price-amount">$79</span>
                <span className="price-period">/month</span>
              </div>
              <button className="pricing-button gold-button">Book A Free Demo</button>
              <div className="features-section">
                <h4 className="features-heading">Features Included:</h4>
                <ul className="features-list">
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>Unlimited Strategy Docs</span>
                  </li>
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>Advanced Revenue Modeling</span>
                  </li>
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>5,000 Cold Emails / mo</span>
                  </li>
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>Investor Database Access</span>
                  </li>
                  <li className="feature-item">
                    <span className="arrow-icon">→</span>
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Hero Section */}
      <section className="cta-hero-section">
        <div className="cta-hero-content">
          <h2 className="cta-hero-title">Stop guessing, start building.</h2>
          <p className="cta-hero-subtitle">Join the platform that acts as your strategy, sales, and networking partner.</p>
          <button className="cta-hero-button">Get Started for Free</button>
        </div>
      </section>
    </div>
  )
}
