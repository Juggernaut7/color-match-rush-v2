"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ColorButtons from "@/components/ColorButtons"
import ColorWord from "@/components/ColorWord"
import TimerBar from "@/components/TimerBar"
import { COLOR_SET, generateQuestion, getBestScore, saveResult, type GameQuestion } from "@/lib/game-state"
import { canAcceptAnswer, scoreAnswer, secondsRemaining } from "@/lib/game-engine.mjs"

const ROUND_SECONDS = 30
const ANSWER_FEEDBACK_MS = 180

const INITIAL_QUESTION: GameQuestion = {
  wordName: "RED",
  wordColor: "#2563EB",
  options: COLOR_SET,
}

export default function GamePage() {
  const router = useRouter()
  const [question, setQuestion] = useState<GameQuestion>(INITIAL_QUESTION)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [gameActive, setGameActive] = useState(true)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const deadlineRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const answerTimeoutRef = useRef<number | null>(null)
  const hasAnsweredRef = useRef(false)
  const finishedRef = useRef(false)
  const statsRef = useRef({ score: 0, correct: 0, mistakes: 0 })

  const finishRound = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    hasAnsweredRef.current = true

    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    if (answerTimeoutRef.current !== null) window.clearTimeout(answerTimeoutRef.current)
    setGameActive(false)
    setTimeLeft(0)

    const finalStats = statsRef.current
    const previousBest = getBestScore()
    saveResult({
      ...finalStats,
      playedAt: new Date().toISOString(),
      player: "Guest",
    })

    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(finalStats).map(([key, value]) => [key, String(value)])),
      bestScore: String(getBestScore()),
      newBest: String(finalStats.score > previousBest),
      submissionId: window.crypto.randomUUID(),
    })
    router.replace(`/result?${params.toString()}`)
  }, [router])

  useEffect(() => {
    deadlineRef.current = Date.now() + ROUND_SECONDS * 1000
    setQuestion(generateQuestion())

    const updateClock = () => {
      if (deadlineRef.current === null || finishedRef.current) return
      const remaining = secondsRemaining(deadlineRef.current, Date.now())
      setTimeLeft((current) => (current === remaining ? current : remaining))
      if (remaining === 0) finishRound()
    }

    updateClock()
    timerRef.current = window.setInterval(updateClock, 250)

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      if (answerTimeoutRef.current !== null) window.clearTimeout(answerTimeoutRef.current)
    }
  }, [finishRound])

  const handleAnswer = (selectedColorName: string) => {
    const now = Date.now()
    if (
      deadlineRef.current === null ||
      !canAcceptAnswer({
        deadline: deadlineRef.current,
        now,
        alreadyAnswered: hasAnsweredRef.current,
        finished: finishedRef.current,
      })
    ) {
      if (!finishedRef.current && deadlineRef.current !== null && now >= deadlineRef.current) finishRound()
      return
    }

    hasAnsweredRef.current = true
    const isCorrect = selectedColorName === question.wordName
    const nextStats = scoreAnswer(statsRef.current, isCorrect)
    statsRef.current = nextStats
    setScore(nextStats.score)
    setCorrect(nextStats.correct)
    setMistakes(nextStats.mistakes)
    setFeedback(isCorrect ? "correct" : "wrong")

    answerTimeoutRef.current = window.setTimeout(() => {
      if (finishedRef.current) return
      setQuestion(generateQuestion())
      setFeedback(null)
      hasAnsweredRef.current = false
    }, ANSWER_FEEDBACK_MS)
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 pb-8 pt-4 text-slate-950 sm:px-8 sm:pt-8">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-2xl flex-col">
        <TimerBar timeLeft={timeLeft} duration={ROUND_SECONDS} />

        <header className="flex items-center justify-between py-5">
          <Link href="/" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white" aria-label="Leave round and return home">
            ← <span className="hidden sm:inline">Leave round</span><span className="sm:hidden">Exit</span>
          </Link>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">Color Match Rush</p>
          <div className="min-w-20 rounded-xl bg-white px-3 py-2 text-right shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Score</span>
            <span className="ml-2 text-xl font-black tabular-nums text-slate-950" aria-live="polite">{score}</span>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center pb-6">
          <div className="mb-8 flex w-full max-w-md items-center justify-between">
            <p className="text-sm font-bold text-slate-500">MATCH THE WORD</p>
            <p className={`rounded-full px-4 py-2 text-lg font-black tabular-nums ${timeLeft <= 5 ? "bg-rose-100 text-rose-700" : "bg-white text-slate-900"}`} aria-live="off">
              {timeLeft}<span className="ml-1 text-xs font-bold">SEC</span>
            </p>
          </div>

          <div className="mb-5 flex min-h-36 w-full items-center justify-center rounded-[2rem] bg-white px-4 py-8 shadow-[0_16px_48px_rgba(15,23,42,0.07)] sm:min-h-48">
            <ColorWord text={question.wordName} color={question.wordColor} />
          </div>
          <p className="mb-5 min-h-6 text-center text-sm font-extrabold uppercase tracking-[0.18em]" aria-live="polite">
            {feedback === "correct" ? <span className="text-emerald-700">Nice! +1</span> : feedback === "wrong" ? <span className="text-rose-700">Not quite · −1</span> : <span className="text-slate-500">Choose the color named above</span>}
          </p>

          <div className="w-full max-w-md">
            <ColorButtons options={question.options} onSelect={handleAnswer} disabled={!gameActive || feedback !== null} />
          </div>
        </section>
      </div>
    </main>
  )
}
