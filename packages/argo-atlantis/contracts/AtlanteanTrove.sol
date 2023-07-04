// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title AtlanteanTrove Quest Rewards Claiming Contract
/// @author Kratos
/*
                                                  #                             
                                               .%%%%%%%%                        
                                                %%%%%%%%%,                      
                                               /%%%%%%%%%                       
                                               %%%%%%%%%%                       
                                               %%%%%%%%%(                       
                                              (%%%%%%%%%                        
                                              %%%%%%%%%#                        
                                             %%%%%%%%%%                         
                                            #%%%%%%%%%%                         
                                  *%&/ *   #%%%%%%%%%% #,.#.                    
                   .            ,         %%%%%%%%%%% .@@@#                     
                   @&@@@#,     @         %%%%%%%%%%%                            
                              @         %%%%%%%%%%%%       #,                   
                   , .       @            %%%%%%%%%%%#                          
                 ,   ,%.    .               %%%%%%%%%%% /@@@@@ *                
                   @@@@@@@@@@              * /%%%%%%@@@@( &@@@@                 
                  @@@&@        @@@/ .@*     @@%@@@%%%&@@@%  %.    @             
            @      @@@@&( @@@   @@@@@@      @@@@@@   @@.(&.       @             
           (@  / .(   %@@@@@@%(@@@@@@         @@@.%%%%%%%%%*      @@@           
           @@@  #       @//  **@@@   @      @      %&%%%#%%%%,    @@/           
           @@@   @      @             @    @        (%%%&%%%%     @@@,          
         %@@@@@  @@    @.             .    @          %%%%%/     @@@@@          
         @@@.@@@ @@@@   %@        @, (       ( @      .%%%   &@ @@@@@@          
         &@@@#@@@@/.@@@          ,               (     /%# ,@/ @@@@@@@          
        @&@@#@@*@&@@@ @@@@@&    (#.@          @@@    #  #  @  @@@@@@@@,         
        (@@@@@@@@@@@@@@ @@     &@&@@@@%     (@@@@@@@        @@@@@@@(@@@         
        @@@,@@@@*@@&@@@@.@@@ @@*@@.@*@@@@@&(@@@@@@@@@@@(   @@@@/@@@ @@          
         @@@@@@@&@%@@@@@@@@@ @/.@#@@@@@@(@@ @@@@@@*@*@@@@@@@@@..@@@.@@@(        
         @@@@@@,@@@@@%@@@ @ @.&@@@,@ @@.@@@@@/(@@@.@@@@@@@@@(@@@(@@@*@@         
         @@@@ @@@@@@#@#@.@@*@((@@&@@,#        #@&@@@@%@@@@@@,@#@@@@@@@ &        
         @@@@@@@@(@@@&@@@@@@@@@@@    ,  .,.#//(& @*@@@#@@ @@@,@@@.@@@@#         
         @@@(@@@@@@@@@@ @,@@@@@@@,@@@@@@@@@@@@@#@@/@@@@@@@@@@@@&@@@@@@          
          ,@ @@@@@@@@@@ @@@@@@@@@@@@@@@@@@@,@@#@@@@@@@@@@,@@@@@@/@@@@           
            @#@@@@(@@@ @@, @@@@@@@@*@@@@@.@@(@@@@*@ @@@@@@@@@@@@(@@             
              @@@@@@@@*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ .            
               @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&@@%@@@@/@@@@@@,@@@@&              
                @@ @@@%@@&@@.@@@@*@@@#@@@@@@@@.@@@@@@@@#%@@@@@@@@               
                  @@@@@@@@@@@@@ @@@@ @@@,(@@@@@@@@@@@@@@@#@@@ #                 
                    @@@@@@@@@@,@@@@@&@@@@@@@@@@@@@@@@@.@@@@@                    
                      @@@@@@@@@@@@@@@@@@@@@@@@@@@@@/@@@@@@                      
                        @ @@@@@@@,@@@@@@@#@@@@@@@@@ (@@@*                       
                         @@@(@@@@@ @@@*@@@@@@@@@@,@@@&&                         
                            @@@@@@@@@@ @@@@@@@@@@@@@@                           
                               @@(@@@@@@@@@@@(@@@@@@                            
                                  @.@@@@*@@&.@@@@@*      
*/

