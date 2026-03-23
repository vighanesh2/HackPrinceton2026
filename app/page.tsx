'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

const APP_URL = 'https://rontzen-victory.vercel.app/app'

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      setMobileMenuOpen(false)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <div className="hero-landing-page">
      {/* Header */}
      <header className={`hero-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="hero-header-content">
          <div className="hero-logo-container">
            <div className="hero-logo-icon">
              <svg className="hero-logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect className="logo-rect" x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" fill="none"/>
                <path className="logo-path" d="M10 8L16 12L10 16V8Z"/>
              </svg>
            </div>
            <span className="hero-brand-name">Rontzen</span>
          </div>
          
          <nav className="hero-nav">
            <Link href="#features" className="hero-nav-link">Home</Link>
            <Link href="#about" className="hero-nav-link">About</Link>
            <Link href="#features" className="hero-nav-link">Features</Link>
            <Link href="#pricing" className="hero-nav-link">Pricing</Link>
          </nav>
          
          <div className="hero-header-actions">
            <ThemeToggle />
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="hero-header-cta">
              <span className="hero-header-cta-text">Try Rontzen</span>
              <span className="header-cta-icon">
                <svg className="header-cta-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
            <button
              type="button"
              className="hero-nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={mobileMenuOpen ? 'hero-hamburger open' : 'hero-hamburger'}>
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div className={`hero-nav-mobile-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
      <nav className={`hero-nav-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        <Link href="#features" className="hero-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
        <Link href="#about" className="hero-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
        <Link href="#features" className="hero-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</Link>
        <Link href="#pricing" className="hero-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
        <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="hero-nav-mobile-cta" onClick={() => setMobileMenuOpen(false)}>Try Rontzen</a>
      </nav>

      {/* Hero Section */}
      <section id="about" className="hero-section">
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
              <img src="/brand1.png" alt="Brand 1" className="review-avatar-image" />
              <img src="/brand2.png" alt="Brand 2" className="review-avatar-image" />
              <img src="/brand3.png" alt="Brand 3" className="review-avatar-image" />
            </div>
            <span className="review-text">Monorepo insights in plain language</span>
          </div>
          
          <h1 className="hero-headline">
            Understand your code without the jargon.
          </h1>
          
          <p className="hero-description">
            Connect to GitHub, analyze your monorepo, and get issues surfaced in simple language instead of raw diagnostics. Clear visibility and faster fixes for teams.
          </p>
          
          <div className="hero-cta-buttons">
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="hero-cta-primary">
              Connect GitHub
              <span className="cta-icon-circle">
                <svg className="cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          </div>

          {/* Hero Video Window */}
          <div className="hero-glass-window">
            <div className="hero-image-window">
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              >
                <source src="/rontzen-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="customer-questions-section">
        <h2 className="customer-questions-title">Everything you need to understand your monorepo</h2>
        
        <div className="customer-questions-cards correctness-cards features-cards">
          {/* 1. Repo Health Score */}
          <div className="customer-card correctness-card">
            <div className="correctness-card-inner">
              <div className="correctness-card-number">1</div>
              <h3 className="correctness-card-title">Repo Health Score</h3>
              <p className="correctness-card-subtitle">How safe to ship to production</p>
              <ul className="correctness-card-list">
                <li>0–100 score per repo</li>
                <li>Simple explanations</li>
                <li>Improvement suggestions</li>
              </ul>
            </div>
          </div>

          {/* 2. Issues Checker */}
          <div className="customer-card correctness-card">
            <div className="correctness-card-inner">
              <div className="correctness-card-number">2</div>
              <h3 className="correctness-card-title">Issues Checker</h3>
              <p className="correctness-card-subtitle">Real problems in your code</p>
              <ul className="correctness-card-list">
                <li>Missing validation</li>
                <li>Unbounded loops</li>
                <li>N+1 queries</li>
                <li>And similar issues</li>
              </ul>
            </div>
          </div>

          {/* 3. Codebase Report */}
          <div className="customer-card correctness-card">
            <div className="correctness-card-inner">
              <div className="correctness-card-number">3</div>
              <h3 className="correctness-card-title">Codebase Report</h3>
              <p className="correctness-card-subtitle">Monorepo-focused view</p>
              <ul className="correctness-card-list">
                <li>High-risk files (change impact)</li>
                <li>Dead code (safe to remove)</li>
                <li>Repo structure (apps/, packages/)</li>
              </ul>
            </div>
          </div>

          {/* 4. AI Full Report */}
          <div className="customer-card correctness-card">
            <div className="correctness-card-inner">
              <div className="correctness-card-number">4</div>
              <h3 className="correctness-card-title">AI Full Report</h3>
              <p className="correctness-card-subtitle">Overview & actionable insights</p>
              <ul className="correctness-card-list">
                <li>Strengths & priority actions</li>
                <li>Quick wins & next steps</li>
                <li>Downloadable as PDF</li>
              </ul>
            </div>
          </div>

          {/* 5. AI & Rule-Based Fixes */}
          <div className="customer-card correctness-card">
            <div className="correctness-card-inner">
              <div className="correctness-card-number">5</div>
              <h3 className="correctness-card-title">AI & Rule-Based Fixes</h3>
              <p className="correctness-card-subtitle">Automatic fix suggestions</p>
              <ul className="correctness-card-list">
                <li>Rule-based when possible</li>
                <li>AI when needed</li>
              </ul>
            </div>
          </div>

          {/* 6. Push Fixes to GitHub */}
          <div className="customer-card correctness-card">
            <div className="correctness-card-inner">
              <div className="correctness-card-number">6</div>
              <h3 className="correctness-card-title">Push Fixes to GitHub</h3>
              <p className="correctness-card-subtitle">Apply fixes from the app</p>
              <ul className="correctness-card-list">
                <li>Create branch and PR</li>
                <li>Direct from Rontzen</li>
              </ul>
            </div>
          </div>

          {/* 7. GitHub Integration */}
          <div className="customer-card correctness-card">
            <div className="correctness-card-inner">
              <div className="correctness-card-number">7</div>
              <h3 className="correctness-card-title">GitHub Integration</h3>
              <p className="correctness-card-subtitle">Sign in and work across repos</p>
              <ul className="correctness-card-list">
                <li>Sign in with GitHub</li>
                <li>Connected repositories</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Section */}
      <section className="engagement-section">
        <h2 className="engagement-title">Connect GitHub. Run a check. Get plain-language insights.</h2>
        
        <div className="engagement-cards">
          {/* GitHub Connect Card */}
          <div className="engagement-card">
            <div className="engagement-card-content">
              <h3 className="engagement-card-title">Connect GitHub</h3>
              <p className="engagement-card-description">Link your monorepo and run a scan. Rontzen analyzes structure, dependencies, and surfaces issues in simple language—no raw diagnostics to decipher.</p>
            </div>
            <div className="engagement-visual-placeholder" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', borderRadius: '12px', overflow: 'hidden' }}>
              <img 
                src="/dependency-graph.png" 
                alt="Rontzen dependency graph - monorepo health, dependency graph, and blast radius" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* Compliance Mapping Card */}
          <div className="engagement-card voice-card">
            <div className="engagement-visual-placeholder voice-placeholder" style={{ padding: '16px', overflow: 'hidden', position: 'relative', height: '100%', background: 'white' }}>
              {/* Compliance mapping list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', flex: 1, overflow: 'hidden', height: '100%' }}>
                <div className="vendor-list-animation" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>✓</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Structure</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Healthy</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>✓</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Dependencies</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Healthy</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>✓</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#111827' }}>API Usage</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Healthy</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#111827', borderBottom: '1px solid #374151' }}>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>!</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'white' }}>Blast radius</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Review</div>
                  </div>
                  
                  {/* Duplicate for seamless loop */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>✓</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Structure</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Healthy</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>✓</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Dependencies</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Healthy</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>✓</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#111827' }}>API Usage</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Healthy</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#111827', borderBottom: '1px solid #374151' }}>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>!</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'white' }}>Blast radius</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Review</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="engagement-card-content">
              <h3 className="engagement-card-title">Actionable Next Steps</h3>
              <p className="engagement-card-description">Every insight comes with clear next steps. Fix structure, trim dependencies, or apply one-click fixes—then commit straight to GitHub.</p>
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
            <h2 className="secure-collaboration-title">AI reports that speak your language.</h2>
            <p className="secure-collaboration-description">
              Get summaries, charts, and recommendations for structure, dependencies, and correctness—written in plain language, not raw diagnostics. Share with your team or stakeholders without translation.
            </p>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="secure-collaboration-cta">
              Try Rontzen
              <span className="cta-arrow-circle">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          </div>

          {/* Right Interior Card */}
          <div className="secure-collaboration-card" style={{ background: '#111827', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)' }}>
            {/* Report Header */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Monorepo Health Report</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Generated: {new Date().toLocaleDateString()}</div>
                </div>
                <div style={{ width: '48px', height: '48px', background: '#111827', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              {/* Report Summary */}
              <div className="audit-report-summary" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '11px', color: '#111827', marginBottom: '4px', fontWeight: '600' }}>REPOSITORY</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>my-monorepo</div>
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '11px', color: '#111827', marginBottom: '4px', fontWeight: '600' }}>SCAN DATE</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Today</div>
                </div>
              </div>

              {/* Compliance Status */}
              <div style={{ padding: '16px', background: '#111827', borderRadius: '8px', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '700' }}>4.2</div>
                  <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>Health Score</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>out of 5 — Good</div>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ height: '100%', width: '84%', background: 'white', borderRadius: '3px' }}></div>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Checks</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>✓</div>
                  <div style={{ flex: 1, fontSize: '13px', color: '#111827', fontWeight: '500' }}>Structure</div>
                  <div style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>Healthy</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>✓</div>
                  <div style={{ flex: 1, fontSize: '13px', color: '#111827', fontWeight: '500' }}>Dependencies</div>
                  <div style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>Healthy</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>✓</div>
                  <div style={{ flex: 1, fontSize: '13px', color: '#111827', fontWeight: '500' }}>Payload & API</div>
                  <div style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>Healthy</div>
                </div>
              </div>

              {/* Digital Signature Badge */}
              <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: '#111827', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Digitally Signed & Timestamped</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>Plain-language insights, ready to share</div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.95)', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: '#111827', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#111827' }}>LIVE REPORT</span>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="integrations-section">
        <h2 className="integrations-title">Connect GitHub. Understand your monorepo.</h2>
        
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

        <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="integrations-cta">
          Try Rontzen
          <span className="cta-icon-circle">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </a>
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
              <span>Health Score</span>
            </div>
            <div className="analytics-feature-item">
              <div className="analytics-feature-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z" />
                </svg>
              </div>
              <span>Dependency Graph</span>
            </div>
            <div className="analytics-feature-item">
              <div className="analytics-feature-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M13 2L3 14h9v8l10-12h-9V2z" />
                </svg>
              </div>
              <span>Blast Radius</span>
            </div>
            <div className="analytics-feature-item">
              <div className="analytics-feature-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
              </div>
              <span>AI Reports</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="analytics-main-content">
            {/* Left Column */}
            <div className="analytics-left-content">
              <h2 className="analytics-title">Plain language, not raw diagnostics.</h2>
              <p className="analytics-description">
                Raw linter output and build errors are hard to parse. Rontzen turns technical data into insights you can act on—structure summaries, dependency recommendations, and next steps in simple language your whole team understands.
              </p>
              <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="analytics-cta">
                Try Rontzen
                <span className="cta-icon-circle">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            </div>

            {/* Right Column - Data Visualization Card */}
            <div className="analytics-card">
              {/* Card Header */}
              <div className="analytics-card-header">
                <div className="analytics-card-title">Monorepo Health by Area</div>
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
              <div className="analytics-metric">4.2</div>

              {/* Bar Chart */}
              <div className="analytics-chart-container">
                <div className="analytics-bars">
                  <div className="analytics-bar" style={{ height: '85%' }}></div>
                  <div className="analytics-bar" style={{ height: '90%' }}></div>
                  <div className="analytics-bar" style={{ height: '80%' }}></div>
                  <div className="analytics-bar" style={{ height: '95%' }}></div>
                  <div className="analytics-bar" style={{ height: '88%' }}></div>
                  <div className="analytics-bar" style={{ height: '82%' }}></div>
                  <div className="analytics-bar" style={{ height: '90%' }}></div>
                  <div className="analytics-bar" style={{ height: '92%' }}></div>
                  <div className="analytics-bar analytics-bar-highlighted" style={{ height: '100%' }}>
                    <div className="analytics-bar-value">Good</div>
                  </div>
                </div>
                <div className="analytics-chart-labels">
                  <span>Structure</span>
                  <span>Deps</span>
                  <span>API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="new-pricing-section">
        <h2 className="new-pricing-title">Clear monorepo visibility for every team.</h2>

        <div className="new-pricing-cards new-pricing-cards-single">
          <div className="new-pricing-card">
            <h3 className="new-plan-name">Starter</h3>
            <p className="new-plan-description">Get started</p>
            <div className="new-plan-price">
              <span className="new-price-amount">Free</span>
            </div>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="new-pricing-button">
              Try Rontzen
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </a>
            <div className="new-features-section">
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>1 monorepo scan</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic CSV Report</span>
              </div>
              <div className="new-feature-item">
                <svg className="new-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Health score & insights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ChatAssist AI Section */}
      <section className="chatassist-section">
        <div className="chatassist-container">
          <div className="chatassist-content">
            <h2 className="chatassist-title">Understand your monorepo in minutes.</h2>
            <p className="chatassist-description">
              Connect GitHub, run a check, and get plain-language insights and actionable next steps. Clear visibility and faster fixes for teams working with monorepos.
            </p>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="chatassist-cta">
              Try Rontzen
              <span className="chatassist-arrow-circle">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </span>
            </a>
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
              <p className="footer-tagline">Understand your monorepo without the jargon. Plain-language insights for structure, dependencies, and correctness.</p>
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
                <h4 className="footer-heading">Product</h4>
                <ul className="footer-links">
                  <li><Link href="#features">Features</Link></li>
                  <li><Link href="#pricing">Pricing</Link></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">Company</h4>
                <ul className="footer-links">
                  <li><Link href="#about">About</Link></li>
                  <li><Link href="#blog">Blog</Link></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">Legal</h4>
                <ul className="footer-links">
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-bottom">
            <div className="footer-bottom-right">
              <p className="footer-copyright">© 2025 Rontzen, Inc. All rights reserved</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
