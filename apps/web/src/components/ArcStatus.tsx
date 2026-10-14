"use client"

import { useCallback, useEffect, useState } from "react"
import { arcMainnet } from "@/lib/web3/arc"

type ArcStatusResponse = {
  chainId: number
  address: string
  codePresent: boolean
}

let inFlightStatusRequest: Promise<ArcStatusResponse> | null = null

function isArcStatusResponse(value: unknown): value is ArcStatusResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "chainId" in value &&
    typeof value.chainId === "number" &&
    "address" in value &&
    typeof value.address === "string" &&
    "codePresent" in value &&
    value.codePresent === true
  )
}

async function requestArcStatus(): Promise<ArcStatusResponse> {
  if (!inFlightStatusRequest) {
    inFlightStatusRequest = (async () => {
      const response = await fetch("/api/arc/status", {
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "Arc connection check failed."
        throw new Error(message)
      }
      if (!isArcStatusResponse(body)) {
        throw new Error("Arc connection check returned an invalid response.")
      }
      return body
    })()
  }

  const request = inFlightStatusRequest
  try {
    return await request
  } finally {
    if (inFlightStatusRequest === request) inFlightStatusRequest = null
  }
}

export default function ArcStatus() {
  const [status, setStatus] = useState<ArcStatusResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const checkConnection = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setStatus(await requestArcStatus())
    } catch (caughtError) {
      setStatus(null)
      setError(caughtError instanceof Error ? caughtError.message : "Arc connection check failed.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void checkConnection()
  }, [checkConnection])

  return (
    <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5" aria-live="polite">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Arc Mainnet · read only</p>
      {loading && <p className="mt-2 text-sm text-slate-700">Checking Arc RPC and deployed contract...</p>}
      {status && (
        <>
          <p className="mt-2 text-sm font-semibold text-emerald-800">
            Connected to chain {status.chainId}; bytecode is present at {status.address.slice(0, 6)}...{status.address.slice(-4)}.
          </p>
          <a
            className="mt-2 inline-block text-sm font-bold text-indigo-700 underline"
            href={`https://explorer.arc.io/address/${status.address}`}
            target="_blank"
            rel="noreferrer"
          >
            View contract on Arc Explorer
          </a>
        </>
      )}
      {error && (
        <div>
          <p role="alert" className="mt-2 text-sm text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => void checkConnection()}
            disabled={loading}
            className="mt-3 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-800 disabled:opacity-60"
          >
            Retry Arc connection
          </button>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        This app performs read-only checks and never submits payment transactions. The legacy contract still has a payable entry method that may accept direct calls while its round is open. Do not send funds to it.
      </p>
      <span className="sr-only">Expected Arc chain ID: {arcMainnet.id}</span>
    </section>
  )
}
