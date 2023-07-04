// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import { AtlantisLib } from "../common/AtlantisLib.sol";

interface IAtlantisSpaceships {
    error NotOwner();
    error WrongElement();

    struct Spaceship {
        AtlantisLib.Rarity rarity;
        uint256 fireEquipmentId;
        uint256 lightningEquipmentId;
        uint256 steelEquipmentId;
    }

    struct SpaceshipData {
        Spaceship spaceship;
        uint256 speed;
    }

    function modifyEquipment(
        uint256 _spaceshipId,
        uint256 _fireEquipmentId,
        uint256 _lightningEquipmentId,
        uint256 _steelEquipmentId
    ) external;

    function getSpaceship(uint256 _tokenId) external view returns (SpaceshipData memory);

    function getSpeed(uint256 _tokenId) external view returns (uint256);

    function getRarity(uint256 _tokenId) external view returns (AtlantisLib.Rarity);
}
