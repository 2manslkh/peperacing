// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IMintBurnToken {
    function mintTo(address to, uint256 amount) external returns (bool);

    function burn(uint256 amount) external returns (bool);
}
