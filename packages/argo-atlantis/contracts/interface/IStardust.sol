// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStardust is IERC20 {
    function unstake(uint256 _amount) external;
}
