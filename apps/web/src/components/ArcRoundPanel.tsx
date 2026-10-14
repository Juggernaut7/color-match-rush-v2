"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  isAddress,
  type Address,
  type Hash,
} from "viem"
import {
  arcMainnet,
  arcTreasuryAbi,
  getArcTreasuryAddress,
} from "@/lib/web3/arc"

type Eip1193Provider = {
  request: (args: { method: string; params?: readonly unknown[] }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

type RoundSnapshot = {
  id: bigint
  entryFee: bigint
  round: {
    startsAt: bigint
    endsAt: bigint
    totalPool: bigint
    playerCount: bigint
    status: number
    winners: readonly Address[]
    prizes: readonly bigint[]
  }
  acceptingEntries: boolean
  hasJoined: boolean
  canRefund: boolean
}

const publicClient = createPublicClient({
  chain: arcMainnet,
  transport: http(),
})

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return error.code
  }
  return undefined
}

function parseChainId(value: unknown) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return null
  return Number.parseInt(value.slice(2), 16)
}

async function requireArcAccount(provider: Eip1193Provider, expectedAddress: Address) {
  const [chain, accounts] = await Promise.all([
    provider.request({ method: "eth_chainId" }),
    provider.request({ method: "eth_accounts" }),
  ])
  if (parseChainId(chain) !== arcMainnet.id) {
    throw new Error("Your wallet is no longer on Arc Mainnet. Switch networks and try again.")
  }
  const stillSelected =
    Array.isArray(accounts) &&
    accounts.some(
      (account) =>
        typeof account === "string" &&
        isAddress(account) &&
        account.toLowerCase() === expectedAddress.toLowerCase(),
    )
  if (!stillSelected) {
    throw new Error("The wallet account changed. Reconnect the intended account and try again.")
  }
}

