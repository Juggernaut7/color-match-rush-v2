# Color Match Rush

Color Match Rush is a mobile-first Stroop reaction game. Free practice, timer, challenge generation, and personal-best history run entirely in the browser. Optional Arc Mainnet competition entries, participant records, pools, cancellations/refunds, and finalized prize results are read from and written directly to the Arc contract.

## Features

- Free 30-second practice with local personal-best and score history; no wallet or backend required.
- Optional Arc Mainnet competition entry paid as native USDC (`msg.value`). Arc's native USDC has 18 decimals and is also the gas asset.
- On-chain numbered rounds and enumerable participant pages (maximum 50 addresses per read).
- On-chain settlement results with unique winning entrants and exact 50% / 30% / 20% pool distribution.
- Participant-claimed refunds when an operator cancels a round with fewer than three entrants.

## Local setup

1. Install Node.js 18+ and pnpm 8+.
2. Copy `apps/web/.env.example` to `apps/web/.env.local`; it contains the deployed Arc Mainnet treasury address.
3. For Vercel, add `NEXT_PUBLIC_ARC_TREASURY_ADDRESS=0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834` to the production environment. Do not add the deployer private key to the web project.
4. From the repository root, run `pnpm install`, then `pnpm --filter web dev`.
5. Open http://localhost:3000.

The browser wallet targets Arc Mainnet (Chain ID 5042, `https://rpc.mainnet.arc.io`, explorer `https://explorer.arc.io`). Network details are from [Circle's official Arc connection guide](https://docs.arc.io/arc/references/connect-to-arc.md).

## Contract setup and tests

```powershell
cd apps\contracts
Copy-Item .env.example .env
npm install
npm test
npm run compile
```

Required deployer secret: `PRIVATE_KEY` in `apps/contracts/.env`. Optional values are `ARC_RPC_URL` (official mainnet RPC), `ARC_TESTNET_RPC_URL`, and `ARC_ENTRY_FEE` (native USDC in human units; defaults to `0.5`). Do not use the fee token's ERC-20 6-decimal interface for `msg.value`.

The current treasury is deployed on Arc Mainnet at [`0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`](https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834). Its first 24-hour round is round #1 with a 0.5 native-USDC entry fee. Round-management commands submit Mainnet transactions; inspect the live round before creating another.

To create a round after deployment, set `TREASURY_ADDRESS` and `ROUND_ACTION=create`; `ROUND_DURATION_SECONDS` defaults to 86400. After the round ends, an operator can set `ROUND_ACTION=settle`, `ROUND_ID`, and three winner addresses. If fewer than three players entered, set `ROUND_ACTION=cancel`; each entrant can then claim a refund. See [apps/contracts/README.md](apps/contracts/README.md) for the complete workflow.

## Scoring trust model

Gameplay inputs and scores are not submitted to a server or stored on-chain. They are client-generated and can be manipulated, so the app does not present them as verified competition rankings. The operator chooses three entrants after the round ends; the contract restricts settlement to that operator and enforces that winners are distinct round participants, settlement happens once, and prize shares total the pool. The leaderboard displays only contract-finalized winners and payouts. This is an operator-trusted proof of concept, not trustless score adjudication.

## Arc native USDC model

Arc uses native USDC for gas and native value transfers. The contract entry path is payable and sends `msg.value`, using 18-decimal native units. Arc also exposes an optional ERC-20 USDC interface at `0x3600000000000000000000000000000000000000` with 6 decimals; this app does not use that interface for entries. See Circle's [official EVM differences](https://docs.arc.io/arc/references/evm-differences.md) and [USDC contract-address reference](https://docs.arc.io/arc/references/contract-addresses.md).

## Risks

This contract and app are experimental and unaudited. The operator can choose winners but cannot prove scores; operator key loss, mistakes, contract bugs, wallet mistakes, or network failures may lead to loss. A cancellation is permitted only after the round ends and with fewer than three entrants; eligible participants must claim their refunds individually.
