'use client'

import { Target, TrendingUp, Lightbulb } from 'lucide-react'
import { useQuestionnaire } from '@/contexts/QuestionnaireContext'
import { calculateStageConfidence } from '@/utils/confidence'
import { getNextAction, getRontzenInsight } from '@/utils/guidance'

// Import questions - in a real app, this would be shared
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
  { id: '3-1', stage: 3, stageName: 'Validation', question: 'How many people have you talked to?', type: 'number', minValue: 5, minChars: 5 },
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

export default function RightSidebar() {
  const { currentQuestionIndex, answers } = useQuestionnaire()
  
  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : ''
  
  // Determine current stage
  const getCurrentStage = () => {
    if (currentQuestionIndex < 5) return 1
    if (currentQuestionIndex < 10) return 2
    if (currentQuestionIndex < 15) return 3
    return 4
  }
  
  const currentStage = getCurrentStage()
  const stageConfidence = calculateStageConfidence(currentStage, answers, questions)
  
  const nextAction = getNextAction(currentQuestionIndex, currentAnswer, questions, answers)
  const insight = getRontzenInsight(currentQuestionIndex, currentAnswer, questions, answers, stageConfidence.level)
  
  const stageName = currentQuestion?.stageName || 'Problem Clarity'
  
  // Get confidence badge color and dots
  const getConfidenceBadgeClass = () => {
    if (stageConfidence.level === 'Strong') return 'confidence-strong'
    if (stageConfidence.level === 'Medium') return 'confidence-medium'
    return 'confidence-weak'
  }
  
  const getActiveDots = () => {
    if (stageConfidence.level === 'Strong') return 3
    if (stageConfidence.level === 'Medium') return 2
    return 1
  }
  
  const activeDots = getActiveDots()

  return (
    <aside className="right-sidebar">
      <div className="right-sidebar-content">
        {/* Header */}
        <div className="right-sidebar-header">
          <div className="guidance-label">GUIDANCE</div>
          <h2 className="guidance-title">{stageName}</h2>
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
              <p className="card-description">{nextAction}</p>
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
                <span className={`confidence-badge ${getConfidenceBadgeClass()}`}>
                  {stageConfidence.level}
                </span>
                <div className="confidence-dots">
                  {[1, 2, 3].map((dot) => (
                    <span
                      key={dot}
                      className={`dot ${dot <= activeDots ? 'active' : ''}`}
                    ></span>
                  ))}
                </div>
              </div>
              <p className="card-description">{stageConfidence.explanation}</p>
            </div>
          </div>

          {/* Rontzen Insight Card */}
          <div className="guidance-card">
            <div className="card-icon rontzen-insight-icon">
              <Lightbulb className="icon" />
            </div>
            <div className="card-content">
              <h3 className="card-title">Rontzen Insight</h3>
              <p className="card-quote">&ldquo;{insight}&rdquo;</p>
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



