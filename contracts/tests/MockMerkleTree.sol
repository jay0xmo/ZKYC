// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

import "../MerkleTreeWithHistory.sol";

contract MockMerkleTree is MerkleTreeWithHistory {

    function initialize(
        string memory seedPhrase,
        uint32 _levels,
        address _hasher
    ) external initializer {
        __merkleTree_init(seedPhrase, _levels, _hasher);
    }

    function insert(bytes32 leaf) external returns (uint32 index) {
        return _insert(leaf);
    }
}
