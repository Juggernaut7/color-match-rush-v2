import { time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("ColorMatchRushTreasury", function () {
  it("keeps contract deployment gas within the MVP budget", async function () {
    const artifact = await hre.artifacts.readArtifact("ColorMatchRushTreasury");
    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    const hash = await deployer.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: [parseEther("0.5")],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`Gas estimate: deploy=${receipt.gasUsed}`);
    expect(receipt.status).to.equal("success");
    expect(receipt.gasUsed).to.be.lessThan(2_000_000n);
  });

  async function deployFixture() {
    const entryFee = parseEther("0.5");
    const [owner, first, second, third, other] = await hre.viem.getWalletClients();
    const treasury = await hre.viem.deployContract("ColorMatchRushTreasury", [entryFee]);
    const publicClient = await hre.viem.getPublicClient();
    await treasury.write.createRound([600]);
    const roundId = await treasury.read.currentRoundId();

    return { treasury, publicClient, entryFee, owner, first, second, third, other, roundId };
  }

  async function enter(
    treasuryAddress: `0x${string}`,
    player: Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number],
    roundId: bigint,
    amount: bigint,
  ) {
    const playerTreasury = await hre.viem.getContractAt("ColorMatchRushTreasury", treasuryAddress, {
      client: { wallet: player },
    });
    return playerTreasury.write.joinRound([roundId], { value: amount });
  }

  describe("round creation and entry", function () {
    it("creates numbered rounds with a bounded duration and restricts creation to the operator", async function () {
      const { treasury, owner, other, roundId } = await deployFixture();
      expect(roundId).to.equal(1n);
      expect(await treasury.read.currentRoundId()).to.equal(1n);
      expect((await treasury.read.getRound([roundId])).status).to.equal(1);

      const otherTreasury = await hre.viem.getContractAt("ColorMatchRushTreasury", treasury.address, {
        client: { wallet: other },
      });
      await expect(otherTreasury.write.createRound([600])).to.be.rejected;
      await expect(treasury.write.createRound([59])).to.be.rejected;
      await expect(treasury.write.createRound([2_592_001])).to.be.rejected;
      await expect(treasury.write.createRound([600])).to.be.rejected;
    });

    it("accepts exactly one exact-fee entry per wallet and records participants in bounded pages", async function () {
      const { treasury, entryFee, first, second, other, roundId } = await deployFixture();
      await enter(treasury.address, first, roundId, entryFee);
      await enter(treasury.address, second, roundId, entryFee);

      expect(await treasury.read.hasJoined([roundId, first.account.address])).to.equal(true);
      expect((await treasury.read.getRound([roundId])).totalPool).to.equal(entryFee * 2n);
      expect(await treasury.read.getRoundParticipants([roundId, 0n, 1n])).to.deep.equal([
        first.account.address,
      ]);
      expect(await treasury.read.getRoundParticipants([roundId, 1n, 50n])).to.deep.equal([
        second.account.address,
      ]);
      expect(await treasury.read.getRoundParticipants([roundId, 99n, 50n])).to.deep.equal([]);
      await expect(treasury.read.getRoundParticipants([roundId, 0n, 51n])).to.be.rejected;

      await expect(enter(treasury.address, first, roundId, entryFee)).to.be.rejected;
      await expect(enter(treasury.address, other, roundId, entryFee - 1n)).to.be.rejected;
      await expect(enter(treasury.address, other, roundId, entryFee + 1n)).to.be.rejected;
      expect(await treasury.read.hasJoined([roundId, other.account.address])).to.equal(false);
    });

    it("rejects entries before a round is opened, after its deadline, and after cancellation", async function () {
      const { treasury, entryFee, first, roundId } = await deployFixture();
      await expect(treasury.write.joinRound([roundId + 1n], { value: entryFee })).to.be.rejected;
      await time.increaseTo((await treasury.read.getRound([roundId])).endsAt);
      await expect(enter(treasury.address, first, roundId, entryFee)).to.be.rejected;
      await treasury.write.cancelRound([roundId]);
      await expect(enter(treasury.address, first, roundId, entryFee)).to.be.rejected;
    });

    it("allows a new round after the prior round expires", async function () {
      const { treasury, roundId } = await deployFixture();
      await time.increaseTo((await treasury.read.getRound([roundId])).endsAt);
      await treasury.write.createRound([600]);
      expect(await treasury.read.currentRoundId()).to.equal(roundId + 1n);
      expect((await treasury.read.getRound([roundId + 1n])).status).to.equal(1);
    });
  });

  describe("settlement and refunds", function () {
    it("restricts settlement to the owner, pays exact 50/30/20 shares, records results, and settles once", async function () {
      const { treasury, publicClient, entryFee, first, second, third, other, roundId } =
        await deployFixture();
      await enter(treasury.address, first, roundId, entryFee);
      await enter(treasury.address, second, roundId, entryFee);
      await enter(treasury.address, third, roundId, entryFee);

      const winners = [first.account.address, second.account.address, third.account.address] as const;
      const otherTreasury = await hre.viem.getContractAt("ColorMatchRushTreasury", treasury.address, {
        client: { wallet: other },
      });
      await expect(otherTreasury.write.settleRound([roundId, ...winners])).to.be.rejected;
      await expect(treasury.write.settleRound([roundId, ...winners])).to.be.rejected;

      await time.increaseTo((await treasury.read.getRound([roundId])).endsAt);
      const before = await Promise.all(
        [first, second, third].map(({ account }) =>
          publicClient.getBalance({ address: account.address }),
        ),
      );
      const settlementHash = await treasury.write.settleRound([roundId, ...winners]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: settlementHash });
      const after = await Promise.all(
        [first, second, third].map(({ account }) =>
          publicClient.getBalance({ address: account.address }),
        ),
      );
      const result = await treasury.read.getRound([roundId]);

      expect(receipt.status).to.equal("success");
      expect(after[0] - before[0]).to.equal(parseEther("0.75"));
      expect(after[1] - before[1]).to.equal(parseEther("0.45"));
      expect(after[2] - before[2]).to.equal(parseEther("0.3"));
      expect(result.status).to.equal(2);
      expect(result.winners).to.deep.equal(winners);
      expect(result.prizes).to.deep.equal([
        parseEther("0.75"),
        parseEther("0.45"),
        parseEther("0.3"),
      ]);
      expect(await publicClient.getBalance({ address: treasury.address })).to.equal(0n);
      await expect(treasury.write.settleRound([roundId, ...winners])).to.be.rejected;
    });

    it("rejects duplicate or nonparticipant winners and allows cancellation instead of underfilled settlement", async function () {
      const { treasury, entryFee, first, second, third, other, roundId } = await deployFixture();
      await enter(treasury.address, first, roundId, entryFee);
      await enter(treasury.address, second, roundId, entryFee);
      await enter(treasury.address, third, roundId, entryFee);
      await time.increaseTo((await treasury.read.getRound([roundId])).endsAt);

      await expect(treasury.write.settleRound([
        roundId,
        first.account.address,
        first.account.address,
        second.account.address,
      ])).to.be.rejected;
      await expect(treasury.write.settleRound([
        roundId,
        first.account.address,
        second.account.address,
        other.account.address,
      ])).to.be.rejected;

      const otherTreasury = await hre.viem.getContractAt("ColorMatchRushTreasury", treasury.address, {
        client: { wallet: other },
      });
      await expect(otherTreasury.write.cancelRound([roundId])).to.be.rejected;
      await expect(treasury.write.cancelRound([roundId])).to.be.rejected;
      await treasury.write.settleRound([
        roundId,
        first.account.address,
        second.account.address,
        third.account.address,
      ]);
      expect((await treasury.read.getRound([roundId])).status).to.equal(2);
    });

    it("allows each participant exactly one refund after operator cancellation", async function () {
      const { treasury, publicClient, entryFee, first, other, roundId } = await deployFixture();
      await enter(treasury.address, first, roundId, entryFee);
      const otherTreasury = await hre.viem.getContractAt("ColorMatchRushTreasury", treasury.address, {
        client: { wallet: other },
      });

      await expect(otherTreasury.write.refundEntry([roundId])).to.be.rejected;
      await time.increaseTo((await treasury.read.getRound([roundId])).endsAt);
      await treasury.write.cancelRound([roundId]);
      await expect(otherTreasury.write.refundEntry([roundId])).to.be.rejected;

      const before = await publicClient.getBalance({ address: first.account.address });
      const refundHash = await (await hre.viem.getContractAt("ColorMatchRushTreasury", treasury.address, {
        client: { wallet: first },
      })).write.refundEntry([roundId]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: refundHash });
      const after = await publicClient.getBalance({ address: first.account.address });
      const refundGasCost = receipt.gasUsed * receipt.effectiveGasPrice;

      expect(receipt.status).to.equal("success");
      expect(after - before).to.equal(entryFee - refundGasCost);
      expect(await treasury.read.hasRefunded([roundId, first.account.address])).to.equal(true);
      expect((await treasury.read.getRound([roundId])).totalPool).to.equal(0n);
      expect(await publicClient.getBalance({ address: treasury.address })).to.equal(0n);
      await expect((await hre.viem.getContractAt("ColorMatchRushTreasury", treasury.address, {
        client: { wallet: first },
      })).write.refundEntry([roundId])).to.be.rejected;
    });
  });

  it("keeps round creation, entry, and settlement gas within the measured MVP budget", async function () {
    const { treasury, owner, first, second, third, entryFee, roundId } = await deployFixture();
    await enter(treasury.address, first, roundId, entryFee);
    await enter(treasury.address, second, roundId, entryFee);
    await enter(treasury.address, third, roundId, entryFee);
    await time.increaseTo((await treasury.read.getRound([roundId])).endsAt);

    const createGas = await treasury.estimateGas.createRound([600], {
      account: owner.account.address,
    });
    await treasury.write.createRound([600]);
    const nextRoundId = await treasury.read.currentRoundId();
    const enterGas = await treasury.estimateGas.joinRound([nextRoundId], {
      account: first.account.address,
      value: entryFee,
    });
    const settleGas = await treasury.estimateGas.settleRound([
      roundId,
      first.account.address,
      second.account.address,
      third.account.address,
    ], {
      account: owner.account.address,
    });

    expect(createGas).to.be.greaterThan(0n);
    expect(enterGas).to.be.greaterThan(0n);
    expect(settleGas).to.be.greaterThan(0n);
    expect(createGas).to.be.lessThan(200_000n);
    expect(enterGas).to.be.lessThan(200_000n);
    expect(settleGas).to.be.lessThan(250_000n);
    console.log(`Gas estimates: createRound=${createGas}, joinRound=${enterGas}, settleRound=${settleGas}`);
  });
});
