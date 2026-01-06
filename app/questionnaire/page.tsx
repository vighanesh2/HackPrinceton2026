'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuestionnaire } from '@/contexts/QuestionnaireContext'

type QuestionType = 'text' | 'selector' | 'number' | 'yesno' | 'decision'

interface Question {
  id: string
  stage: number
  stageName: string
  question: string
  instruction?: string
  type: QuestionType
  options?: string[]
  minChars?: number
  minValue?: number
}

const questions: Question[] = [
  // Stage 1: Problem Clarity
  {
    id: '1-1',
    stage: 1,
    stageName: 'Problem Clarity',
    question: 'Who exactly has this problem?',
    instruction: "Be specific. 'Everyone' is not a valid answer. Describe the exact person, their role, industry, and situation.",
    type: 'text',
    minChars: 30,
  },
  {
    id: '1-2',
    stage: 1,
    stageName: 'Problem Clarity',
    question: 'When does this problem occur?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '1-3',
    stage: 1,
    stageName: 'Problem Clarity',
    question: 'How painful is this problem?',
    type: 'selector',
    options: ['Mild', 'Repeated', 'Serious impact'],
  },
  {
    id: '1-4',
    stage: 1,
    stageName: 'Problem Clarity',
    question: 'How are people solving this today?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '1-5',
    stage: 1,
    stageName: 'Problem Clarity',
    question: 'Why is this problem worth solving now?',
    type: 'text',
    minChars: 30,
  },
  // Stage 2: Solution Hypothesis
  {
    id: '2-1',
    stage: 2,
    stageName: 'Solution Hypothesis',
    question: 'What is your proposed solution (1–2 sentences)?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '2-2',
    stage: 2,
    stageName: 'Solution Hypothesis',
    question: 'Why is AI necessary here?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '2-3',
    stage: 2,
    stageName: 'Solution Hypothesis',
    question: 'What core value does the user get?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '2-4',
    stage: 2,
    stageName: 'Solution Hypothesis',
    question: 'What is the smallest useful version of this product?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '2-5',
    stage: 2,
    stageName: 'Solution Hypothesis',
    question: 'Why would users choose this over their current solution?',
    type: 'text',
    minChars: 30,
  },
  // Stage 3: Validation
  {
    id: '3-1',
    stage: 3,
    stageName: 'Validation',
    question: 'How many people have you talked to?',
    type: 'number',
    minValue: 5,
    minChars: 5, // Also set minChars for consistency
  },
  {
    id: '3-2',
    stage: 3,
    stageName: 'Validation',
    question: 'What did users say the problem was?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '3-3',
    stage: 3,
    stageName: 'Validation',
    question: 'Did anyone ask for a solution?',
    type: 'yesno',
  },
  {
    id: '3-4',
    stage: 3,
    stageName: 'Validation',
    question: 'What surprised you?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '3-5',
    stage: 3,
    stageName: 'Validation',
    question: 'Decision: Continue / Pivot / Kill (with justification)',
    type: 'decision',
    options: ['Continue', 'Pivot', 'Kill'],
  },
  // Stage 4: MVP Build Readiness
  {
    id: '4-1',
    stage: 4,
    stageName: 'MVP Build Readiness',
    question: 'What single user action defines success?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '4-2',
    stage: 4,
    stageName: 'MVP Build Readiness',
    question: 'What is the riskiest assumption left?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '4-3',
    stage: 4,
    stageName: 'MVP Build Readiness',
    question: 'What will you NOT build in the MVP?',
    type: 'text',
    minChars: 30,
  },
  {
    id: '4-4',
    stage: 4,
    stageName: 'MVP Build Readiness',
    question: "How will you get this MVP into users' hands?",
    type: 'text',
    minChars: 30,
  },
  {
    id: '4-5',
    stage: 4,
    stageName: 'MVP Build Readiness',
    question: 'Are you ready to commit time?',
    type: 'selector',
    options: ['Full-time', 'Part-time', 'Not ready'],
  },
]

