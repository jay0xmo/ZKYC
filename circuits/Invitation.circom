pragma circom 2.0.0;

include "./InvitationChecker.circom";

component main {public [root, nullifierHash, invitee]} = InvitationChecker(10);
