// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ILeader {
    function isMinionQuesting(uint256 tokenId) external view returns (bool);
    function removeCrew(uint256 minionTokenId) external;
}