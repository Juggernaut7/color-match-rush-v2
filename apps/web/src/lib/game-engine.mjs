/**
 * @typedef {{ score: number, correct: number, mistakes: number }} RoundStats
 */

/**
 * @param {RoundStats} stats
 * @param {boolean} isCorrect
 * @returns {RoundStats}
 */
export function scoreAnswer(stats, isCorrect) {
  return {
    score: isCorrect ? stats.score + 1 : Math.max(0, stats.score - 1),
    correct: stats.correct + Number(isCorrect),
    mistakes: stats.mistakes + Number(!isCorrect),
  }
}

/**
 * @param {number} deadline
 * @param {number} now
 */
export function secondsRemaining(deadline, now) {
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

/**
 * @param {{ deadline: number, now: number, alreadyAnswered: boolean, finished: boolean }} state
 */
export function canAcceptAnswer({ deadline, now, alreadyAnswered, finished }) {
  return !alreadyAnswered && !finished && now < deadline
}
