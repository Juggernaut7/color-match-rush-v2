/**
 * @typedef {{ name: string, hex: string }} ColorOption
 */

/**
 * @typedef {{ wordName: string, wordColor: string, options: ColorOption[] }} GameQuestion
 */

/** @type {ColorOption[]} */
export const COLOR_SET = [
  { name: "RED", hex: "#DC2626" },
  { name: "GREEN", hex: "#15803D" },
  { name: "BLUE", hex: "#2563EB" },
  { name: "YELLOW", hex: "#A16207" },
  { name: "ORANGE", hex: "#C2410C" },
  { name: "PURPLE", hex: "#7E22CE" },
  { name: "PINK", hex: "#BE185D" },
  { name: "CYAN", hex: "#0E7490" },
]

/**
 * @param {() => number} random
 */
function shuffleColors(random) {
  const shuffled = [...COLOR_SET]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  return shuffled
}

/**
 * @param {() => number} [random]
 * @returns {GameQuestion}
 */
export function generateQuestion(random = Math.random) {
  const shuffled = shuffleColors(random)
  const word = shuffled[0]
  const distractor = shuffled[1]

  return {
    wordName: word.name,
    wordColor: distractor.hex,
    options: shuffleColors(random),
  }
}
