// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interface/IAtlantis.sol";
import "./AtlantisAddressRegistry.sol";

/// @title Atlantis - Expedition contract
/// @dev Send your Argonauts and Planets on an expedition to earn rewards in terms of Stardust tokens and gemstones!
contract Atlantis is Ownable, ERC721Holder, IAtlantis, ReentrancyGuard {
    using SafeERC20 for IERC20;
    /// @notice Atlantis address registry, which allows contracts to keep track of the latest deployed addresses at all times.
    AtlantisAddressRegistry public addressRegistry;
    /// @notice Base rate of stardust per expedition
    uint256 public baseStardustRate = 115 ether;
    /// @notice Level parameter
    uint256 public levelParameter = 1;
    /// @notice Rarity parameter
    uint256 public rarityParameter = 20;
    /// @notice Mapping of level to Gemstone rate
    mapping(uint8 => uint256) public gemstoneRate;
    /// @notice Mapping of NFTs staked to gemstone multiplier
    uint256[4] public nftGemstoneMultiplier;
    /// @notice Array of orbit to rarity multiplier
    uint256[4] public rarityMultiplier;
    /// @notice Mapping of address to boolean whitelisted status
    mapping(address => bool) public whitelistedCollections;
    /// @notice Mapping of user address to array of Expedition struct
    mapping(uint256 => Expedition) public expeditions;
    /// @notice Variable to track current Expedition id
    uint256 public currentExpeditionId = 0;
    /// @notice Variable to track expedition duration
    uint256 public expeditionDuration = 7 days;
    /// @notice Denominator used for calculation
    uint256 public constant DENOMINATOR = 100;
    /// @notice Tax fee for going on expeditions
    uint256 public taxFee = 0.25 ether;
    /// @notice EOA for treasury
    address public treasury;

    /**
     * @notice Constructor for Atlantis Expedition
     * @param _registry Address registry contract
     * @param _treasury Address of EOA treasury
     */
    constructor(AtlantisAddressRegistry _registry, address _treasury) {
        // Set address registry
        addressRegistry = _registry;
        // Set treasury
        // Check that treasury is not address(0)
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        // Get argonaut address from registry
        address argonautAddress = addressRegistry.getArgonauts();
        // Initialise whitelisted collection with Argonauts
        whitelistedCollections[argonautAddress] = true;
    }

    // --------------------- PUBLIC FUNCTINOS ---------------------

    /**
     * @notice Starts an Atlantis Expedition
     * @dev NFTs sent on expedition must be whitelisted
     * @param _planetId PlanetId of planets to send NFTs on expedition
     * @param _collectionAddresses Collection Addresses of nfts to send on expedition
     * @param _tokenIds TokenIds of nfts to send on expedition
     */
    function startExpedition(
        uint256 _planetId,
        address[] memory _collectionAddresses,
        uint256[] memory _tokenIds
    ) external payable {
        require(msg.value == taxFee, "Invalid tax fee");
        IAtlantisPlanets atlantisPlanets = IAtlantisPlanets(addressRegistry.getAtlantisPlanets());
        // Tax fee ether to treasury
        (bool success, ) = payable(treasury).call{ value: taxFee }("");
        require(success, "Transfer failed");
        // Get planetLevel from planetId
        uint8 planetLevel = atlantisPlanets.getPlanetDetails(_planetId).level;
        // REVERT: If _collectionAddresses.length != _tokenIds.length
        if (_collectionAddresses.length != _tokenIds.length) {
            revert InvalidExpeditionInput();
        }
        // REVERT: If staked NFTs is more than limit
        if (_collectionAddresses.length > calculateNFTsStakable(planetLevel)) {
            revert InvalidExpeditionInput();
        }
        // Record the expedition
        expeditions[currentExpeditionId] = Expedition({
            collectionAddresses: _collectionAddresses,
            tokenIds: _tokenIds,
            id: currentExpeditionId,
            planetId: _planetId,
            startTime: block.timestamp,
            endTime: block.timestamp + expeditionDuration,
            owner: msg.sender,
            hasEnded: false
        });

        // Increment currentExpeditionId
        currentExpeditionId++;
        // Transfer Planet NFT to this contract
        atlantisPlanets.safeTransferFrom(msg.sender, address(this), _planetId);
        // Transfer Staked NFTs to this contract
        for (uint256 i; i < _collectionAddresses.length; i++) {
            // Check if collection address is whitelisted
            if (!whitelistedCollections[_collectionAddresses[i]]) {
                revert NFTCollectionNotWhitelisted();
            }
            IERC721(_collectionAddresses[i]).safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
        }
        // Emit event
        emit ExpeditionStarted(
            msg.sender,
            currentExpeditionId - 1,
            _planetId,
            _tokenIds,
            _collectionAddresses,
            block.timestamp,
            block.timestamp + expeditionDuration
        );
    }

    /**
     * @notice Starts multiple expeditions without boosting NFTs
     * @param _planetIds PlanetId of planets to send NFTs on expedition
     */
    function startMultipleExpeditions(uint256[] memory _planetIds) external payable {
        // Check that _planetIds is not empty
        require(_planetIds.length > 0, "Invalid planetIds");
        require(msg.value == taxFee * _planetIds.length, "Invalid tax fee");
        IAtlantisPlanets atlantisPlanets = IAtlantisPlanets(addressRegistry.getAtlantisPlanets());
        // Tax fee ether to treasury
        (bool success, ) = payable(treasury).call{ value: taxFee * _planetIds.length }("");
        require(success, "Transfer failed");
        // Create empty arrays for collectionAddresses and tokenIds outside the loop
        address[] memory emptyCollectionAddresses = new address[](0);
        uint256[] memory emptyTokenIds = new uint256[](0);

        for (uint256 i; i < _planetIds.length; ) {
            // Record the expedition
            expeditions[currentExpeditionId] = Expedition({
                collectionAddresses: emptyCollectionAddresses,
                tokenIds: emptyTokenIds,
                id: currentExpeditionId,
                planetId: _planetIds[i],
                startTime: block.timestamp,
                endTime: block.timestamp + expeditionDuration,
                owner: msg.sender,
                hasEnded: false
            });

            // Increment currentExpeditionId
            currentExpeditionId++;
            // Transfer Planet NFT to this contract
            atlantisPlanets.safeTransferFrom(msg.sender, address(this), _planetIds[i]);
            // Emit event
            emit ExpeditionStarted(
                msg.sender,
                currentExpeditionId - 1,
                _planetIds[i],
                emptyTokenIds,
                emptyCollectionAddresses,
                block.timestamp,
                block.timestamp + expeditionDuration
            );
            unchecked {
                i++;
            }
        }
    }

    /**
     * @notice Stops an Atlantis Expedition
     * @param _expeditionId ExpeditionId of expedition to stop
     * @dev - Must be called by the owner of the expedition
     *      - Must be called after the expedition has ended (block.timestamp > block.timestamp)
     *      - Must be called before the expedition has been claimed (hasEnded == false)
     */
    function _endExpedition(uint256 _expeditionId) internal {
        IAtlantisPlanets atlantisPlanets = IAtlantisPlanets(addressRegistry.getAtlantisPlanets());

        Expedition storage currentExpedition = expeditions[_expeditionId];

        // REVERT: If expedition has ended
        if (currentExpedition.hasEnded) {
            revert ExpeditionAlreadyEnded();
        }
        // REVERT: If current time is less than end time
        if (currentExpedition.endTime > block.timestamp) {
            revert ExpeditionInProgress();
        }
        // REVERT: If caller is not the owner of the expedition
        if (currentExpedition.owner != msg.sender) revert NotOwnerOfExpedition();

        // Transfer all staked NFTs back to user
        for (uint256 i; i < currentExpedition.collectionAddresses.length; i++) {
            IERC721(currentExpedition.collectionAddresses[i]).safeTransferFrom(
                address(this),
                msg.sender,
                currentExpedition.tokenIds[i]
            );
        }
        // Transfer Planet NFT back to user
        atlantisPlanets.safeTransferFrom(address(this), msg.sender, currentExpedition.planetId);
        _claimReward(_expeditionId);
        currentExpedition.hasEnded = true;

        emit ExpeditionEnded(msg.sender, _expeditionId, block.timestamp);
    }

    /**
     * @notice Ends multiple Atlantis Expeditions
     * @param _expeditionIds ExpeditionIds of expeditions to stop
     * @dev - Must be called by the owner of the expedition
     *      - Must be called after the expedition has ended (block.timestamp > block.timestamp)
     *      - Must be called before the expedition has been claimed (hasEnded == false)
     */
    function endExpeditions(uint256[] calldata _expeditionIds) external nonReentrant {
        // Loop through all expedition ids
        for (uint256 i; i < _expeditionIds.length; i++) {
            _endExpedition(_expeditionIds[i]);
        }
    }

    /**
     * @notice Claims rewards for multiple expeditions
     * @param _expeditionIds ExpeditionIds of expeditions to claim rewards for
     */
    function claimRewards(uint256[] calldata _expeditionIds) external payable nonReentrant {
        require(msg.value == taxFee * _expeditionIds.length, "Invalid tax fee");
        // Tax fee ether to treasury
        (bool success, ) = payable(treasury).call{ value: taxFee * _expeditionIds.length }("");
        require(success, "Transfer failed");
        // Loop through all expedition ids
        for (uint256 i; i < _expeditionIds.length; i++) {
            // Get expedition
            _claimReward(_expeditionIds[i]);
            Expedition memory currentExpedition = expeditions[_expeditionIds[i]];
            // Emit event
            emit ExpeditionStarted(
                msg.sender,
                _expeditionIds[i],
                currentExpedition.planetId,
                currentExpedition.tokenIds,
                currentExpedition.collectionAddresses,
                block.timestamp,
                block.timestamp + expeditionDuration
            );
        }
    }

    /**
     * @notice Claims rewards for an expedition and continues the expedition
     * @param _expeditionId ExpeditionId of expedition to claim rewards for
     * @dev - Must only be called by the owner of the expedition
     *      - Must only be called after the expedition has ended (block.timestamp > block.timestamp)
     *      - Stardust is minted to the caller
     *      - Atlantisgemstones are minted to the caller
     *      - EndDate is Updated
     */
    function _claimReward(uint256 _expeditionId) internal {
        // check if claimant is owner of expeditionId
        if (expeditions[_expeditionId].owner != msg.sender) {
            revert NotOwnerOfExpedition();
        }
        IERC20 stardust = IERC20(addressRegistry.getStardust());
        IAtlantisGemstones atlantisGemstones = IAtlantisGemstones(addressRegistry.getGemstones());
        // Get expedition
        Expedition storage expedition = expeditions[_expeditionId];
        // Require that expedition hasended = false
        if (expedition.hasEnded) {
            revert ExpeditionAlreadyEnded();
        }
        // Check if expedition has ended
        if (expedition.endTime > block.timestamp) {
            revert ExpeditionInProgress();
        }

        // Update Expedition startTime and endTime
        expeditions[_expeditionId].startTime = block.timestamp;
        expeditions[_expeditionId].endTime = block.timestamp + expeditionDuration;

        AtlantisLib.Element planetElement;
        uint256 _gemstoneGenerated;
        uint256 _stardustEarned;
        // Calculate rewards
        (_gemstoneGenerated, planetElement, _stardustEarned) = calculateRewards(_expeditionId);
        // Distribute stardust rewards
        stardust.safeTransfer(msg.sender, _stardustEarned);
        // Distribute gemstone rewards
        atlantisGemstones.mint(msg.sender, uint8(planetElement) + 1, _gemstoneGenerated);

        // Emit event
        emit RewardsClaimed(
            msg.sender,
            _expeditionId,
            uint8(planetElement) + 1,
            _gemstoneGenerated,
            _stardustEarned,
            expedition.startTime,
            expedition.endTime
        );
    }

    /**
     * @notice Get Expedition Info
     * @param _expeditionId Expedition Id
     * @return Expedition of given expeditionId
     */
    function getExpeditionInfo(uint256 _expeditionId) external view returns (Expedition memory) {
        return expeditions[_expeditionId];
    }

    /**
     * @notice Returns the amount of stardust earned
     * @param _planetLevel Level of the planet
     * @param _planetOrbit Orbit tier of the planet
     * From Spreadsheet:
     * Stardust earned per expedition =
     * (((planet_level -1) ^ 2) * level_parameter + 1) * ((planet_rarity -1) * rarity_parameter + 1) * stardust_base_rate
     * Planet orbit will always start from 1. Hence, planetOrbit which is planet_rarity, will need to + 1 to match the equation.
     */
    function calculateStardustPerExpedition(uint8 _planetLevel, uint8 _planetOrbit) public view returns (uint256) {
        // If planet level is 0, return baseStardustRate
        if (_planetLevel == 0) {
            return baseStardustRate;
        }
        // Convert _planetLevel and _planetOrbit to uint256
        uint256 __planetLevel = uint256(_planetLevel);
        uint256 __planetOrbit = uint256(_planetOrbit);
        return
            (((((__planetLevel - 1) * DENOMINATOR) ** 2 * levelParameter + DENOMINATOR ** 3) / DENOMINATOR ** 2) *
                (((__planetOrbit) * DENOMINATOR) * rarityParameter + DENOMINATOR ** 2) *
                baseStardustRate) / DENOMINATOR ** 3;
    }

    /**
     * @notice Returns the amount of Gemstones earned
     * @param _planetLevel ExpeditionId of the expedition
     * @param _planetOrbit ExpeditionId of the expedition
     * @param _amountArgonauts ExpeditionId of the expedition
     * From Spreadsheet:
     * Gemstone generated / expedition =
     * roundup(base_Gemstone_rate * planet_rarity * argonauts_Gemstone_multiplier)
     */
    function gemstoneGenerated(
        uint8 _planetLevel,
        uint8 _planetOrbit,
        uint8 _amountArgonauts
    ) public view returns (uint256) {
        uint256 _temp = gemstoneRate[_planetLevel] *
            (rarityMultiplier[_planetOrbit] * (DENOMINATOR / 10)) *
            nftGemstoneMultiplier[_amountArgonauts] *
            (DENOMINATOR / 10);

        return _roundUp(_temp);
    }

    function _roundUp(uint256 _number) internal pure returns (uint256) {
        if ((_number % (DENOMINATOR ** 2)) != 0) {
            return _number / (DENOMINATOR ** 2) + 1;
        } else {
            return _number / (DENOMINATOR ** 2);
        }
    }

    function calculateRewards(uint256 _expeditionId) public view returns (uint256, AtlantisLib.Element, uint256) {
        IAtlantisPlanets atlantisPlanets = IAtlantisPlanets(addressRegistry.getAtlantisPlanets());

        // Get expedition
        Expedition memory expedition = expeditions[_expeditionId];
        uint256 planetId = expedition.planetId;

        // Get Planet level and Orbit
        AtlantisLib.Planet memory planet = atlantisPlanets.getPlanetDetails(planetId);

        // gemstone multiplier is in terms of 100s, 1.2 = 120
        uint256 _gemstoneGenerated = gemstoneGenerated(
            planet.level,
            uint8(planet.orbit),
            uint8(expedition.tokenIds.length)
        );

        uint256 _stardustEarned = calculateStardustPerExpedition(planet.level, uint8(planet.orbit));
        // Return rewards
        return (_gemstoneGenerated, planet.element, _stardustEarned);
    }

    /**
     * @notice Returns number of NFTs that can be staked on the planet
     * @param _planetLevel Level of the planet
     */
    function calculateNFTsStakable(uint8 _planetLevel) public pure returns (uint8 nftsStakable) {
        if (_planetLevel >= 0 && _planetLevel < 20) {
            nftsStakable = 0;
        } else if (_planetLevel >= 20 && _planetLevel < 30) {
            nftsStakable = 1;
        } else if (_planetLevel >= 30 && _planetLevel < 40) {
            nftsStakable = 2;
        } else if (_planetLevel >= 40) {
            nftsStakable = 3;
        }
    }

    // -------------------- ADMIN FUNCTIONS ----------------------
    /**
     * @notice Set the duration of an expedition
     * @param _duration The duration of an expedition in seconds
     */
    function setExpeditionDuration(uint256 _duration) external onlyOwner {
        expeditionDuration = _duration;
        emit ExpeditionDurationUpdated(_duration);
    }

    /**
     * @notice Set the whitelisted status of a collection
     * @param _collectionAddresses The address of the collection
     * @param _status The whitelisted status of the collection
     * @dev Only whitelisted collections can be staked
     */
    function setWhitelistedCollections(address[] memory _collectionAddresses, bool _status) external onlyOwner {
        for (uint256 i; i < _collectionAddresses.length; i++) {
            whitelistedCollections[_collectionAddresses[i]] = _status;
        }
        emit WhitelistedCollectionsUpdated(_collectionAddresses, _status);
    }

    /**
     * @notice Set the gemstone rate for a level
     * @param _levels The level of the gemstone
     * @param _rates The rate of the gemstone
     */
    function setGemstoneRate(uint8[] memory _levels, uint256[] memory _rates) external onlyOwner {
        if (_levels.length != _rates.length) revert InvalidSetGemstoneRateInput();
        for (uint256 i; i < _levels.length; i++) {
            gemstoneRate[_levels[i]] = _rates[i];
        }
        emit GemstoneRateUpdated(_levels, _rates);
    }

    /**
     * @notice Set the gemstone multiplier for a NFT
     * @param _multipliers The multiplier of the rewards
     */
    function setNftGemstoneMultiplier(uint256[] memory _multipliers) external onlyOwner {
        if (_multipliers.length != 4) revert InvalidSetNFTGemstoneMultiplierInput();

        for (uint256 i; i < _multipliers.length; i++) {
            nftGemstoneMultiplier[i] = _multipliers[i];
        }
        emit NFTGemstoneMultiplierUpdated(_multipliers);
    }

    /**
     * @notice Set the Rarity Multiplier parameter
     */
    function setRarityMultiplier(uint256[] memory _multipliers) external onlyOwner {
        if (_multipliers.length != 4) revert InvalidSetRarityMultiplierInput();

        for (uint256 i; i < _multipliers.length; i++) {
            rarityMultiplier[i] = _multipliers[i];
        }
        emit RarityMultiplierUpdated(_multipliers);
    }

    /**
     * @notice Set the Base Stardust Rate parameter
     * @param _baseStardustRate The base stardust rewards rate
     */
    function setBaseStardustRate(uint256 _baseStardustRate) external onlyOwner {
        baseStardustRate = _baseStardustRate;
        emit BaseStardustRateUpdated(_baseStardustRate);
    }

    /**
     * @notice Set the level parameter
     * @param _levelParameter The level parameter for rewards
     */
    function setLevelParameter(uint256 _levelParameter) external onlyOwner {
        levelParameter = _levelParameter;
        emit LevelParameterUpdated(_levelParameter);
    }

    /**
     * @notice Set the rarity parameter
     * @param _rarityParameter The rarity parameter for rewards
     */
    function setRarityParameter(uint256 _rarityParameter) external onlyOwner {
        rarityParameter = _rarityParameter;
        emit RarityParameterUpdated(_rarityParameter);
    }

    /**
     * @notice Set the Address Registry
     * @param _addressRegistry The address of the Address Registry
     */
    function setAddressRegistry(AtlantisAddressRegistry _addressRegistry) external onlyOwner {
        addressRegistry = _addressRegistry;
        emit AddressRegistryUpdated(address(_addressRegistry));
    }

    /**
     * @notice Set the expedition tax fee
     * @param _taxFee The amount tax fee
     */
    function setTaxFee(uint256 _taxFee) external onlyOwner {
        taxFee = _taxFee;
        emit TaxFeeUpdated(_taxFee);
    }

    /**
     * @notice Function to withdraw any ERC20 tokens from the contract
     * @param _tokenAddress The token address to withdraw
     * @param _amount Amount to withdraw
     */
    function withdrawERC20(address _tokenAddress, uint256 _amount) external onlyOwner {
        IERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
    }

    /**
     * @notice Set the treasury address
     * @param _treasury Address of treasury
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
}
