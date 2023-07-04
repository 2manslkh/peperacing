// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Argonauts Mint Contract
contract MockWCRO is ERC20 {
    constructor() ERC20("MockWCRO", "mWCRO") {}

    function devMint(uint256 _amount) external {
        _mint(tx.origin, _amount);
    }
}
