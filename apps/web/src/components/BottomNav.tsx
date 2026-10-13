"use client"

import Link from "next/link"
import { motion } from "framer-motion"

interface BottomNavProps {
  active: "home" | "play" | "leaderboard" | "profile" | "how-to-play"
}

export default function BottomNav({ active }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "Home", href: "/", icon: "🏠" },
    { id: "play", label: "Play", href: "/play", icon: "🎮" },
    { id: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: "🏆" },
    { id: "profile", label: "Profile", href: "/profile", icon: "👤" },
    { id: "how-to-play", label: "How to play", href: "/how-to-play", icon: "🧠" },
  ]

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-slate-200 backdrop-blur-xl z-50 shadow-[0_-10px_30px_rgba(37,99,235,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-3 transition-colors ${
                active === tab.id ? "text-blue-600" : "text-slate-500"
              }`}
            >
              <span className="text-xl mb-1">{tab.icon}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase">{tab.label}</span>
            </motion.button>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