export default function ArcRoundPanel() {
  const [walletAddress, setWalletAddress] = useState<Address | null>(null)
  const [walletChainId, setWalletChainId] = useState<number | null>(null)
  const [roundSnapshot, setRoundSnapshot] = useState<RoundSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWalletBusy, setIsWalletBusy] = useState(false)
  const [isTransactionPending, setIsTransactionPending] = useState(false)
  const [isReviewingEntry, setIsReviewingEntry] = useState(false)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [notice, setNotice] = useState("")
  const [transactionHash, setTransactionHash] = useState<Hash | null>(null)
  const loadRequestRef = useRef(0)

  const loadRound = useCallback(async () => {
    const requestId = ++loadRequestRef.current
    setIsLoading(true)
    setError("")
    try {
      const treasuryAddress = getArcTreasuryAddress()
      const [chainId, code] = await Promise.all([
        publicClient.getChainId(),
        publicClient.getCode({ address: treasuryAddress }),
      ])
      if (chainId !== arcMainnet.id) {
        throw new Error(`Arc RPC returned chain ID ${chainId}, expected ${arcMainnet.id}.`)
      }
      if (!code || code === "0x") {
        throw new Error("No contract bytecode exists at the configured Arc treasury address.")
      }

      const [entryFee, id] = await Promise.all([
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
      if (id === 0n) {
        if (loadRequestRef.current === requestId) setRoundSnapshot(null)
        return
      }

      const [round, acceptingEntries] = await Promise.all([
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "getRound",
          args: [id],
        }),
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "isRoundOpen",
          args: [id],
        }),
      ])
      let hasJoined = false
      let canRefund = false
      if (walletAddress) {
        const [joined, refunded] = await Promise.all([
          publicClient.readContract({
            address: treasuryAddress,
            abi: arcTreasuryAbi,
            functionName: "hasJoined",
            args: [id, walletAddress],
          }),
          publicClient.readContract({
            address: treasuryAddress,
            abi: arcTreasuryAbi,
            functionName: "hasRefunded",
            args: [id, walletAddress],
          }),
        ])
        hasJoined = joined
        canRefund = round.status === 3 && joined && !refunded
      }
      if (loadRequestRef.current === requestId) {
        setRoundSnapshot({ id, entryFee, round, acceptingEntries, hasJoined, canRefund })
      }
    } catch (caughtError) {
      if (loadRequestRef.current === requestId) {
        setRoundSnapshot(null)
        setError(errorMessage(caughtError, "Could not read the Arc treasury."))
      }
    } finally {
      if (loadRequestRef.current === requestId) setIsLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    void loadRound()
    const interval = window.setInterval(() => void loadRound(), 15_000)
    return () => {
      window.clearInterval(interval)
      loadRequestRef.current += 1
    }
  }, [loadRound])

  const readWallet = useCallback(async (provider: Eip1193Provider) => {
    const [accounts, chain] = await Promise.all([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" }),
    ])
    const account = Array.isArray(accounts)
      ? accounts.find((value): value is Address => typeof value === "string" && isAddress(value))
      : undefined
    setWalletAddress(account ?? null)
    setWalletChainId(parseChainId(chain))
  }, [])

  useEffect(() => {
    const provider = window.ethereum
    if (!provider) return

    const onAccountsChanged = (accounts: unknown) => {
      const account = Array.isArray(accounts)
        ? accounts.find((value): value is Address => typeof value === "string" && isAddress(value))
        : undefined
      setWalletAddress(account ?? null)
    }
    const onChainChanged = (chain: unknown) => setWalletChainId(parseChainId(chain))

    void readWallet(provider).catch((caughtError: unknown) => {
      setActionError(errorMessage(caughtError, "Could not check the connected wallet."))
    })
    provider.on?.("accountsChanged", onAccountsChanged)
    provider.on?.("chainChanged", onChainChanged)
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged)
      provider.removeListener?.("chainChanged", onChainChanged)
    }
  }, [readWallet])

  const connectWallet = async () => {
    setActionError("")
    setNotice("")
    const provider = window.ethereum
    if (!provider) {
      setActionError("No browser wallet was found. Install an EVM wallet such as MetaMask or Rabby.")
      return
    }

    setIsWalletBusy(true)
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" })
      const account = Array.isArray(accounts)
        ? accounts.find((value): value is Address => typeof value === "string" && isAddress(value))
        : undefined
      if (!account) throw new Error("The wallet did not return a valid account.")
      setWalletAddress(account)
      const chain = await provider.request({ method: "eth_chainId" })
      setWalletChainId(parseChainId(chain))
    } catch (caughtError) {
      setActionError(errorMessage(caughtError, "Wallet connection was not completed."))
    } finally {
      setIsWalletBusy(false)
    }
  }

  const switchToArc = async () => {
    const provider = window.ethereum
    if (!provider) {
      setActionError("No browser wallet was found. Install an EVM wallet to switch networks.")
      return
    }

    setActionError("")
    setNotice("")
    setTransactionHash(null)
    setIsWalletBusy(true)
    try {
      const switchNetwork = () =>
        provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13b2" }],
        })
      try {
        await switchNetwork()
      } catch (caughtError) {
        if (getErrorCode(caughtError) !== 4902) throw caughtError
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x13b2",
              chainName: "Arc Mainnet",
              nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
              rpcUrls: ["https://rpc.mainnet.arc.io"],
              blockExplorerUrls: ["https://explorer.arc.io"],
            },
          ],
        })
        await switchNetwork()
      }
      const chain = await provider.request({ method: "eth_chainId" })
      const chainId = parseChainId(chain)
      setWalletChainId(chainId)
      if (chainId !== arcMainnet.id) throw new Error("The wallet did not switch to Arc Mainnet.")
      setNotice("Wallet is connected to Arc Mainnet.")
    } catch (caughtError) {
      setActionError(errorMessage(caughtError, "Could not switch the wallet to Arc Mainnet."))
    } finally {
      setIsWalletBusy(false)
    }
  }

  const submitJoin = async () => {
    if (!roundSnapshot || !walletAddress || walletChainId !== arcMainnet.id) {
      setActionError("Connect a wallet and switch it to Arc Mainnet before joining.")
      return
    }

    setActionError("")
    setNotice("")
    setTransactionHash(null)
    setIsTransactionPending(true)
    try {
      const treasuryAddress = getArcTreasuryAddress()
      const [isOpen, alreadyJoined, currentFee] = await Promise.all([
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "isRoundOpen",
          args: [roundSnapshot.id],
        }),
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "hasJoined",
          args: [roundSnapshot.id, walletAddress],
        }),
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "entryFee",
        }),
      ])
      if (!isOpen) throw new Error("This round is no longer accepting entries. Refresh the round status.")
      if (alreadyJoined) throw new Error("This wallet has already entered this round.")
      if (currentFee !== roundSnapshot.entryFee) {
        throw new Error("The entry fee changed. Refresh the round information before continuing.")
      }
      const provider = window.ethereum
      if (!provider) throw new Error("The connected browser wallet is no longer available.")
      await requireArcAccount(provider, walletAddress)

      const walletClient = createWalletClient({
        account: walletAddress,
        chain: arcMainnet,
        transport: custom(provider),
      })
      setNotice("Confirm the entry payment in your wallet. No transaction has been sent yet.")
      const hash = await walletClient.writeContract({
        address: treasuryAddress,
        abi: arcTreasuryAbi,
        functionName: "joinRound",
        args: [roundSnapshot.id],
        value: currentFee,
      })
      setTransactionHash(hash)
      setNotice(`Entry transaction submitted (${hash}). Waiting for Arc confirmation…`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== "success") throw new Error("The entry transaction failed on Arc.")
      const joined = await publicClient.readContract({
        address: treasuryAddress,
        abi: arcTreasuryAbi,
        functionName: "hasJoined",
        args: [roundSnapshot.id, walletAddress],
      })
      if (!joined) throw new Error("The transaction succeeded, but the contract does not show this wallet as entered.")
      setIsReviewingEntry(false)
      setNotice(`Entry confirmed on Arc Mainnet. Transaction: ${hash}`)
      await loadRound()
    } catch (caughtError) {
      setActionError(errorMessage(caughtError, "Could not enter the Arc round."))
      setNotice("")
    } finally {
      setIsTransactionPending(false)
    }
  }

  const claimRefund = async () => {
    if (!roundSnapshot || !walletAddress || walletChainId !== arcMainnet.id) {
      setActionError("Connect a wallet and switch it to Arc Mainnet before claiming a refund.")
      return
    }

    setActionError("")
    setNotice("")
    setTransactionHash(null)
    setIsTransactionPending(true)
    try {
      const treasuryAddress = getArcTreasuryAddress()
      const provider = window.ethereum
      if (!provider) throw new Error("The connected browser wallet is no longer available.")
      await requireArcAccount(provider, walletAddress)
      const [round, joined, refunded] = await Promise.all([
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "getRound",
          args: [roundSnapshot.id],
        }),
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "hasJoined",
          args: [roundSnapshot.id, walletAddress],
        }),
        publicClient.readContract({
          address: treasuryAddress,
          abi: arcTreasuryAbi,
          functionName: "hasRefunded",
          args: [roundSnapshot.id, walletAddress],
        }),
      ])
      if (round.status !== 3 || !joined || refunded) {
        throw new Error("This round no longer has an unclaimed refund for the connected wallet.")
      }
      const walletClient = createWalletClient({
        account: walletAddress,
        chain: arcMainnet,
        transport: custom(provider),
      })
      const hash = await walletClient.writeContract({
        address: treasuryAddress,
        abi: arcTreasuryAbi,
        functionName: "refundEntry",
        args: [roundSnapshot.id],
      })
      setTransactionHash(hash)
      setNotice(`Refund transaction submitted (${hash}). Waiting for Arc confirmation…`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== "success") throw new Error("The refund transaction failed on Arc.")
      setNotice(`Refund confirmed on Arc Mainnet. Transaction: ${hash}`)
      await loadRound()
    } catch (caughtError) {
      setActionError(errorMessage(caughtError, "Could not claim the refund."))
      setNotice("")
    } finally {
      setIsTransactionPending(false)
    }
  }

  const forgetWallet = () => {
    setWalletAddress(null)
    setNotice("Wallet disconnected from this app. The wallet itself may still authorize this site.")
  }

  const statusLabel = (snapshot: RoundSnapshot) => {
    if (snapshot.round.status === 2) return "Settled"
    if (snapshot.round.status === 3) return "Cancelled"
    if (snapshot.round.status === 1 && snapshot.acceptingEntries) return "Entries open"
    if (snapshot.round.status === 1) return "Entry window ended — awaiting operator action"
    return "Unavailable"
  }

  return (
    <section className="mt-8 rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="arc-round-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">Optional · Arc Mainnet</p>
          <h2 id="arc-round-heading" className="mt-2 text-2xl font-black text-slate-950">On-chain round</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Practice is always free and independent of this contract. Arc reads show the real round and entrant state; game answers and scores are never sent on-chain.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!walletAddress ? (
            <button
              type="button"
              onClick={connectWallet}
              disabled={isWalletBusy}
              className="min-h-11 rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-60"
            >
              {isWalletBusy ? "Connecting…" : "Connect wallet"}
            </button>
          ) : (
            <>
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </span>
              {walletChainId !== arcMainnet.id && (
                <button
                  type="button"
                  onClick={switchToArc}
                  disabled={isWalletBusy}
                  className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {isWalletBusy ? "Switching…" : "Switch to Arc"}
                </button>
              )}
              <button
                type="button"
                onClick={forgetWallet}
                className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
              >
                Forget
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
        {isLoading && <p role="status" className="text-slate-600">Reading current round from Arc RPC…</p>}
        {!isLoading && error && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="break-words text-rose-700">{error}</p>
            <button type="button" onClick={() => void loadRound()} className="rounded-lg px-3 py-2 font-bold text-blue-700 hover:bg-blue-100">
              Retry
            </button>
          </div>
        )}
        {!isLoading && !error && !roundSnapshot && (
          <p className="text-slate-600">The treasury has no round yet. Free practice is ready below.</p>
        )}
        {!isLoading && !error && roundSnapshot && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-slate-700">Round <strong>#{roundSnapshot.id.toString()}</strong> · {statusLabel(roundSnapshot)}</p>
              <p className="text-slate-700">Entrants <strong>{roundSnapshot.round.playerCount.toString()}</strong></p>
              <p className="text-slate-700">Pool <strong>{formatUnits(roundSnapshot.round.totalPool, 18)} USDC</strong></p>
              <p className="text-slate-700">Entry fee <strong>{formatUnits(roundSnapshot.entryFee, 18)} native USDC</strong></p>
              <p className="text-slate-700 sm:col-span-2">
                Round end: <strong>{new Date(Number(roundSnapshot.round.endsAt) * 1000).toLocaleString()}</strong>
              </p>
              {roundSnapshot.round.status === 2 && (
                <div className="sm:col-span-2">
                  <p className="font-bold text-slate-800">Operator-selected winners and on-chain payouts</p>
                  {roundSnapshot.round.winners.map((winner, index) => (
                    <p key={winner} className="mt-1 break-all text-slate-600">
                      {index + 1}. {winner} · {formatUnits(roundSnapshot.round.prizes[index] ?? 0n, 18)} USDC
                    </p>
                  ))}
                </div>
              )}
            </div>

            {roundSnapshot.acceptingEntries && walletAddress && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                {roundSnapshot.hasJoined ? (
                  <p className="font-bold text-emerald-800">This wallet is recorded as an entrant.</p>
                ) : walletChainId !== arcMainnet.id ? (
                  <p className="text-slate-600">Switch your wallet to Arc Mainnet to see entry options.</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsReviewingEntry(true)}
                      disabled={isTransactionPending}
                      className="min-h-12 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                      Review paid entry · {formatUnits(roundSnapshot.entryFee, 18)} USDC
                    </button>
                    {isReviewingEntry && (
                      <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                        <p className="font-bold text-amber-950">Before you continue</p>
                        <p className="mt-1 text-sm leading-relaxed text-amber-900">
                          This sends {formatUnits(roundSnapshot.entryFee, 18)} native USDC to the treasury. The game does not submit a score; the operator selects winners from entrants. Selection is not trustless, and the contract enforces only entrant eligibility and the 50% / 30% / 20% payout split. Arc also charges USDC gas.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void submitJoin()}
                            disabled={isTransactionPending}
                            className="min-h-11 rounded-lg bg-amber-800 px-4 py-2 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-60"
                          >
                            {isTransactionPending ? "Waiting for wallet…" : "Continue to wallet"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsReviewingEntry(false)}
                            disabled={isTransactionPending}
                            className="min-h-11 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 hover:bg-amber-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {roundSnapshot.canRefund && walletAddress && (
              <button
                type="button"
                onClick={() => void claimRefund()}
                disabled={isTransactionPending || walletChainId !== arcMainnet.id}
                className="mt-4 min-h-11 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 disabled:opacity-60"
              >
                {isTransactionPending ? "Waiting for wallet…" : "Claim on-chain USDC refund"}
              </button>
            )}
          </>
        )}
      </div>

      {notice && <p role="status" className="mt-3 break-words text-sm text-emerald-800">{notice}</p>}
      {transactionHash && (
        <a
          className="mt-2 inline-block break-all text-sm font-bold text-blue-700 underline"
          href={`https://explorer.arc.io/tx/${transactionHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction on Arc Explorer
        </a>
      )}
      {actionError && <p role="alert" className="mt-3 break-words text-sm text-rose-700">{actionError}</p>}
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        This existing treasury uses Arc native USDC as transaction value and gas (18 decimals), not ERC-20 transfers. Its operator controls round creation, cancellation, and winner selection. Read contract <a className="font-bold underline" href="https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834" target="_blank" rel="noreferrer">on Arc Explorer</a>.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void loadRound()}
          disabled={isLoading || isTransactionPending}
          className="rounded-lg px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        >
          {isLoading ? "Refreshing…" : "Refresh Arc data"}
        </button>
        <span className="text-xs font-semibold text-slate-500">Arc Mainnet · chain ID 5042</span>
      </div>
    </section>
  )
}
