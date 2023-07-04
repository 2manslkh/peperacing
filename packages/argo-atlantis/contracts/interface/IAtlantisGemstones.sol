// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAtlantisGemstones is IERC1155 {
    error NonExistentToken();
    error OnlyAtlantisOrOwner();
    error InvalidInputAmount();
    error InvalidElement();
    error InvalidUpgrade();

    function fuseGemstones(uint8 _id, uint8 _toId, uint256 _amountToCreate) external;

    function burn(address _user, uint256 _id, uint256 _quantity) external;

    function mint(address _to, uint256 _id, uint256 _quantity) external;

    event FusionCostUpdated(uint256 _newCost);
    event BaseMetadataURIUpdated(string _newBaseMetadataURI);
    event AddressRegistryUpdated(address _newAddressRegistry);
}
