import { BigNumberish } from "ethers";
// @ts-ignore
import { groth16 } from "snarkjs";

export interface Groth16Proof {
  a: [BigNumberish, BigNumberish];
  b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
  c: [BigNumberish, BigNumberish];
}

export class Groth16Prover {
  private readonly wasmPath: string;
  private readonly zkeyPath: string;

  constructor(wasmPath: string, zkeyPath: string) {
    this.wasmPath = wasmPath;
    this.zkeyPath = zkeyPath;
  }

  async prove(input: any): Promise<Groth16Proof> {
    const { proof } = await groth16.fullProve(
      input,
      this.wasmPath,
      this.zkeyPath
    );
    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
    };
  }
}
