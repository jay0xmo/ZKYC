## ZKYC, Zero-Knowledge Yacht Club

### Objective

해당 리파짓토리는 영지식 증명(ZK-SNARKS)를 활용하여, 간단한 NFT DApp(Decentralized Application)을 구현하는 것을 목표로 합니다. 토네이도 캐시의 Mixer 아이디어를 바탕으로,
초대자가 누구인지를 익명으로 하는 멤버십 NFT를 설계하였습니다.

### Concept: `Secret Invitation Membership`

ZKYC 클럽 멤버들은 ZKYC 클럽에 어울리는 사람들은 초대할 수 있어요. 다만 어떤 멤버가 초대했는지 알게 된다면, 초대한 사람이 누구인지에 따라 그 사람을 판단하게 되겠지요. 그래서, ZKYC에서는 영지식
증명을 활용해, `누가 초대했는지를 알 수 없는` 멤버십 NFT를 만들려고 합니다.

### Features

1. 익명화된 초대권
    * 멤버들은 누가 초대했는지를 알 수 없어요.
2. 이중 사용 방지
    * 한 번 사용된 초대권은 더 이상 사용할 수 없어요.
3. 초대권 갯수 제한
    * 한 명의 멤버에게 할당된 초대권에는 제한이 있어요.
4. 계정 귀속(Soul-Bounded Token)
    * 해당 멤버십 토큰은 다른 누구에게 전송하거나 팔 수 없어요.
    * 하나의 계정에는 하나의 멤버십 토큰만 소유할 수 있어요.

### User Flows

* 초대하는 사람 (`inviter`)이 초대장을 만드는 과정

    1. inviter은 `Nullifier` 값을 랜덤하게 추출해요.
        * 이 정보는 invitee에게만 노출해야 합니다. 이 값을 알게 되면, 누가 초대했는지를 대번에 알 수 있어요.

    2. commitmentHash 함수를 통해 암호화된 `nullifier`을 `invitation`이라 합니다. 이 값을 ZKYC 컨트랙트에 등록하여, 초대권을 발행합니다.
        * `invitation = commitmentHash(nullifier) = poseidonHash(nullifier, 0)`
        * 이후, 초대장의 소유 여부를 증명할 때 사용합니다.

    3. inviter는 발행된 초대권이 유효한 초대권인지를 증명하는 Proof와 이중 사용을 방지하기 위한 `nullifierHash`를 생성합니다.
        * 발행된 초대권이 유효한 초대권인지를 증명하는 Proof을 구성합니다.
            * invitation이 머클 트리에 존재했는지 여부
            * invitation이 해당 유저에게 제공하는 것이 맞는지 여부
        * 발급 후, 해당 초대장이 2번 사용되지 않도록, `nullifierHash` 값을 통해 사용 여부를 체크합니다.
        * 그리고 해당 초대장이 내가 제공한 invitee 외에는 쓸 수 없도록
        * `nullifierHash = poseidonHash(nullifier, 1, invitation Index)`

    4. 초청에 필요한 모든 정보는(`Proof` / `root` / `nullifierHash`)를 Letter이라 하겠습니다.이 값을 내가 초대하고 싶은 사람(`invitee`)에게 전달합니다.


* 초청받은 사람 (`invitee`)이 멤버십에 가입하는 과정

    1. invitee는 inviter에게 `Letter`를 전달 받습니다.
    2. join 함수를 호출하여, 멤버십을 발급받습니다.

### pre-requirements

* [circom2](https://docs.circom.io/)

  ZK-SNARKs의 회로(circuit)를 컴파일 하기 위해, circuit 컴파일러인 circom2을 활용하고 있습니다.

### installations

1. 패키지 설치하기

````shell
yarn install
````

2. 컨트랙트 컴파일하기

   ZKYC 컨트랙트를 컴파일합니다. `typechain-types` 폴더에 typechain이 등록됩니다.

````shell
yarn build:contract
````

3. 서킷 컴파일하기

   총 3단계의 작업을 순차대로 수행합니다
    1. 서킷 컴파일 (r1cs / wasm)
    2. trusted setup 수행
    3. Solidity Verifier 생성

````shell
yarn build:circuit
````

4. 테스트 수행하기

````shell
yarn test
````

### References

- [How to create a Zero Knowledge DApp: From zero to production](https://vivianblog.hashnode.dev/how-to-create-a-zero-knowledge-dapp-from-zero-to-production)
- [영지식 증명을 활용한 프라이버시 토큰 (ZK-ERC20) 구현](https://medium.com/onther-tech/%EC%98%81%EC%A7%80%EC%8B%9D-%EC%A6%9D%EB%AA%85%EC%9D%84-%ED%99%9C%EC%9A%A9%ED%95%9C-%ED%94%84%EB%9D%BC%EC%9D%B4%EB%B2%84%EC%8B%9C-%ED%86%A0%ED%81%B0-zk-erc20-%EA%B5%AC%ED%98%84-14fa69b49418)
- [tornado-cash](https://github.com/tornadocash)
- [poseidon-tornado](https://github.com/ChihChengLiang/poseidon-tornado) 
