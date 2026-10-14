"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import BottomNav from "@/components/BottomNav"
import { getProfileSummary, getStoredResults, summarizeResults, type GameResult } from "@/lib/game-state"
import { getAnonymousPlayerId, getPersonalScores } from "@/lib/score-api"

const EMPTY_STATS = { totalGames: 0, bestScore: 0, totalPoints: 0, avgAccuracy: 0 }

export default function ProfilePage() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [recent, setRecent] = useState<GameResult[]>([])
  const [historySource, setHistorySource] = useState<"loading" | "online" | "local">("loading")

  useEffect(() => {
    const localResults = getStoredResults().filter((entry) => entry.player === "Guest")
    setStats(getProfileSummary("Guest"))
    setRecent(localResults.slice(0, 5))
    void getPersonalScores(getAnonymousPlayerId()).then(({ records, bestScore }) => {
      setStats({ ...summarizeResults(records), bestScore })
      setRecent(records.slice(0, 5))
      setHistorySource("online")
    }).catch(() => {
      setHistorySource("local")
    })
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto max-w-4xl px-4 pb-28 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Profile</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Your stats</h1>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-[0_25px_70px_rgba(37,99,235,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Player</p>
                <div className="mt-2 text-lg font-bold text-slate-900">Anonymous player</div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {historySource === "online" ? "Online" : historySource === "local" ? "Local" : "Loading"}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Recent games</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{stats.totalGames}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Best</div>
                <div className="mt-2 text-3xl font-black text-blue-600">{stats.bestScore}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Avg. accuracy</div>
                <div className="mt-2 text-3xl font-black text-emerald-600">{Math.round(stats.avgAccuracy)}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Recent points</p>
            <div className="mt-3 text-4xl font-black text-slate-900">{stats.totalPoints}</div>
            <p className="mt-3 text-slate-500">Points across up to 25 recent saved rounds.</p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Recent runs</p>
          {historySource === "local" && (
            <p role="status" className="mt-3 text-sm text-amber-800">Online history is unavailable; showing this device&apos;s saved runs.</p>
          )}
          {recent.length === 0 ? (
            <p className="mt-4 text-slate-500">No recorded runs yet. Jump into a round and start building your streak.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recent.map((run, index) => (
                <div key={`${run.playedAt}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{run.score} pts</div>
                    <div className="text-sm text-slate-500">{new Date(run.playedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <div>{run.correct} correct</div>
                    <div>{run.mistakes} mistakes</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
