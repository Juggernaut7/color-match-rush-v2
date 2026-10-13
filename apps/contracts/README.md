# Color Match Rush Arc contract

`ColorMatchRushTreasury` is a small Arc Mainnet competition contract. It uses native USDC through Solidity `payable` calls and `msg.value`, not an ERC-20 `transferFrom` approval flow.

## Arc token and network facts

Circle's official Arc documentation identifies Mainnet as Chain ID `5042`, RPC `https://rpc.mainnet.arc.io`, explorer `https://explorer.arc.io`, and native USDC (18 decimals) as gas currency. Arc also exposes an ERC-20 interface at `0x3600000000000000000000000000000000000000`, with 6 decimals. This contract uses native value transfers, so an entry of 0.5 USDC is `0.5 * 10^18` native units, not `0.5 * 10^6` ERC-20 units.

References: [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc.md), [EVM differences](https://docs.arc.io/arc/references/evm-differences.md), and [contract addresses](https://docs.arc.io/arc/references/contract-addresses.md).

## Contract behavior

- The deployer is the sole round operator and sets a fixed native-USDC entry fee at deployment. `ARC_ENTRY_FEE` defaults to `0.5`.
- Round IDs are sequential integers stored by the contract. The operator opens a round with a duration between 60 seconds and 30 days.
- Each address can enter once per round by paying the exact fee. Participant addresses are enumerable through `getRoundParticipants(roundId, offset, limit)`, with `limit` capped at 50.
- After expiry, the operator chooses three distinct participants and settles once. The contract sends 50%, 30%, and the remaining 20% of the pool, and stores all three winner addresses and payout amounts.
- After expiry, a round with fewer than three entrants can be cancelled by the operator. Participants individually claim a one-time refund.
- A round with at least three entrants cannot be cancelled; it must be settled.

## Trust model

Game inputs and scores remain in the browser and are neither submitted to a server nor stored on-chain. Client scores are manipulable and are not evidence. The owner/operator chooses winning participants off-chain. The contract enforces operator authorization, round expiry, unique participants, one-time settlement, and exact payout arithmetic, but does not verify who scored highest. The public leaderboard therefore presents only contract-finalized winners and payouts, not player-submitted scores.

## Setup and local checks

```powershell
cd apps\contracts
Copy-Item .env.example .env
npm install
npm test
npm run compile
```

The Hardhat tests cover round authorization and duration, entry payment and duplicate prevention, participant pagination, expiry, settlement eligibility and authorization, one-time payouts, cancellation/refunds, payout arithmetic, and local EVM gas estimates. Local Hardhat is not a substitute for Arc runtime tests. Circle's Arc docs note differences in USDC balance representations, fee-market floors, and revert handling; the contract avoids the ERC-20 interface and sends only nonzero payouts to nonzero participants.

## Required environment values

In `apps/contracts/.env`:

- `PRIVATE_KEY` — dedicated operator key, required for deployment and round management; never expose or commit it.
- `ARC_ENTRY_FEE` — optional; native USDC human amount, defaults to `0.5`.
- `ARC_RPC_URL` — optional; defaults to the official Arc Mainnet RPC.
- `ARC_TESTNET_RPC_URL` — optional; defaults to the official Arc Testnet RPC.
- `REPORT_GAS` — optional test reporter switch.

In `apps/web/.env.local`:

- `NEXT_PUBLIC_ARC_TREASURY_ADDRESS` — required only for the optional Arc competition UI. Free play does not need it.

## Deploy and operate

Run tests and compile before deploying. A deployer needs sufficient native USDC for gas. Deployment and round-management commands broadcast transactions:

```powershell
npm run deploy:treasury:arc
```

Configure `TREASURY_ADDRESS` in the contracts `.env` to the verified deployment, then create the first round:

```powershell
$env:ROUND_ACTION = "create"
$env:ROUND_DURATION_SECONDS = "86400"
npm run manage-round:arc
```

The command waits for the receipt and prints the on-chain round ID. Configure that ID for settlement after expiry:

```powershell
$env:ROUND_ID = "1"
$env:ROUND_ACTION = "settle"
$env:FIRST_PLACE = "0x..."
$env:SECOND_PLACE = "0x..."
$env:THIRD_PLACE = "0x..."
npm run manage-round:arc
```

For a round with fewer than three entrants, use `ROUND_ACTION=cancel` and the round ID instead. Every participant claims their own refund by calling `refundEntry(roundId)`. Configure `NEXT_PUBLIC_ARC_TREASURY_ADDRESS` in the frontend deployment after verifying the contract address and bytecode.

## Current Arc Mainnet deployment

- Contract: `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`
- Deployment transaction: `0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638`
- Explorer: https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834
- Current round: `1`, open for 24 hours from creation, entry fee `0.5` native USDC.
- Round creation transaction: `0x7da6e5dce15af06b0d91795988381c0882f969f7e2ecef0918182b56bfa49d03`

The deployed bytecode, successful receipts, owner, entry fee, round ID, status, and timestamps were checked against Arc Mainnet RPC. The contract has not had an independent security audit. The frontend hosting environment must set `NEXT_PUBLIC_ARC_TREASURY_ADDRESS` to this address.
