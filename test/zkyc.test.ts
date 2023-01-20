import { ethers, network } from "hardhat";
import {
  generateHasher,
  getHasherContractFactory,
  PoseidonHasher,
} from "../helpers/poseidon";
import { IHasher, InvitationVerifier, ZKYC } from "../typechain-types";
import path from "path";
import { Groth16Prover } from "../helpers/prover";
import { generateNullifier, num2bytes32 } from "../helpers/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { zkycClient } from "../helpers/client";

describe("ZKYC Unit Test", function () {
  let hasherContract: IHasher;
  let zkycContract: ZKYC;
  let zkycVerifierContract: InvitationVerifier;

  let deployer: SignerWithAddress;
  let user0: SignerWithAddress;
  let user1: SignerWithAddress;

  let prover: Groth16Prover;
  let hasher: PoseidonHasher;

  let snapshotId: number;

  before(async () => {
    [deployer, user0, user1] = await ethers.getSigners();
    const hasherFactory = await getHasherContractFactory(2);
    hasherContract = (await hasherFactory
      .connect(deployer)
      .deploy()) as IHasher;

    zkycVerifierContract = (await (
      await ethers.getContractFactory("InvitationVerifier")
    ).deploy()) as InvitationVerifier;

    const wasmPath = path.join(
      __dirname,
      "../circuits/build/Invitation_js/Invitation.wasm"
    );
    const zkeyPath = path.join(__dirname, "../circuits/build/Invitation.zkey");
    prover = new Groth16Prover(wasmPath, zkeyPath);

    const ZKYCFactory = await ethers.getContractFactory("ZKYC");
    zkycContract = (await ZKYCFactory.deploy()) as ZKYC;

    hasher = await generateHasher();
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send("evm_snapshot");
  });

  afterEach(async () => {
    await network.provider.send("evm_revert", [snapshotId]);
  });

  describe("초기 멤버 등록 과정", () => {
    let client: zkycClient;

    beforeEach(async () => {
      client = new zkycClient(prover, zkycContract);
    });

    it("nullfier0을 알고 있다면, join할 수 있는지 검증", async () => {
      const invi0 = await client.invite();
      const invi1 = await client.invite();

      await zkycContract.initialize(
        hasherContract.address,
        zkycVerifierContract.address,
        [invi0.invitation, invi1.invitation]
      );

      const letter = await client.join(user0.address, invi0.nullifier);
      await zkycContract.connect(user0).join(letter);

      expect(await zkycContract.balanceOf(user0.address)).to.be.eq(1);
    });

    it("revert case : wrong nullifierHash", async () => {
      const invi0 = await client.invite();
      const invi1 = await client.invite();

      await zkycContract.initialize(
        hasherContract.address,
        zkycVerifierContract.address,
        [invi0.invitation, invi1.invitation]
      );

      const letter = await client.join(user0.address, invi0.nullifier);
      // corrupt nullifierHash
      letter.nullifierHash = await hasher.nullifierHash(invi1.nullifier, 0);

      await expect(zkycContract.connect(user0).join(letter)).to.be.reverted;
    });

    it("revert case : wrong root", async () => {
      const invi0 = await client.invite();
      const invi1 = await client.invite();

      await zkycContract.initialize(
        hasherContract.address,
        zkycVerifierContract.address,
        [invi0.invitation, invi1.invitation]
      );

      const letter = await client.join(user0.address, invi0.nullifier);
      // corrupt nullifierHash
      letter.root = num2bytes32(await generateNullifier());

      await expect(zkycContract.connect(user0).join(letter)).to.be.reverted;
    });

    it("revert case : already invited", async () => {
      const invi0 = await client.invite();
      const invi1 = await client.invite();

      await zkycContract.initialize(
        hasherContract.address,
        zkycVerifierContract.address,
        [invi0.invitation, invi1.invitation]
      );

      const letter = await client.join(user0.address, invi0.nullifier);

      await zkycContract.connect(user0).join(letter);

      await expect(zkycContract.connect(user0).join(letter)).to.be.reverted;
    });
  });

  describe("멤버가 다른 유저를 초대하는 과정", () => {
    let client: zkycClient;

    beforeEach(async () => {
      client = new zkycClient(prover, zkycContract);

      const invi = await client.invite();
      await zkycContract.initialize(
        hasherContract.address,
        zkycVerifierContract.address,
        [invi.invitation]
      );

      const letter = await client.join(user0.address, invi.nullifier);

      await zkycContract.connect(user0).join(letter);
    });

    it("멤버인 user0가 user1을 초대", async () => {
      const invi = await client.invite();

      await zkycContract.connect(user0).invite(invi.invitation);

      const letter = await client.join(user1.address, invi.nullifier);

      await zkycContract.connect(user1).join(letter);

      expect(await zkycContract.balanceOf(user1.address)).to.be.eq(1);
    });

    it("멤버인 user0가 MAX_INVITATION을 넘어서 발행하려고 하는 경우 실패처리한다.", async () => {
      await zkycContract
        .connect(user0)
        .invite((await client.invite()).invitation);
      await zkycContract
        .connect(user0)
        .invite((await client.invite()).invitation);
      await expect(
        zkycContract.connect(user0).invite((await client.invite()).invitation)
      ).to.be.reverted;
    });
  });
});
