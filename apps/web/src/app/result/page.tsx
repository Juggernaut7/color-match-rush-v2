"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import BottomNav from "@/components/BottomNav"
import { getBestScore, getStoredResults } from "@/lib/game-state"
import { getAnonymousPlayerId, submitScore } from "@/lib/score-api"

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultPageFallback />}>
      <ResultPageContent />
    </Suspense>
  )
}

function ResultPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const score = Number(searchParams.get("score") || 0)
  const correct = Number(searchParams.get("correct") || 0)
  const mistakes = Number(searchParams.get("mistakes") || 0)
  const submissionId = searchParams.get("submissionId")
  const [bestScore, setBestScore] = useState(0)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    setBestScore(getBestScore())
  }, [])

  const saveToCloud = useCallback(async () => {
    if (!submissionId) return
    setSaveStatus("saving")
    setSaveError("")
    try {
      const savedBestScore = await submitScore({
        submissionId,
        playerId: getAnonymousPlayerId(),
        score,
        correct,
        mistakes,
      })
      setBestScore((current) => Math.max(current, savedBestScore))
      setSaveStatus("saved")
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save this score online.")
      setSaveStatus("error")
    }
  }, [correct, mistakes, score, submissionId])

  useEffect(() => {
    void saveToCloud()
  }, [saveToCloud])

  const accuracy = useMemo(() => {
    const attempts = correct + mistakes
    if (!attempts) return 0
    return Math.round((correct / attempts) * 100)
  }, [correct, mistakes])

  const totalGames = getStoredResults().length

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 pb-28 pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 rounded-full bg-blue-600 p-6 text-5xl shadow-xl shadow-blue-200">
          {score >= 15 ? "🎉" : score >= 8 ? "👏" : "⚡"}
        </motion.div>

        <h1 className="text-4xl font-black text-slate-900 md:text-5xl">{score} points</h1>
        <p className="mt-3 text-lg text-slate-600">
          {score >= 15 ? "Outstanding reaction speed." : score >= 8 ? "Strong focus." : "Great effort — round one is always the toughest."}
        </p>
        {submissionId && (
          <div className="mt-5 w-full max-w-xl rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900" aria-live="polite">
            {saveStatus === "saving" && "Saving this self-reported score to your anonymous online history..."}
            {saveStatus === "saved" && "Score saved to your anonymous online history. Scores are self-reported and not verified."}
            {saveStatus === "error" && (
              <>
                <p>{saveError} Your local result remains available on this device.</p>
                <button type="button" onClick={() => void saveToCloud()} className="mt-2 font-bold underline">
                  Retry online save
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-8 grid w-full max-w-xl gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Correct</p>
            <p className="mt-3 text-3xl font-black text-blue-600">{correct}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Mistakes</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{mistakes}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Accuracy</p>
            <p className="mt-3 text-3xl font-black text-emerald-600">{accuracy}%</p>
          </div>
        </div>

        <div className="mt-8 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Device best</span>
            <span className="text-xl font-black text-slate-900">{bestScore}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Games saved</span>
            <span className="text-xl font-black text-slate-900">{totalGames}</span>
          </div>
        </div>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/game")}
            className="flex-1 rounded-2xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500"
          >
            Play again
          </button>
          <button
            type="button"
            onClick={() => router.push("/leaderboard")}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
          >
            Leaderboard
          </button>
        </div>
      </div>

      <BottomNav active="play" />
    </div>
  )
}

function ResultPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
      Loading results...
    </div>
  )
}
