"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/BottomNav"

export default function HowToPlayPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto max-w-4xl px-4 pb-28 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-blue-100 bg-white/80 p-6 shadow-[0_25px_70px_rgba(37,99,235,0.08)] backdrop-blur-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">How to play</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Use the word, not the color</h1>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 text-3xl">1.</div>
              <h2 className="text-xl font-bold text-slate-900">Read the word</h2>
              <p className="mt-2 text-slate-600">The challenge word is the instruction. Ignore the ink color and answer based on the word itself.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 text-3xl">2.</div>
              <h2 className="text-xl font-bold text-slate-900">Choose fast</h2>
              <p className="mt-2 text-slate-600">You have 30 seconds to answer as quickly and accurately as possible. Timing matters.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 text-3xl">3.</div>
              <h2 className="text-xl font-bold text-slate-900">Build your streak</h2>
              <p className="mt-2 text-slate-600">Correct answers add points. Mistakes reduce your run, so stay calm and stay precise.</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Example</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 px-4 py-3 text-2xl font-black text-white">BLUE</div>
              <div className="text-xl text-slate-700">written in orange ink</div>
            </div>
            <p className="mt-3 text-slate-700">The correct response is <span className="font-black text-blue-700">BLUE</span> because the prompt is the word, not the displayed ink.</p>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            Practice is free and requires no wallet. Your score is saved locally and may also be submitted to the shared leaderboard as an anonymous, self-reported result; it is not independently verified or stored on Arc. The app&apos;s Arc integration is read-only, and this app has no payment or prize-payout flow. The legacy on-chain contract may still accept direct payment calls while its round is open; do not send funds to it.
          </div>

          <button
            type="button"
            onClick={() => router.push("/game")}
            className="mt-8 w-full rounded-2xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500"
          >
            Start practice round
          </button>
        </motion.div>
      </div>

      <BottomNav active="how-to-play" />
    </div>
  )
}
