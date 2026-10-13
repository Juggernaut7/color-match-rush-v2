import "dotenv/config";
import hre from "hardhat";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  getAddress,
  http,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const arcMainnet = defineChain({
  id: 5042,
  name: "Arc Mainnet",
  nativeCurrency: { decimals: 18, name: "USDC", symbol: "USDC" },
  rpcUrls: { default: { http: [process.env.ARC_RPC_URL ?? "https://rpc.mainnet.arc.io"] } },
  blockExplorers: { default: { name: "Arc Explorer", url: "https://explorer.arc.io" } },
});

async function main() {
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const roundId = process.env.ROUND_ID ? BigInt(process.env.ROUND_ID) : undefined;
  const action = process.env.ROUND_ACTION;

  if (!treasuryAddress || !isAddress(treasuryAddress)) {
    throw new Error("Set TREASURY_ADDRESS to the deployed ColorMatchRushTreasury address.");
  }
  if (!["create", "cancel", "settle"].includes(action ?? "")) {
    throw new Error("Set ROUND_ACTION to create, cancel, or settle.");
  }
  if (action !== "create" && (!roundId || roundId <= 0n)) {
    throw new Error("Set ROUND_ID to an existing positive Arc round ID.");
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY is required for Arc round management.");
  const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
  const publicClient = createPublicClient({
    chain: arcMainnet,
    transport: http(process.env.ARC_RPC_URL ?? "https://rpc.mainnet.arc.io"),
  });
  const operator = createWalletClient({
    account,
    chain: arcMainnet,
    transport: http(process.env.ARC_RPC_URL ?? "https://rpc.mainnet.arc.io"),
  });
  const chainId = await publicClient.getChainId();
  if (chainId !== 5042) throw new Error(`Refusing round management on unexpected chain ID ${chainId}.`);
  const treasury = await hre.viem.getContractAt(
    "ColorMatchRushTreasury",
    getAddress(treasuryAddress),
    { client: { public: publicClient, wallet: operator } },
  );
  const owner = await treasury.read.owner();
  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error(`Configured wallet ${account.address} is not the treasury operator.`);
  }
  let transactionHash: `0x${string}`;

  switch (action) {
    case "create": {
      const durationText = process.env.ROUND_DURATION_SECONDS ?? "86400";
      if (!/^\d+$/.test(durationText)) {
        throw new Error("ROUND_DURATION_SECONDS must be an integer between 60 and 2592000.");
      }
      const duration = BigInt(durationText);
      if (duration < 60n || duration > 2_592_000n) {
        throw new Error("ROUND_DURATION_SECONDS must be between 60 and 2592000.");
      }
      const createdRound = await treasury.write.createRound([Number(duration)]);
      const createdReceipt = await publicClient.waitForTransactionReceipt({ hash: createdRound });
      if (createdReceipt.status !== "success") throw new Error(`Create round failed: ${createdRound}`);
      const latestRoundId = await treasury.read.currentRoundId();
      console.log(`Created Arc round #${latestRoundId.toString()}: ${createdRound}`);
      return;
    }
    case "cancel":
      transactionHash = await treasury.write.cancelRound([roundId!]);
      break;
    case "settle": {
      const winnerAddresses = [
        process.env.FIRST_PLACE,
        process.env.SECOND_PLACE,
        process.env.THIRD_PLACE,
      ];
      const [first, second, third] = winnerAddresses;
      if (!first || !second || !third || !isAddress(first) || !isAddress(second) || !isAddress(third)) {
        throw new Error("Set FIRST_PLACE, SECOND_PLACE, and THIRD_PLACE to valid winner addresses.");
      }
      transactionHash = await treasury.write.settleRound([
        roundId!,
        getAddress(first),
        getAddress(second),
        getAddress(third),
      ]);
      break;
    }
    default:
      throw new Error("Unsupported round action.");
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });
  if (receipt.status !== "success") {
    throw new Error(`Round ${action} transaction failed: ${transactionHash}`);
  }
  console.log(`Round ${action} confirmed: ${transactionHash}`);
  console.log(`Round ID: ${roundId!.toString()}`);
}

main().catch((error: unknown) => {
  console.error("Round management failed:", error);
  process.exitCode = 1;
});
