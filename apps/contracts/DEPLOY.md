# Legacy contract deployment record

The treasury contract was previously deployed to Arc Mainnet. The current website is a free-play MVP and does not use its payment or payout features. Do not deploy another treasury or create/manage rounds for the current app.

Verified historical deployment:

- Chain ID: `5042`
- Contract: `0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834`
- Contract explorer: https://explorer.arc.io/address/0xCde9Ada39F44a5d1C929D7f51Bfd7205B6aD6834
- Deployment transaction: `0xf2d1bce8ff15cdc30a5ec85a3957c21463ad935557f8f20a87a1a6e8f4ae9638`
- Initial round transaction: `0x7da6e5dce15af06b0d91795988381c0882f969f7e2ecef0918182b56bfa49d03`

The on-chain contract still contains a payable entry method, which cannot be disabled by removing frontend code. Do not send funds to it. Its deployer key is not needed by the web app. Contract source, historical behavior, and test instructions are in [README.md](./README.md).
