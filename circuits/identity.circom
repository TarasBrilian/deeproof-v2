pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template DeeproofIdentity() {
    signal input userId; 
    signal input trapdoor;

    signal input minKycLevel;
    signal input userKycLevel;

    signal output identityCommitment;

    userKycLevel === minKycLevel;
    component hasher = Poseidon(2);
    hasher.inputs[0] <== userId;
    hasher.inputs[1] <== trapdoor;

    identityCommitment <== hasher.out;
}

component main {public [minKycLevel]} = DeeproofIdentity();