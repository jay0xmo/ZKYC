pragma circom 2.0.0;

include "./MerkleTreeChecker.circom";

component main {public [root]} = MerkleTreeChecker(20);
