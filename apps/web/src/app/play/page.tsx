"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/BottomNav"
import WalletButton from "@/components/WalletButton"
import CompetitiveEntry from "@/components/CompetitiveEntry"
import { getBestScore } from "@/lib/game-state"

export default function PlayPage() {
  const router = useRouter()
  const bestScore = getBestScore()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <WalletButton />

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 pb-28 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl rounded-[2rem] border border-blue-100 bg-white/80 p-6 shadow-[0_25px_70px_rgba(37,99,235,0.08)] backdrop-blur-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Free play + Arc competition</p>
              <h1 className="mt-2 text-4xl font-black text-slate-900">Free-to-play challenge</h1>
            </div>
            <div className="rounded-full bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200">30s</div>
          </div>

          <p className="mb-8 text-lg text-slate-600">
            Match the color name to the correct answer before the timer ends. Free practice needs no wallet or fee; joining the optional Arc competition is a separate on-chain transaction.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-2xl">⏱️</div>
              <div className="text-lg font-bold text-slate-900">Fast rounds</div>
              <p className="mt-1 text-sm text-slate-500">30-second challenge loop</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-2xl">🎯</div>
              <div className="text-lg font-bold text-slate-900">8 colors</div>
              <p className="mt-1 text-sm text-slate-500">Pick the correct match under pressure</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-2xl">🏆</div>
              <div className="text-lg font-bold text-slate-900">Local leaderboard</div>
              <p className="mt-1 text-sm text-slate-500">Track your best score on this device</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/game")}
              className="flex-1 rounded-2xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500"
            >
              Start free play
            </button>
            <button
              type="button"
              onClick={() => router.push("/how-to-play")}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              How to play
            </button>
          </div>

          <CompetitiveEntry />

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Best local score: {bestScore}
          </div>
        </motion.div>
      </div>

      <BottomNav active="play" />
    </div>
  )
}
