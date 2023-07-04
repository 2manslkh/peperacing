// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./interface/IAtlantisSpaceships.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./common/SetUtils.sol";
import "./interface/IAtlantisRacing.sol";
import "./AtlantisAddressRegistry.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Atlantis - Racing contract
/// @dev Send your Spaceships to race for rewards. Add supported Nft collections to boost speed and earn a larger share of the rewards.
contract AtlantisRacing is IAtlantisRacing, Ownable, IERC721Receiver, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using SetUtils for EnumerableSet.UintSet;
    using SafeERC20 for IERC20;

    /// @notice Address registry contract
    AtlantisAddressRegistry public addressRegistry;
    /// @notice Unix timestamp of season end time
    uint256 public seasonEndTime;
    /// @notice Total reward per second
    uint256 public totalRewardPerSecond;
    /// @notice Precision factor for calculations
    uint256 public immutable ACC_TOKEN_PRECISION;
    /// @notice Unix timestamp of season start time
    uint256 public seasonStartTime;
    /// @notice Max limit of Nfts staked in all pools
    uint256 public constant MAX_NFTS_STAKED = 15;
    /// @notice Number of pools
    uint256 internal constant amountOfPools = 4;
    /// @notice Whether the season has started
    bool public seasonStarted = false;
    /// @notice Information of each respective pool (Global, Common, Uncommon, Rare/Epic)
    mapping(uint256 => PoolInfo) public poolInfo;
    /// @notice Information of each user that stakes spaceships
    mapping(address => UserInfo) public userInfo;
    /// @notice Cached speed
    mapping(uint256 => uint256) public cachedSpeeds;
    /// @notice Multiplier when a user stakes Nfts
    uint256[6] public nftMultiplier;
    /// @notice Mapping of (user) => (tokenId) => (bool) if token is staked
    mapping(address => mapping(uint256 => bool)) public stakedSpaceships;
    /// @notice Mapping of (user) => (PoolId) => address => (EnumerableSet of NFT tokenIds) Number of NFTs staked in each pool
    mapping(address => mapping(uint8 => mapping(address => EnumerableSet.UintSet))) internal stakedNFTs;

    /// @notice Mapping of address to boolean whitelisted status
    mapping(address => bool) public whitelistedCollections;
    /// @notice All tokenIds currently staked
    mapping(address => mapping(uint8 => EnumerableSet.UintSet)) internal currentlyStakedSpaceshipIds;
    /// @notice All tokenIds currently staked
    mapping(address => EnumerableSet.UintSet) internal currentlyStakedIds;
    /// @notice All tokenIds previously staked
    mapping(address => EnumerableSet.UintSet) internal previouslyStakedIds;

    /**
     * @notice Constructor for Atlantis Racing
     * @param _registry Address registry contract
     * @param _totalRewardPerSecond Total stardust per second
     * @param _seasonEndTime Season end time
     */
    constructor(
        AtlantisAddressRegistry _registry,
        uint256 _totalRewardPerSecond,
        uint256 _seasonEndTime,
        uint256[] memory _nftMultipliers
    ) {
        require(_nftMultipliers[0] == 10, "Invalid nft multipliers");
        require(_seasonEndTime > block.timestamp, "Invalid season end time");
        for (uint256 i; i < _nftMultipliers.length; i++) {
            nftMultiplier[i] = _nftMultipliers[i];
        }
        // Set total stardust per second
        totalRewardPerSecond = _totalRewardPerSecond;

        addressRegistry = _registry;
        // Global race pool, 22.5% of total
        poolInfo[0].poolType = 0;
        poolInfo[0].rewardPerSecond = (_totalRewardPerSecond * 225) / 1000;
        poolInfo[0].stardustWeightage = 80;
        poolInfo[0].goldWeightage = 20;
        poolInfo[0].lastRewardTime = block.timestamp;
        poolInfo[0].accStardustPerPoint = 0;
        poolInfo[0].totalPoints = 0;
        poolInfo[0].totalCount = 0;

        // Common race pool, 45% of total
        poolInfo[1].poolType = 1;
        poolInfo[1].rewardPerSecond = (_totalRewardPerSecond * 45) / 100;
        poolInfo[1].stardustWeightage = 80;
        poolInfo[1].goldWeightage = 20;
        poolInfo[1].lastRewardTime = block.timestamp;
        poolInfo[1].accStardustPerPoint = 0;
        poolInfo[1].totalPoints = 0;
        poolInfo[1].totalCount = 0;

        // Uncommon race pool, 25% of total
        poolInfo[2].poolType = 2;
        poolInfo[2].rewardPerSecond = (_totalRewardPerSecond * 25) / 100;
        poolInfo[2].stardustWeightage = 80;
        poolInfo[2].goldWeightage = 20;
        poolInfo[2].lastRewardTime = block.timestamp;
        poolInfo[2].accStardustPerPoint = 0;
        poolInfo[2].totalPoints = 0;
        poolInfo[2].totalCount = 0;

        // Rare + Epic race pool, 7.5% of total
        poolInfo[3].poolType = 3;
        poolInfo[3].rewardPerSecond = (_totalRewardPerSecond * 75) / 1000;
        poolInfo[3].stardustWeightage = 80;
        poolInfo[3].goldWeightage = 20;
        poolInfo[3].lastRewardTime = block.timestamp;
        poolInfo[3].accStardustPerPoint = 0;
        poolInfo[3].totalPoints = 0;
        poolInfo[3].totalCount = 0;

        // Scratch generation cut off date
        seasonEndTime = _seasonEndTime;
        ACC_TOKEN_PRECISION = 10 ** 18;

        // Get argonauts from registry
        address argonauts = addressRegistry.getArgonauts();
        // Set whitelisted collections
        whitelistedCollections[argonauts] = true;
    }

    /**
        onlyOwner functions >:]
    */

    /**
     * @notice Setter for season end time
     * @param _time season end time in unix timestamp
     */
    function setSeasonEndTime(uint256 _time) public onlyOwner {
        require(_time > block.timestamp, "Season end time must be in the future");
        seasonEndTime = _time;
        _massUpdatePools();
        emit SeasonEndTimeChanged(_time);
    }

    /**
     * @notice Starts the season
     */
    function startSeason() external onlyOwner {
        require(!seasonStarted, "Season already started");
        require(block.timestamp < seasonEndTime, "Season already ended");
        uint256 currentTime = block.timestamp;
        seasonStartTime = currentTime;
        seasonStarted = true;
        // Update last reward time
        for (uint256 i; i < amountOfPools; i++) {
            poolInfo[i].lastRewardTime = currentTime;
        }
        emit StartSeason(currentTime);
    }

    /**
     * @notice Ends the season early
     */
    function endSeason() external onlyOwner {
        require(seasonStarted, "Season not started");
        require(block.timestamp < seasonEndTime, "Season already ended");
        uint256 currentTime = block.timestamp;
        seasonEndTime = currentTime;
        _massUpdatePools();
        emit EndSeason(currentTime);
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
     * @notice Used to retrieve any stardust on the contract
     */
    function retrieveStardust() external onlyOwner {
        IERC20 stardust = IERC20(addressRegistry.getStardust());
        uint256 total = stardust.balanceOf(address(this));
        stardust.safeTransfer(msg.sender, total);
        emit EmergencyWithdrawStardust(total);
    }

    /**
     * @notice Used to retrieve any gold on the contract
     */
    function retrieveGold() external onlyOwner {
        IERC20 gold = IERC20(addressRegistry.getGold());
        uint256 total = gold.balanceOf(address(this));
        gold.safeTransfer(msg.sender, total);
        emit EmergencyWithdrawGold(total);
    }

    /**
     * @notice Stake spaceships to earn stardust + gold
     * @param _ids The ids of the spaceships to stake
     */
    function stakeSpaceships(uint256[] memory _ids) external nonReentrant {
        require(block.timestamp < seasonEndTime, "Season already ended");
        IAtlantisSpaceships spaceships = IAtlantisSpaceships(addressRegistry.getSpaceships());
        // Harvest any pending rewards
        if (seasonStarted) {
            _massUpdatePools();
            for (uint8 i; i < amountOfPools; i++) {
                _harvest(i, msg.sender);
            }
        }
        for (uint256 i; i < _ids.length; i++) {
            AtlantisLib.Rarity _type = spaceships.getRarity(_ids[i]);
            // Convert spaceship type to uint256
            uint8 _spaceshipRarity = uint8(_type) + 1;
            // If spaceship type is 4, it is an epic and in same pool as rare, so we set it to 3
            if (_spaceshipRarity == 4) {
                _spaceshipRarity = 3;
            }
            uint256 _speed = spaceships.getSpeed(_ids[i]) * 10;
            cachedSpeeds[_ids[i]] = _speed;
            require(_speed > 0, "Spaceship speed cannot be 0");
            currentlyStakedSpaceshipIds[msg.sender][_spaceshipRarity].add(_ids[i]);
            //Take Token and Transfer to Contract for Holding
            IERC721(address(spaceships)).safeTransferFrom(msg.sender, address(this), _ids[i]);
            // Increase to free pool and increase to protected pool
            if (userInfo[msg.sender].boostingNftsPoolCount[_spaceshipRarity] == 0) {
                _increasePoolAndUserStats(_speed, 0, msg.sender, false);
                _increasePoolAndUserStats(_speed, _spaceshipRarity, msg.sender, false);
            } else {
                uint256 _multiplier = nftMultiplier[userInfo[msg.sender].boostingNftsPoolCount[_spaceshipRarity]];
                _increasePoolAndUserStats((_speed * _multiplier) / 10, 0, msg.sender, false);
                _increasePoolAndUserStats((_speed * _multiplier) / 10, _spaceshipRarity, msg.sender, false);
            }
            stakedSpaceships[msg.sender][_ids[i]] = true;
            userInfo[msg.sender].spaceshipsStaked++;
            emit Stake(msg.sender, _ids[i], _speed);
        }
        _updateRewardDebts(msg.sender);
    }

    /**
     * @notice Unstake spaceships
     * @param _ids The ids of the spaceships to unstake
     */
    function unstakeSpaceships(uint256[] calldata _ids) external nonReentrant {
        IAtlantisSpaceships spaceships = IAtlantisSpaceships(addressRegistry.getSpaceships());

        require(userInfo[msg.sender].spaceshipsStaked >= _ids.length, "Not enough spaceships staked");
        // Harvest any pending rewards
        if (seasonStarted) {
            _massUpdatePools();
            for (uint8 i; i < amountOfPools; i++) {
                _harvest(i, msg.sender);
            }
        }

        for (uint256 i; i < _ids.length; i++) {
            // if id found in stakedSpaceships, unstake it
            uint256 _id = _ids[i];
            require(stakedSpaceships[msg.sender][_id], "Spaceship not staked");
            uint8 _spaceshipRarity = uint8(spaceships.getRarity(_id)) + 1;
            uint256 _speed = cachedSpeeds[_id];
            if (_spaceshipRarity == 4) {
                _spaceshipRarity = 3;
            }

            // decrease for free pool and protected pool
            if (userInfo[msg.sender].boostingNftsPoolCount[_spaceshipRarity] == 0) {
                _decreasePoolAndUserStats(_speed, 0, msg.sender, false);
                _decreasePoolAndUserStats(_speed, _spaceshipRarity, msg.sender, false);
            } else {
                uint256 _multiplier = nftMultiplier[userInfo[msg.sender].boostingNftsPoolCount[_spaceshipRarity]];
                _decreasePoolAndUserStats((_speed * _multiplier) / 10, 0, msg.sender, false);
                _decreasePoolAndUserStats((_speed * _multiplier) / 10, _spaceshipRarity, msg.sender, false);
            }

            stakedSpaceships[msg.sender][_id] = false;
            userInfo[msg.sender].spaceshipsStaked--;
            currentlyStakedSpaceshipIds[msg.sender][_spaceshipRarity].remove(_ids[i]);
            // transfer spaceship back to user
            IERC721(address(spaceships)).safeTransferFrom(address(this), msg.sender, _id);
            emit Unstaked(msg.sender, _id);
        }
        _updateRewardDebts(msg.sender);
    }

    /**
     * @notice Stakes given nfts and uses them to boost the given pool.
     * @param _pid  Id of the pool to boost
     * @param _collectionAddresses Array of collection addresses
     * @param _nfts Array of token ids to stake
     */
    function stakeNfts(
        uint8 _pid,
        address[] calldata _collectionAddresses,
        uint256[] calldata _nfts
    ) external nonReentrant {
        require(block.timestamp < seasonEndTime, "Season already ended");
        // Require pid to be 1-3 only
        require(_pid >= 1 && _pid <= 3, "Invalid pool id");
        require(_nfts.length == _collectionAddresses.length, "NFTs and collection addresses must be same length");
        if (seasonStarted) {
            _massUpdatePools();
            for (uint8 i; i < amountOfPools; i++) {
                _harvest(i, msg.sender);
            }
        }
        // Get userInfo
        UserInfo storage user = userInfo[msg.sender];

        require(user.boostingNftsCount + _nfts.length <= MAX_NFTS_STAKED, "Too many NFTs staked");
        for (uint256 i; i < _collectionAddresses.length; i++) {
            // Check whitelisted nfts
            require(whitelistedCollections[_collectionAddresses[i]], "Collection not whitelisted");
        }
        uint256 _initialNftsCount = user.boostingNftsPoolCount[_pid];
        for (uint256 i; i < _collectionAddresses.length; i++) {
            user.boostingNfts[_pid][_collectionAddresses[i]].push(_nfts[i]);

            // print currentNfts length
            user.boostingNftsPoolCount[_pid]++;
            user.boostingNftsCount++;
            _stake(_pid, _collectionAddresses[i], _nfts[i]);
        }
        uint256 _currentSpeed = user.totalSpeeds[_pid];
        uint256 _initialMultiplier = nftMultiplier[_initialNftsCount];
        uint256 _multiplier = nftMultiplier[userInfo[msg.sender].boostingNftsPoolCount[_pid]];
        _decreasePoolAndUserStats(_currentSpeed - (_currentSpeed * 10) / _initialMultiplier, 0, msg.sender, true);
        _decreasePoolAndUserStats(_currentSpeed - (_currentSpeed * 10) / _initialMultiplier, _pid, msg.sender, true);
        _currentSpeed = userInfo[msg.sender].totalSpeeds[_pid];
        _increasePoolAndUserStats((_currentSpeed * _multiplier) / 10 - _currentSpeed, 0, msg.sender, true);
        _increasePoolAndUserStats((_currentSpeed * _multiplier) / 10 - _currentSpeed, _pid, msg.sender, true);
        _updateRewardDebts(msg.sender);
        emit StakeNfts(_pid, msg.sender, _nfts.length);
    }

    /**
     * @notice Unstakes nfts without unboosting the pool
     * @param _pid  Id of the farm to unstake the nfts from
     * @param _collectionAddresses Array of nft contract addresses
     * @param _nfts Array of structs containing the nft contract and token id to unstake
     */
    function unstakeNfts(
        uint8 _pid,
        address[] calldata _collectionAddresses,
        uint256[] calldata _nfts
    ) external nonReentrant {
        require(_nfts.length == _collectionAddresses.length, "NFTs and collection addresses must be same length");
        require(_pid >= 1 && _pid <= 3, "Invalid pool id");
        if (seasonStarted) {
            _massUpdatePools();
            for (uint8 i; i < amountOfPools; i++) {
                _harvest(i, msg.sender);
            }
        }
        uint256 _initialNftsCount = userInfo[msg.sender].boostingNftsPoolCount[_pid];
        for (uint256 i; i < _collectionAddresses.length; i++) {
            _removeNftFromPool(_pid, _collectionAddresses[i], _nfts[i]);
            _unstake(_pid, _collectionAddresses[i], _nfts[i]);
        }
        uint256 _currentSpeed = userInfo[msg.sender].totalSpeeds[_pid];
        uint256 _initialMultiplier = nftMultiplier[_initialNftsCount];
        uint256 _multiplier = nftMultiplier[userInfo[msg.sender].boostingNftsPoolCount[_pid]];
        _decreasePoolAndUserStats(_currentSpeed - (_currentSpeed * 10) / _initialMultiplier, 0, msg.sender, true);
        _decreasePoolAndUserStats(_currentSpeed - (_currentSpeed * 10) / _initialMultiplier, _pid, msg.sender, true);
        _currentSpeed = userInfo[msg.sender].totalSpeeds[_pid];
        _increasePoolAndUserStats((_currentSpeed * _multiplier) / 10 - _currentSpeed, 0, msg.sender, true);
        _increasePoolAndUserStats((_currentSpeed * _multiplier) / 10 - _currentSpeed, _pid, msg.sender, true);
        _updateRewardDebts(msg.sender);
        emit UnstakeNfts(_pid, msg.sender, _nfts.length);
    }

    /**
     * @notice Get tokenIds of a given collection currently staked by specific user
     * @param _pid  Pool id
     * @param _collectionAddress  Address of the collection contract
     * @param _staker  User for whom to retrieve staked token ids
     * @return Array of tokenIds which are currently staked by the user for the given token contract
     */
    function getCurrentlyStakedTokenIds(
        uint8 _pid,
        address _collectionAddress,
        address _staker
    ) external view returns (uint256[] memory) {
        return stakedNFTs[_staker][_pid][_collectionAddress].toArray();
    }

    /**
     * @notice Get tokenIds of a given collection currently staked by any user
     * @param _collectionAddress  Address of the collection contract
     * @return Array of tokenIds which are currently staked for the given token contract
     */
    function getCurrentlyStakedTokenIds(address _collectionAddress) external view returns (uint256[] memory) {
        return currentlyStakedIds[_collectionAddress].toArray();
    }

    /**
     * @notice Get tokenIds of a given collection that have ever been staked by any user
     * @param _collectionAddress  Address of the collection contract
     * @return Array of tokenIds which have ever been staked for the given token contract
     */
    function getPreviouslyStakedTokenIds(address _collectionAddress) external view returns (uint256[] memory) {
        return previouslyStakedIds[_collectionAddress].toArray();
    }

    /**
     * @notice Harvest all rewards for msg.sender
     */
    function getRewards() external nonReentrant {
        _massUpdatePools();
        for (uint8 i; i < amountOfPools; i++) {
            _harvest(i, msg.sender);
        }
    }

    /**
     * @notice Harvest rewards for a certain poolId for msg.sender
     * @param _pid Pool id
     */
    function getReward(uint8 _pid) external nonReentrant {
        _massUpdatePools();
        _harvest(_pid, msg.sender);
    }

    /**
     * @notice View rewards for a certain poolId and user
     * @param _user  User address
     * @param _pid Pool id
     * @return rewards  Array of rewards [stardust, gold]
     */
    function viewRewards(address _user, uint8 _pid) external view returns (uint256[2] memory) {
        UserInfo storage user = userInfo[_user];
        uint256[2] memory rewards;
        uint256 currentTime = block.timestamp;
        if (currentTime >= seasonEndTime) {
            currentTime = seasonEndTime;
        }
        PoolInfo memory pool = poolInfo[_pid];
        if (!seasonStarted || pool.totalPoints == 0) {
            rewards[0] = 0;
            rewards[1] = 0;
        } else {
            uint256 accStardustPerPoint = pool.accStardustPerPoint;
            uint256 multiplier = currentTime - pool.lastRewardTime;
            uint256 total = multiplier * pool.rewardPerSecond;
            accStardustPerPoint += ((total * ACC_TOKEN_PRECISION) / pool.totalPoints);
            uint256 accStardust = (userInfo[_user].totalSpeeds[_pid] * accStardustPerPoint) / ACC_TOKEN_PRECISION;
            uint256 pending = accStardust - user.rewardDebts[_pid];
            uint256 stardustAmount = (pending * poolInfo[_pid].stardustWeightage) / 100;
            uint256 goldAmount = pending - stardustAmount;
            rewards[0] = stardustAmount;
            rewards[1] = goldAmount;
        }

        return rewards;
    }

    /**
     * @notice View the total speeds of a user across all pools
     * @param _user  User address
     * @return totalSpeeds  Array of total speeds [Global, Common, Uncommon, Rare/Epic]
     */
    function viewTotalSpeeds(address _user) external view returns (uint256[4] memory) {
        // Get userinfo memory
        UserInfo storage user = userInfo[_user];
        return user.totalSpeeds;
    }

    /**
     * @notice View number of spaceships staked by user
     * @param _user  User address
     * @return spaceshipsStaked  Number of spaceships staked
     */
    function viewSpaceshipsStaked(address _user) external view returns (uint256) {
        // Get userinfo memory
        UserInfo storage user = userInfo[_user];
        return user.spaceshipsStaked;
    }

    /**
     * @notice View number of NFTs staked by user
     * @param _pid Pool id
     * @param _collectionAddress  Address of the collection contract
     * @param _user  User address
     * @return boostingNfts Array of nft ids
     */
    function viewBoostingNfts(
        uint8 _pid,
        address _collectionAddress,
        address _user
    ) external view returns (uint256[] memory) {
        // Get userinfo storage
        UserInfo storage user = userInfo[_user];
        uint256[] storage boostingNfts = user.boostingNfts[_pid][_collectionAddress];
        uint256[] memory result = new uint256[](boostingNfts.length);
        // Copy boosting nfts to memory
        for (uint256 i = 0; i < boostingNfts.length; i++) {
            result[i] = boostingNfts[i];
        }
        return result;
    }

    /**
     * @notice View boosting nfts count in a specific pool
     * @param _user  User address
     * @param _pid Pool id
     * @return number of boosting nfts in a specific pool
     */
    function viewBoostingNftsPoolCount(address _user, uint8 _pid) external view returns (uint256) {
        // Get userinfo memory
        UserInfo storage user = userInfo[_user];
        return user.boostingNftsPoolCount[_pid];
    }

    /**
     * @notice View currently staked spaceship ids
     * @param _user  User address
     * @param _pid Pool id
     * @return spaceshipIds Array of spaceship ids
     */
    function viewCurrentlyStakedSpaceships(address _user, uint8 _pid) external view returns (uint256[] memory) {
        return currentlyStakedSpaceshipIds[_user][_pid].toArray();
    }

    /**
     * @notice View pool info
     * @param _pid Pool id
     */
    function viewPoolInfo(uint256 _pid) external view returns (PoolInfo memory) {
        return poolInfo[_pid];
    }

    /**
     * @notice Updates pool's core values
     * @param _pid The pool id
     */
    function _updatePool(uint256 _pid) internal {
        uint256 currentTime = block.timestamp;
        // Check if season is over
        if (seasonEndTime <= currentTime) {
            currentTime = seasonEndTime;
        }
        // Update based on pool type
        if (poolInfo[_pid].totalPoints > 0) {
            uint256 stardustReward = (currentTime - poolInfo[_pid].lastRewardTime) * poolInfo[_pid].rewardPerSecond;
            poolInfo[_pid].accStardustPerPoint += ((stardustReward * ACC_TOKEN_PRECISION) / poolInfo[_pid].totalPoints);
        }

        poolInfo[_pid].lastRewardTime = currentTime;
    }

    /**
     * @notice Updates all pools core values
     */
    function _massUpdatePools() internal {
        for (uint256 i; i < amountOfPools; i++) {
            _updatePool(i);
        }
    }

    /**
     * @notice Update reward debts of user
     * @param _user User address
     */
    function _updateRewardDebts(address _user) internal {
        for (uint256 i; i < amountOfPools; i++) {
            userInfo[_user].rewardDebts[i] =
                (userInfo[_user].totalSpeeds[i] * poolInfo[i].accStardustPerPoint) /
                ACC_TOKEN_PRECISION;
        }
    }

    /**
     * @notice Internal function for staking nfts
     * @param _pid The pool id to stake Nfts in
     * @param _collectionAddress The address of the collection the nft is from
     * @param _tokenId The id of the nft to stake
     */
    function _stake(uint8 _pid, address _collectionAddress, uint256 _tokenId) internal virtual {
        require(!stakedNFTs[msg.sender][_pid][_collectionAddress].contains(_tokenId), "NFT already staked");
        // Transfer ERC721 from user
        IERC721(_collectionAddress).safeTransferFrom(msg.sender, address(this), _tokenId);

        // Update stakers specific data
        stakedNFTs[msg.sender][_pid][_collectionAddress].add(_tokenId);
        // Update token specific data
        currentlyStakedIds[_collectionAddress].add(_tokenId);
        previouslyStakedIds[_collectionAddress].add(_tokenId);
    }

    /**
     * @notice Internal function for unstaking Nfts
     * @param _pid The pool id to unstake Nfts from
     * @param _collectionAddress The address of the collection the Nft is from
     * @param _tokenId The id of the Nft to unstake
     */
    function _unstake(uint8 _pid, address _collectionAddress, uint256 _tokenId) internal virtual {
        require(_isTokenStaked(_pid, msg.sender, _collectionAddress, _tokenId), "NFT not staked");
        // Update tokens currently staked
        stakedNFTs[msg.sender][_pid][_collectionAddress].remove(_tokenId);
        currentlyStakedIds[_collectionAddress].remove(_tokenId);
        // Transfer ERC721 from user
        IERC721(_collectionAddress).safeTransferFrom(address(this), msg.sender, _tokenId);
    }

    /**
     * @notice Checks whether a specific token is currently staked by a specific user
     * @param _pid  Pool id
     * @param _staker  User for whom to retrieve staked token ids
     * @param _collectionAddress Address of the collection the token is from
     * @param _tokenId TokenId to check for staking
     * @return bool True if token is staked by user, false otherwise
     */
    function _isTokenStaked(
        uint8 _pid,
        address _staker,
        address _collectionAddress,
        uint256 _tokenId
    ) internal view returns (bool) {
        return stakedNFTs[_staker][_pid][_collectionAddress].contains(_tokenId);
    }

    /**
     * @notice Increase pool and user stats
     * @param _speed Speed to increase
     * @param _pid Pool id
     * @param _user User address
     * @param _nft Is boosting nft or not
     */
    function _increasePoolAndUserStats(uint256 _speed, uint8 _pid, address _user, bool _nft) internal {
        poolInfo[_pid].totalPoints += _speed;
        if (_speed > 0 && !_nft) {
            poolInfo[_pid].totalCount++;
        }
        userInfo[_user].totalSpeeds[_pid] += _speed;
    }

    /**
     * @notice Decrease pool and user stats
     * @param _speed Speed to decrease
     * @param _pid Pool id
     * @param _user User address
     * @param _nft Is boosting nft or not
     */
    function _decreasePoolAndUserStats(uint256 _speed, uint8 _pid, address _user, bool _nft) internal {
        poolInfo[_pid].totalPoints -= _speed;
        if (_speed > 0 && !_nft) {
            poolInfo[_pid].totalCount--;
        }
        userInfo[_user].totalSpeeds[_pid] -= _speed;
    }

    /**
     * @notice Internal function for harvesting rewards
     * @param _pid Pool id
     * @param _user User address
     * @return pending Pending rewards
     */
    function _harvest(uint8 _pid, address _user) internal returns (uint256 pending) {
        IERC20 gold = IERC20(addressRegistry.getGold());
        IERC20 stardust = IERC20(addressRegistry.getStardust());
        UserInfo storage user = userInfo[_user];
        uint256 oldShares = userInfo[_user].totalSpeeds[_pid];
        PoolInfo storage pool = poolInfo[_pid];
        if (oldShares > 0) {
            uint256 accStardust = (oldShares * pool.accStardustPerPoint) / ACC_TOKEN_PRECISION;
            pending = accStardust - user.rewardDebts[_pid];
        }
        if (pending > 0) {
            user.rewardDebts[_pid] = (oldShares * pool.accStardustPerPoint) / ACC_TOKEN_PRECISION;
        }
        // Split total into 80% stardust, 20% gold
        stardust.safeTransfer(_user, (pending * poolInfo[_pid].stardustWeightage) / 100);
        gold.safeTransfer(_user, (pending * poolInfo[_pid].goldWeightage) / 100);
        emit Payout(
            _pid,
            _user,
            (pending * poolInfo[_pid].goldWeightage) / 100,
            (pending * poolInfo[_pid].stardustWeightage) / 100
        );
    }

    /**
     * @dev Remove nfts from pool
     * @param _pid  Pool id
     * @param _collectionAddress Nft collection address
     * @param _tokenId  Nft id
     */
    function _removeNftFromPool(uint8 _pid, address _collectionAddress, uint256 _tokenId) internal {
        UserInfo storage user = userInfo[msg.sender];
        uint256[] storage currentNfts = user.boostingNfts[_pid][_collectionAddress];
        for (uint256 i; i < currentNfts.length; i++) {
            uint256 currentNft = currentNfts[i];
            if (currentNft == _tokenId) {
                currentNfts[i] = currentNfts[currentNfts.length - 1];
                currentNfts.pop();
                user.boostingNftsPoolCount[_pid]--;
                user.boostingNftsCount--;
                return;
            }
        }
        revert("Nft not found");
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
    }

    /**
     * @notice For receiving ERC721 tokens
     */
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
