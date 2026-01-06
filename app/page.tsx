'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Home() {
  const [answer, setAnswer] = useState('')
  const minChars = 30
  const charsNeeded = Math.max(0, minChars - answer.length)

  return (
    <div className="questionnaire-page">
      {/* Header */}
      <div className="questionnaire-header">
        <h1 className="questionnaire-title">Problem Clarity</h1>
        <div className="question-counter">Question 1 of 5</div>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: '20%' }}></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <h2 className="question-text">Who exactly has this problem?</h2>
        <p className="question-instruction">
          Be specific. 'Everyone' is not a valid answer. Describe the exact
          person, their role, industry, and situation.
        </p>

        <textarea
          className="answer-input"
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={8}
        />

        {charsNeeded > 0 && (
          <div className="char-counter">{charsNeeded} more characters needed</div>
        )}

        {/* Navigation Buttons */}
        <div className="questionnaire-nav">
          <button className="nav-button back-button">
            <ChevronLeft className="nav-icon" />
            <span>Back</span>
          </button>
          <button className="nav-button next-button" disabled={charsNeeded > 0}>
            <span>Next</span>
            <ChevronRight className="nav-icon" />
          </button>
        </div>
      </div>
    </div>
  )
}