contract AtlanteanTrove is IERC1155Receiver, ReentrancyGuard {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;
    /// @notice Mapping of round to user address to their claim status
    mapping(uint256 => mapping(address => bool)) private hasClaimed;

    /// @notice Mapping of round to Round details
    mapping(uint256 => Round) public roundTime;

    /// @notice Mapping to track each round rewards
    mapping(uint256 => Reward) internal roundRewards;

    /// @notice Mapping to track each round amounts
    mapping(uint256 => Amount) internal roundAmounts;

    /// @notice Variable to track current round
    uint256 public currentRound = 0;

    /// @notice The address of the admin
    address public admin;

    /// @notice The address of the controller
    address public controller;

    /// @notice The address of the whitelist signer
    address public whitelistSignerAddress;

    /// Reward structs

    /// @notice Defines how much a single instance of claimable ERC-20 reward is worth
    struct RewardERC20 {
        address tokenAddress;
        uint256 amount;
    }

    /// @notice Defines how much a single instance of claimable ERC-721 reward is worth
    struct RewardERC721 {
        address tokenAddress;
        uint256[] tokenIds;
        uint256 index;
    }

    /// @notice Defines how much a single instance of claimable ERC-1155 reward is worth
    struct RewardERC1155 {
        address tokenAddress;
        uint256[] tokenIds;
        uint256[] amounts;
    }

    /// @notice Defines how much a single instance of total rewards claimable is worth
    struct Reward {
        RewardERC20[] erc20Rewards;
        RewardERC721[] erc721Rewards;
        RewardERC1155[] erc1155Rewards;
    }

    /// Accounting structs

    /// @notice Struct used to track amount of ERC-20 in the contract in a specific round
    struct RewardERC20Amount {
        address tokenAddress;
        uint256 amount;
    }

    /// @notice Struct used to track amount of ERC-721 in the contract in a specific round
    struct RewardERC721Amount {
        address tokenAddress;
        uint256 amount;
    }

    /// @notice Struct used to track amount of ERC-1155 in the contract in a specific round
    struct RewardERC1155Amount {
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }

    /// @notice Struct used to track amount of rewards in the contract in a specific round
    struct Amount {
        RewardERC20Amount[] erc20Amount;
        RewardERC721Amount[] erc721Amount;
        RewardERC1155Amount[][] erc1155Amount;
    }

    /// @notice Struct used for managing rewards by admin
    struct RewardData {
        uint256 round;
        RewardERC20[] erc20Rewards;
        uint256[] erc20Amounts;
        RewardERC721[] erc721Rewards;
        uint256[] erc721Amounts;
        RewardERC1155[] erc1155Rewards;
        uint256[][] erc1155Amounts;
    }

    /// @notice Struct used for managing rounds
    struct Round {
        uint256 startTime;
        uint256 expiryTimestamp;
    }

    // Events
    event SetRoundExpiry(uint256 round, uint256 expiryTimestamp);
    event SetController(address controller);
    event SetAdmin(address admin);
    event SetWhitelistSignerAddress(address whitelistSignerAddress);
    event StartNewRound(uint256 round, uint256 startTime, uint256 expiryTimestamp);
    event ClaimRewards(uint256 round, address indexed user, Amount amount);
    event AddRewards(uint256 round, RewardData rewardData);
    event RemoveRewards(uint256 round, RewardData rewardData);

    constructor(address _controller, address _whitelistSignerAddress) {
        admin = msg.sender;
        controller = _controller;
        whitelistSignerAddress = _whitelistSignerAddress;
    }

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function.");
        _;
    }

    modifier onlyController() {
        require(msg.sender == controller, "Only controller can call this function.");
        _;
    }

    // Admin functions

    /**
     * @dev Set round expiry timestamp
     * @param _round Round number
     * @param expiryTimestamp Expiry timestamp for the round
     */
    function setRoundExpiry(uint256 _round, uint256 expiryTimestamp) external onlyAdmin {
        // Round expiry can only be set in the future
        require(expiryTimestamp > block.timestamp, "Expiry timestamp must be in future.");
        // Set round expiry timestamp
        roundTime[_round].expiryTimestamp = expiryTimestamp;
        // Emit event
        emit SetRoundExpiry(_round, expiryTimestamp);
    }

    /**
     * @dev Set address of controller EOA
     * @param _controller Address of controller EOA
     */
    function setController(address _controller) external onlyAdmin {
        // Set controller address
        controller = _controller;
        // Emit event
        emit SetController(_controller);
    }

    /**
     * @dev Set address of admin EOA
     * @param _admin Address of admin EOA
     */
    function setAdmin(address _admin) external onlyAdmin {
        // Set admin address
        admin = _admin;
        // Emit event
        emit SetAdmin(_admin);
    }

    /**
     * @dev Set new whitelist signer address
     * @param _whitelistSignerAddress Address of new whitelist signer
     */
    function setWhitelistSignerAddress(address _whitelistSignerAddress) external onlyAdmin {
        // Set whitelist signer address
        whitelistSignerAddress = _whitelistSignerAddress;
        // Emit event
        emit SetWhitelistSignerAddress(_whitelistSignerAddress);
    }

    /**
     * @dev Top up rewards for a round, only for admin
     * @param data Reward data
     */
    function topUpRewards(RewardData calldata data) external onlyAdmin {
        // Handle ERC20 rewards
        if (data.erc20Rewards.length > 0) {
            _handleERC20Rewards(data);
        }
        // Handle ERC721 rewards
        if (data.erc721Rewards.length > 0) {
            _handleERC721Rewards(data);
        }
        // Handle ERC1155 rewards
        if (data.erc1155Rewards.length > 0) {
            _handleERC1155Rewards(data);
        }

        // Emit event
        emit AddRewards(data.round, data);
    }

    /**
     * @dev Remove rewards for a round, only for admin
     * @param data Reward data
     */
    function removeRewards(RewardData calldata data) external onlyAdmin {
        // Cannot remove rewards if round is already started
        require(data.round != currentRound, "Cannot modify rewards for ongoing round.");
        // Remove ERC20 rewards and transfer back to admin
        if (roundRewards[data.round].erc20Rewards.length > 0) {
            // Transfer rewards to admin
            for (uint256 i = 0; i < roundRewards[data.round].erc20Rewards.length; ) {
                IERC20(roundRewards[data.round].erc20Rewards[i].tokenAddress).safeTransfer(admin, data.erc20Amounts[i]);
                roundAmounts[data.round].erc20Amount[i].amount -= data.erc20Amounts[i];
                unchecked {
                    i++;
                }
            }

            // If round is not in the past, delete rewards
            if (data.round > currentRound) {
                delete roundRewards[data.round].erc20Rewards;
                delete roundAmounts[data.round].erc20Amount;
            }
        }
        // Remove ERC721 rewards and transfer back to admin
        if (roundRewards[data.round].erc721Rewards.length > 0) {
            // Transfer rewards to admin

            for (uint256 i = 0; i < roundRewards[data.round].erc721Rewards.length; ) {
                uint256 _index = roundRewards[data.round].erc721Rewards[i].index;
                for (
                    uint256 j = 0;
                    j <
                    roundRewards[data.round].erc721Rewards[i].tokenIds.length -
                        roundRewards[data.round].erc721Rewards[i].index;

                ) {
                    IERC721(roundRewards[data.round].erc721Rewards[i].tokenAddress).safeTransferFrom(
                        address(this),
                        admin,
                        roundRewards[data.round].erc721Rewards[i].tokenIds[_index]
                    );

                    roundAmounts[data.round].erc721Amount[i].amount -= 1;
                    unchecked {
                        _index++;
                        j++;
                    }
                }
                unchecked {
                    i++;
                }
            }

            // If round is not in the past, delete rewards
            if (data.round > currentRound) {
                delete roundRewards[data.round].erc721Rewards;
                delete roundAmounts[data.round].erc721Amount;
            }
        }

        // Remove ERC1155 rewards and transfer back to admin
        if (roundRewards[data.round].erc1155Rewards.length > 0)
            // Transfer rewards to admin
            for (uint256 i = 0; i < roundRewards[data.round].erc1155Rewards.length; ) {
                for (uint256 j = 0; j < roundRewards[data.round].erc1155Rewards[i].tokenIds.length; ) {
                    IERC1155(roundRewards[data.round].erc1155Rewards[i].tokenAddress).safeTransferFrom(
                        address(this),
                        admin,
                        roundRewards[data.round].erc1155Rewards[i].tokenIds[j],
                        data.erc1155Amounts[i][j],
                        ""
                    );
                    roundAmounts[data.round].erc1155Amount[i][j].amount -= data.erc1155Amounts[i][j];
                    unchecked {
                        j++;
                    }
                }
                unchecked {
                    i++;
                }

                if (data.round > currentRound) // If round is not in the past, delete rewards
                {
                    delete roundRewards[data.round].erc1155Rewards;
                    delete roundAmounts[data.round].erc1155Amount;
                }
            }
        emit RemoveRewards(data.round, data);
    }

    // Controller functions

    /**
     * @dev Start a new round for controller only
     * @param expiryTimestamp Expiry timestamp for the round
     */
    function startNewRound(uint256 startTime, uint256 expiryTimestamp) external onlyController {
        // Timestamp must be in future
        require(expiryTimestamp > block.timestamp, "Expiry timestamp must be in future.");
        // Increment currentRound
        currentRound++;
        // Save round details
        roundTime[currentRound] = Round(startTime, expiryTimestamp);
        // Emit event
        emit StartNewRound(currentRound, startTime, expiryTimestamp);
    }

    // View functions

    /**
     * @notice Get user claim status for a round
     * @param _round Round number
     * @param user Address of user
     */
    function hasUserClaimed(uint256 _round, address user) public view returns (bool) {
        return hasClaimed[_round][user];
    }

    /**
     * @notice Get round rewards
     * @param _round Round number
     */
    function getRoundRewards(uint256 _round) external view returns (Reward memory) {
        return roundRewards[_round];
    }

    /**
     * @notice Get round amounts
     * @param _round Round number
     */
    function getRoundAmounts(uint256 _round) external view returns (Amount memory) {
        return roundAmounts[_round];
    }

    /**
     * @dev Checks if the the signature is signed by a valid signer for whitelist
     * @param sender Address of minter
     * @param _round Round number
     * @param nonce Random bytes32 nonce
     * @param signature Signature generated off-chain
     */
    function whitelistSigned(
        address sender,
        uint256 _round,
        bytes memory nonce,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(sender, nonce, _round));
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        hash = keccak256(abi.encodePacked(prefix, hash));
        return whitelistSignerAddress == hash.recover(signature);
    }

    /**
     * @dev Claims rewards for a round
     * @param _round Round number
     * @param nonce Random bytes32 nonce
     * @param signature Signature generated off-chain
     */
    function claimRewards(uint256 _round, bytes memory nonce, bytes memory signature) external nonReentrant {
        // Check if user is whitelisted
        require(whitelistSigned(msg.sender, _round, nonce, signature), "Invalid Signature!");
        // Check if user has already claimed
        require(!hasUserClaimed(_round, msg.sender), "User has already claimed rewards.");
        // Check if round has expired
        require(block.timestamp <= roundTime[_round].expiryTimestamp, "Round has expired.");
        // Check if round has started
        require(block.timestamp >= roundTime[_round].startTime, "Round has not started.");
        // Mark user as claimed
        hasClaimed[_round][msg.sender] = true;
        // Initialise variables for events logging
        Amount memory claimedAmounts;
        claimedAmounts.erc20Amount = new RewardERC20Amount[](roundRewards[_round].erc20Rewards.length);
        claimedAmounts.erc721Amount = new RewardERC721Amount[](roundRewards[_round].erc721Rewards.length);
        claimedAmounts.erc1155Amount = new RewardERC1155Amount[][](roundRewards[_round].erc1155Rewards.length);

        // If there are ERC20 token rewards, transfer
        if (roundRewards[_round].erc20Rewards.length > 0) {
            for (uint256 i = 0; i < roundRewards[_round].erc20Rewards.length; ) {
                // Reduce amount of reward amount after transfer
                roundAmounts[_round].erc20Amount[i].amount -= roundRewards[_round].erc20Rewards[i].amount;
                // Record amount for event logging
                claimedAmounts.erc20Amount[i].tokenAddress = roundRewards[_round].erc20Rewards[i].tokenAddress;
                claimedAmounts.erc20Amount[i].amount = roundRewards[_round].erc20Rewards[i].amount;

                IERC20(roundRewards[_round].erc20Rewards[i].tokenAddress).safeTransfer(
                    msg.sender,
                    roundRewards[_round].erc20Rewards[i].amount
                );
                unchecked {
                    i++;
                }
            }
        }

        // If there are ERC721 token rewards, transfer
        if (roundRewards[_round].erc721Rewards.length > 0) {
            for (uint256 i = 0; i < roundRewards[_round].erc721Rewards.length; ) {
                // Reduce amount of reward amount after transfer
                roundAmounts[_round].erc721Amount[i].amount -= 1;
                // Record amount for event logging
                claimedAmounts.erc721Amount[i].tokenAddress = roundRewards[_round].erc721Rewards[i].tokenAddress;
                claimedAmounts.erc721Amount[i].amount = 1;
                IERC721(roundRewards[_round].erc721Rewards[i].tokenAddress).safeTransferFrom(
                    address(this),
                    msg.sender,
                    roundRewards[_round].erc721Rewards[i].tokenIds[roundRewards[_round].erc721Rewards[i].index]
                );
                // Increment index
                unchecked {
                    roundRewards[_round].erc721Rewards[i].index++;
                }
                unchecked {
                    i++;
                }
            }
        }

        // If there are ERC1155 token rewards, transfer
        if (roundRewards[_round].erc1155Rewards.length > 0) {
            for (uint256 i = 0; i < roundRewards[_round].erc1155Rewards.length; ) {
                claimedAmounts.erc1155Amount[i] = new RewardERC1155Amount[](
                    roundRewards[_round].erc1155Rewards[i].tokenIds.length
                );
                for (uint256 j = 0; j < roundRewards[_round].erc1155Rewards[i].tokenIds.length; ) {
                    // Reduce amount of reward amount after transfer
                    roundAmounts[_round].erc1155Amount[i][j].amount -= roundRewards[_round].erc1155Rewards[i].amounts[
                        j
                    ];
                    // Record amount for event logging
                    claimedAmounts.erc1155Amount[i][j].tokenAddress = roundRewards[_round]
                        .erc1155Rewards[i]
                        .tokenAddress;
                    claimedAmounts.erc1155Amount[i][j].tokenId = roundRewards[_round].erc1155Rewards[i].tokenIds[j];
                    claimedAmounts.erc1155Amount[i][j].amount = roundRewards[_round].erc1155Rewards[i].amounts[j];
                    IERC1155(roundRewards[_round].erc1155Rewards[i].tokenAddress).safeTransferFrom(
                        address(this),
                        msg.sender,
                        roundRewards[_round].erc1155Rewards[i].tokenIds[j],
                        roundRewards[_round].erc1155Rewards[i].amounts[j],
                        ""
                    );
                    unchecked {
                        j++;
                    }
                }
                unchecked {
                    i++;
                }
            }
        }
        // Emit event
        emit ClaimRewards(_round, msg.sender, claimedAmounts);
    }

    // Internal helper functions

    function _handleERC20Rewards(RewardData calldata data) internal {
        if (roundRewards[data.round].erc20Rewards.length == 0) {
            // Add rewards to round
            for (uint256 i = 0; i < data.erc20Rewards.length; ) {
                roundRewards[data.round].erc20Rewards.push(data.erc20Rewards[i]);
                roundAmounts[data.round].erc20Amount.push(
                    RewardERC20Amount(data.erc20Rewards[i].tokenAddress, data.erc20Amounts[i])
                );
                unchecked {
                    i++;
                }
            }
        } else {
            // Already existing rewards cannot change reward amount, can only top up reward
            // Ensure that the token address is the same
            for (uint256 i = 0; i < data.erc20Rewards.length; ) {
                require(
                    roundRewards[data.round].erc20Rewards[i].tokenAddress == data.erc20Rewards[i].tokenAddress,
                    "Token address cannot be changed."
                );
                roundAmounts[data.round].erc20Amount[i].amount += data.erc20Amounts[i];
                unchecked {
                    i++;
                }
            }
        }
        // Transfer ERC20 tokens to contract
        for (uint256 i = 0; i < data.erc20Rewards.length; ) {
            IERC20(data.erc20Rewards[i].tokenAddress).safeTransferFrom(msg.sender, address(this), data.erc20Amounts[i]);
            unchecked {
                i++;
            }
        }
    }

    function _handleERC721Rewards(RewardData calldata data) internal {
        // No existing rewards
        if (roundRewards[data.round].erc721Rewards.length == 0) {
            // Add rewards to round
            for (uint256 i = 0; i < data.erc721Rewards.length; ) {
                roundRewards[data.round].erc721Rewards.push(data.erc721Rewards[i]);
                roundAmounts[data.round].erc721Amount.push(
                    RewardERC721Amount(data.erc721Rewards[i].tokenAddress, data.erc721Amounts[i])
                );
                unchecked {
                    i++;
                }
            }
        } else {
            // Already existing rewards cannot change reward amount, can only top up reward
            // Ensure that the token address is the same
            for (uint256 i = 0; i < data.erc721Rewards.length; ) {
                require(
                    roundRewards[data.round].erc721Rewards[i].tokenAddress == data.erc721Rewards[i].tokenAddress,
                    "Token address cannot be changed."
                );
                for (uint256 j; j < data.erc721Rewards[i].tokenIds.length; j++) {
                    roundRewards[data.round].erc721Rewards[i].tokenIds.push(data.erc721Rewards[i].tokenIds[j]);
                }
                roundAmounts[data.round].erc721Amount[i].amount += data.erc721Amounts[i];
                unchecked {
                    i++;
                }
            }
        }
        // Transfer ERC721 tokens to contract
        for (uint256 i = 0; i < data.erc721Rewards.length; ) {
            for (uint256 j = 0; j < data.erc721Rewards[i].tokenIds.length; ) {
                IERC721(data.erc721Rewards[i].tokenAddress).safeTransferFrom(
                    msg.sender,
                    address(this),
                    data.erc721Rewards[i].tokenIds[j]
                );
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    function _handleERC1155Rewards(RewardData calldata data) internal {
        if (roundRewards[data.round].erc1155Rewards.length == 0) {
            // Add rewards to round
            for (uint256 i = 0; i < data.erc1155Rewards.length; i++) {
                roundRewards[data.round].erc1155Rewards.push(data.erc1155Rewards[i]);
                roundAmounts[data.round].erc1155Amount.push();
                for (uint256 j = 0; j < data.erc1155Rewards[i].tokenIds.length; j++) {
                    roundAmounts[data.round].erc1155Amount[i].push(
                        RewardERC1155Amount(
                            data.erc1155Rewards[i].tokenAddress,
                            data.erc1155Rewards[i].tokenIds[j],
                            data.erc1155Amounts[i][j]
                        )
                    );
                }
            }
        } else {
            // Already existing rewards cannot change reward amount, can only top up reward
            // Ensure that the token address is the same
            for (uint256 i = 0; i < data.erc1155Rewards.length; i++) {
                for (uint256 j = 0; j < data.erc1155Rewards[i].tokenIds.length; j++) {
                    require(
                        roundRewards[data.round].erc1155Rewards[i].tokenAddress == data.erc1155Rewards[i].tokenAddress,
                        "Token address cannot be changed."
                    );
                    roundAmounts[data.round].erc1155Amount[i][j].amount += data.erc1155Amounts[i][j];
                }
            }
        }

        // Transfer ERC1155 tokens to contract
        for (uint256 i = 0; i < data.erc1155Rewards.length; i++) {
            for (uint256 j = 0; j < data.erc1155Rewards[i].tokenIds.length; j++) {
                IERC1155(data.erc1155Rewards[i].tokenAddress).safeTransferFrom(
                    msg.sender,
                    address(this),
                    data.erc1155Rewards[i].tokenIds[j],
                    data.erc1155Amounts[i][j],
                    ""
                );
            }
        }
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        // Add your custom logic for handling ERC1155 token transfers
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        // Add your custom logic for handling ERC1155 token transfers
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
