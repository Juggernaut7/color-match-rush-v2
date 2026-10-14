import "server-only"

import { MongoClient, type Collection } from "mongodb"

export type ScoreRecord = {
  submissionId: string
  playerId: string
  score: number
  correct: number
  mistakes: number
  playedAt: Date
}

type MongoCache = typeof globalThis & {
  colorMatchMongoClient?: MongoClient
  colorMatchMongoClientPromise?: Promise<MongoClient>
  colorMatchMongoIndexesPromise?: Promise<void>
}

const mongoCache = globalThis as MongoCache

export class MongoConfigurationError extends Error {}

export async function getScoresCollection(): Promise<Collection<ScoreRecord>> {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    throw new MongoConfigurationError("MONGODB_URI is not configured.")
  }
  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    throw new MongoConfigurationError("MONGODB_URI must use the mongodb:// or mongodb+srv:// scheme.")
  }

  if (!mongoCache.colorMatchMongoClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 5,
    })
    mongoCache.colorMatchMongoClient = client
    mongoCache.colorMatchMongoClientPromise = client.connect().catch((error: unknown) => {
      mongoCache.colorMatchMongoClient = undefined
      mongoCache.colorMatchMongoClientPromise = undefined
      throw error
    })
  }

  const client = await mongoCache.colorMatchMongoClientPromise
  const collection = client.db().collection<ScoreRecord>("scores")

  if (!mongoCache.colorMatchMongoIndexesPromise) {
    mongoCache.colorMatchMongoIndexesPromise = Promise.all([
      collection.createIndex({ submissionId: 1 }, { unique: true }),
      collection.createIndex({ playerId: 1, playedAt: -1 }),
      collection.createIndex({ score: -1, correct: -1, playedAt: 1 }),
    ]).then(() => undefined).catch((error: unknown) => {
      mongoCache.colorMatchMongoIndexesPromise = undefined
      throw error
    })
  }

  await mongoCache.colorMatchMongoIndexesPromise
  return collection
}
