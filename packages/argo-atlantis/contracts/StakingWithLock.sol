// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interface/IMintBurnToken.sol";
import "./AtlantisAddressRegistry.sol";

/**
 * @title StakingWithLock
 * @notice StakingWithLock is the contract that allows users to stake their gold tokens and receive stardust.
 */
contract StakingWithLock is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Unstake {
        uint256 amount; // Amount of stardust unstaked.
        uint256 startTime; // Time when unstake is initiated.
        uint256 claimTime; // Time where stardust is unlocked and ready for claiming.
    }

    AtlantisAddressRegistry public addressRegistry;

    // Info on user's pending or completed unstakes.
    mapping(address => Unstake[]) public unstakeInfo;

    // Addresses of gold & stardust.
    mapping(address => uint) public whitelistedContracts;
    // Unstake time
    uint256 public unstakeTime;

    // Event that triggers on staking.
    event LogStake(address indexed staker, uint256 goldAmount, uint256 timestamp);
    // Event that triggers on unstake initiation.
    event LogUnstake(address indexed staker, uint256 stardustAmount, uint256 unstakeStart, uint256 unstakeUnlocked);
    // Event that triggers when Gold is claimed after unbonding period.
    event LogClaimed(address indexed staker, uint256 claimedAmount, uint256 timestamp);
    // Event that triggers when Stardust address is set.
    event LogSetStardust(address stardust, uint256 timestamp);
    // Event that log unstake and burn
    event LogUnstakeAndBurn(address indexed staker, address indexed from, uint256 stardustAmount, uint256 burnTime);
    // Log set atlantis
    event LogSetAtlantisGemstones(address atlantis, uint256 timestamp);
    // Change unstake time event
    event LogSetUnstakeTime(uint256 unstakeTime, uint256 timestamp);
    // Set Address Registry
    event LogSetAddressRegistry(address addressRegistry);
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;

    modifier onlyAtlantisContracts() {
        _isAtlantisContracts();
        _;
    }

    function _isAtlantisContracts() internal view {
        require(
            addressRegistry.isControllerContract(msg.sender),
            "StakingWithLock: Only Atlantis contracts can call this function"
        );
    }

    /**
     * @notice Initialises StakingWithLock contract with the required addresses.
     * @param _admin address of the admin.
     */
    function __StakingWithLock_init(address _admin, AtlantisAddressRegistry _addressRegistry) external initializer {
        __ReentrancyGuard_init_unchained();
        __Context_init_unchained();
        __Pausable_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __Ownable_init_unchained();

        // _admin will be address of timelock contract.
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(PAUSER_ROLE, _admin);
        addressRegistry = _addressRegistry;
        unstakeTime = 180 days;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice View user's pending unstakes.
     */
    function getUserPendingUnstakes(address _user) external view returns (Unstake[] memory) {
        return unstakeInfo[_user];
    }

    /**
     * @notice View user's total amount of Gold that is pending unstake (includes Gold that are not yet claimed).
     */
    function getUserTotalGoldPendingUnstake(address _user) external view returns (uint256) {
        // Retrieve user's unstake information.
        Unstake[] memory userusInfo = unstakeInfo[_user];
        uint256 usLength = userusInfo.length;
        uint256 totalGoldPendingUnstake;
        // Check unstakeInfo mapping for any unstakes that have passed claimTime and add those specific unstakes' Gold amount to claimableAmount.
        for (uint256 i = 0; i < usLength; i++) {
            Unstake memory usInfo = userusInfo[i];
            uint256 amount = usInfo.amount;
            totalGoldPendingUnstake += amount;
        }

        return totalGoldPendingUnstake - getUserClaimableGold(_user);
    }

    /**
     * @notice View user's claimable Gold.
     */
    function getUserClaimableGold(address _user) public view returns (uint256) {
        // Initialise claimable Gold to 0.
        uint256 claimableAmount;

        // Retrieve user's unstake information.
        Unstake[] memory userusInfo = unstakeInfo[_user];
        uint256 usLength = userusInfo.length;

        // Check unstakeInfo mapping for any unstakes that have passed claimTime and add those specific unstakes' Gold amount to claimableAmount.
        for (uint256 i = 0; i < usLength; i++) {
            Unstake memory usInfo = userusInfo[i];
            uint256 claimTime = usInfo.claimTime;
            uint256 amount = usInfo.amount;
            if (claimTime < block.timestamp) {
                claimableAmount += amount;
            }
        }

        return claimableAmount;
    }

    /* ========== ADMIN CONFIGURATION ========== */

    /**
     * @notice Set Atlantis Registry
     * @param _addressRegistry address of Atlantis Registry
     */
    function setAtlantisRegistry(AtlantisAddressRegistry _addressRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        addressRegistry = _addressRegistry;
        emit LogSetAddressRegistry(address(addressRegistry));
    }

    /**
     * @notice Pauses contract.
     * @dev Can only be called by pauser role.
     */
    function pauseContract() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses contract.
     * @dev Can only be called by pauser role.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Stake gold tokens in exchange for stardust tokens.
     * @param _amount amount of gold tokens to stake.
     */
    function stake(uint256 _amount) external nonReentrant whenNotPaused returns (bool) {
        // Stake amount must be > 0.
        require(_amount > 0, "StakingWithLock: Nothing to deposit");

        IERC20Upgradeable gold = IERC20Upgradeable(addressRegistry.getGold());
        IMintBurnToken stardust = IMintBurnToken(addressRegistry.getStardust());

        // Receive user's Gold tokens.
        gold.safeTransferFrom(msg.sender, address(this), _amount);

        // Mint stardust tokens to user at 1:1 ratio.
        stardust.mint(msg.sender, _amount);

        emit LogStake(msg.sender, _amount, block.timestamp);
        return true;
    }

    /**
     * @notice Initiate unstake of stardust tokens which will require unstaking period before claiming.
     * @param _amount amount of stardust tokens to unstake.
     */
    function unstake(uint256 _amount) external nonReentrant whenNotPaused returns (bool) {
        // Unstake amount must be > 0.
        require(_amount > 0, "StakingWithLock: Nothing to unstake");

        IMintBurnToken stardust = IMintBurnToken(addressRegistry.getStardust());

        // Save unstake details.
        Unstake memory usInfo = Unstake(_amount, block.timestamp, block.timestamp + unstakeTime);
        unstakeInfo[msg.sender].push(usInfo);

        // Receive user's stardust.
        stardust.transferFrom(msg.sender, address(this), _amount);

        // Burn all of user's Stardust.
        stardust.burn(_amount);

        emit LogUnstake(msg.sender, _amount, block.timestamp, block.timestamp + unstakeTime);
        return true;
    }

    /**
     * @notice Function to claim after the unstaking period of Stardust.
     */
    function claim() external nonReentrant whenNotPaused returns (bool) {
        IERC20Upgradeable gold = IERC20Upgradeable(addressRegistry.getGold());

        // Initialise claimable Gold to 0.
        uint256 claimableAmount;
        Unstake[] memory stillUnstaking;
        // Retrieve user's unstake information.
        Unstake[] storage userusInfo = unstakeInfo[msg.sender];
        uint256 usLength = userusInfo.length;
        stillUnstaking = new Unstake[](usLength);
        // Check unstakeInfo mapping for any unstakes that have passed claimTime and add those specific unstakes' Gold amount to claimableAmount.
        for (uint256 i = 0; i < usLength; i++) {
            Unstake storage usInfo = userusInfo[i];
            uint256 claimTime = usInfo.claimTime;
            uint256 amount = usInfo.amount;
            if (claimTime < block.timestamp) {
                claimableAmount += amount;
            } else {
                // Push unstake details that have yet to pass claim time into stillUnstaking.
                // This is used for reconstruction later.
                stillUnstaking[i] = Unstake(amount, usInfo.startTime, claimTime);
            }
        }

        // Delete all unstake details of the user.
        delete unstakeInfo[msg.sender];

        // Reconstruct user's unstake details.
        uint256 length = stillUnstaking.length;
        for (uint256 i = 0; i < length; i++) {
            if (stillUnstaking[i].startTime != 0) {
                unstakeInfo[msg.sender].push(stillUnstaking[i]);
            }
        }
        delete stillUnstaking;
        // Check that user has something to claim.
        require(claimableAmount > 0, "StakingWithLock: Nothing to claim");

        // Check sufficient gold balance for transfer.
        require(
            claimableAmount <= IERC20Upgradeable(gold).balanceOf(address(this)),
            "StakingWithLock: Insufficient balance, check back later"
        );

        // Returns user's gold.
        IERC20Upgradeable(gold).safeTransfer(msg.sender, claimableAmount);

        emit LogClaimed(address(msg.sender), claimableAmount, block.timestamp);

        return true;
    }

    // Instant unstake and burn only for atlantis related contracts
    function unstakeAndBurn(uint256 _amount) external onlyAtlantisContracts {
        IMintBurnToken stardust = IMintBurnToken(addressRegistry.getStardust());
        IMintBurnToken gold = IMintBurnToken(addressRegistry.getGold());

        // Unstake amount must be > 0.
        require(_amount > 0, "StakingWithLock: Nothing to unstake");

        // Receive user's stardust.
        stardust.transferFrom(tx.origin, address(this), _amount);

        // Burn all of user's stardust.
        stardust.burn(_amount);
        // Burn corresponding gold
        gold.burn(_amount);

        emit LogUnstakeAndBurn(address(tx.origin), msg.sender, _amount, block.timestamp);
    }

    function setUnstakeTime(uint256 _unstakeTime) external onlyRole(DEFAULT_ADMIN_ROLE) {
        unstakeTime = _unstakeTime;
        emit LogSetUnstakeTime(_unstakeTime, block.timestamp);
    }
}
