// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMintBurnToken is IERC20 {
    function mint(address to, uint256 amount) external returns (bool);

    function burn(uint256 amount) external returns (bool);
}
