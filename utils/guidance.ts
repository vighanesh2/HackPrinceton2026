import { calculateStageConfidence, ConfidenceLevel } from './confidence'

interface Question {
  id: string
  stage: number
  stageName: string
  question: string
  type: string
  minChars?: number
  minValue?: number
}

export interface Guidance {
  nextAction: string
  stageConfidence: {
    level: ConfidenceLevel
    explanation: string
  }
  insight: string
}

export function getNextAction(
  currentQuestionIndex: number,
  currentAnswer: string,
  questions: Question[],
  answers: Record<string, string>
): string {
  const currentQuestion = questions[currentQuestionIndex]
  if (!currentQuestion) return 'Complete the current question to proceed.'

  const hasAnswer = currentAnswer && currentAnswer.trim().length > 0

  if (!hasAnswer) {
    return `Answer "${currentQuestion.question}" to move forward.`
  }

  if (currentQuestion.type === 'text' && currentQuestion.minChars) {
    const charsNeeded = currentQuestion.minChars - currentAnswer.length
    if (charsNeeded > 0) {
      return `Add ${charsNeeded} more characters to provide a complete answer.`
    }
  }

  if (currentQuestion.type === 'number') {
    const num = parseInt(currentAnswer)
    const minValue = currentQuestion.minValue || (currentQuestion.minChars ? parseInt(String(currentQuestion.minChars)) : 0)
    if (isNaN(num) || num < minValue) {
      return `Enter a number of at least ${minValue}.`
    }
  }

  if (currentQuestion.type === 'decision' && currentAnswer) {
    const justification = answers[`${currentQuestion.id}-justification`]
    if (!justification || justification.trim().length < 30) {
      return 'Provide a detailed justification for your decision.'
    }
  }

  // Check if we can move to next question
  if (currentQuestionIndex < questions.length - 1) {
    return 'Click "Next" to continue to the next question.'
  }

  return 'Review your answers and ensure everything is complete.'
}

export function getRontzenInsight(
  currentQuestionIndex: number,
  currentAnswer: string,
  questions: Question[],
  answers: Record<string, string>,
  stageConfidence: ConfidenceLevel
): string {
  const currentQuestion = questions[currentQuestionIndex]
  if (!currentQuestion) return 'Focus on answering each question thoughtfully.'

  const answer = currentAnswer || ''
  const lowerAnswer = answer.toLowerCase()

  // Check for vague answers
  const vagueWords = ['everyone', 'people', 'users', 'they', 'some', 'many', 'often', 'sometimes', 'maybe', 'probably']
  const hasVagueWords = vagueWords.some((word) => lowerAnswer.includes(word))

  if (hasVagueWords && answer.length > 0) {
    return "This answer is too vague. Be specific about who, what, when, and why."
  }

  // Check for very short answers
  if (answer.length > 0 && answer.length < 30 && currentQuestion.type === 'text') {
    return "This answer is too brief. Provide more detail to clarify your thinking."
  }

  // Stage-specific insights
  if (currentQuestion.stage === 1) {
    if (lowerAnswer.includes('everyone') || lowerAnswer.includes('all people')) {
      return "'Everyone' is not a valid answer. Be specific about your target user."
    }
    if (stageConfidence === 'Weak') {
      return "You can't solve a problem you don't understand. Slow down and be specific."
    }
  }

  if (currentQuestion.stage === 2) {
    if (lowerAnswer.length > 0 && !lowerAnswer.includes('ai') && !lowerAnswer.includes('artificial')) {
      return "If you're building an AI product, explain why AI is necessary here."
    }
    if (stageConfidence === 'Weak') {
      return "Your solution needs more clarity. What makes it unique and valuable?"
    }
  }

  if (currentQuestion.stage === 3) {
    if (currentQuestion.id === '3-1') {
      const num = parseInt(answer)
      if (!isNaN(num) && num < 5) {
        return "You need to talk to at least 5 people before validating. Go talk to real users."
      }
    }
    if (stageConfidence === 'Weak') {
      return "Validation requires real conversations. Have you actually talked to users?"
    }
  }

  if (currentQuestion.stage === 4) {
    if (stageConfidence === 'Weak') {
      return "Before building, ensure you've validated the problem and solution."
    }
    if (lowerAnswer.includes('not ready') || lowerAnswer.includes('not sure')) {
      return "If you're not ready to commit time, you may not be ready to build an MVP."
    }
  }

  // Default positive feedback
  if (answer.length >= 50 && !hasVagueWords) {
    return "Good answer. Keep being specific and thoughtful."
  }

  return "Take your time. Thoughtful answers lead to better decisions."
}

