#!/bin/bash

## Variable to store the name of the circuit
CIRCUIT=Invitation
BUILD_DIR=./circuits/build
RESOURCE_DIR=./circuits/resources

# Variable to store the number of the ptau file
PTAU=14

# In case there is a circuit name as an input
if [ "$1" ]; then
    CIRCUIT=$1
fi

# In case there is a ptau file number as an input
if [ "$2" ]; then
    PTAU=$2
fi

# Check if the RESOURCE_DIR ptau file already exists. If it does not exist, it will be downloaded from the data center
mkdir -p ${BUILD_DIR}
if [ -f ${RESOURCE_DIR}/powersOfTau28_hez_final_${PTAU}.ptau ]; then
    echo "----- powersOfTau28_hez_final_${PTAU}.ptau already exists -----"
else
    echo "----- Download powersOfTau28_hez_final_${PTAU}.ptau -----"
    wget -P ${RESOURCE_DIR} https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PTAU}.ptau
fi

# Compile the circuit
mkdir -p ${BUILD_DIR}

echo "----- Compile the circuit: ${CIRCUIT} -----"
circom circuits/${CIRCUIT}.circom --r1cs --wasm --sym --c -o ${BUILD_DIR}

echo "----- Generate .zkey file -----"
# Generate a .zkey file that will contain the proving and verification keys
# together with all phase 2 contributions
snarkjs groth16 setup ${BUILD_DIR}/${CIRCUIT}.r1cs ${RESOURCE_DIR}/powersOfTau28_hez_final_${PTAU}.ptau ${BUILD_DIR}/${CIRCUIT}_0000.zkey

echo "----- Contribute to the phase 2 of the ceremony -----"
RANDOM_TEXT=$(openssl rand -base64 512)
snarkjs zkey contribute ${BUILD_DIR}/${CIRCUIT}_0000.zkey ${BUILD_DIR}/${CIRCUIT}.zkey --name="${CIRCUIT} CREATOR" -v -e="${RANDOM_TEXT}"

echo "----- Generate Solidity verifier -----"
# Generate a Solidity verifier that allows verifying proofs on Ethereum blockchain
snarkjs zkey export solidityverifier ${BUILD_DIR}/${CIRCUIT}.zkey contracts/${CIRCUIT}Verifier.sol
sed -i '' -e "s/contract Verifier/contract ${CIRCUIT}Verifier/g" contracts/${CIRCUIT}Verifier.sol
