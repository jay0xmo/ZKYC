declare module "circomlibjs";

import { BytesLike } from "@ethersproject/bytes";

export interface PoseidonContract {
  createCode(nInputs: number): BytesLike;

  generateABI(nInputs: number): string;
}
