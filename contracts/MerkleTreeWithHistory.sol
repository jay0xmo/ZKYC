// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

import "./interfaces/IHasher.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @notice Merkle tree
/// referenced by https://github.com/ChihChengLiang/poseidon-tornado/blob/main/contracts/Tornado.sol
contract MerkleTreeWithHistory is Initializable {
    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    string public SEED_PHRASE;

    uint256 public ZERO_VALUE;
    IHasher public hasher;

    uint32 public levels;

    // filledSubtrees and roots could be bytes32[size],
    // but using mappings makes it cheaper because it removes index range check on every interaction
    mapping(uint256 => bytes32) public filledSubtrees;
    mapping(uint256 => bytes32) public roots;
    mapping(uint256 => bytes32) public zeros;
    bytes32[] public leafs;

    uint32 public constant ROOT_HISTORY_SIZE = 100;
    uint32 public currentRootIndex = 0;
    uint32 public nextIndex = 0;

    function __merkleTree_init(
        string memory seedPhrase,
        uint32 _levels,
        address _hasher
    ) internal onlyInitializing {
        require(_levels > 0, "_levels should be greater than zero");
        require(_levels < 32, "_levels should be less than 32");
        levels = _levels;
        hasher = IHasher(_hasher);

        ZERO_VALUE = uint256(keccak256(abi.encodePacked(seedPhrase))) % FIELD_SIZE;
        SEED_PHRASE = seedPhrase;
        bytes32 currentZero = bytes32(ZERO_VALUE);
        filledSubtrees[0] = currentZero;
        zeros[0] = currentZero;

        for (uint32 i = 1; i < _levels; i++) {
            currentZero = hashLeftRight(currentZero, currentZero);
            filledSubtrees[i] = currentZero;
            zeros[i] = currentZero;
        }

        roots[0] = hashLeftRight(currentZero, currentZero);
    }

    function totalLeafs() external view returns (uint256) {
        return leafs.length;
    }

    function hashLeftRight(bytes32 left, bytes32 right) public view returns (bytes32) {
        require(uint256(left) < FIELD_SIZE, "left should be inside the field");
        require(uint256(right) < FIELD_SIZE, "right should be inside the field");
        bytes32[2] memory input;
        input[0] = left;
        input[1] = right;
        return hasher.poseidon(input);
    }

    function _insert(bytes32 leaf) internal returns (uint32 index) {
        uint32 currentIndex = nextIndex;
        require(
            currentIndex != uint32(2) ** levels,
            "Merkle tree is full. No more leafs can be added"
        );

        nextIndex += 1;
        bytes32 currentLevelHash = leaf;
        bytes32 left;
        bytes32 right;

        for (uint32 i = 0; i < levels; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros[i];

                filledSubtrees[i] = left;
            } else {
                left = filledSubtrees[i];
                right = currentLevelHash;
            }
            currentLevelHash = hashLeftRight(left, right);

            currentIndex /= 2;
        }

        currentRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        roots[currentRootIndex] = currentLevelHash;
        leafs.push(leaf);
        return nextIndex - 1;
    }

    function isKnownRoot(bytes32 root) public view returns (bool) {
        if (root == 0) return false;

        uint32 i = currentRootIndex;
        do {
            if (root == roots[i]) return true;
            if (i == 0) i = ROOT_HISTORY_SIZE;
            i--;
        }
        while (i != currentRootIndex);
        return false;
    }
}
