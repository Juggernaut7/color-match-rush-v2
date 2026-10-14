import { NextResponse } from "next/server"
import { getScoresCollection, MongoConfigurationError } from "@/lib/server/mongodb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const scores = await getScoresCollection()
    const records = await scores.find(
      {},
      { projection: { _id: 0, playerId: 1, score: 1, correct: 1, mistakes: 1, playedAt: 1 } },
    ).sort({ score: -1, correct: -1, playedAt: 1 }).limit(25).toArray()

    return NextResponse.json({
      entries: records.map((record, index) => ({
        rank: index + 1,
        player: `Player ${index + 1}`,
        score: record.score,
        correct: record.correct,
        mistakes: record.mistakes,
        playedAt: record.playedAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof MongoConfigurationError) {
      return NextResponse.json(
        { error: "The shared leaderboard is not configured yet." },
        { status: 503 },
      )
    }
    console.error("Leaderboard database request failed:", error instanceof Error ? error.name : "UnknownError")
    return NextResponse.json(
      { error: "The shared leaderboard is temporarily unavailable." },
      { status: 503 },
    )
  }
}
