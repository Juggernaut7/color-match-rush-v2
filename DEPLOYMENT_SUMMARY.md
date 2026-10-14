# Deployment and MVP status

## Current application

Free practice and local personal-best history work without a wallet. An optional Arc panel reads the deployed treasury directly and can request wallet-approved entry/refund transactions only when the contract allows them. Scores remain browser/MongoDB records and are not submitted to or verified by the treasury. The operator controls round creation, cancellation, and winner selection.

For a deployment, set the following variables in the hosting provider's environment (for Vercel, add them to the project and redeploy). Keep `MONGODB_URI` server-only; the two contract-address values are public:

- `MONGODB_URI` — MongoDB connection string. Required for cloud persistence; never expose with a `NEXT_PUBLIC_` prefix.
- `ARC_TREASURY_ADDRESS` — public legacy treasury address `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`.
- `NEXT_PUBLIC_ARC_TREASURY_ADDRESS` — same verified address, used by the browser for direct Arc RPC reads and explicit wallet actions.

No private key is required by the website. See [README.md](./README.md) for local setup and feature behavior.

## Legacy Arc Mainnet treasury

- Chain ID: `5042` (Arc Mainnet)
- Official RPC: `https://rpc.mainnet.arc.io`
- Contract: [`0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`](https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834)
- Deployment transaction: [`0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638`](https://explorer.arc.io/tx/0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638)
- The contract was originally configured for paid rounds using Arc native USDC as `msg.value` (18 decimals). It is not the ERC-20 USDC transfer flow.

The contract is a separate paid-entry deployment, not the game's scoring system. It uses native USDC `msg.value` (18 decimals), not ERC-20 transfers. Entrants should understand that the operator selects winners; scores and gameplay are not submitted to the contract. The website shows current round status from RPC and does not allow an entry when the round is not accepting entries.

## Verification caveat

On 2026-10-14, the official Arc RPC again returned chain ID `5042`, non-empty bytecode at the treasury, and a successful receipt for the deployment transaction above. The configured local contract deployer matches both the transaction sender and the treasury's current on-chain owner. The existing deployment is therefore the target; no duplicate deployment transaction was sent. The local contract `.env` now points `TREASURY_ADDRESS` at this verified deployment, and remains Git-ignored.

An independent read confirmed Arc RPC chain ID `5042`, non-empty bytecode (5,331 bytes) at the address, and `entryFee()` returning `0.5` native USDC using the deployment artifact ABI. The latest read returned round ID `1`, status `Open`, no entrants, an empty pool, and `isRoundOpen() == false` because its deadline passed. The browser now reads this state directly with retry/error states. The earlier `TimeoutError` was transient; its exact upstream cause remains unestablished. A live Vercel deployment and browser verification must be recorded only after actually completing them.
