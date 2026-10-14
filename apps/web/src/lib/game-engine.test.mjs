import assert from "node:assert/strict"
import test from "node:test"
import { canAcceptAnswer, scoreAnswer, secondsRemaining } from "./game-engine.mjs"
import { COLOR_SET, generateQuestion } from "./game-questions.mjs"

test("correct answers add one point and increment correct count", () => {
  assert.deepEqual(scoreAnswer({ score: 2, correct: 3, mistakes: 1 }, true), {
    score: 3,
    correct: 4,
    mistakes: 1,
  })
})

test("incorrect answers subtract one point without crossing zero", () => {
  assert.deepEqual(scoreAnswer({ score: 1, correct: 1, mistakes: 0 }, false), {
    score: 0,
    correct: 1,
    mistakes: 1,
  })
  assert.equal(scoreAnswer({ score: 0, correct: 0, mistakes: 4 }, false).score, 0)
})

test("one challenge accepts only one answer, and never after finish or deadline", () => {
  const beforeDeadline = { deadline: 30_000, now: 29_999, alreadyAnswered: false, finished: false }
  assert.equal(canAcceptAnswer(beforeDeadline), true)
  assert.equal(canAcceptAnswer({ ...beforeDeadline, alreadyAnswered: true }), false)
  assert.equal(canAcceptAnswer({ ...beforeDeadline, finished: true }), false)
  assert.equal(canAcceptAnswer({ ...beforeDeadline, now: 30_000 }), false)
})

test("countdown is derived from the round deadline and clamps at zero", () => {
  assert.equal(secondsRemaining(30_000, 0), 30)
  assert.equal(secondsRemaining(30_000, 29_001), 1)
  assert.equal(secondsRemaining(30_000, 30_000), 0)
  assert.equal(secondsRemaining(30_000, 35_000), 0)
})

test("generated challenges have eight unique answers and mismatched prompt ink", () => {
  const question = generateQuestion(() => 0.5)
  assert.equal(question.options.length, 8)
  assert.deepEqual(new Set(question.options.map(({ name }) => name)), new Set(COLOR_SET.map(({ name }) => name)))
  assert.notEqual(question.wordColor, COLOR_SET.find(({ name }) => name === question.wordName)?.hex)
})
