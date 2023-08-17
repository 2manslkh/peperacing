// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "solmate/src/tokens/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialBalance_
    ) ERC20(name_, symbol_, decimals_) {
        _mint(msg.sender, initialBalance_);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

}