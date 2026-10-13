"use client"

import { useState } from "react"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { arcMainnet } from "@/lib/web3/arc"

export default function WalletButton() {
  const { address, chainId, isConnected } = useAccount()
  const { connectAsync, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
  const [error, setError] = useState("")

  const handleClick = async () => {
    setError("")
    try {
      if (!isConnected) {
        const connector = connectors[0]
        if (!connector) {
          throw new Error("No injected wallet was found. Install MetaMask or another EVM wallet.")
        }
        await connectAsync({ connector })
      } else if (chainId !== arcMainnet.id) {
        await switchChainAsync({ chainId: arcMainnet.id })
      } else {
        disconnect()
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Wallet action failed.")
    }
  }

  const label = isConnecting
    ? "Connecting..."
    : isSwitching
      ? "Switching..."
      : !isConnected
        ? "Connect wallet"
        : chainId !== arcMainnet.id
          ? "Switch to Arc"
          : `${address?.slice(0, 6)}...${address?.slice(-4)}`

  return (
    <div className="absolute right-4 top-4 z-50 flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isConnecting || isSwitching}
        className="rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 shadow-sm backdrop-blur-sm disabled:opacity-60"
      >
        {label}
      </button>
      {error && <span role="alert" className="max-w-56 rounded bg-white px-2 py-1 text-xs text-rose-700 shadow">{error}</span>}
    </div>
  )
}
