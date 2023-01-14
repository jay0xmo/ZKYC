// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

interface IHasher {
    function poseidon(bytes32[2] calldata input) external pure returns (bytes32);

    function poseidon(uint256[2] calldata input) external pure returns (uint256);
}

