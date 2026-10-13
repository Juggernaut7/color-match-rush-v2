# Arc Mainnet deployment checklist

Follow [README.md](./README.md) for exact environment variables and operator commands.

The current contract is already deployed to Arc Mainnet at `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`. Do not redeploy it to start using the app. Its first 24-hour round is round `1`, opened with a `0.5` native-USDC entry fee.

For a future replacement deployment:

1. Confirm the reviewed source, run `npm test` and `npm run compile`, and inspect the compiled bytecode.
2. Confirm `.env` points to Arc Mainnet (Chain ID 5042) and `ARC_ENTRY_FEE` is intentional. Never print, paste, or commit `PRIVATE_KEY`.
3. Verify the deployer has enough native USDC for both contract deployment gas and round-creation gas.
4. Deploy only after explicit operator approval:

   ```powershell
   npm run deploy:treasury:arc
   ```

5. Verify the successful transaction, contract address, chain, and bytecode in `https://explorer.arc.io`.
6. Set `NEXT_PUBLIC_ARC_TREASURY_ADDRESS` in the frontend deployment and verify its live Arc reads/writes.
7. Open a timed round only when needed; inspect `currentRoundId` first to avoid creating a duplicate.

No testnet is a substitute for the required Mainnet deployment. The contract is unaudited and its operator selects winners based on scores that are not independently verified.
