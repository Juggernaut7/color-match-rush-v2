"use client"

import { motion } from "framer-motion"

interface Color { name: string; hex: string }

interface ColorButtonsProps {
  options: Color[]
  onSelect: (colorName: string) => void
  disabled: boolean
}

export default function ColorButtons({ options, onSelect, disabled }: ColorButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
      {options.map((option) => (
        <motion.button
          key={`${option.name}-${option.hex}`}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(option.name)}
          disabled={disabled}
          style={{ backgroundColor: option.hex }}
          className="rounded-2xl border border-white/40 px-3 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.12)] text-white font-black text-lg tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[72px]"
          aria-label={`Select ${option.name}`}
        >
          {option.name}
        </motion.button>
      ))}
    </div>
  )
}

