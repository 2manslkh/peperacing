// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Atlantis Gold Contract
/// @author Kratos
contract Gold is ERC20 {
    event Minted(address to, uint256 amount);
    uint256 public INITIAL_SUPPLY = 10_000_000_000 ether;

    constructor() ERC20("GOLD", "GOLD") {
        // Mint initial supply to contract creator
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice  Burn `amount` tokens and decreasing the total supply.
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external returns (bool) {
        _burn(_msgSender(), amount);
        return true;
    }
}
