// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./common/SetUtils.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title KazoStaking contract

contract KazoStaking is Ownable, IERC721Receiver {
    using EnumerableSet for EnumerableSet.UintSet;
    using SetUtils for EnumerableSet.UintSet;

    /// @notice Mapping of (user) => (EnumerableSet of NFT tokenIds) Number of NFTs staked for each user
    mapping(address => EnumerableSet.UintSet) internal userStakedNFTs;

    /// @notice Event emitted when an NFT is staked
    event StakedNFT(address indexed user, uint256 indexed nftId, uint256 startTime);

    /// @notice Event emitted when an NFT is unstaked
    event UnstakedNFT(address indexed user, uint256 indexed nftId, uint256 unstakeTime);

    IERC721 public kazo;

    constructor(address _kazo) {
        // Set the Kazo token address
        kazo = IERC721(_kazo);
    }

    /**
     * @notice Stake NFTs
     * @param _nftIds The IDs of the NFTs
     */
    function stakeNFT(uint256[] calldata _nftIds) external {
        // More than 1 NFT must be staked
        require(_nftIds.length > 0, "Must stake at least 1 NFT");
        for (uint256 i; i < _nftIds.length; ) {
            // Add staked NFT to the stakedNFTs mapping
            userStakedNFTs[msg.sender].add(_nftIds[i]);
            // Transfer the NFT to this contract
            kazo.safeTransferFrom(msg.sender, address(this), _nftIds[i]);
            // Emit the StakedNFT event
            emit StakedNFT(msg.sender, _nftIds[i], block.timestamp);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Unstake NFTs
     * @param _nftIds The IDs of the NFTs
     */
    function unstakeNFT(uint256[] calldata _nftIds) external {
        for (uint256 i; i < _nftIds.length; ) {
            // Check if the NFT is staked
            require(userStakedNFTs[msg.sender].contains(_nftIds[i]), "NFT is not staked");
            // Remove the NFT from the stakedNFTs mapping
            userStakedNFTs[msg.sender].remove(_nftIds[i]);
            // Transfer the NFT back to the user
            kazo.safeTransferFrom(address(this), msg.sender, _nftIds[i]);
            emit UnstakedNFT(msg.sender, _nftIds[i], block.timestamp);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Get staked NFT count of a user
     * @param _user The address of the user
     * @return The number of staked NFTs
     */
    function getStakedNFTCount(address _user) external view returns (uint256) {
        return userStakedNFTs[_user].length();
    }

    /**
     * @notice Get staked NFTs of a user
     * @param _user The address of the user
     * @return The IDs of the NFTs
     */
    function getStakedNFTs(address _user) external view returns (uint256[] memory) {
        return userStakedNFTs[_user].toArray();
    }

    /**
     * @dev Set the NFT contract address
     * @param _nftAddress The address of the NFT contract
     */
    function setStakingNFT(address _nftAddress) external onlyOwner {
        kazo = IERC721(_nftAddress);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
