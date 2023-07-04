// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./common/AddressRegistry.sol";

contract AtlantisAddressRegistry is Ownable, AddressRegistry {
    bytes32 private constant ARGONAUTS = "ARGONAUTS";
    bytes32 private constant ARGO = "ARGO";
    bytes32 private constant XARGO = "XARGO";
    bytes32 private constant GOLD = "GOLD";
    bytes32 private constant STARDUST = "STARDUST";
    bytes32 private constant ATLANTIS = "ATLANTIS";
    bytes32 private constant ATLANTIS_PLANETS = "ATLANTIS_PLANETS";
    bytes32 private constant STAKING_WITH_LOCK = "STAKING_WITH_LOCK";
    bytes32 private constant ATLANTIS_GEMSTONES = "GEMSTONES";
    bytes32 private constant ATLANTIS_EQUIPMENTS = "EQUIPMENTS";
    bytes32 private constant ATLANTIS_SPACESHIPS = "SPACESHIPS";
    bytes32 private constant ATLANTIS_RACING = "RACING";
    bytes32 private constant ATLANTIS_MARKETPLACE = "MARKETPLACE";
    bytes32 private constant ATLANTIS_AUCTION = "AUCTION";
    bytes32 private constant STARDUST_PLEDGING = "PLEDGING";
    bytes32 private constant GOLD_STAKING = "GOLD_STAKING";
    mapping(address => bool) private _addresses;

    function setArgonauts(address contractAddress) external onlyOwner {
        _setAddress(ARGONAUTS, contractAddress);
    }

    function setArgo(address contractAddress) external onlyOwner {
        _setAddress(ARGO, contractAddress);
    }

    function setXargo(address contractAddress) external onlyOwner {
        _setAddress(XARGO, contractAddress);
    }

    function setGold(address contractAddress) external onlyOwner {
        _setAddress(GOLD, contractAddress);
    }

    function setStardust(address contractAddress) external onlyOwner {
        _setAddress(STARDUST, contractAddress);
    }

    function setAtlantis(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS, contractAddress);
    }

    function setAtlantisPlanets(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS_PLANETS, contractAddress);
    }

    function setStakingWithLock(address contractAddress) external onlyOwner {
        _setAddress(STAKING_WITH_LOCK, contractAddress);
    }

    function setGemstones(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS_GEMSTONES, contractAddress);
    }

    function setEquipments(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS_EQUIPMENTS, contractAddress);
    }

    function setSpaceships(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS_SPACESHIPS, contractAddress);
    }

    function setRacing(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS_RACING, contractAddress);
    }

    function setMarketplace(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS_MARKETPLACE, contractAddress);
    }

    function setAuction(address contractAddress) external onlyOwner {
        _setAddress(ATLANTIS_AUCTION, contractAddress);
    }

    function setPledging(address contractAddress) external onlyOwner {
        _setAddress(STARDUST_PLEDGING, contractAddress);
    }

    function setGoldStaking(address contractAddress) external onlyOwner {
        _setAddress(GOLD_STAKING, contractAddress);
    }

    function getArgonauts() external view returns (address) {
        return getAddress(ARGONAUTS);
    }

    function getArgo() external view returns (address) {
        return getAddress(ARGO);
    }

    function getXargo() external view returns (address) {
        return getAddress(XARGO);
    }

    function getGold() external view returns (address) {
        return getAddress(GOLD);
    }

    function getStardust() external view returns (address) {
        return getAddress(STARDUST);
    }

    function getAtlantis() public view returns (address) {
        return getAddress(ATLANTIS);
    }

    function getAtlantisPlanets() public view returns (address) {
        return getAddress(ATLANTIS_PLANETS);
    }

    function getStakingWithLock() external view returns (address) {
        return getAddress(STAKING_WITH_LOCK);
    }

    function getGemstones() public view returns (address) {
        return getAddress(ATLANTIS_GEMSTONES);
    }

    function getEquipments() public view returns (address) {
        return getAddress(ATLANTIS_EQUIPMENTS);
    }

    function getSpaceships() external view returns (address) {
        return getAddress(ATLANTIS_SPACESHIPS);
    }

    function getRacing() external view returns (address) {
        return getAddress(ATLANTIS_RACING);
    }

    function getMarketplace() external view returns (address) {
        return getAddress(ATLANTIS_MARKETPLACE);
    }

    function getAuction() external view returns (address) {
        return getAddress(ATLANTIS_AUCTION);
    }

    function getPledging() external view returns (address) {
        return getAddress(STARDUST_PLEDGING);
    }

    function getGoldStaking() external view returns (address) {
        return getAddress(GOLD_STAKING);
    }

    function isControllerContract(address _contractAddress) external view returns (bool) {
        if (
            _contractAddress == getAtlantis() ||
            _contractAddress == getGemstones() ||
            _contractAddress == getAtlantisPlanets() ||
            _contractAddress == getEquipments()
        ) {
            return true;
        }
        return false;
    }
}
