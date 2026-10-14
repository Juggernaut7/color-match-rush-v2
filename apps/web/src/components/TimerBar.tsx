"use client"
import { motion } from "framer-motion"

interface TimerBarProps {
  timeLeft: number
  duration: number
}

export default function TimerBar({ timeLeft, duration }: TimerBarProps) {
  const percentage = (timeLeft / duration) * 100

  return (
    <div
      className="h-2 w-full bg-slate-200"
      role="progressbar"
      aria-label="Time remaining"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={timeLeft}
    >
      <motion.div
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.12, ease: "linear" }}
        className={`h-full ${
          timeLeft > 10 ? "bg-emerald-500" : timeLeft > 5 ? "bg-amber-500" : "bg-rose-500"
        }`}
      />
    </div>
  )
}
