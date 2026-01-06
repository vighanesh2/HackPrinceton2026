export type ConfidenceLevel = 'Weak' | 'Medium' | 'Strong'

interface StageConfidence {
  level: ConfidenceLevel
  score: number
  explanation: string
}

// Calculate confidence for a single answer
function calculateAnswerQuality(answer: string, minChars?: number): number {
  if (!answer || answer.trim().length === 0) return 0

  const length = answer.trim().length
  const hasMinLength = minChars ? length >= minChars : length >= 20
  const wordCount = answer.trim().split(/\s+/).length

  let score = 0

  // Length score (0-40 points)
  if (hasMinLength) {
    score += 40
  } else {
    score += Math.min(40, (length / (minChars || 20)) * 40)
  }

  // Detail score (0-30 points) - based on word count
  if (wordCount >= 10) score += 30
  else if (wordCount >= 5) score += 20
  else if (wordCount >= 3) score += 10

  // Specificity score (0-30 points) - check for vague words
  const vagueWords = ['everyone', 'people', 'users', 'they', 'some', 'many', 'often', 'sometimes']
  const lowerAnswer = answer.toLowerCase()
  const hasVagueWords = vagueWords.some((word) => lowerAnswer.includes(word))
  
  if (!hasVagueWords && wordCount >= 5) {
    score += 30
  } else if (!hasVagueWords) {
    score += 15
  }

  return Math.min(100, score)
}

// Calculate stage confidence based on all answers in that stage
export function calculateStageConfidence(
  stageNumber: number,
  answers: Record<string, string>,
  questions: Array<{ id: string; stage: number; minChars?: number; minValue?: number; type: string }>
): StageConfidence {
  const stageQuestions = questions.filter((q) => q.stage === stageNumber)
  const totalQuestions = stageQuestions.length

  if (totalQuestions === 0) {
    return {
      level: 'Weak',
      score: 0,
      explanation: 'No questions in this stage.',
    }
  }

  let totalScore = 0
  let answeredCount = 0

  stageQuestions.forEach((question) => {
    const answer = answers[question.id]
    if (answer && answer.trim().length > 0) {
      answeredCount++
      if (question.type === 'text') {
        totalScore += calculateAnswerQuality(answer, question.minChars)
      } else       if (question.type === 'number') {
        const num = parseInt(answer)
        const minValue = question.minValue || (question.minChars ? parseInt(String(question.minChars)) : 0)
        if (!isNaN(num) && num >= minValue) {
          totalScore += 100
        } else if (!isNaN(num) && num > 0) {
          totalScore += 50
        } else {
          totalScore += 0
        }
      } else {
        // selector, yesno, decision
        totalScore += 100
      }

      // Check for justification in decision questions
      if (question.type === 'decision' && answer) {
        const justification = answers[`${question.id}-justification`]
        if (justification && justification.trim().length >= 30) {
          totalScore += 20 // bonus for good justification
        }
      }
    }
  })

  const averageScore = totalQuestions > 0 ? totalScore / totalQuestions : 0
  const completeness = answeredCount / totalQuestions

  // Final score combines quality and completeness
  const finalScore = averageScore * 0.7 + completeness * 100 * 0.3

  let level: ConfidenceLevel = 'Weak'
  let explanation = ''

  if (finalScore >= 75 && completeness >= 0.8) {
    level = 'Strong'
    explanation = 'All questions are well-answered with specific details.'
  } else if (finalScore >= 50 && completeness >= 0.6) {
    level = 'Medium'
    explanation = 'Most questions are answered, but some need more detail.'
  } else {
    level = 'Weak'
    if (completeness < 0.4) {
      explanation = 'Most questions are incomplete or too brief.'
    } else if (completeness < 0.6) {
      explanation = 'Several questions need more thoughtful answers.'
    } else {
      explanation = 'Answers are too vague. Be more specific.'
    }
  }

  return {
    level,
    score: Math.round(finalScore),
    explanation,
  }
}