export default function Questionnaire() {
  const { currentQuestionIndex, setCurrentQuestionIndex, answers, setAnswers } = useQuestionnaire()

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion.id] || ''
  const stageQuestions = questions.filter((q) => q.stage === currentQuestion.stage)
  const questionNumber = stageQuestions.findIndex((q) => q.id === currentQuestion.id) + 1
  const totalInStage = stageQuestions.length

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value })
  }

  const isAnswerValid = () => {
    if (!currentAnswer) return false

    if (currentQuestion.type === 'text' && currentQuestion.minChars) {
      return currentAnswer.length >= currentQuestion.minChars
    }

    if (currentQuestion.type === 'number') {
      const minValue = currentQuestion.minValue || (currentQuestion.minChars ? parseInt(String(currentQuestion.minChars)) : 0)
      const num = parseInt(currentAnswer)
      return !isNaN(num) && num >= minValue
    }

    if (currentQuestion.type === 'decision') {
      // Decision requires both selection and justification
      const justification = answers[`${currentQuestion.id}-justification`]
      return currentAnswer.length > 0 && justification && justification.trim().length >= 30
    }

    return currentAnswer.length > 0
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'text':
        const minChars = currentQuestion.minChars || 0
        const charsNeeded = Math.max(0, minChars - currentAnswer.length)
        return (
          <>
            <textarea
              className="answer-input"
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={8}
            />
            {charsNeeded > 0 && (
              <div className="char-counter">{charsNeeded} more characters needed</div>
            )}
          </>
        )

      case 'selector':
        return (
          <div className="selector-options">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                className={`selector-option ${currentAnswer === option ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )

      case 'number':
        // For number type, minChars is repurposed as minValue
        const minValue = currentQuestion.minValue || (currentQuestion.minChars ? parseInt(String(currentQuestion.minChars)) : 0)
        const numValue = currentAnswer ? parseInt(currentAnswer) : NaN
        const isValid = !isNaN(numValue) && numValue >= minValue
        return (
          <>
            <input
              type="number"
              className="answer-input number-input"
              placeholder={`Enter a number (minimum ${minValue})...`}
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              min={minValue}
            />
            {currentAnswer && !isValid && (
              <div className="char-counter">Minimum {minValue} required</div>
            )}
          </>
        )

      case 'yesno':
        return (
          <div className="selector-options">
            <button
              className={`selector-option ${currentAnswer === 'Yes' ? 'selected' : ''}`}
              onClick={() => handleAnswerChange('Yes')}
            >
              Yes
            </button>
            <button
              className={`selector-option ${currentAnswer === 'No' ? 'selected' : ''}`}
              onClick={() => handleAnswerChange('No')}
            >
              No
            </button>
          </div>
        )

      case 'decision':
        return (
          <>
            <div className="selector-options">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  className={`selector-option ${currentAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {currentAnswer && (
              <textarea
                className="answer-input"
                placeholder="Provide justification..."
                value={answers[`${currentQuestion.id}-justification`] || ''}
                onChange={(e) => setAnswers({ ...answers, [`${currentQuestion.id}-justification`]: e.target.value })}
                rows={4}
                style={{ marginTop: '16px' }}
              />
            )}
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="questionnaire-page">
      {/* Header */}
      <div className="questionnaire-header">
        <h1 className="questionnaire-title">{currentQuestion.stageName}</h1>
        <div className="question-counter">
          Question {questionNumber} of {totalInStage}
        </div>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <h2 className="question-text">{currentQuestion.question}</h2>
        {currentQuestion.instruction && (
          <p className="question-instruction">{currentQuestion.instruction}</p>
        )}

        {renderInput()}

        {/* Navigation Buttons */}
        <div className="questionnaire-nav">
          <button
            className="nav-button back-button"
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="nav-icon" />
            <span>Back</span>
          </button>
          <button
            className="nav-button next-button"
            onClick={handleNext}
            disabled={!isAnswerValid() || currentQuestionIndex === questions.length - 1}
          >
            <span>Next</span>
            <ChevronRight className="nav-icon" />
          </button>
        </div>
      </div>
    </div>
  )
}

