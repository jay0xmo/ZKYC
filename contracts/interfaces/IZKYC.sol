// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

import "./IVerifier.sol";

interface IZKYC {

    /*
     * InvitationLetter
     * Zero-Knowledge invitation that hides who the invitation is from
     *
     * * Whether the invitation is included in the Merkle tree
     * * Whether the
     */
    struct InvitationLetter {
        IVerifier.Proof proof;
        bytes32 root;
        bytes32 nullifierHash;
    }

    event Join(address owner, bytes32 nullifierHash);
    event Invitation(address owner, bytes32 invitation);

    // @notice The person receiving the invitation must prove that they have the invitation by proof.
    function join(InvitationLetter calldata letter) external;

    /// @notice Members must create `invitation` before inviting new members.
    ///         invitation = poseidonHash(secret, nullifier)
    ///         Before inviting, share the secret and nullifier to the invitee
    function invite(bytes32 _invitation) external;
}
