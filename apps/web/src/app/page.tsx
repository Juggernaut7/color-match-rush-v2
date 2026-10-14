"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getBestScore } from "@/lib/game-state"

export default function HomePage() {
  const [bestScore, setBestScore] = useState(0)

  useEffect(() => {
    setBestScore(getBestScore())
  }, [])

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f6f1] px-5 pb-10 pt-8 text-slate-950 sm:items-center sm:justify-center sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col sm:flex-none">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Color Match Rush home" className="text-lg font-black tracking-tight">
            COLOR <span className="text-blue-700">MATCH</span> RUSH
          </Link>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">FREE TO PLAY</span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 sm:grid-cols-[1.15fr_0.85fr] sm:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-700">A tiny game for your big brain</p>
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-7xl">
              Think fast.<br /><span className="text-blue-700">Match the word.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              The word says one color. The ink says another. Trust the word and beat the clock.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/game"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-blue-700 px-8 py-4 text-lg font-extrabold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                Play Free <span aria-hidden="true" className="ml-2">→</span>
              </Link>
              <Link href="/leaderboard" className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 font-bold text-slate-700 transition hover:bg-white">
                🏆 Leaderboard
              </Link>
              <Link href="/play" className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 font-bold text-slate-700 transition hover:bg-white">
                Optional Arc round
              </Link>
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Free 30-second practice · wallet only for optional Arc round features
            </p>
          </div>

          <div className="relative mx-auto grid w-full max-w-sm grid-cols-2 gap-3 sm:max-w-md sm:gap-4" aria-hidden="true">
            {[
              ["RED", "#2563EB", "-rotate-6"],
              ["GREEN", "#BE185D", "rotate-3"],
              ["BLUE", "#C2410C", "rotate-2"],
              ["YELLOW", "#7E22CE", "-rotate-3"],
            ].map(([word, color, rotation]) => (
              <div key={word} className={`flex aspect-square items-center justify-center rounded-[2rem] bg-white p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ${rotation}`}>
                <span style={{ color }} className="text-3xl font-black tracking-tight sm:text-4xl">{word}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-200 py-5">
          <p className="text-sm font-semibold text-slate-600">Your best: <span className="font-black text-slate-950">{bestScore}</span></p>
          <Link href="/how-to-play" className="text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-blue-700">
            How to play
          </Link>
        </footer>
      </div>
    </main>
  )
}
