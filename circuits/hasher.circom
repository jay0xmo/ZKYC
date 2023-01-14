pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template NullifierHasher(levels) {
    signal input nullifier;
    signal input pathIndices[levels];

    component leafIndexNum = Bits2Num(levels);
    for (var i = 0; i < levels; i++) {
        leafIndexNum.in[i] <== pathIndices[i];
    }


    component hasher = Poseidon(3);
    hasher.inputs[0] <== nullifier;
    hasher.inputs[1] <== 1;
    hasher.inputs[2] <== leafIndexNum.out;

    signal output out <== hasher.out;
}

template CommitmentHasher() {
    signal input nullifier;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== nullifier;
    hasher.inputs[1] <== 0;

    signal output out <== hasher.out;
}
