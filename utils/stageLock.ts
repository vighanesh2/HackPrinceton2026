import { calculateStageConfidence } from './confidence'

export function isStageComplete(
  stageNumber: number,
  answers: Record<string, string>,
  questions: Array<{ id: string; stage: number; minChars?: number; minValue?: number; type: string }>
): boolean {
  const confidence = calculateStageConfidence(stageNumber, answers, questions)
  // Stage is complete if it has at least Medium confidence
  return confidence.level === 'Medium' || confidence.level === 'Strong'
}

export function isStageLocked(
  stageNumber: number,
  answers: Record<string, string>,
  questions: Array<{ id: string; stage: number; minChars?: number; minValue?: number; type: string }>
): boolean {
  // Stage 1 is never locked
  if (stageNumber === 1) return false

  // Check if previous stage is complete
  const previousStage = stageNumber - 1
  return !isStageComplete(previousStage, answers, questions)
}

