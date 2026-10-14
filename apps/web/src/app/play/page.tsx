"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PlayPage() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f6f1] px-5 py-8 text-slate-950 sm:items-center sm:justify-center sm:px-8">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-blue-700">← Back</Link>
        <p className="mt-10 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-700">Ready, player?</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Beat the 30-second clock.</h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          Select the color named by the word—not the color used to display it. Right answers add a point; wrong answers take one away.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/game")}
            className="min-h-14 flex-1 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Start round
          </button>
          <Link href="/leaderboard" className="inline-flex min-h-14 items-center justify-center rounded-2xl px-5 py-4 font-bold text-slate-700 hover:bg-slate-50">
            🏆 Scores
          </Link>
        </div>
      </div>
    </main>
  )
}
