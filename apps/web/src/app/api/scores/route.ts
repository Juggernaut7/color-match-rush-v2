import { NextResponse } from "next/server"
import { getScoresCollection, MongoConfigurationError } from "@/lib/server/mongodb"
import { validateSubmittedScore } from "@/lib/server/score-validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const POST_LIMIT = 12
const POST_WINDOW_MS = 60_000
const postRequests = new Map<string, number[]>()

function getRateLimitKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

function isRateLimited(request: Request) {
  const now = Date.now()
  const key = getRateLimitKey(request)
  const recent = (postRequests.get(key) ?? []).filter((timestamp) => now - timestamp < POST_WINDOW_MS)
  if (recent.length >= POST_LIMIT) {
    postRequests.set(key, recent)
    return true
  }
  recent.push(now)
  postRequests.set(key, recent)
  if (postRequests.size > 1000) {
    for (const [storedKey, timestamps] of postRequests) {
      if (timestamps.every((timestamp) => now - timestamp >= POST_WINDOW_MS)) postRequests.delete(storedKey)
    }
  }
  return false
}

function databaseUnavailable(error: unknown) {
  if (error instanceof MongoConfigurationError) {
    return NextResponse.json(
      { error: "Cloud score storage is not configured." },
      { status: 503 },
    )
  }
  console.error("Score database request failed:", error instanceof Error ? error.name : "UnknownError")
  return NextResponse.json(
    { error: "Score storage is temporarily unavailable." },
    { status: 503 },
  )
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Too many score submissions. Please try again shortly." }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  const submitted = validateSubmittedScore(body)
  if (!submitted) {
    return NextResponse.json({ error: "Score submission is invalid." }, { status: 400 })
  }

  try {
    const scores = await getScoresCollection()
    const result = await scores.updateOne(
      { submissionId: submitted.submissionId },
      {
        $setOnInsert: {
          ...submitted,
          playedAt: new Date(),
        },
      },
      { upsert: true },
    )
    const bestScoreRecord = await scores.findOne(
      { playerId: submitted.playerId },
      { projection: { _id: 0, score: 1 }, sort: { score: -1 } },
    )
    return NextResponse.json({
      saved: true,
      duplicate: result.upsertedCount === 0,
      bestScore: bestScoreRecord?.score ?? 0,
    })
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "number" && error.code === 11000) {
      return NextResponse.json({ saved: true, duplicate: true })
    }
    return databaseUnavailable(error)
  }
}

export async function GET(request: Request) {
  const playerId = new URL(request.url).searchParams.get("playerId")
  if (!playerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId)) {
    return NextResponse.json({ error: "A valid anonymous player ID is required." }, { status: 400 })
  }

  try {
    const scores = await getScoresCollection()
    const [records, bestScoreRecord] = await Promise.all([
      scores.find(
        { playerId },
        { projection: { _id: 0, submissionId: 1, score: 1, correct: 1, mistakes: 1, playedAt: 1 } },
      ).sort({ playedAt: -1 }).limit(25).toArray(),
      scores.findOne({ playerId }, { projection: { _id: 0, score: 1 }, sort: { score: -1 } }),
    ])
    return NextResponse.json({
      records: records.map((record) => ({
        ...record,
        player: "Guest",
        playedAt: record.playedAt.toISOString(),
      })),
      bestScore: bestScoreRecord?.score ?? 0,
    })
  } catch (error) {
    return databaseUnavailable(error)
  }
}
