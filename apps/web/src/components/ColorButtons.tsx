"use client"

interface Color { name: string; hex: string }

interface ColorButtonsProps {
  options: Color[]
  onSelect: (colorName: string) => void
  disabled: boolean
}

export default function ColorButtons({ options, onSelect, disabled }: ColorButtonsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.name}
          type="button"
          onClick={() => onSelect(option.name)}
          disabled={disabled}
          style={{ borderColor: option.hex, color: option.hex }}
          className="flex min-h-[62px] items-center justify-center gap-2 rounded-2xl border-2 bg-white px-3 py-3 text-base font-extrabold tracking-wide shadow-sm transition active:scale-[0.98] hover:bg-slate-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[68px] sm:text-lg"
          aria-label={`Select ${option.name}`}
        >
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: option.hex }} />
          {option.name}
        </button>
      ))}
    </div>
  )
}
