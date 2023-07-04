// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAtlantisGemstones } from "./IAtlantisGemstones.sol";
import { IAtlantisPlanets } from "./IAtlantisPlanets.sol";
import { AtlantisLib } from "../common/AtlantisLib.sol";

interface IAtlantis {
    /**
     * The nft staked must belong to an approved collection
     */
    error NFTCollectionNotWhitelisted();

    /**
     * The length of tokenIds should not be 0
     */
    error TokenIdInputEmpty();

    /**
     * The length of tokenIds and collectionAddress must be the same
     */
    error ArrayLengthMismatch();

    /**
     * Expeditton in progress
     */
    error ExpeditionInProgress();

    /**
     * Not the owner of the expedition
     */
    error NotOwnerOfExpedition();

    /**
     * Expedition already ended
     */
    error ExpeditionAlreadyEnded();
    /**
     * Invalid expedition input
     */
    error InvalidExpeditionInput();
    /**
     * Invalid gemstone rate input
     */
    error InvalidSetGemstoneRateInput();
    /**
     * Invalid inputs while setting NFTGemstoneMultiplier
     */
    error InvalidSetNFTGemstoneMultiplierInput();
    /**
     * Invalid inputs while setting RarityMultiplier
     */
    error InvalidSetRarityMultiplierInput();
    /**
     * @notice Expedition struct
     * @param collectionAddresses addresses of collections that corresponds to tokenIds array
     * @param tokenIds Array of tokenIds for boosting expedition rewards
     * @param id Id of expedition
     * @param planetId Id of planet which expedition was started with
     * @param startTime Start time of the expedition
     * @param endTime End time of the expedition
     * @param owner Address of user who started expedition
     * @param hasEnded Shows whether expedition has ended or not
     */
    struct Expedition {
        address[] collectionAddresses;
        uint256[] tokenIds;
        uint256 id;
        uint256 planetId;
        uint256 startTime;
        uint256 endTime;
        address owner;
        bool hasEnded;
    }

    function startExpedition(
        uint256 _planetId,
        address[] memory _collectionAddresses,
        uint256[] memory _tokenIds
    ) external payable;

    function endExpeditions(uint256[] memory _expeditionIds) external;

    function claimRewards(uint256[] memory _expeditionIds) external payable;

    function getExpeditionInfo(uint256 _expeditionId) external view returns (Expedition memory);

    function setExpeditionDuration(uint256 _duration) external;

    /**
     * @notice Event emitted when expedition is started
     * @param user Address of user who started expedition
     * @param expeditionId Id of expedition
     * @param planetId Id of planet which expedition was started with
     * @param tokenIds Array of tokenIds for boosting expedition rewards
     * @param collectionAddresses addresses of collections that corresponds to tokenIds array
     * @param startTime Start time of the expedition
     * @param endTime End time of the expedition
     */
    event ExpeditionStarted(
        address indexed user,
        uint256 indexed expeditionId,
        uint256 planetId,
        uint256[] tokenIds,
        address[] collectionAddresses,
        uint256 startTime,
        uint256 endTime
    );

    /**
     * @notice Event emitted when expedition is ended
     * @param user Address of user who ended expedition
     * @param expeditionId Id of expedition
     * @param timeEnded Time when expedition ended
     */
    event ExpeditionEnded(address indexed user, uint256 indexed expeditionId, uint256 timeEnded);
    /**
     * @notice Event emitted when rewards are claimed
     * @param user Address of user who started expedition
     * @param expeditionId Id of expedition
     * @param gemstoneId Id of gemstone claimed as rewards
     * @param gemstoneGenerated Amount of gemstone returned from this expedition
     * @param stardust Amount of stardust returned from this expedition
     * @param startTime Start time of the expedition
     * @param endTime End time of the expedition
     */
    event RewardsClaimed(
        address indexed user,
        uint256 indexed expeditionId,
        uint256 indexed gemstoneId,
        uint256 gemstoneGenerated,
        uint256 stardust,
        uint256 startTime, // New startTime of the expedition
        uint256 endTime // New endTime of the expedition
    );

    /**
     * @notice Event emitted when expedition duration is changed
     * @param newDuration New duration of expedition
     */
    event ExpeditionDurationUpdated(uint256 newDuration);

    /**
     * @notice Event emitted when whitelisted collections are updated
     * @param collections Array of whitelisted collections
     * @param isWhitelisted Bool to show if collection is whitelisted or not
     */
    event WhitelistedCollectionsUpdated(address[] collections, bool isWhitelisted);

    /**
     * @notice Event emitted when gemstone rate is updated
     * @param _levels Array of levels
     * @param _rates Array of rates
     */
    event GemstoneRateUpdated(uint8[] _levels, uint256[] _rates);

    /**
     * @notice Event emitted when NFTGemstoneMultiplier is updated
     * @param newMultipliers Array of multipliers
     */
    event NFTGemstoneMultiplierUpdated(uint256[] newMultipliers);

    /**
     * @notice Event emitted when RarityMultiplier is updated
     * @param newMultipliers Array of multipliers
     */
    event RarityMultiplierUpdated(uint256[] newMultipliers);

    /**
     * @notice Event emitted when BaseStardustRate is updated
     * @param newRate New rate
     */
    event BaseStardustRateUpdated(uint256 newRate);

    /**
     * @notice Event emitted when level parameter is updated
     * @param newParameter New parameter
     */
    event LevelParameterUpdated(uint256 newParameter);

    /**
     * @notice Event emitted when rarity parameter is updated
     * @param newParameter New parameter
     */
    event RarityParameterUpdated(uint256 newParameter);

    /**
     * @notice Event emitted when registry is updated
     * @param newRegistry New registry address
     */
    event AddressRegistryUpdated(address newRegistry);

    /**
     * @notice Event emitted when tax fee is updated
     * @param newFee New tax fee
     */
    event TaxFeeUpdated(uint256 newFee);

    /**
     * @notice Event emitted when treasury is updated
     * @param newTreasury New treasury address
     */
    event TreasuryUpdated(address newTreasury);
}
