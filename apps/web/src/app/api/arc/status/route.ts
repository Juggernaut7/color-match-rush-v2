import { NextResponse } from "next/server"
import { createPublicClient, http, isAddress } from "viem"
import { arcMainnet } from "@/lib/web3/arc"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const address = process.env.ARC_TREASURY_ADDRESS
  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "Arc contract address is not configured correctly." },
      { status: 503 },
    )
  }

  try {
    const client = createPublicClient({
      chain: arcMainnet,
      transport: http("https://rpc.mainnet.arc.io", {
        retryCount: 2,
        timeout: 8000,
      }),
    })
    const chainId = await client.getChainId()
    if (chainId !== 5042) {
      return NextResponse.json({ error: `Arc RPC returned unexpected chain ID ${chainId}.` }, { status: 502 })
    }

    const bytecode = await client.getCode({ address })
    if (!bytecode || bytecode === "0x") {
      return NextResponse.json({ error: "No contract bytecode exists at the configured Arc address." }, { status: 502 })
    }

    return NextResponse.json(
      {
        chainId,
        address,
        codePresent: true,
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("Arc status request failed:", error instanceof Error ? error.name : "UnknownError")
    return NextResponse.json(
      { error: "Arc Mainnet is temporarily unreachable. Retry the connection check; gameplay remains available." },
      { status: 503 },
    )
  }
}
