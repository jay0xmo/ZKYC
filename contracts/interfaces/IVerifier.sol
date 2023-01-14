// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

interface IVerifier {

    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external view returns (bool r);

}
