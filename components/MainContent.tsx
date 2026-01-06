'use client'

import { Plus, Lock, Radio, ChevronRight } from 'lucide-react'

export default function MainContent() {
  const featureCards = [
    {
      number: '01/12',
      emoji: '🧱',
      title: 'Design and launch your MVP in minutes.',
      bgColor: 'card-icon-blue',
    },
    {
      number: '02/12',
      emoji: '🎤',
      title: 'Craft a winning pitch that attracts investors.',
      bgColor: 'card-icon-purple',
    },
    {
      number: '03/12',
      emoji: '🛡️',
      title: 'Analyze your startup with a smart SWOT breakdown.',
      bgColor: 'card-icon-green',
    },
    {
      number: '04/12',
      emoji: '👤',
      title: 'Define your target users with AI-generated personas.',
      bgColor: 'card-icon-orange',
    },
  ]

  return (
    <main className="main-content">
      <div className="content-wrapper">
        <div className="content-header">
          <div className="main-logo">
            <span className="main-logo-text">E</span>
          </div>
          <p className="tagline">LETS CREATE SOMETHING BIG</p>
          <h1 className="main-headline">Enhance your business</h1>
        </div>

        <div className="input-section">
          <div className="input-header">
            <Lock className="lock-icon" />
            <span className="unlocked-text">Full potential unlocked</span>
            <div className="subscription-badge">
              <div className="green-dot"></div>
              <span className="subscription-text">Subscription Active</span>
            </div>
          </div>
          
          <div className="input-container">
            <div className="input-box">
              <Plus className="plus-icon" />
              <input
                type="text"
                placeholder="Ask Anything..."
                className="input-field"
              />
              <Radio className="radio-icon" />
            </div>
          </div>
        </div>

        <div className="cards-section">
          <h2 className="cards-title">What do you want to build today?</h2>
          
          <div className="cards-grid">
            {featureCards.map((card, index) => (
              <div key={index} className="feature-card">
                <div className="card-header">
                  <span className="card-number">{card.number}</span>
                  <ChevronRight className="card-arrow" />
                </div>
                
                <div className={`card-icon ${card.bgColor}`}>
                  {card.emoji}
                </div>
                
                <p className="card-title">{card.title}</p>
              </div>
            ))}
          </div>

          <div className="dots-container">
            <div className="dot dot-active"></div>
            <div className="dot dot-inactive"></div>
            <div className="dot dot-inactive"></div>
          </div>
        </div>
      </div>
    </main>
  )
}
