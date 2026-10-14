import { COLOR_SET, generateQuestion } from "./game-questions.mjs"

export { COLOR_SET, generateQuestion }
export type { ColorOption, GameQuestion } from "./game-questions.mjs"

export type GameResult = {
  score: number
  correct: number
  mistakes: number
  playedAt: string
  player: string
}

export const GAME_STORAGE_KEY = "color-match-rush-results-v1"

export function getStoredResults(): GameResult[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(GAME_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveResult(result: GameResult): GameResult[] {
  if (typeof window === "undefined") {
    return []
  }

  const existing = getStoredResults()
  const next = [...existing, result]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.correct !== a.correct) return b.correct - a.correct
      return new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
    })
    .slice(0, 25)

  try {
    window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(next))
  } catch {
    return next
  }
  return next
}

export function getBestScore(player?: string): number {
  const allResults = getStoredResults()
  const relevant = player
    ? allResults.filter((result) => result.player === player)
    : allResults

  return relevant.reduce((best, result) => Math.max(best, result.score), 0)
}

export function getProfileSummary(player?: string) {
  const allResults = getStoredResults()
  const relevant = player ? allResults.filter((result) => result.player === player) : allResults

  return summarizeResults(relevant)
}

export function summarizeResults(relevant: GameResult[]) {
  const totalGames = relevant.length
  const bestScore = relevant.reduce((best, result) => Math.max(best, result.score), 0)
  const totalPoints = relevant.reduce((sum, result) => sum + result.score, 0)
  const avgAccuracy =
    totalGames > 0
      ? (relevant.reduce((sum, result) => sum + (result.correct / Math.max(1, result.correct + result.mistakes)), 0) /
          totalGames) * 100
      : 0

  return { totalGames, bestScore, totalPoints, avgAccuracy }
}

export function getLeaderboard(player?: string) {
  const allResults = getStoredResults()
  const normalized = [...allResults]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.correct !== a.correct) return b.correct - a.correct
      return new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
    })
    .map((result, index) => ({
      ...result,
      playerName: player && result.player === player ? `${result.player} (you)` : result.player,
      rank: index + 1,
    }))

  return normalized
}

export function formatPlayerLabel(address?: string | null) {
  if (!address) return "Guest"
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
