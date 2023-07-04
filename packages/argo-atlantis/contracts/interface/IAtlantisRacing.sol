// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

interface IAtlantisRacing {
    /**
        Structs
    */
    struct PoolInfo {
        uint256 poolType;
        uint256 rewardPerSecond;
        uint256 stardustWeightage;
        uint256 goldWeightage;
        uint256 lastRewardTime;
        uint256 accStardustPerPoint;
        uint256 totalPoints;
        uint256 totalCount;
    }

    struct UserInfo {
        uint256[4] totalSpeeds;
        uint256[4] rewardDebts;
        uint256 spaceshipsStaked;
        mapping(uint8 => mapping(address => uint256[])) boostingNfts;
        uint256 boostingNftsCount;
        mapping(uint8 => uint8) boostingNftsPoolCount;
    }
    event Stake(address indexed user, uint256 indexed tokenID, uint256 shipScore);
    event Unstaked(address indexed user, uint256 indexed tokenID);
    event Payout(uint8 poolId, address indexed user, uint256 goldAmount, uint256 stardustAmount);
    event EmergencyWithdraw(address user, uint256 tokenID);
    event EmergencyWithdrawStardust(uint256 amount);
    event EmergencyWithdrawGold(uint256 amount);
    event StakeNfts(uint256 indexed pid, address indexed user, uint256 numOfNfts);
    event UnstakeNfts(uint256 indexed pid, address indexed user, uint256 numOfNfts);
    event SeasonEndTimeChanged(uint256 newEndTime);
    event StartSeason(uint256 startTime);
    event EndSeason(uint256 endTime);
    event AddressRegistryUpdated(address newAddressRegistry);

    /**
        Functions
    */
    function stakeSpaceships(uint256[] memory _ids) external;

    function unstakeSpaceships(uint256[] memory _ids) external;

    function stakeNfts(uint8 _pid, address[] calldata _collectionAddresses, uint256[] calldata _nfts) external;

    function unstakeNfts(uint8 _pid, address[] calldata _collectionAddresses, uint256[] calldata _nfts) external;

    function viewRewards(address _user, uint8 _poolId) external view returns (uint256[2] memory);

    function getRewards() external;

    function viewTotalSpeeds(address _user) external view returns (uint256[4] memory);

    function viewBoostingNfts(
        uint8 _pid,
        address _collectionAddress,
        address _user
    ) external view returns (uint256[] memory);

    function viewPoolInfo(uint256 _pid) external view returns (PoolInfo memory);

    function getCurrentlyStakedTokenIds(
        uint8 _pid,
        address _collectionAddress,
        address _staker
    ) external view returns (uint256[] memory);

    function getPreviouslyStakedTokenIds(address _collectionAddress) external view returns (uint256[] memory);
}
