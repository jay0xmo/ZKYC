import { ZKYC } from "../typechain-types";
import { BigNumberish } from "ethers";
import { MerkleTree } from "./merkleTree";
import { generateHasher, PoseidonHasher } from "./poseidon";
import { Groth16Prover } from "./prover";
import { generateNullifier } from "./utils";

/**
 * ZKYC Client
 *
 * - join : helper method for interacting with ZKYC.join method
 * - invite : helper method for interacting with ZKYC.invite method
 */
export class zkycClient {
  private hasher?: PoseidonHasher;
  private merkleTree?: MerkleTree;

  constructor(
    private readonly prover: Groth16Prover,
    private readonly zkyc: ZKYC
  ) {}

  /**
   * `ZKYC.join` TX에 필요한 파라미터 생성
   *
   * @param nullifier
   */
  async join(nullifier: BigNumberish) {
    // 1. 컨트랙트로부터 데이터를 받아와, 머클트리 구성
    //    ( invitation 정보를 순서대로 넣어서, 현재 컨트랙트의 머클트리 상태와 동기화 )
    const merkleTree = await this.syncTree();

    // 2. nullifier를 통해 invitation 값 추출
    const invitation = merkleTree.hasher.commitmentHash(nullifier);

    // 3. invitation의 index 계산
    const index = merkleTree.getIndexByElement(invitation);

    // 4. 머클트리 경로 계산 ( 머클트리에 invitation이 존재함을 증명 )
    let { root, pathElements, pathIndices } = await merkleTree.path(index);
    root = root.toString();

    // 5. 무효화 해시 값 계산 ( nullifier의 이중 사용 방지 )
    const nullifierHash = await merkleTree.hasher.nullifierHash(
      nullifier,
      index
    );

    // 6. proof 생성
    const proof = await this.prover.prove({
      nullifier,
      nullifierHash,
      root,
      pathElements,
      pathIndices,
    });

    // 7. public input인 nullifierHash와 root + proof 구성
    return {
      nullifierHash,
      root,
      proof,
    };
  }

  /**
   * `ZKYC.invite` TX에 필요한 파라미터 생성
   */
  async invite() {
    const hasher = await generateHasher();

    // 1. nullifier 값 생성
    //    Inviter와 Invitee만 알아야 합니다.
    const nullifier = generateNullifier();

    // 2.
    const invitation = hasher.commitmentHash(nullifier);

    return {
      nullifier,
      invitation,
    };
  }

  async resetTree() {
    this.hasher = await generateHasher();
    this.merkleTree = new MerkleTree(
      await this.zkyc.levels(),
      this.hasher!,
      await this.zkyc.SEED_PHRASE()
    );
  }

  private async syncTree() {
    if (!this.merkleTree) {
      await this.resetTree();
    }

    const total = await this.zkyc.totalInvitations().then((e) => e.toNumber());
    const treeNodes = this.merkleTree?.totalElements!;

    for (let i = treeNodes; i < total; i++) {
      const invitation = await this.zkyc.invitation(i);
      await this.merkleTree!.insert(invitation);
    }

    return this.merkleTree!;
  }
}
