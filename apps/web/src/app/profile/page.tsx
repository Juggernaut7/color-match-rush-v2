"use client"

import { motion } from "framer-motion"
import BottomNav from "@/components/BottomNav"
import WalletButton from "@/components/WalletButton"
import { getProfileSummary, getStoredResults } from "@/lib/game-state"

export default function ProfilePage() {
  const player = "Guest"
  const stats = getProfileSummary(player)
  const recent = getStoredResults().filter((entry) => entry.player === player).slice(0, 5)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <WalletButton />

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
                <div className="mt-2 text-lg font-bold text-slate-900">{player}</div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Local</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Games</div>
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
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Total points</p>
            <div className="mt-3 text-4xl font-black text-slate-900">{stats.totalPoints}</div>
            <p className="mt-3 text-slate-500">Your all-time score total across saved rounds.</p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Recent runs</p>
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
