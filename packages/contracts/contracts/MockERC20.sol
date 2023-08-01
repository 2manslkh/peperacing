// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    event Minted(address to, uint256 amount);
    uint256 public INITIAL_SUPPLY = 10_000_000_000 ether;

    constructor() ERC20("GOLD", "GOLD") {
        // Mint initial supply to contract creator
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
