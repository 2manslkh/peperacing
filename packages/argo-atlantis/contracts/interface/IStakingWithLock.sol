// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;


interface IStakingWithLock {
     function unstakeAndBurn(uint256 _amount) external;

}
