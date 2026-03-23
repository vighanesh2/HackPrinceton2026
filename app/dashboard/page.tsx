'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuestionnaire } from '@/contexts/QuestionnaireContext'
import Sidebar from '@/components/Sidebar'

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
    minChars: 5,
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

export default function Dashboard() {
  const router = useRouter()
  const { currentQuestionIndex, setCurrentQuestionIndex, answers, setAnswers } = useQuestionnaire()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: '#efeeff',
      display: 'flex',
      position: 'relative'
    }}>
      {/* Left Sidebar with Icons */}
      <div style={{
        position: 'fixed',
        left: '40px',
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10,
        width: '48px',
        paddingTop: '40px'
      }}>
        {/* R Icon at Top */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '300',
            color: '#111827',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif'
          }}>
            R
          </span>
        </div>

        {/* Icons Container - Vertically Centered */}
        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Home Icon (Active) */}
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#c4673a',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" fill="white"/>
              <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* People Icon */}
          <button 
            onClick={() => router.push('/networking')}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Document Icon */}
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17L9 11L13 15L21 7" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 7H17V11" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Logout Button at Bottom */}
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            bottom: '40px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{
        marginLeft: '128px',
        width: 'calc(100% - 128px)',
        height: '100vh',
        display: 'flex'
      }}>
        {/* Left Side - 30% - Questionnaire Sidebar */}
        <div className="dashboard-sidebar-container" style={{
          width: '30%',
          height: '100vh',
          backgroundColor: '#efeeff',
          overflow: 'hidden'
        }}>
          <div style={{ width: '100%', height: '100%' }}>
            <Sidebar />
          </div>
        </div>

        {/* Right Side - 70% - Questionnaire Content */}
        <div style={{
          width: '70%',
          background: 'linear-gradient(180deg, #f0efff 0%, #fdfdff 100%)',
          overflowY: 'auto',
          padding: '40px'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
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
        </div>
      </div>
    </div>
  )
}
