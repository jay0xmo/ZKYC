import { ethers } from "ethers";
import { FIELD_SIZE } from "./constants";
import { randomBytes } from "crypto";

export function num2bytes32(num: number | bigint) {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(num), 32);
}

export function generateZeroValue(seedPhrase: string) {
  return (
    BigInt(ethers.utils.solidityKeccak256(["string"], [seedPhrase])) %
    BigInt(FIELD_SIZE)
  ).toString();
}

/**
 * Nullifier 랜덤 추출
 * - range: 0 ~ 2^248
 */
export function generateNullifier() {
  return BigInt("0x" + randomBytes(31).toString("hex"));
}
