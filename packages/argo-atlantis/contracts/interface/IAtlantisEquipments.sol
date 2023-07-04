// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

interface IAtlantisEquipments {
    // ------------------------- EVENTS --------------------------
    event FuseEquipment(address indexed _from, uint256 indexed _id, uint256 _amount, uint256 _totalSupply);
    event BaseMetadataURIUpdated(string _baseMetadataURI);
    event TokenURIUpdated(uint256 indexed _id, string _tokenURI);
    event AddressRegistryUpdated(address _address);
    event StardustCostsUpdated(uint256[] _stardustCosts);
    event GemstonesRequiredUpdated(uint16[] _gemstonesRequired);
    event EquipmentSpeedsUpdated(uint16[] _equipmentSpeeds);
    event MintCostUpdated(uint256 _mintCost);
    event PaymentModeUpdated(PaymentMode _paymentMode);
    event PaymentTokenUpdated(address _paymentToken);
    // ------------------------- ERRORS --------------------------
    error UpgradeError();
    error IdNotExistsError();

    /// @notice Enum for payment mode
    enum PaymentMode {
        CRYPTO,
        TOKEN
    }

    function fuseEquipment(uint256 _id, uint16 _amountToCreate) external;

    function calculateFusionCost(uint256 _id, uint16 _amountToCreate) external view returns (uint256);

    function fuseEquipmentsView(uint256 _id, uint16 _amountToCreate) external view returns (uint16);

    function getLevel(uint256 _id) external pure returns (uint8);

    function getSpeed(uint256 _id) external view returns (uint16);

    function setStardustCosts(uint256[] calldata _stardustCost) external;

    function getElement(uint256 _id) external pure returns (uint8);
}
