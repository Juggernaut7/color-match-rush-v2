export type SubmittedScore = {
  submissionId: string
  playerId: string
  score: number
  correct: number
  mistakes: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_ANSWERS_PER_ROUND = 500

export function validateSubmittedScore(value: unknown): SubmittedScore | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null

  const body = value as Record<string, unknown>
  if (typeof body.submissionId !== "string" || !UUID_PATTERN.test(body.submissionId)) return null
  if (typeof body.playerId !== "string" || !UUID_PATTERN.test(body.playerId)) return null

  const { score, correct, mistakes } = body
  if (typeof score !== "number" || typeof correct !== "number" || typeof mistakes !== "number") return null
  if (!Number.isSafeInteger(score) || !Number.isSafeInteger(correct) || !Number.isSafeInteger(mistakes)) return null
  if (score < 0 || score > MAX_ANSWERS_PER_ROUND) return null
  if (correct < 0 || mistakes < 0) return null
  if (correct + mistakes > MAX_ANSWERS_PER_ROUND) return null
  if (score > correct) return null

  return {
    submissionId: body.submissionId,
    playerId: body.playerId,
    score,
    correct,
    mistakes,
  }
}
