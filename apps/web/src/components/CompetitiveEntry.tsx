"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatEther, parseEther } from "viem"
import { useAccount, useConnect, usePublicClient, useSwitchChain, useWriteContract } from "wagmi"
import { arcMainnet, arcTreasuryAbi, getArcTreasuryAddress, type TreasuryRound } from "@/lib/web3/arc"

type PaidEntry = {
  address: string
  roundId: string
}

export default function CompetitiveEntry() {
  const router = useRouter()
  const { address, chainId, isConnected } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: arcMainnet.id })
  const { writeContractAsync, isPending } = useWriteContract()
  const [entryFee, setEntryFee] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [roundId, setRoundId] = useState<bigint | null>(null)
  const [round, setRound] = useState<TreasuryRound | null>(null)
  const [acceptingEntries, setAcceptingEntries] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [canRefund, setCanRefund] = useState(false)
  const treasuryAddress = getArcTreasuryAddress()

  useEffect(() => {
    if (!treasuryAddress || !publicClient) return
    let active = true
    const loadRound = async () => {
      try {
        const [fee, latestRoundId] = await Promise.all([
          publicClient.readContract({
            address: treasuryAddress,
            abi: arcTreasuryAbi,
            functionName: "entryFee",
          }),
          publicClient.readContract({
            address: treasuryAddress,
            abi: arcTreasuryAbi,
            functionName: "currentRoundId",
          }),
        ])
        if (!active) return
        setEntryFee(formatEther(fee))
        if (latestRoundId === 0n) {
          setRoundId(null)
          setRound(null)
          setAcceptingEntries(false)
          return
        }
        const latestRound = await publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "getRound",
          args: [latestRoundId],
        })
        const isOpen = await publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "isRoundOpen",
          args: [latestRoundId],
        })
        if (active) {
          setRoundId(latestRoundId)
          setRound(latestRound as TreasuryRound)
          setAcceptingEntries(isOpen)
          if (address && latestRound.status === 3) {
            const [joined, refunded] = await Promise.all([
              publicClient.readContract({
                address: treasuryAddress,
                abi: arcTreasuryAbi,
                functionName: "hasJoined",
                args: [latestRoundId, address],
              }),
              publicClient.readContract({
                address: treasuryAddress,
                abi: arcTreasuryAbi,
                functionName: "hasRefunded",
                args: [latestRoundId, address],
              }),
            ])
            if (active) setCanRefund(joined && !refunded)
          } else {
            setCanRefund(false)
          }
        }
      } catch (caughtError) {
        if (active) setError(caughtError instanceof Error ? caughtError.message : "Could not read Arc round state.")
      }
    }
    void loadRound()
    const interval = window.setInterval(loadRound, 15_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [address, publicClient, treasuryAddress])

  const startGame = (entry: PaidEntry) => {
    sessionStorage.setItem("arc-paid-entry", JSON.stringify(entry))
    setStatus("Arc entry confirmed. Starting your 30-second game...")
    router.push("/game")
  }

  const handleEntry = async () => {
    setIsJoining(true)
    setError("")
    setStatus("")

    try {
      if (!treasuryAddress) {
        throw new Error("Arc competition is not configured. Set NEXT_PUBLIC_ARC_TREASURY_ADDRESS after deploying the treasury.")
      }
      if (!isConnected) {
        const connector = connectors[0]
        if (!connector) {
          throw new Error("No injected wallet was found. Install MetaMask or another EVM wallet.")
        }
        await connectAsync({ connector })
        setStatus("Wallet connected. Select the entry button again to join.")
        return
      }
      if (chainId !== arcMainnet.id) {
        await switchChainAsync({ chainId: arcMainnet.id })
        setStatus("Switched to Arc Mainnet. Select the entry button again to join.")
        return
      }
      if (!address || !publicClient) {
        throw new Error("Wallet or Arc RPC is not ready.")
      }

      if (roundId === null || !round) {
        throw new Error("The operator has not created an Arc competition round yet.")
      }
      const [alreadyJoined, isRoundOpen] = await Promise.all([
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "hasJoined",
          args: [roundId, address],
        }),
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "isRoundOpen",
          args: [roundId],
        }),
      ])

      if (!isRoundOpen) {
        throw new Error("The current Arc round is not accepting entries.")
      }
      if (alreadyJoined) {
        throw new Error("This wallet has already entered the current Arc round.")
      }

      setStatus("Confirm the entry transaction in your wallet...")
      const hash = await writeContractAsync({
        address: treasuryAddress,
        abi: arcTreasuryAbi,
        functionName: "joinRound",
        args: [roundId],
        value: parseEther(entryFee ?? "0"),
        chainId: arcMainnet.id,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== "success") {
        throw new Error("The entry transaction did not succeed.")
      }
      const joined = await publicClient.readContract({
        address: treasuryAddress,
        abi: arcTreasuryAbi,
        functionName: "hasJoined",
        args: [roundId, address],
      })
      if (!joined) throw new Error("The entry was confirmed but is not recorded in the contract.")
      startGame({ address, roundId: roundId.toString() })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not join the competition.")
      setStatus("")
    } finally {
      setIsJoining(false)
    }
  }

  const claimRefund = async () => {
    if (!treasuryAddress || !publicClient || !address || roundId === null) return
    setIsRefunding(true)
    setError("")
    try {
      const hash = await writeContractAsync({
        address: treasuryAddress,
        abi: arcTreasuryAbi,
        functionName: "refundEntry",
        args: [roundId],
        chainId: arcMainnet.id,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== "success") throw new Error("Refund transaction failed.")
      setCanRefund(false)
      setStatus("Your Arc-native USDC entry fee was refunded.")
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Refund failed.")
    } finally {
      setIsRefunding(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Arc Mainnet competition</p>
          <p className="mt-1 text-sm text-slate-700">
            Enter with Arc native USDC. Finalists are selected by the round operator; top-three payouts are enforced on-chain.
          </p>
          {entryFee && <p className="mt-2 text-sm font-bold text-slate-900">On-chain entry fee: {entryFee} USDC</p>}
          {roundId !== null && round && (
            <p className="mt-2 text-sm text-slate-700">
              Round #{roundId.toString()} · {round.playerCount.toString()} entrants · Pool {formatEther(round.totalPool)} USDC · {acceptingEntries ? "Entries open" : round.status === 1 ? "Awaiting settlement" : round.status === 2 ? "Settled" : "Cancelled"}
            </p>
          )}
          {roundId === null && !error && (
            <p className="mt-2 text-sm text-slate-600">No Arc round is open yet. Free practice is available below.</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleEntry}
          disabled={isJoining || isPending || (!!treasuryAddress && !entryFee) || !acceptingEntries}
          className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-60"
        >
          {isJoining || isPending ? "Waiting for confirmation..." : "Join Arc competition"}
        </button>
      </div>
      {round?.status === 3 && canRefund && (
        <button
          type="button"
          onClick={claimRefund}
          disabled={isRefunding || isPending}
          className="mt-3 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-900 disabled:opacity-60"
        >
          {isRefunding ? "Claiming refund..." : "Claim Arc USDC refund"}
        </button>
      )}
      {status && <p role="status" className="mt-3 text-sm text-blue-800">{status}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        Game inputs and scores stay in your browser and are not used to determine on-chain winners. The operator selects three entrants; the contract enforces unique entrants, 50% / 30% / 20% payouts, and refunds after cancellation. Operator selection is trusted, not trustless.
      </p>
    </section>
  )
}
