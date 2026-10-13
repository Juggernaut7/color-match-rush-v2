import { defineChain } from "viem";

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
});

export const arcTreasuryAbi = [
  {
    type: "function",
    name: "entryFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "currentRoundId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getRound",
    stateMutability: "view",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [
      {
        name: "",
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
    name: "getRoundParticipants",
    stateMutability: "view",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "page", type: "address[]" }],
  },
  {
    type: "function",
    name: "isRoundOpen",
    stateMutability: "view",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "hasJoined",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "hasRefunded",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
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
  {
    type: "event",
    name: "RoundCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "roundId", type: "uint256" },
      { indexed: false, name: "startsAt", type: "uint64" },
      { indexed: false, name: "endsAt", type: "uint64" },
      { indexed: false, name: "entryFee", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "EntryFeeReceived",
    anonymous: false,
    inputs: [
      { indexed: true, name: "roundId", type: "uint256" },
      { indexed: true, name: "player", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "RoundCancelled",
    anonymous: false,
    inputs: [{ indexed: true, name: "roundId", type: "uint256" }],
  },
  {
    type: "event",
    name: "RoundSettled",
    anonymous: false,
    inputs: [
      { indexed: true, name: "roundId", type: "uint256" },
      { indexed: false, name: "firstPlace", type: "address" },
      { indexed: false, name: "secondPlace", type: "address" },
      { indexed: false, name: "thirdPlace", type: "address" },
      { indexed: false, name: "firstPrize", type: "uint256" },
      { indexed: false, name: "secondPrize", type: "uint256" },
      { indexed: false, name: "thirdPrize", type: "uint256" },
    ],
  },
] as const;

export type TreasuryRound = {
  startsAt: bigint;
  endsAt: bigint;
  totalPool: bigint;
  playerCount: bigint;
  status: number;
  winners: readonly [`0x${string}`, `0x${string}`, `0x${string}`];
  prizes: readonly [bigint, bigint, bigint];
};

export function getArcTreasuryAddress() {
  const address = process.env.NEXT_PUBLIC_ARC_TREASURY_ADDRESS;
  return address && /^0x[0-9a-fA-F]{40}$/.test(address) ? (address as `0x${string}`) : null;
}
