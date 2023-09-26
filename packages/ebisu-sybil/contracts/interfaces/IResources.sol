// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IResources {
    struct MintRequest {
        address to;
        uint256[] ids;
        uint256[] amounts;
        uint256 expire;
        uint256 nonce;
    }

    function mintWithSig(MintRequest calldata request, bytes calldata signature) external;
}
