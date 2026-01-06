'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { isStageLocked } from '@/utils/stageLock'

// Import questions for lock checking
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

interface QuestionnaireContextType {
  currentQuestionIndex: number
  setCurrentQuestionIndex: (index: number) => void
  navigateToStage: (stageNumber: number) => void
  answers: Record<string, string>
  setAnswers: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined)

export function QuestionnaireProvider({ children }: { children: ReactNode }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Stage 1 starts at index 0, Stage 2 at 5, Stage 3 at 10, Stage 4 at 15
  const stageStartIndices: Record<number, number> = {
    1: 0,
    2: 5,
    3: 10,
    4: 15,
  }

  const navigateToStage = (stageNumber: number) => {
    // Check if stage is locked before navigating
    if (isStageLocked(stageNumber, answers, questions)) {
      return
    }
    
    const startIndex = stageStartIndices[stageNumber]
    if (startIndex !== undefined) {
      setCurrentQuestionIndex(startIndex)
    }
  }

  return (
    <QuestionnaireContext.Provider
      value={{ currentQuestionIndex, setCurrentQuestionIndex, navigateToStage, answers, setAnswers }}
    >
      {children}
    </QuestionnaireContext.Provider>
  )
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext)
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider')
  }
  return context
}

