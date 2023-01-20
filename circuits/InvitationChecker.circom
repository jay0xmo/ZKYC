pragma circom 2.0.0;

include "./hasher.circom";
include "./merkleTreeChecker.circom";

template InvitationChecker(levels) {
    signal input root;
    signal input nullifierHash;

    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component nullifierHasher = NullifierHasher(levels);
    nullifierHasher.nullifier <== nullifier;
    nullifierHasher.pathIndices <== pathIndices;
    nullifierHash === nullifierHasher.out;

    component commitmentHasher = CommitmentHasher();
    commitmentHasher.nullifier <== nullifier;

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitmentHasher.out;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    // Add hidden signals to make sure that tampering with invitee will invalidate the snark proof
    signal inviteeSquare;
    inviteeSquare <== invitee * invitee;
}
