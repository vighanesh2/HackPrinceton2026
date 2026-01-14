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
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="#111827" strokeWidth="2" fill="none"/>
                <path d="M10 8L16 12L10 16V8Z" fill="#111827"/>
              </svg>
            </div>
            <span className="hero-brand-name">Rontzen</span>
          </div>
          
          <nav className="hero-nav">
            <Link href="#features" className="hero-nav-link">Home</Link>
            <Link href="#about" className="hero-nav-link">About</Link>
            <Link href="#features" className="hero-nav-link">Features</Link>
            <Link href="#pricing" className="hero-nav-link">Pricing</Link>
            <Link href="#career" className="hero-nav-link">Career</Link>
            <Link href="#blog" className="hero-nav-link">Blog</Link>
          </nav>
          
          <div className="hero-header-actions">
            <button className="hero-header-cta">
              Get 14 Days Free Trial
              <svg className="header-cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background-pattern">
          <span className="plus-symbol" style={{ top: '10%', left: '15%' }}>+</span>
          <span className="plus-symbol" style={{ top: '20%', right: '10%' }}>+</span>
          <span className="plus-symbol" style={{ top: '60%', left: '10%' }}>+</span>
          <span className="plus-symbol" style={{ top: '70%', right: '15%' }}>+</span>
          <span className="plus-symbol" style={{ top: '40%', left: '50%' }}>+</span>
        </div>
        <div className="hero-content">
          <div className="hero-review-badge">
            <div className="review-avatars">
              <div className="review-avatar"></div>
              <div className="review-avatar"></div>
              <div className="review-avatar"></div>
            </div>
            <span className="review-text">5900+ 5 Star Reviews</span>
          </div>
          
          <h1 className="hero-headline">
            Your Co-Founder for Growth &amp; Strategy
          </h1>
          
          <p className="hero-description">
            From validating ideas to closing your first deal. Streamline your networking, automate cold outreach, and build data-backed pricing models—all in one platform.
          </p>
          
          <div className="hero-cta-buttons">
            <button className="hero-cta-primary">
              Get 14 Days Free Trial
              <span className="cta-icon-circle">
                <svg className="cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>

          {/* Image Generation Window */}
          <div className="hero-glass-window">
            <div className="hero-image-window">
            </div>
          </div>
        </div>
      </section>

      {/* Customer Questions Section */}
      <section className="customer-questions-section">
        <h2 className="customer-questions-title">Execute your entire go-to-market strategy in one place</h2>
        
        <div className="customer-questions-cards">
          {/* Profile and Review Card */}
          <div className="customer-card profile-review-card">
            <div className="profile-image-wrapper">
              <div className="profile-pattern"></div>
              <div className="profile-photo">
                {/* Placeholder for profile image - user can add actual image */}
              </div>
            </div>
            <div className="customer-overlay">
              <div className="customer-avatars">
                <div className="customer-avatar"></div>
                <div className="customer-avatar"></div>
                <div className="customer-avatar"></div>
              </div>
              <div className="customer-stats">
                <div className="customer-count">120k+</div>
                <div className="customer-label">Happy customer</div>
              </div>
            </div>
          </div>

          {/* Bar Chart Card */}
          <div className="customer-card chart-card">
            <div className="chart-header-badge">
              <div className="chart-badge-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <span className="chart-badge-text">34%</span>
            </div>
            <div className="bar-chart-container">
              <div className="chart-y-axis">
                <span className="y-axis-label">20 h</span>
                <span className="y-axis-label">15 h</span>
                <span className="y-axis-label">10 h</span>
                <span className="y-axis-label">5 h</span>
              </div>
              <div className="chart-bars">
                <div className="chart-bar bar-high" style={{ height: '85%' }}></div>
                <div className="chart-bar bar-low" style={{ height: '40%' }}></div>
                <div className="chart-bar bar-high" style={{ height: '100%' }}></div>
                <div className="chart-bar bar-low" style={{ height: '60%' }}></div>
                <div className="chart-bar bar-low" style={{ height: '30%' }}></div>
              </div>
            </div>
          </div>

          {/* Task List Card */}
          <div className="customer-card task-list-card">
            <div className="task-item">
              <div className="task-icon task-icon-purple">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="task-text">Write copy</span>
              <button className="task-add-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="task-item">
              <div className="task-icon task-icon-orange">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="task-text">Image integration</span>
              <button className="task-add-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="task-item">
              <div className="task-icon task-icon-pink">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="task-text">Create avatar</span>
              <button className="task-add-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="task-item">
              <div className="task-icon task-icon-blue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="task-text">Write code</span>
              <button className="task-add-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Section */}
      <section className="engagement-section">
        <h2 className="engagement-title">Boost engagement and drive sales.</h2>
        
        <div className="engagement-cards">
          {/* Proactive Messaging Card */}
          <div className="engagement-card">
            <div className="engagement-card-content">
              <h3 className="engagement-card-title">Proactive Messaging.</h3>
              <p className="engagement-card-description">Sends reminders, updates, offers to boost engagement.</p>
            </div>
            <div className="engagement-visual-placeholder">
              {/* Empty placeholder for visual content */}
            </div>
          </div>

          {/* Live Voice Support Card */}
          <div className="engagement-card voice-card">
            <div className="engagement-visual-placeholder voice-placeholder">
              <div className="voice-placeholder-layer-1"></div>
              <div className="voice-placeholder-layer-2"></div>
            </div>
            <div className="engagement-card-content">
              <h3 className="engagement-card-title">Live Voice Support.</h3>
              <p className="engagement-card-description">This method is particularly valuable for complex issues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Secure Collaboration Section */}
      <section className="secure-collaboration-section">
        <div className="secure-collaboration-wrapper">
          <div className="secure-collaboration-container">
          {/* Left Content */}
          <div className="secure-collaboration-content">
            <h2 className="secure-collaboration-title">Secure collaboration with role based access control.</h2>
            <p className="secure-collaboration-description">
              Secure collaboration is essential in modern workflows, and role-based access control (RBAC) ensures that it is both efficient and protected.
            </p>
            <button className="secure-collaboration-cta">
              Get Started Now
              <span className="cta-arrow-circle">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>

          {/* Right Interior Card */}
          <div className="secure-collaboration-card">
          </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="integrations-section">
        <h2 className="integrations-title">Boost engagement and drive sales.</h2>
        
        <div className="integrations-container">
          {/* Top Row - Scrolling Left */}
          <div className="integrations-row-wrapper">
            <div className="integrations-fade-left"></div>
            <div className="integrations-row integrations-row-1">
              <div className="integration-icon" style={{ backgroundColor: '#a7f3d0' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M3 12h18M3 12c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2M3 12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M12 3v18" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fde68a' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#bfdbfe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fbcfe8' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#ddd6fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a5f3fc' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fed7aa' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#c7d2fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              {/* Duplicate entire set for seamless infinite loop */}
              <div className="integration-icon" style={{ backgroundColor: '#a7f3d0' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M3 12h18M3 12c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2M3 12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M12 3v18" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fde68a' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#bfdbfe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fbcfe8' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#ddd6fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a5f3fc' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fed7aa' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#c7d2fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              {/* Third set for continuous visibility */}
              <div className="integration-icon" style={{ backgroundColor: '#a7f3d0' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M3 12h18M3 12c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2M3 12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M12 3v18" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fde68a' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#bfdbfe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fbcfe8' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#ddd6fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a5f3fc' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fed7aa' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#c7d2fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <div className="integrations-fade-right"></div>
          </div>

          {/* Bottom Row - Scrolling Right */}
          <div className="integrations-row-wrapper">
            <div className="integrations-fade-left"></div>
            <div className="integrations-row integrations-row-2">
              <div className="integration-icon" style={{ backgroundColor: '#ddd6fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fbcfe8' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a7f3d0' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M3 12h18M3 12c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2M3 12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M12 3v18" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a5f3fc' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#bfdbfe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fed7aa' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#c7d2fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fde68a' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              {/* Duplicate entire set for seamless infinite loop */}
              <div className="integration-icon" style={{ backgroundColor: '#ddd6fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fbcfe8' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a7f3d0' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M3 12h18M3 12c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2M3 12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M12 3v18" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a5f3fc' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#bfdbfe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fed7aa' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#c7d2fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fde68a' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              {/* Third set for continuous visibility */}
              <div className="integration-icon" style={{ backgroundColor: '#ddd6fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fbcfe8' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a7f3d0' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M3 12h18M3 12c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2M3 12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M12 3v18" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#a5f3fc' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#bfdbfe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fed7aa' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#c7d2fe' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="integration-icon" style={{ backgroundColor: '#fde68a' }}>
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <div className="integrations-fade-right"></div>
          </div>
        </div>

        <button className="integrations-cta">
          Explore All Integrations
          <span className="cta-icon-circle">
            <svg fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </section>

      {/* New Grey Card Section */}
      <section className="grey-card-section">
        <div className="grey-card-wrapper">
          {/* Top Feature List */}
          <div className="analytics-features-list">
            <div className="analytics-feature-item">
              <div className="analytics-feature-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </div>
              <span>Risk Assessment</span>
            </div>
            <div className="analytics-feature-item">
              <div className="analytics-feature-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span>Market Opportunities</span>
            </div>
            <div className="analytics-feature-item">
              <div className="analytics-feature-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M13 2L3 14h9v8l10-12h-9V2z" />
                </svg>
              </div>
              <span>Competitor Gaps</span>
            </div>
            <div className="analytics-feature-item">
              <div className="analytics-feature-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
              </div>
              <span>Strategic Roadmap</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="analytics-main-content">
            {/* Left Column */}
            <div className="analytics-left-content">
              <h2 className="analytics-title">Data-backed SWOT analysis, not just guesswork.</h2>
              <p className="analytics-description">
                Don&apos;t launch in the dark. Our engine analyzes millions of market data points to generate a comprehensive SWOT matrix for your specific niche. Instantly validate your business logic, discover hidden risks, and pivot your strategy before you pitch to investors.
              </p>
              <button className="analytics-cta">
                Generate My Report
                <svg fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Right Column - Data Visualization Card */}
            <div className="analytics-card">
              {/* Card Header */}
              <div className="analytics-card-header">
                <div className="analytics-card-title">Projected Market Share</div>
                <div className="analytics-card-icons">
                  <svg className="analytics-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <svg className="analytics-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="analytics-profile-picture"></div>
              </div>

              {/* Key Metric */}
              <div className="analytics-metric">+350%</div>

              {/* Bar Chart */}
              <div className="analytics-chart-container">
                <div className="analytics-bars">
                  <div className="analytics-bar" style={{ height: '40%' }}></div>
                  <div className="analytics-bar" style={{ height: '50%' }}></div>
                  <div className="analytics-bar" style={{ height: '35%' }}></div>
                  <div className="analytics-bar" style={{ height: '45%' }}></div>
                  <div className="analytics-bar" style={{ height: '55%' }}></div>
                  <div className="analytics-bar" style={{ height: '50%' }}></div>
                  <div className="analytics-bar" style={{ height: '60%' }}></div>
                  <div className="analytics-bar" style={{ height: '55%' }}></div>
                  <div className="analytics-bar analytics-bar-highlighted" style={{ height: '100%' }}>
                    <div className="analytics-bar-value">$5.6 m</div>
                  </div>
                </div>
                <div className="analytics-chart-labels">
                  <span>Q1 Growth</span>
                  <span>Q2 Scale</span>
                  <span>Q3 Dominate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Pricing Section */}
      <section className="new-pricing-section">
        <h2 className="new-pricing-title">No hidden charges! choose your plan now.</h2>
        
        <div className="new-pricing-toggle-container">
          <div className="new-pricing-toggle">
            <button className="new-toggle-option active">Monthly</button>
            <button className="new-toggle-option">Annual</button>
            <span className="new-save-badge">SAVE 20%</span>
          </div>
        </div>

        <div className="new-pricing-cards">
          {/* Starter Plan */}
          <div className="new-pricing-card">
            <h3 className="new-plan-name">Starter</h3>
            <p className="new-plan-description">Perfect for small businesses just starting with CRM management.</p>
            <div className="new-plan-price">
              <span className="new-price-amount">Free</span>
              <span className="new-price-period">/mo</span>
            </div>
            <button className="new-pricing-button new-pricing-button-white">
              Get Started Now
              <svg fill="black" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
            <div className="new-features-section">
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic chatbot templates.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Up to 1,000 messages.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Integration with 1 platform.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic analytics dashboard.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>24/7 support.</span>
              </div>
            </div>
          </div>

          {/* Growth Plan */}
          <div className="new-pricing-card">
            <h3 className="new-plan-name">Growth</h3>
            <p className="new-plan-description">Ideal for growing teams that need advanced tools.</p>
            <div className="new-plan-price">
              <span className="new-price-amount">$29</span>
              <span className="new-price-period">/mo</span>
            </div>
            <button className="new-pricing-button new-pricing-button-white">
              Get Started Now
              <svg fill="black" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
            <div className="new-features-section">
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>All starter features.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Up to 10,000 messages.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Integration 3 platforms.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Customizable chatbot flows.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Advanced analytics.</span>
              </div>
            </div>
          </div>

          {/* Professional Plan (Highlighted) */}
          <div className="new-pricing-card new-pricing-card-highlighted">
            <h3 className="new-plan-name">Professional</h3>
            <p className="new-plan-description">Designed for midsized business needing deeper customer.</p>
            <div className="new-plan-price">
              <span className="new-price-amount">$64</span>
              <span className="new-price-period">/mo</span>
            </div>
            <button className="new-pricing-button new-pricing-button-black">
              Get Started Now
              <svg fill="white" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
            <div className="new-features-section">
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>All growth features.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Up to 1,000 messages.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Integration with 1 platform.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI powered understanding.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Multi language support.</span>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="new-pricing-card">
            <h3 className="new-plan-name">Enterprise</h3>
            <p className="new-plan-description">Comprehensive solution for large organizations.</p>
            <div className="new-plan-price">
              <span className="new-price-amount">$99</span>
              <span className="new-price-period">/mo</span>
            </div>
            <button className="new-pricing-button new-pricing-button-white">
              Get Started Now
              <svg fill="black" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
            <div className="new-features-section">
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>All professional features.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dedicated account manager.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>White label solution.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>API access integrations.</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Advanced security.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ChatAssist AI Section */}
      <section className="chatassist-section">
        <div className="chatassist-container">
          <div className="chatassist-content">
            <h2 className="chatassist-title">Work faster with Chatassist AI.</h2>
            <p className="chatassist-description">
              ChatAssist AI is designed to revolutionize how businesses operate, helping teams work.
            </p>
            <button className="chatassist-cta">
              Get 14 Days Free Trial
              <span className="chatassist-arrow-circle">
                <svg fill="white" viewBox="0 0 24 24">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-brand-section">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" fill="black" />
                    <rect x="5" y="4" width="3" height="16" fill="white" />
                    <rect x="10" y="6" width="3" height="14" fill="white" />
                    <rect x="15" y="8" width="3" height="12" fill="white" />
                    <rect x="20" y="10" width="2" height="10" fill="white" />
                  </svg>
                </div>
                <span className="footer-logo-text">Rontzen</span>
              </div>
              <p className="footer-tagline">Rontzen AI is designed to revolutionize how businesses operate.</p>
              <div className="social-icons">
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg fill="white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="LinkedIn">
                  <svg fill="white" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Instagram">
                  <svg fill="white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Telegram">
                  <svg fill="white" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-nav-columns">
              <div className="footer-column">
                <h4 className="footer-heading">Home</h4>
                <ul className="footer-links">
                  <li><a href="#">Home 1</a></li>
                  <li><a href="#">Home 2</a></li>
                  <li><a href="#">Home 3</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">About</h4>
                <ul className="footer-links">
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Features</a></li>
                  <li><a href="#">Career</a></li>
                  <li><a href="#">Pricing</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">Resources</h4>
                <ul className="footer-links">
                  <li><a href="#">Blog & Article</a></li>
                  <li><a href="#">Blog single</a></li>
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="#">Integrations</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">Company</h4>
                <ul className="footer-links">
                  <li><a href="#">Privacy policy</a></li>
                  <li><a href="#">Terms conditions</a></li>
                  <li><a href="#">Career single</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p className="footer-product-credit">A product by Gr8r Studio</p>
            </div>
            <div className="footer-bottom-right">
              <p className="footer-copyright">© 2025 Rontzen, Inc. All rights reserved</p>
              <div className="framer-badge">
                <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span>Made in Framer</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
