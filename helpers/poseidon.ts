import { BigNumber, BigNumberish, ContractFactory, ethers } from "ethers";
// @ts-ignore
import { poseidonContract, buildPoseidon } from "circomlibjs";

/**
 * POSEIDON : A New Hash Function for Zero-Knowledge Proof Systems
 * POSEIDON uses up to 8x fewer constraints per message bit than Pedersen Hash.
 *
 * https://eprint.iacr.org/2019/458.pdf
 *
 * @param nInputs
 */
export function getHasherContractFactory(nInputs: number) {
  const bytecode = poseidonContract.createCode(nInputs);
  const abiJson = poseidonContract.generateABI(nInputs);
  const abi = new ethers.utils.Interface(abiJson);
  return new ContractFactory(abi, bytecode);
}

export async function generateHasher() {
  return new PoseidonHasher(await buildPoseidon());
}

export class PoseidonHasher {
  private readonly poseidon: any;

  constructor(poseidon: any) {
    this.poseidon = poseidon;
  }

  /**
   * CommitmentHash(invitationHash) : hash value of the invitation member create
   * > commitmentHash = Poseidon(nullifier, 0);
   *
   * 1. Member who want to create `invitation` first randomly extract `nullifier`.
   * 2. After calculating the commitmentHash value for the nullifier, register it in the `ZKYC` contract.
   * 3. Pass nullifier to the invitee
   *
   * @param nullifier secret random value Known only by the inviter and the invitee
   */
  commitmentHash(nullifier: BigNumberish) {
    const hash = this.applyHash(nullifier, 0);
    return this.encodeBytes32(hash);
  }

  /**
   * NullifierHash : hash value to track whether invitation is used
   * > nullifierHash = Poseidon(nullifier, 1, leafIndex);
   *
   * @param nullifier secret random value Known only by the inviter and the invitee
   * @param leafIndex the index of target invitation
   */
  nullifierHash(nullifier: BigNumberish, leafIndex: BigNumberish) {
    const hash = this.applyHash(nullifier, 1, leafIndex);
    return this.encodeBytes32(hash);
  }

  hash(left: BigNumberish, right: BigNumberish) {
    const hash = this.applyHash(left, right);
    return this.encodeBytes32(hash);
  }

  private applyHash(...args: BigNumberish[]) {
    return this.poseidon(args.map((x) => BigNumber.from(x).toBigInt()));
  }

  private encodeBytes32(hash: any) {
    // make the number within the field size
    const hashStr = this.poseidon.F.toString(hash);

    // make it a valid hex string
    const hashHex = BigNumber.from(hashStr).toHexString();

    // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
    return ethers.utils.hexZeroPad(hashHex, 32);
  }
}
