// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ForgeToken is ERC20 {
    using ECDSA for bytes32;
    struct MintRequest {
        address to;
        uint256 amount;
        uint256 expire;
        uint256 nonce;
    }
    address public admin;
    address private signerAddress;
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor(address _signerAddress) ERC20("Forge", "FORGE") {
        signerAddress = _signerAddress;
        admin = msg.sender;
    }

    function mintWithSignature(MintRequest calldata _request, bytes calldata _signature) external {
        require(_authenticate(_request.to, _request.nonce, _signature, _request.amount), "Invalid Signature!");
        _mint(_request.to, _amount);
    }

    function bulkMintWithSignatures(MintRequest[] calldata _requests, bytes[] calldata _signatures) external {
        require(_requests.length == _signatures.length, "Invalid input length");
        for (uint256 i = 0; i < _requests.length; i++) {
            require(
                _authenticate(_requests[i].to, _requests[i].nonce, _signatures[i], _requests[i].amount),
                "Invalid Signature!"
            );
            _mint(_requests[i].to, _requests[i].amount);
        }
    }

    function _authenticate(
        address _sender,
        bytes calldata _nonce,
        bytes calldata _signature,
        uint256 _amount
    ) internal view returns (bool) {
        bytes32 _hash = keccak256(abi.encodePacked(_sender, _nonce, _amount));
        return signerAddress == ECDSA.toEthSignedMessageHash(_hash).recover(_signature);
    }

    function setSignerAddress(address _signerAddress) external onlyAdmin {
        signerAddress = _signerAddress;
    }

    function transfer(address, uint256) public pure override returns (bool) {
        revert("Transfer is disabled");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Transfer is disabled");
    }

    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }
}
