"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getBestScore, getStoredResults } from "@/lib/game-state"
import { getAnonymousPlayerId, submitScore } from "@/lib/score-api"

function readCount(value: string | null) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? Math.max(0, parsed) : 0
}

export default function ResultPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#f7f6f1] text-slate-600">Loading your score…</main>}>
      <ResultPageContent />
    </Suspense>
  )
}

function ResultPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const score = readCount(searchParams.get("score"))
  const correct = readCount(searchParams.get("correct"))
  const mistakes = readCount(searchParams.get("mistakes"))
  const submissionId = searchParams.get("submissionId")
  const [bestScore, setBestScore] = useState(readCount(searchParams.get("bestScore")))
  const [totalGames, setTotalGames] = useState(0)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")
  const newBest = searchParams.get("newBest") === "true"

  useEffect(() => {
    setBestScore((current) => Math.max(current, getBestScore()))
    setTotalGames(getStoredResults().length)
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
      setSaveError(error instanceof Error ? error.message : "Online score sync is unavailable.")
      setSaveStatus("error")
    }
  }, [correct, mistakes, score, submissionId])

  useEffect(() => {
    void saveToCloud()
  }, [saveToCloud])

  const attempts = correct + mistakes
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f6f1] px-5 pb-10 pt-8 text-slate-950 sm:px-8">
      <div className="w-full max-w-xl">
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-blue-700">← Home</Link>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-700">Round complete</p>
          <h1 className="mt-3 text-6xl font-black tracking-tight sm:text-7xl">{score}<span className="ml-3 text-2xl text-slate-400 sm:text-3xl"> pts</span></h1>
          <p className="mt-3 text-lg text-slate-600">
            {newBest ? "New personal best. Look at you go!" : score >= 10 ? "Quick thinking. Fancy another round?" : "Good warm-up. You can beat that next round."}
          </p>

          <div className="mt-8 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-[#f7f6f1] py-4">
            <div className="text-center">
              <p className="text-2xl font-black">{correct}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Right</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black">{mistakes}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Missed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black">{accuracy}%</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Accuracy</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 px-5 py-4">
            <span className="font-bold text-slate-600">Personal best</span>
            <span className="text-2xl font-black">{bestScore}</span>
          </div>

          {submissionId && (
            <div className="mt-5 text-sm text-slate-600" aria-live="polite">
              {saveStatus === "saving" && "Saving your score online…"}
              {saveStatus === "saved" && "Score synced. Online scores are player-submitted and unverified."}
              {saveStatus === "error" && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>{saveError} Your score is safe on this device.</p>
                  <button type="button" onClick={() => void saveToCloud()} className="font-bold text-blue-700 underline underline-offset-2">
                    Retry sync
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="mt-5 text-sm text-slate-500">{totalGames} {totalGames === 1 ? "round" : "rounds"} saved on this device</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/game")}
              className="min-h-14 flex-1 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Play Again
            </button>
            <Link href="/" className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl border-2 border-slate-200 px-6 py-4 text-center font-bold text-slate-700 transition hover:bg-slate-50">
              Home
            </Link>
          </div>
          <Link href="/leaderboard" className="mt-5 block text-center text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-blue-700">
            See leaderboard
          </Link>
        </section>
      </div>
    </main>
  )
}
