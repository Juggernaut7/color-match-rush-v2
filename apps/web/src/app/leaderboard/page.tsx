"use client"

import { useCallback, useEffect, useState } from "react"
import BottomNav from "@/components/BottomNav"
import { getLeaderboard } from "@/lib/game-state"
import { getSharedLeaderboard, type SharedScore } from "@/lib/score-api"

type LeaderboardEntry = Pick<SharedScore, "rank" | "player" | "score" | "correct" | "mistakes" | "playedAt">

function getLocalEntries(): LeaderboardEntry[] {
  return getLeaderboard().map((record) => ({
    rank: record.rank,
    player: record.playerName,
    score: record.score,
    correct: record.correct,
    mistakes: record.mistakes,
    playedAt: record.playedAt,
  }))
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<"online" | "local">("online")

  const loadLeaderboard = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setEntries(await getSharedLeaderboard())
      setSource("online")
    } catch (caughtError) {
      setEntries(getLocalEntries())
      setSource("local")
      setError(caughtError instanceof Error ? caughtError.message : "Shared leaderboard is unavailable.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setEntries(getLocalEntries())
    void loadLeaderboard()
  }, [loadLeaderboard])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-20">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Community scores</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">Leaderboard</h1>
            <p className="mt-2 text-sm text-slate-500">
              {source === "online" ? "Anonymous scores stored by the app." : "Showing scores saved on this device."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLeaderboard()}
            disabled={loading}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Loading..." : "Retry"}
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error} Your game and local score history remain available.
          </p>
        )}

        {entries.length === 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">🏁</div>
            <h2 className="mt-4 text-2xl font-black">No scores yet</h2>
            <p className="mt-2 text-slate-500">Play a free round to add the first anonymous score.</p>
          </section>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li key={`${entry.rank}-${entry.playedAt}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-8 shrink-0 text-xl font-black text-blue-600">#{entry.rank}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{entry.player}</p>
                    <p className="text-xs text-slate-500">
                      {entry.correct} correct · {entry.mistakes} mistakes · {new Date(entry.playedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-2xl font-black text-slate-900">{entry.score}</span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          Scores are submitted by players and can be manipulated; they are not independently verified or recorded on-chain. Arc integration in this MVP is read-only. No entry fees or prize payouts are enabled.
        </p>
      </main>
      <BottomNav active="leaderboard" />
    </div>
  )
}
