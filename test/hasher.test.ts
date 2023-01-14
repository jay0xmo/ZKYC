import { ethers } from "hardhat";
import {
  generateHasher,
  getHasherContractFactory,
  PoseidonHasher,
} from "../helpers/poseidon";
import { IHasher } from "../typechain-types";
import { num2bytes32 } from "../helpers/utils";
import { expect } from "chai";

describe("Hasher Contract(Poseidon Contract)", function () {
  describe("Contract Deploy test", function () {
    let hasherContract: IHasher;
    let hasher: PoseidonHasher;

    before(async () => {
      const [deployer] = await ethers.getSigners();
      const hasherFactory = await getHasherContractFactory(2);
      hasherContract = (await hasherFactory
        .connect(deployer)
        .deploy()) as IHasher;

      hasher = await generateHasher();
    });

    describe("컨트랙트 결과와 클라이언트 결과가 동일한지 테스트 ", async () => {
      it("case 1) left = 1, right = 1", async () => {
        const givenLeft = 1;
        const givenRight = 1;

        const contractResult = await hasherContract.functions[
          "poseidon(bytes32[2])"
        ]([num2bytes32(givenLeft), num2bytes32(givenRight)]).then((e) => e[0]);

        const clientResult = await hasher.hash(givenLeft, givenRight);

        expect(contractResult).to.be.eq(clientResult);
      });

      it("case 2) left = 1, right = 2", async () => {
        const givenLeft = 1;
        const givenRight = 2;

        const contractResult = await hasherContract.functions[
          "poseidon(bytes32[2])"
        ]([num2bytes32(givenLeft), num2bytes32(givenRight)]).then((e) => e[0]);

        const clientResult = await hasher.hash(givenLeft, givenRight);

        expect(contractResult).to.be.eq(clientResult);
      });

      it("case 3) left = 321, right = 2131", async () => {
        const givenLeft = 321;
        const givenRight = 2131;

        const contractResult = await hasherContract.functions[
          "poseidon(bytes32[2])"
        ]([num2bytes32(givenLeft), num2bytes32(givenRight)]).then((e) => e[0]);

        const clientResult = await hasher.hash(givenLeft, givenRight);

        expect(contractResult).to.be.eq(clientResult);
      });
    });
  });
});
