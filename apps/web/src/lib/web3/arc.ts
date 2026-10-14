import { defineChain, getAddress, isAddress, type Address } from "viem"

const deployedTreasuryAddress = "0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834" as const

export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.arc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://explorer.arc.io",
    },
  },
})

export const arcTreasuryAbi = [
  {
    type: "function",
    name: "entryFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "currentRoundId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getRound",
    stateMutability: "view",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [
      {
        name: "round",
        type: "tuple",
        components: [
          { name: "startsAt", type: "uint64" },
          { name: "endsAt", type: "uint64" },
          { name: "totalPool", type: "uint256" },
          { name: "playerCount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "winners", type: "address[3]" },
          { name: "prizes", type: "uint256[3]" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "isRoundOpen",
    stateMutability: "view",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "hasJoined",
    stateMutability: "view",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "player", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "hasRefunded",
    stateMutability: "view",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "player", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "joinRound",
    stateMutability: "payable",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refundEntry",
    stateMutability: "nonpayable",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [],
  },
] as const

export function getArcTreasuryAddress(): Address {
  const verifiedAddress = getAddress(deployedTreasuryAddress)
  const configuredAddress = process.env.NEXT_PUBLIC_ARC_TREASURY_ADDRESS?.trim()
  if (!configuredAddress) return verifiedAddress
  if (!isAddress(configuredAddress)) {
    throw new Error("NEXT_PUBLIC_ARC_TREASURY_ADDRESS is not a valid EVM address.")
  }
  const normalizedAddress = getAddress(configuredAddress)
  if (normalizedAddress !== verifiedAddress) {
    throw new Error("NEXT_PUBLIC_ARC_TREASURY_ADDRESS does not match the verified Arc treasury deployment.")
  }
  return normalizedAddress
}
