# Arc treasury status

`ColorMatchRushTreasury` is wired to Arc Mainnet using native USDC `msg.value`. The frontend reads rounds, entries, and finalized winners directly from Arc RPC. Scores remain local and are not used as verified payout evidence; the operator selects the winners.

The contract is deployed at `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834` on Arc Mainnet (Chain ID 5042). A fresh RPC read confirmed round #1 remains stored as Open but is no longer accepting entries because its end time has passed. See [README.md](./README.md) for verified transaction details and [DEPLOY.md](./DEPLOY.md) for future deployments. The contract is unaudited.
