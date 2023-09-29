// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IResources.sol";

contract Sybil is Ownable {
    address[] public signers;

    constructor(address[] memory _signers) {
        signers = _signers;
    }

    function setSigners(address[] calldata _signers) external onlyOwner {
        signers = _signers;
    }

    function bulkMintWithSig(IResources.MintRequest[] calldata requests, bytes[] calldata signatures) external {
        require(requests.length == signatures.length, "Sybil: invalid input");
        for (uint256 i = 0; i < requests.length; i++) {
            IResources.MintRequest calldata request = requests[i];
            bytes calldata signature = signatures[i];
            IResources(request.to).mintWithSig(request, signature);
        }
    }
}
