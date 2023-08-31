// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// Import ECDSA
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ForgeToken is ERC20 {
    using ECDSA for bytes32;
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

    function mintWithSignature(uint256 _amount, bytes calldata _nonce, bytes calldata _signature ) external {
        require(
            _authenticate(msg.sender, _nonce, _signature, _amount),
            "Invalid Signature!"
        );
        _mint(msg.sender, _amount);
    }

    function _authenticate(
        address _sender,
        bytes calldata _nonce,
        bytes calldata _signature,
        uint256 _amount
    ) internal view returns (bool) {
        bytes32 _hash = keccak256(abi.encodePacked(_sender, _nonce, _amount));
        return
            signerAddress ==
            ECDSA.toEthSignedMessageHash(_hash).recover(_signature);
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
