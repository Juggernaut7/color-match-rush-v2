# Deployment and MVP status

## Current application

The current website is free-to-play: no wallet is required, and the website has no payment, entry, refund, or prize-payout flow. Gameplay and local personal-best history work in the browser. Optional score history and the shared leaderboard use server-side MongoDB; saved results are self-reported and unverified. A read-only server route checks Arc Mainnet connectivity and the legacy contract.

For a deployment, set the following variables in the hosting provider's server-side environment (for Vercel, add them to the project and redeploy):

- `MONGODB_URI` — MongoDB connection string. Required for cloud persistence; never expose with a `NEXT_PUBLIC_` prefix.
- `ARC_TREASURY_ADDRESS` — public legacy treasury address `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`.

No private key is required by the website. See [README.md](./README.md) for local setup and feature behavior.

## Legacy Arc Mainnet treasury

- Chain ID: `5042` (Arc Mainnet)
- Official RPC: `https://rpc.mainnet.arc.io`
- Contract: [`0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`](https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834)
- Deployment transaction: [`0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638`](https://explorer.arc.io/tx/0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638)
- The contract was originally configured for paid rounds using Arc native USDC as `msg.value` (18 decimals). It is not the ERC-20 USDC transfer flow.

The contract is a legacy deployment, not the scoring system for this free-play MVP. The website does not submit paid entries or interact with its payment functions. Its existing payable method cannot be disabled by removing frontend controls, and may remain callable directly while its round is open. Do not send funds to it.

## Verification caveat

On 2026-10-14, the official Arc RPC again returned chain ID `5042`, non-empty bytecode at the treasury, and a successful receipt for the deployment transaction above. The configured local contract deployer matches both the transaction sender and the treasury's current on-chain owner. The existing deployment is therefore the target; no duplicate deployment transaction was sent. The local contract `.env` now points `TREASURY_ADDRESS` at this verified deployment, and remains Git-ignored.

An independent read previously confirmed Arc RPC chain ID `5042`, non-empty bytecode at the address, and `entryFee()` returning `0.5` native USDC. The app no longer calls `entryFee()` at runtime because this MVP has no paid-entry flow; its status route checks only chain ID and bytecode presence, not source/ABI identity. The earlier `TimeoutError` indicates a transient RPC request timeout, but its precise upstream cause was not established. The current app routes Arc checks through a server-side API with retry, timeout, and explicit error states. A live Vercel deployment and browser verification must be recorded only after actually completing them.
