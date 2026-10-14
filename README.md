# Color Match Rush

Think fast. Match the word. **Color Match Rush** is a free, mobile-first color-word reaction game: read the color name, ignore its ink, and pick the matching answer before the 30-second clock runs out. No wallet, account, payment, or backend connection is needed to play.

- **Play:** open the app, tap **Play Free**, and answer using one of eight large color buttons.
- **Scoring:** correct answers add one point; wrong answers subtract one, down to zero.
- **Results:** after 30 seconds, see your score and personal best, then play again.
- **Personal bests:** saved on the current device. An optional shared leaderboard stores anonymous, player-submitted scores in MongoDB; results are not independently verified.
- **Public source:** [github.com/Juggernaut7/color-match-rush-v2](https://github.com/Juggernaut7/color-match-rush-v2)

No live production app URL has been verified yet.

The existing Arc Mainnet treasury is a separate legacy deployment. This game does not connect wallets, accept entry payments, write scores on-chain, or distribute prizes. Read-only Arc checks are available through the server API for diagnostic use; they are not part of the play flow.

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

Configure these variables in `apps/web/.env.local` for local backend and Arc status features, and in the Vercel project's **server-side Production Environment Variables** before deploying:

```dotenv
MONGODB_URI=mongodb+srv://<db-user>:<db-password>@<cluster-host>/<database>?retryWrites=true&w=majority
ARC_TREASURY_ADDRESS=0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834
```

`MONGODB_URI` is secret: never use a `NEXT_PUBLIC_` prefix, add it to client code, or commit it. It is optional for local play; score submissions and the shared leaderboard show an error and fall back to local records if the database is missing or unavailable. `ARC_TREASURY_ADDRESS` is the public contract address but is read only by the server-side Arc status route. Do not put a deployer private key in the web project's environment.

## Persistence and score trust

- `POST /api/scores` validates bounded integer scores, anonymous UUIDs, and idempotent submission IDs; submissions are rate-limited per server instance.
- `GET /api/scores?playerId=<anonymous UUID>` returns that browser's latest saved history and personal best.
- `GET /api/leaderboard` returns the top 25 community submissions.
- MongoDB indexes support idempotency, personal history, and ranked reads. The Mongo client is reused across serverless invocations when the runtime permits.
- The browser saves results locally before attempting a cloud submission. A database outage does not block play or erase local history.
- Scores are client-submitted and can be fabricated. They are not independently verified and must not be treated as proof of performance or eligibility for prizes.

## Arc Mainnet integration

The status panel makes read-only requests through a same-origin server route to the official Arc Mainnet RPC (`https://rpc.mainnet.arc.io`). It reports success only after RPC confirms chain ID `5042` and non-empty bytecode at the configured address. It does not call the legacy paid-entry getter or prove that the bytecode matches the repository source. Transient RPC failures show an error and a retry action; they do not disable free gameplay.

The verified legacy treasury is [`0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`](https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834). It was originally deployed with a payable entry method and an open round. This version of the website removes all wallet and payment controls and never calls those methods. **The legacy contract itself remains on-chain and may still accept direct contract calls while its round is open; do not send funds to it.** Arc uses native USDC as gas/value (18 decimals); this app does not use the separate 6-decimal ERC-20 interface.

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
