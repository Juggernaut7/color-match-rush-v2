"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import ColorButtons from "@/components/ColorButtons"
import ColorWord from "@/components/ColorWord"
import TimerBar from "@/components/TimerBar"
import WalletButton from "@/components/WalletButton"
import { COLOR_SET, generateQuestion, saveResult, type GameQuestion } from "@/lib/game-state"

const ROUND_SECONDS = 30

type PaidEntry = {
  address: string
  roundId: string
}

export default function GamePage() {
  const router = useRouter()
  const [question, setQuestion] = useState<GameQuestion>({
    wordName: "RED",
    wordColor: "#3B82F6",
    options: COLOR_SET,
  })
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [gameActive, setGameActive] = useState(true)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [completed, setCompleted] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setQuestion(generateQuestion())
  }, [])

  useEffect(() => {
    if (!gameActive) return

    timerRef.current = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          setGameActive(false)
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [gameActive])

  useEffect(() => {
    if (gameActive || timeLeft !== 0 || completed) return
    setCompleted(true)

    const paidEntry = sessionStorage.getItem("arc-paid-entry")
    let entry: PaidEntry | null = null
    if (paidEntry) {
      try {
        entry = JSON.parse(paidEntry) as PaidEntry
      } catch (error) {
        console.error("Unable to read the saved Arc entry:", error)
      }
    }

    saveResult({
      score,
      correct,
      mistakes,
      playedAt: new Date().toISOString(),
      player: entry?.address
        ? `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`
        : "Guest",
    })

    const params = new URLSearchParams({
      score: String(score),
      correct: String(correct),
      mistakes: String(mistakes),
      ...(entry ? { competition: "entered", roundId: entry.roundId } : {}),
    })
    if (entry) sessionStorage.removeItem("arc-paid-entry")
    router.push(`/result?${params.toString()}`)
  }, [gameActive, timeLeft, completed, score, correct, mistakes, router])

  const handleAnswer = (selectedColorName: string) => {
    if (!gameActive) return

    const isCorrect = selectedColorName === question.wordName
    if (isCorrect) {
      setScore((previous) => previous + 1)
      setCorrect((previous) => previous + 1)
      setFeedback("correct")
    } else {
      setScore((previous) => Math.max(0, previous - 1))
      setMistakes((previous) => previous + 1)
      setFeedback("wrong")
    }

    window.setTimeout(() => {
      setQuestion(generateQuestion())
      setFeedback(null)
    }, 220)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.25),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <WalletButton />
      <TimerBar timeLeft={timeLeft} duration={ROUND_SECONDS} />

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 pb-24 pt-12">
        <div className="mb-6 flex w-full max-w-xl items-center justify-between rounded-full border border-blue-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Round</div>
          <motion.div key={score} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-black text-slate-900">
            {score}
          </motion.div>
        </div>

        <div className="mb-6 flex w-full max-w-xl items-center justify-between gap-3 text-sm font-medium text-slate-600">
          <span>Correct: {correct}</span>
          <span>Errors: {mistakes}</span>
          <span>{timeLeft}s left</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${question.wordName}-${question.wordColor}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-8 flex min-h-[180px] items-center justify-center"
          >
            <ColorWord text={question.wordName} color={question.wordColor} />
          </motion.div>
        </AnimatePresence>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`mb-4 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] ${
              feedback === "correct" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {feedback === "correct" ? "Correct" : "Wrong"}
          </motion.div>
        )}

        <div className="w-full max-w-xl">
          <ColorButtons options={question.options} onSelect={handleAnswer} disabled={!gameActive} />
        </div>
      </div>
    </div>
  )
}
