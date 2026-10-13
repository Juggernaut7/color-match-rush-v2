export type ColorOption = {
  name: string
  hex: string
}

export type GameResult = {
  score: number
  correct: number
  mistakes: number
  playedAt: string
  player: string
}

export const COLOR_SET: ColorOption[] = [
  { name: "RED", hex: "#FF4D4D" },
  { name: "GREEN", hex: "#35D07F" },
  { name: "BLUE", hex: "#3B82F6" },
  { name: "YELLOW", hex: "#FACC15" },
  { name: "ORANGE", hex: "#F97316" },
  { name: "PURPLE", hex: "#8B5CF6" },
  { name: "PINK", hex: "#EC4899" },
  { name: "CYAN", hex: "#06B6D4" },
]

export type GameQuestion = {
  wordName: string
  wordColor: string
  options: ColorOption[]
}

export const GAME_STORAGE_KEY = "color-match-rush-results-v1"

export function generateQuestion(): GameQuestion {
  const shuffled = [...COLOR_SET].sort(() => Math.random() - 0.5)
  const word = shuffled[0]
  const distractor = shuffled.find((color) => color.name !== word.name) ?? shuffled[1] ?? word

  return {
    wordName: word.name,
    wordColor: distractor.hex,
    options: [...COLOR_SET].sort(() => Math.random() - 0.5),
  }
}

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

  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(next))
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
