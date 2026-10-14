# Legacy Color Match Rush treasury contract

This package contains the source and Hardhat tests for the previously deployed paid-entry treasury. It is **not used by the current free-play website**. The website has no wallet or payment controls and does not call the contract's payable methods.

## Existing Arc Mainnet deployment

- Chain ID: `5042`
- Contract: `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`
- Explorer: https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834
- Deployment transaction: `0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638`
- Initial round transaction: `0x7da6e5dce15af06b0d91795988381c0882f969f7e2ecef0918182b56bfa49d03`

The deployment was originally configured with a 0.5 native-USDC fee. Arc native USDC is the gas/value asset with 18 decimals. This contract accepts entry payment through payable calls and `msg.value`; it does not use the separate ERC-20 USDC transfer interface.

**The contract remains deployed and its payable entry function cannot be disabled by this frontend.** It may still accept direct entries while its round is open. The current application does not expose or use these payment functions; do not send funds to the legacy contract.

## Historical contract behavior

- The deployer is the round operator and creates sequential, timed rounds.
- An address can enter once per round by paying the exact native-value entry fee.
- After expiry, only the operator can select three distinct entrant addresses and settle the round.
- Payout arithmetic is enforced on-chain as 50%, 30%, and the remainder; entrant scores are not verified by the contract.
- An expired round with fewer than three entrants may be cancelled, after which entrants can claim refunds.

The operator-selected winners model is not trustless score verification. These features are retained only to describe and test the already-deployed contract; they are not part of the free-play MVP.

## Test the legacy contract

```powershell
cd apps\contracts
npm install
npm test
npm run compile
```

Tests exercise authorization, round durations and lifecycle, exact payment, duplicate entries, participant pagination, settlement eligibility, one-time payouts, cancellation/refunds, payout arithmetic, and local EVM gas estimates. Local tests do not prove live network behavior or constitute an independent audit.

Do not run deployment or round-management scripts unless you intentionally want to broadcast a transaction to Arc Mainnet and have separately reviewed and approved it. The web application does not require `PRIVATE_KEY`, `ARC_ENTRY_FEE`, or any contract-operator environment variable.
