'use client'

import { Archive, TrendingUp, Lock } from 'lucide-react'
import { useQuestionnaire } from '@/contexts/QuestionnaireContext'
import { calculateStageConfidence } from '@/utils/confidence'
import { isStageLocked } from '@/utils/stageLock'

interface Stage {
  number: number
  name: string
}

const stages: Stage[] = [
  { number: 1, name: 'Problem Clarity' },
  { number: 2, name: 'Solution Hypothesis' },
  { number: 3, name: 'Validation' },
  { number: 4, name: 'MVP Build Readiness' },
]

// Import questions for confidence calculation
const questions = [
  { id: '1-1', stage: 1, stageName: 'Problem Clarity', question: 'Who exactly has this problem?', type: 'text', minChars: 30 },
  { id: '1-2', stage: 1, stageName: 'Problem Clarity', question: 'When does this problem occur?', type: 'text', minChars: 30 },
  { id: '1-3', stage: 1, stageName: 'Problem Clarity', question: 'How painful is this problem?', type: 'selector', options: ['Mild', 'Repeated', 'Serious impact'] },
  { id: '1-4', stage: 1, stageName: 'Problem Clarity', question: 'How are people solving this today?', type: 'text', minChars: 30 },
  { id: '1-5', stage: 1, stageName: 'Problem Clarity', question: 'Why is this problem worth solving now?', type: 'text', minChars: 30 },
  { id: '2-1', stage: 2, stageName: 'Solution Hypothesis', question: 'What is your proposed solution (1–2 sentences)?', type: 'text', minChars: 30 },
  { id: '2-2', stage: 2, stageName: 'Solution Hypothesis', question: 'Why is AI necessary here?', type: 'text', minChars: 30 },
  { id: '2-3', stage: 2, stageName: 'Solution Hypothesis', question: 'What core value does the user get?', type: 'text', minChars: 30 },
  { id: '2-4', stage: 2, stageName: 'Solution Hypothesis', question: 'What is the smallest useful version of this product?', type: 'text', minChars: 30 },
  { id: '2-5', stage: 2, stageName: 'Solution Hypothesis', question: 'Why would users choose this over their current solution?', type: 'text', minChars: 30 },
  { id: '3-1', stage: 3, stageName: 'Validation', question: 'How many people have you talked to?', type: 'number', minValue: 5 },
  { id: '3-2', stage: 3, stageName: 'Validation', question: 'What did users say the problem was?', type: 'text', minChars: 30 },
  { id: '3-3', stage: 3, stageName: 'Validation', question: 'Did anyone ask for a solution?', type: 'yesno' },
  { id: '3-4', stage: 3, stageName: 'Validation', question: 'What surprised you?', type: 'text', minChars: 30 },
  { id: '3-5', stage: 3, stageName: 'Validation', question: 'Decision: Continue / Pivot / Kill (with justification)', type: 'decision', options: ['Continue', 'Pivot', 'Kill'] },
  { id: '4-1', stage: 4, stageName: 'MVP Build Readiness', question: 'What single user action defines success?', type: 'text', minChars: 30 },
  { id: '4-2', stage: 4, stageName: 'MVP Build Readiness', question: 'What is the riskiest assumption left?', type: 'text', minChars: 30 },
  { id: '4-3', stage: 4, stageName: 'MVP Build Readiness', question: 'What will you NOT build in the MVP?', type: 'text', minChars: 30 },
  { id: '4-4', stage: 4, stageName: 'MVP Build Readiness', question: "How will you get this MVP into users' hands?", type: 'text', minChars: 30 },
  { id: '4-5', stage: 4, stageName: 'MVP Build Readiness', question: 'Are you ready to commit time?', type: 'selector', options: ['Full-time', 'Part-time', 'Not ready'] },
]

export default function Sidebar() {
  const { currentQuestionIndex, navigateToStage, answers } = useQuestionnaire()

  // Determine which stage is active based on current question index
  // Stage 1: 0-4, Stage 2: 5-9, Stage 3: 10-14, Stage 4: 15-19
  const getCurrentStage = () => {
    if (currentQuestionIndex < 5) return 1
    if (currentQuestionIndex < 10) return 2
    if (currentQuestionIndex < 15) return 3
    return 4
  }

  const currentStage = getCurrentStage()
  
  // Calculate confidence for each stage
  const getStageStatus = (stageNumber: number) => {
    const confidence = calculateStageConfidence(stageNumber, answers, questions)
    return confidence.level.toLowerCase() as 'weak' | 'medium' | 'strong'
  }

  const handleStageClick = (stageNumber: number) => {
    // Don't navigate if stage is locked
    if (isStageLocked(stageNumber, answers, questions)) {
      return
    }
    navigateToStage(stageNumber)
  }

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
            {stages.map((stage) => {
              const isActive = currentStage === stage.number
              const status = getStageStatus(stage.number)
              const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
              const isLocked = isStageLocked(stage.number, answers, questions)
              
              return (
                <div
                  key={stage.number}
                  className={`stage-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={() => handleStageClick(stage.number)}
                >
                  <div className="stage-content">
                    <div
                      className={`stage-number-circle ${
                        isActive ? 'active' : ''
                      } ${isLocked ? 'locked' : ''}`}
                    >
                      {isLocked ? (
                        <Lock className="lock-icon" />
                      ) : (
                        stage.number
                      )}
                    </div>
                    <span
                      className={`stage-name ${
                        isActive ? 'active' : ''
                      } ${isLocked ? 'locked' : ''}`}
                    >
                      {stage.name}
                    </span>
                  </div>
                  <div className="stage-badges">
                    {!isLocked && (
                      <span className={`badge-status badge-${status}`}>
                        {statusLabel}
                      </span>
                    )}
                    {isLocked && (
                      <span className="badge-locked">Locked</span>
                    )}
                    {isActive && !isLocked && (
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
              )
            })}
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
