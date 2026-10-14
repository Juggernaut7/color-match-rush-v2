# Color Match Rush

Think fast. Match the word. **Color Match Rush** is a free, mobile-first color-word reaction game: read the color name, ignore its ink, and pick the matching answer before the 30-second clock runs out. Free practice and local personal-best tracking need no wallet, account, or network connection.

- **Play:** open the app, tap **Play Free**, and answer using one of eight large color buttons.
- **Scoring:** correct answers add one point; wrong answers subtract one, down to zero.
- **Results:** after 30 seconds, see your score and personal best, then play again.
- **Personal bests:** saved on the current device. An optional shared leaderboard stores anonymous, player-submitted scores in MongoDB; results are not independently verified.
- **Public source:** [github.com/Juggernaut7/color-match-rush-v2](https://github.com/Juggernaut7/color-match-rush-v2)

No live production app URL has been verified yet.

The app also has an optional Arc Mainnet panel for direct treasury reads and wallet-approved entry/refund actions when the on-chain round permits them. It never gates free practice. The existing contract does not accept gameplay scores, and its operator—not a trustless score verifier—selects winners.

## Run locally

Requirements: Node.js 18+ and pnpm 8+.

```powershell
if (-not (Test-Path apps\web\.env.local)) {
  Copy-Item apps\web\.env.example apps\web\.env.local
}
pnpm install
pnpm --filter web dev
```

Open http://localhost:3000 and tap **Play Free**. The complete game loop and device history work without environment variables, a wallet, or network access.

Vercel installs the workspace with the repository-pinned pnpm 8.10.0 command in [`vercel.json`](./vercel.json), so its default pnpm version cannot silently fall back to an incompatible pnpm 6 release.

Configure these variables in `apps/web/.env.local` for local features and in the Vercel project before deploying. Add the two Arc address variables as plain environment variables (the address is public), and add `MONGODB_URI` only to server-side Production Environment Variables:

```dotenv
MONGODB_URI=mongodb+srv://<db-user>:<db-password>@<cluster-host>/<database>?retryWrites=true&w=majority
ARC_TREASURY_ADDRESS=0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834
NEXT_PUBLIC_ARC_TREASURY_ADDRESS=0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834
```

`MONGODB_URI` is secret: never use a `NEXT_PUBLIC_` prefix, add it to client code, or commit it. It is optional for local play; score submissions and the shared leaderboard show an error and fall back to local records if the database is missing or unavailable. `ARC_TREASURY_ADDRESS` is read only by the server-side Arc status route; `NEXT_PUBLIC_ARC_TREASURY_ADDRESS` is public and used by the browser to read the contract and create wallet transactions. The browser rejects a configured treasury address that differs from the verified deployment, preventing stale values from being silently used. Never put a deployer private key in the web project's environment.

## Persistence and score trust

- `POST /api/scores` validates bounded integer scores, anonymous UUIDs, and idempotent submission IDs; submissions are rate-limited per server instance.
- `GET /api/scores?playerId=<anonymous UUID>` returns that browser's latest saved history and personal best.
- `GET /api/leaderboard` returns the top 25 community submissions.
- MongoDB indexes support idempotency, personal history, and ranked reads. The Mongo client is reused across serverless invocations when the runtime permits.
- The browser saves results locally before attempting a cloud submission. A database outage does not block play or erase local history.
- Scores are client-submitted and can be fabricated. They are not independently verified and must not be treated as proof of performance or eligibility for prizes.

## Arc Mainnet integration

The Arc panel calls the official Arc Mainnet RPC (`https://rpc.mainnet.arc.io`) directly from the browser using the deployed treasury ABI. It checks chain ID `5042`, deployed bytecode, and current contract round state; transient failures are shown with a retry action and do not disable free gameplay. Browser wallet support uses an injected EVM wallet (such as MetaMask or Rabby); connecting is optional.

The verified treasury is [`0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`](https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834). Its original entry fee is `0.5` native USDC (18 decimals); this is both the `msg.value` required to enter and Arc's gas asset, not an ERC-20 approval or transfer. When a round is open, users can review the fee and contract's trust model before explicitly requesting a wallet transaction. The wallet must be switched to Arc Mainnet. A confirmed entry records only the wallet as a participant, not the local game score.

The operator creates/cancels rounds and selects the three winners after a round ends. The contract enforces that each selected winner is a distinct participant and pays 50% / 30% / 20% of the pool. It does not verify gameplay or select winners by score. Cancelled participants may claim their own refunds. The current deployment's first round has passed its entry deadline; the website must display live round state rather than imply that entries are currently available.

Network details: [Circle Arc connection guide](https://docs.arc.io/arc/references/connect-to-arc.md).

## Checks

```powershell
pnpm --filter web type-check
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test:game
pnpm --filter hardhat exec hardhat test
```

Contract sources/tests remain for the already-deployed legacy treasury; this game MVP does not use its payment or payout features. See [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for verified deployment details and current known limitations.
