import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const configuredEntryFee = process.env.ARC_ENTRY_FEE ?? "0.5";
if (!/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(configuredEntryFee)) {
  throw new Error("ARC_ENTRY_FEE must be a valid USDC amount with at most 18 decimals, such as 0.5.");
}
const entryFee = parseEther(configuredEntryFee);

const ColorMatchRushTreasuryModule = buildModule("ColorMatchRushTreasuryModule", (m) => {
  const treasury = m.contract("ColorMatchRushTreasury", [entryFee]);
  return { treasury };
});

export default ColorMatchRushTreasuryModule;

