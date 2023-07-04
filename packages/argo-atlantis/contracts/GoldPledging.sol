// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GoldPledging is Ownable, Pausable, ReentrancyGuard {
    // Using SafeERC20 for IERC20
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many Gold tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    // Info of Pool
    struct PoolInfo {
        uint256 lastRewardBlock; // Last block number that Rewards distribution occurs.
        uint256 accRewardPerShare; // Accumulated reward per share, times 1e12. See below.
    }

    // Gold Token
    IERC20 public gold;

    // Stardust Token
    IERC20 public stardust;

    // rewards created per block.
    uint256 public rewardPerBlock;

    uint256 public totalGold;
    // Info.
    PoolInfo public poolInfo;
    // Info of each user that stakes Gold tokens.
    mapping(address => UserInfo) public userInfo;

    // The block number when mining starts.
    uint256 public startBlock;
    // The block number when mining ends.
    uint256 public bonusEndBlock;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event PoolUpdate(uint256 accRewardPerShare, uint256 lastRewardBlock);
    event EmissionsModified(uint256 rewardPerBlock, uint256 startBlock, uint256 bonusEndBlock, uint256 lastRewardBlock);

    constructor(address _gold, address _stardust, uint256 _rewardPerBlock, uint256 _startBlock, uint256 _endBlock) {
        // Require both gold and stardust to not be the zero address
        require(_gold != address(0), "GoldPledging: gold address cannot be 0x0");
        require(_stardust != address(0), "GoldPledging: stardust address cannot be 0x0");
        stardust = IERC20(_stardust);
        gold = IERC20(_gold);
        // Require the end block to be greater than the start block
        require(_endBlock > _startBlock, "GoldPledging: endBlock must be greater than startBlock");
        // Require that startBlock cannot be in the past
        require(block.number < _startBlock, "GoldPledging: startBlock must be in the future");
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _endBlock;

        // staking pool
        poolInfo = PoolInfo({ lastRewardBlock: startBlock, accRewardPerShare: 0 });
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) internal view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return _to - _from;
        } else if (_from >= bonusEndBlock) {
            return 0;
        } else {
            return bonusEndBlock - _from;
        }
    }

    // View function to see pending Tokens on frontend.
    function pendingReward(address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo;
        UserInfo storage user = userInfo[_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 stakedSupply = totalGold;
        if (block.number > pool.lastRewardBlock && stakedSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 tokenReward = multiplier * rewardPerBlock;
            accRewardPerShare = accRewardPerShare + ((tokenReward * 1e12) / stakedSupply);
        }
        return (user.amount * accRewardPerShare) / 1e12 - user.rewardDebt;
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.number <= poolInfo.lastRewardBlock) {
            return;
        }
        uint256 goldSupply = totalGold;
        if (goldSupply == 0) {
            poolInfo.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(poolInfo.lastRewardBlock, block.number);
        uint256 tokenReward = multiplier * rewardPerBlock;

        poolInfo.accRewardPerShare = poolInfo.accRewardPerShare + ((tokenReward * 1e12) / goldSupply);
        poolInfo.lastRewardBlock = block.number;
        emit PoolUpdate(poolInfo.accRewardPerShare, poolInfo.lastRewardBlock);
    }

    // Deposit Gold tokens to farm Stardust
    function deposit(uint256 _amount) external nonReentrant whenNotPaused {
        UserInfo storage user = userInfo[msg.sender];

        updatePool();
        totalGold += _amount;
        if (user.amount > 0) {
            uint256 pending = (user.amount * poolInfo.accRewardPerShare) / 1e12 - user.rewardDebt;
            if (pending > 0) {
                stardust.safeTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            gold.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount + _amount;
        }
        user.rewardDebt = (user.amount * poolInfo.accRewardPerShare) / 1e12;

        emit Deposit(msg.sender, _amount);
    }

    // Withdraw Gold tokens
    function withdraw(uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > 0, "amount 0");
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "withdraw: not enough");

        updatePool();
        totalGold -= _amount;
        uint256 pending = (user.amount * poolInfo.accRewardPerShare) / 1e12 - user.rewardDebt;

        if (pending > 0) {
            stardust.safeTransfer(msg.sender, pending);
        }

        if (_amount > 0) {
            gold.safeTransfer(address(msg.sender), _amount);
            user.amount = user.amount - _amount;
        }
        user.rewardDebt = (user.amount * poolInfo.accRewardPerShare) / 1e12;

        emit Withdraw(msg.sender, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw() public {
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        gold.safeTransfer(address(msg.sender), amount);
        emit EmergencyWithdraw(msg.sender, amount);
    }

    // Modify rate of Stardust farming.
    function modifyEmissions(uint256 _rewardPerBlock, uint256 _startBlock, uint256 _endBlock) external onlyOwner {
        // Check that the start block is greater than the current block
        require(block.number < _startBlock, "GoldPledging: startBlock must be in the future");
        // Check that endBlock is greater than startBlock
        require(_endBlock > _startBlock, "GoldPledging: endBlock must be greater than startBlock");
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _endBlock;
        poolInfo.lastRewardBlock = startBlock;
        emit EmissionsModified(rewardPerBlock, startBlock, bonusEndBlock, poolInfo.lastRewardBlock);
    }

    // Pause from Pausable
    function pause() external onlyOwner {
        _pause();
    }

    // Unpause from Pausable
    function unpause() external onlyOwner {
        _unpause();
    }
}
