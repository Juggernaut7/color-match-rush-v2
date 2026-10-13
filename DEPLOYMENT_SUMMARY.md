# Arc Mainnet deployment status

## Treasury

- Network: Arc Mainnet, chain ID `5042`
- Contract: `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`
- Deployment transaction: `0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638`
- Explorer: https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834
- Deployed runtime code, owner, and the `0.5` native-USDC entry fee verified using Arc RPC.

## First round

- Round ID: `1`
- Status: Open
- Duration: 24 hours
- Entry fee: `0.5` native USDC
- Creation transaction: `0x7da6e5dce15af06b0d91795988381c0882f969f7e2ecef0918182b56bfa49d03`

The frontend uses `NEXT_PUBLIC_ARC_TREASURY_ADDRESS` to read and interact with this contract. Set it in Vercel's production environment before deploying the Next.js app. The web app needs no private key or database.

## Verification and limitations

The contract test suite passes 9 tests; the web application passed `pnpm --filter web type-check` and `pnpm --filter web build`, including after the free-game hydration fix. Round management was exercised against Arc Mainnet and round state confirmed directly by RPC. No participant entry has been made as part of deployment verification, to avoid spending the 0.5-USDC entry fee and additional gas.

Game inputs and scores are client-side and can be manipulated. The contract restricts settlement to its owner and enforces distinct participants, payout arithmetic, and one-time settlement, but the operator selects winners. This project has not had an independent security audit. The frontend production deployment and live wallet/entry verification remain for the project owner to complete.
