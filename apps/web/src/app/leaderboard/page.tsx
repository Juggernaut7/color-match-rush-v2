"use client"

import { useCallback, useEffect, useState } from "react"
import { formatEther } from "viem"
import { usePublicClient } from "wagmi"
import BottomNav from "@/components/BottomNav"
import WalletButton from "@/components/WalletButton"
import { arcMainnet, arcTreasuryAbi, getArcTreasuryAddress, type TreasuryRound } from "@/lib/web3/arc"

type SettledRound = {
  roundId: bigint
  round: TreasuryRound
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function LeaderboardPage() {
  const publicClient = usePublicClient({ chainId: arcMainnet.id })
  const treasuryAddress = getArcTreasuryAddress()
  const [latestRoundId, setLatestRoundId] = useState<bigint>(0n)
  const [currentRound, setCurrentRound] = useState<TreasuryRound | null>(null)
  const [participants, setParticipants] = useState<string[]>([])
  const [settledRounds, setSettledRounds] = useState<SettledRound[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const loadResults = useCallback(async () => {
    if (!publicClient || !treasuryAddress) return
    setLoading(true)
    setError("")
    try {
      const currentId = await publicClient.readContract({
        address: treasuryAddress,
        abi: arcTreasuryAbi,
        functionName: "currentRoundId",
      })
      setLatestRoundId(currentId)
      if (currentId === 0n) {
        setCurrentRound(null)
        setParticipants([])
        setSettledRounds([])
        return
      }

      const firstRoundId = currentId > 9n ? currentId - 9n : 1n
      const roundIds = Array.from(
        { length: Number(currentId - firstRoundId + 1n) },
        (_, index) => firstRoundId + BigInt(index),
      )
      const rounds = await Promise.all(roundIds.map(async (roundId) => ({
        roundId,
        round: await publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "getRound",
          args: [roundId],
        }) as TreasuryRound,
      })))
      const newest = rounds[rounds.length - 1]
      setCurrentRound(newest.round)
      setSettledRounds(rounds.filter(({ round }) => round.status === 2).reverse())

      if (newest.round.status === 1) {
        const page = await publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "getRoundParticipants",
          args: [currentId, 0n, 50n],
        })
        setParticipants([...page])
      } else {
        setParticipants([])
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not read Arc competition results.")
    } finally {
      setLoading(false)
    }
  }, [publicClient, treasuryAddress])

  useEffect(() => {
    void loadResults()
    const interval = window.setInterval(loadResults, 30_000)
    return () => window.clearInterval(interval)
  }, [loadResults])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_35%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] text-slate-900">
      <WalletButton />

      <div className="mx-auto max-w-3xl px-4 pb-28 pt-20">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Arc Mainnet</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">Competition results</h1>
            <p className="mt-2 text-sm text-slate-500">Finalized winners and payouts are read directly from the Arc contract.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadResults()}
            disabled={loading}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {!treasuryAddress && (
          <p role="status" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Arc results are unavailable until the deployed contract address is configured. Free practice scores remain on this device only.
          </p>
        )}
        {error && <p role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}

        {treasuryAddress && currentRound && (
          <section className="mb-8 rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Latest round · #{latestRoundId.toString()}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Status</p>
                <p className="mt-1 font-bold">{currentRound.status === 1 ? "Open / awaiting settlement" : currentRound.status === 2 ? "Settled" : currentRound.status === 3 ? "Cancelled" : "Not created"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Entrants</p>
                <p className="mt-1 font-bold">{currentRound.playerCount.toString()}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Pool / remaining</p>
                <p className="mt-1 font-bold">{formatEther(currentRound.totalPool)} USDC</p>
              </div>
            </div>

            {participants.length > 0 && (
              <div className="mt-5">
                <h2 className="font-bold">On-chain participants</h2>
                {BigInt(participants.length) < currentRound.playerCount && (
                  <p className="mt-1 text-xs text-slate-500">Showing the first {participants.length} of {currentRound.playerCount.toString()} participants.</p>
                )}
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {participants.map((address) => (
                    <li key={address} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm">{shortAddress(address)}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {treasuryAddress && settledRounds.length === 0 && !error && (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">🏁</div>
            <h2 className="mt-4 text-2xl font-black">No finalized payouts yet</h2>
            <p className="mt-2 text-slate-500">After a round ends, the operator selects three entrants and the contract records the winners and transfers their shares.</p>
          </section>
        )}

        <div className="space-y-5">
          {settledRounds.map(({ roundId, round }) => (
            <section key={roundId.toString()} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">Round #{roundId.toString()}</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-800">Settled on Arc</span>
              </div>
              <p className="mb-4 text-sm text-slate-500">{round.playerCount.toString()} entrants · total pool {formatEther(round.prizes.reduce((sum, prize) => sum + prize, 0n))} USDC paid</p>
              <ol className="space-y-2">
                {round.winners.map((winner, index) => (
                  <li key={winner} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <span className="font-mono text-sm">{["🥇", "🥈", "🥉"][index]} {shortAddress(winner)}</span>
                    <span className="font-bold">{formatEther(round.prizes[index])} USDC</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          The game keeps inputs and scores off-chain. The operator, not a verifiable scoring system, selects the winning entrants. The contract enforces that winners entered, are distinct, and receive the published 50% / 30% / 20% shares. This leaderboard shows only contract-finalized payouts, never claimed game scores.
        </p>
      </div>

      <BottomNav active="leaderboard" />
    </div>
  )
}
