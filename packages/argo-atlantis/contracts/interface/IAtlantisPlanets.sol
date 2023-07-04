// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Import AtlantisLib
import { AtlantisLib } from "../common/AtlantisLib.sol";

interface IAtlantisPlanets is IERC721 {
    error AuctionSettled();

    /**
     * The signature must be by the correct signer
     */
    error InvalidSignature();

    /**
     * The minting stage must be correct
     */
    error InvalidStage(uint8 currentStage, uint8 requiredStage);

    /**
     * The collection has exceeded the max supply
     */
    error ExceededMaxSupply();

    /**
     * The user has exceeded allowed mint count
     */
    error ExceedMaxMintPerWallet();

    /**
     * The planet has exceeded the max level
     */
    error ExceededMaxLevel();

    /**
     * Error thrown when user queries an unknown OrbitId
     */
    error UnknownOrbit();

    /**
     * Error thrown when user queries an unknown ElementId
     */
    error UnknownElement();

    /**
     * Error thrown when user queries an unknown PlanetId
     */
    error InvalidUpgradeLevel(uint8 currentLevel, uint8 newLevel);
    /**
     * User is not the owner of planet
     */
    error NotOwnerOfPlanet();

    error InsufficientCRO(uint256 amountPaid, uint256 amountRequired);

    error InvalidInput();

    function upgradePlanet(uint256 _tokenId, uint8 _levels) external;

    function getUpgradeCosts(
        uint256 _tokenId,
        uint8 _levels
    ) external view returns (uint256 stardustCost, uint256 xArgoCost, uint16[4] memory gemstoneRequirements);

    function getPlanetDetails(uint256 _planetId) external view returns (AtlantisLib.Planet memory);

    function setPlanetElements(uint256[] memory _tokenIds, AtlantisLib.Element[] memory _gemstoneType) external;

    function setPlanetOrbits(uint256[] memory _tokenIds, AtlantisLib.Orbit[] memory _planetsOrbit) external;
}
