"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import BottomNav from "@/components/BottomNav"
import WalletButton from "@/components/WalletButton"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <WalletButton />

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 pb-28 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl rounded-[2rem] border border-blue-100 bg-white/80 p-6 shadow-[0_25px_70px_rgba(37,99,235,0.08)] backdrop-blur-sm md:p-10"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Play free or compete on Arc</p>
              <h1 className="mt-3 text-4xl font-black text-slate-900 md:text-6xl">Color Match Rush</h1>
            </div>
            <div className="rounded-full bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200">Free</div>
          </div>

          <p className="max-w-2xl text-lg text-slate-600 md:text-xl">
            A mobile-first Stroop reaction game: practice for free, or enter an optional Arc Mainnet competition using native USDC.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-2xl">⚡</div>
              <div className="text-lg font-bold text-slate-900">30s rounds</div>
              <p className="mt-1 text-sm text-slate-500">Fast, focused reaction loops</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-2xl">🎯</div>
              <div className="text-lg font-bold text-slate-900">Stroop challenge</div>
              <p className="mt-1 text-sm text-slate-500">Answer by the word, not the ink</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-2xl">🏁</div>
              <div className="text-lg font-bold text-slate-900">Arc competitions</div>
              <p className="mt-1 text-sm text-slate-500">Optional native-USDC entry and on-chain prize payouts</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/play" className="flex-1 rounded-2xl bg-blue-600 px-5 py-4 text-center text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500">
              Start free play
            </Link>
            <Link href="/how-to-play" className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-base font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-600">
              How to play
            </Link>
          </div>
        </motion.div>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
