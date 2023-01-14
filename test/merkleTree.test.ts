import { ethers } from "hardhat";
import {
  generateHasher,
  getHasherContractFactory,
  PoseidonHasher,
} from "../helpers/poseidon";
import {
  IHasher,
  MerkleTreeVerifier,
  MockMerkleTree,
} from "../typechain-types";
import { generateNullifier, num2bytes32 } from "../helpers/utils";
import { expect } from "chai";
import { MerkleTree } from "../helpers/merkleTree";
import path from "path";
import { Groth16Prover } from "../helpers/prover";
import { SEED_PHRASE } from "../helpers/constants";

describe("MerkleTree Contract", function () {
  let level = 20;
  let hasherContract: IHasher;
  let merkleTreeContract: MockMerkleTree;
  let merkleTreeVerifierContract: MerkleTreeVerifier;
  let merkleTree: MerkleTree;
  let prover: Groth16Prover;
  let hasher: PoseidonHasher;

  before(async () => {
    const [deployer] = await ethers.getSigners();
    const hasherFactory = await getHasherContractFactory(2);
    hasherContract = (await hasherFactory
      .connect(deployer)
      .deploy()) as IHasher;

    const wasmPath = path.join(
      __dirname,
      "../circuits/build/MerkleTree_js/MerkleTree.wasm"
    );
    const zkeyPath = path.join(__dirname, "../circuits/build/MerkleTree.zkey");
    prover = new Groth16Prover(wasmPath, zkeyPath);

    const MerkleTreeFactory = await ethers.getContractFactory("MockMerkleTree");
    merkleTreeContract = (await MerkleTreeFactory.deploy()) as MockMerkleTree;
    merkleTreeContract.initialize(SEED_PHRASE, level, hasherContract.address);
    merkleTreeVerifierContract = (await (
      await ethers.getContractFactory("MerkleTreeVerifier")
    ).deploy()) as MerkleTreeVerifier;

    hasher = await generateHasher();
    merkleTree = new MerkleTree(level, hasher);
  });

  describe("initialization", () => {
    it("올바르게 초기화가 되어있는지를 조회", async () => {
      let value = num2bytes32(
        (await merkleTreeContract.ZERO_VALUE()).toBigInt()
      );
      for (let i = 0; i < level; i++) {
        console.log(`${i}th hash : ${value}`);
        expect(await merkleTreeContract.zeros(i)).to.be.eq(value);
        value = await hasher.hash(value, value);
      }
    });
  });

  describe("머클트리 노드 삽입 테스트", async () => {
    it("case 1) insert 1111", async () => {
      const givenNumber = 1111;

      // GIVEN
      await merkleTree.insert(givenNumber.toString());
      await merkleTreeContract.insert(num2bytes32(givenNumber));
      const rootIndex = await merkleTreeContract.currentRootIndex();

      // WHEN
      const contractRootValue = await merkleTreeContract.roots(rootIndex);
      const clientRootValue = await merkleTree.root();

      // THEN
      expect(contractRootValue).to.be.eq(clientRootValue);
    });

    it("case 2) insert 11912", async () => {
      const givenNumber = 11912;
      // GIVEN
      await merkleTree.insert(givenNumber.toString());
      await merkleTreeContract.insert(num2bytes32(givenNumber));
      const rootIndex = await merkleTreeContract.currentRootIndex();

      // WHEN
      const contractRootValue = await merkleTreeContract.roots(rootIndex);
      const clientRootValue = await merkleTree.root();

      // THEN
      expect(contractRootValue).to.be.eq(clientRootValue);
    });
  });

  describe("머클트리 Verifier 테스트", async () => {
    it("Verification True Case 1)", async () => {
      merkleTree = new MerkleTree(level, hasher);

      const v1 = generateNullifier();
      const v2 = generateNullifier();
      const v3 = generateNullifier();

      await merkleTree.insert(v1);
      await merkleTree.insert(v2);
      await merkleTree.insert(v3);

      const { root, pathElements, pathIndices } = await merkleTree.path(0);

      const proof = await prover.prove({
        leaf: v1,
        root,
        pathElements,
        pathIndices,
      });

      const output = await merkleTreeVerifierContract.verifyProof(
        proof.a,
        proof.b,
        proof.c,
        [root]
      );
      expect(output).to.be.true;
    });

    it("Verification True Case 2)", async () => {
      merkleTree = new MerkleTree(level, hasher);

      const v1 = generateNullifier();
      const v2 = generateNullifier();
      const v3 = generateNullifier();

      await merkleTree.insert(v1);
      await merkleTree.insert(v2);
      await merkleTree.insert(v3);

      const { root, pathElements, pathIndices } = await merkleTree.path(1);

      const proof = await prover.prove({
        leaf: v2,
        root,
        pathElements,
        pathIndices,
      });

      const output = await merkleTreeVerifierContract.verifyProof(
        proof.a,
        proof.b,
        proof.c,
        [root]
      );
      expect(output).to.be.true;
    });

    it("Verification False Case 3)", async () => {
      merkleTree = new MerkleTree(level, hasher);

      const v1 = generateNullifier();
      const v2 = generateNullifier();
      const v3 = generateNullifier();

      await merkleTree.insert(v1);
      await merkleTree.insert(v2);
      await merkleTree.insert(v3);

      const { root, pathElements, pathIndices } = await merkleTree.path(1);

      const proof = await prover.prove({
        leaf: v2,
        root,
        pathElements: pathElements,
        pathIndices: pathIndices,
      });

      await merkleTree.insert("4");

      const output = await merkleTreeVerifierContract.verifyProof(
        proof.a,
        proof.b,
        proof.c,
        [await merkleTree.root()]
      );
      expect(output).to.be.false;
    });

    it("Verification False Case 4)", async () => {
      merkleTree = new MerkleTree(level, hasher);

      const v1 = generateNullifier();
      const v2 = generateNullifier();
      const v3 = generateNullifier();

      await merkleTree.insert(v1);
      await merkleTree.insert(v2);
      await merkleTree.insert(v3);

      const { root, pathElements, pathIndices } = await merkleTree.path(1);

      const proof = await prover.prove({
        leaf: v2,
        root,
        pathElements,
        pathIndices,
      });

      const output = await merkleTreeVerifierContract.verifyProof(
        proof.c,
        proof.b,
        proof.a,
        [root]
      );
      expect(output).to.be.false;
    });
  });
});
