import type { GameResult } from "@/lib/game-state"

const PLAYER_ID_KEY = "color-match-rush-player-v1"

export type SharedScore = GameResult & {
  rank: number
}

export function getAnonymousPlayerId() {
  try {
    const existing = window.localStorage.getItem(PLAYER_ID_KEY)
    if (existing) return existing
    const created = window.crypto.randomUUID()
    window.localStorage.setItem(PLAYER_ID_KEY, created)
    return created
  } catch {
    return window.crypto.randomUUID()
  }
}

export async function submitScore(
  score: Omit<GameResult, "playedAt" | "player"> & { submissionId: string; playerId: string },
): Promise<number> {
  const response = await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(score),
    signal: AbortSignal.timeout(8000),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not save score.")
  if (typeof body.bestScore !== "number" || !Number.isSafeInteger(body.bestScore)) {
    throw new Error("Score storage returned an invalid personal best.")
  }
  return body.bestScore
}

export async function getSharedLeaderboard(): Promise<SharedScore[]> {
  const response = await fetch("/api/leaderboard", {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not load leaderboard.")
  return body.entries as SharedScore[]
}

export async function getPersonalScores(playerId: string): Promise<{ records: GameResult[]; bestScore: number }> {
  const response = await fetch(`/api/scores?playerId=${encodeURIComponent(playerId)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not load saved scores.")
  if (!Array.isArray(body.records) || typeof body.bestScore !== "number") {
    throw new Error("Score storage returned an invalid history response.")
  }
  return body as { records: GameResult[]; bestScore: number }
}
