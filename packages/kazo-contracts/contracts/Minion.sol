// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IMinion.sol";
import "./interfaces/ILeader.sol";
import "./ERC721Template.sol";
import "./common/DefaultOperatorFilterer.sol";

contract Minion is
    ERC721Template,
    ReentrancyGuard,
    DefaultOperatorFilterer,
    IMinion
{

    mapping(uint256 => uint256) public tokensLastStakedAt; // tokenId => timestamp
     bool public canStake;
        bool public canStakeTransfer;
        uint8 public marketplaceRestriction;
    event Stake(uint256 tokenId, address by, uint256 stakedAt);
    event Unstake(
        uint256 tokenId,
        address by,
        uint256 stakedAt,
        uint256 unstakedAt
    );

    mapping(address => bool) public whitelistedMarketplaces;
    mapping(address => bool) public blacklistedMarketplaces;
    event MarketplaceWhitelisted(address indexed market, bool whitelisted);
    event MarketplaceBlacklisted(address indexed market, bool blacklisted);

    ILeader public leader;
    mapping(address => bool) public moderators;


      constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint16 maxSupply_,
        address withdrawAddress,
        address _whitelistSignerAddress,
        uint256 _publicMaxMint,
        uint256 _whitelistMaxMint,
        uint256 _whitelistMintPrice,
        uint256 _publicMintPrice
    ) ERC721Template(_name, _symbol, _baseURI, maxSupply_, withdrawAddress, _whitelistSignerAddress, _publicMaxMint, _whitelistMaxMint, _whitelistMintPrice, _publicMintPrice) {
       
    }

    // =============== Airdrop ===============

    function giveawayWithAmounts(
        address[] memory receivers,
        uint256[] memory amounts
    ) external onlyOwner {
        require(receivers.length >= 1, "at least 1 receiver");
        for (uint256 i; i < receivers.length; i++) {
            address receiver = receivers[i];
            _safeMint(receiver, amounts[i]);
        }
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721x) onlyAllowedOperator(from) {
        require(
            tokensLastStakedAt[tokenId] == 0,
            "Cannot transfer staked token"
        );
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata _data
    ) public override(ERC721x) onlyAllowedOperator(from) {
        require(
            tokensLastStakedAt[tokenId] == 0,
            "Cannot transfer staked token"
        );
        super.safeTransferFrom(from, to, tokenId, _data);
    }

    function stake(uint256 tokenId) public {
        require(canStake, "staking not open");
        require(
            msg.sender == ownerOf(tokenId) ||
                msg.sender == owner() ||
                msg.sender == address(leader),
            "caller must be any: token owner, contract owner, leader"
        );
        require(tokensLastStakedAt[tokenId] == 0, "already staking");
        tokensLastStakedAt[tokenId] = block.timestamp;
        emit Stake(tokenId, msg.sender, tokensLastStakedAt[tokenId]);
    }

    function unstake(uint256 tokenId) public {
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner() || moderators[msg.sender],
            "caller must be owner of token or contract owner"
        );
        require(tokensLastStakedAt[tokenId] > 0, "not staking");
        if (leader.isMinionQuesting(tokenId)) {
            leader.removeCrew(tokenId);
        }
        uint256 lsa = tokensLastStakedAt[tokenId];
        tokensLastStakedAt[tokenId] = 0;
        emit Unstake(tokenId, msg.sender, block.timestamp, lsa);
    }

    function setTokensStakeStatus(uint256[] memory tokenIds, bool setStake)
        external
    {
        for (uint256 i; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (setStake) {
                stake(tokenId);
            } else {
                unstake(tokenId);
            }
        }
    }

    function stakeTransferAll(
        address from,
        address to,
        uint256[] calldata tokenIds
    ) public {
        require(canStakeTransfer, "Staked transfer not open");
        require(msg.sender == from, "Sender must be from token owner");
        require(tokenIds.length == balanceOf(from), "Staked transfer must transfer all tokens");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(
                ownerOf(tokenId) == from,
                "Only token owner can do staked transfer"
            );
            super.transferFrom(from, to, tokenId);
        }
    }

    // V4
    function isMinionStaking(uint256 tokenId) external view returns (bool) {
        return tokensLastStakedAt[tokenId] > 0;
    }

    function stakeExternal(uint256 tokenId) external {
        stake(tokenId);
    }

    function nftOwnerOf(uint256 tokenId) external view returns (address) {
        return ownerOf(tokenId);
    }

    function setLeader(address addr) external onlyOwner {
        leader = ILeader(addr);
    }

    function setModerator(address addr, bool add) external onlyOwner {
        moderators[addr] = add;
    }

    function setCanStake(bool _canStake) external onlyOwner {
        canStake = _canStake;
    }

    function setCanStakeTransfer(bool _canStakeTransfer) external onlyOwner {
        canStakeTransfer = _canStakeTransfer;
    }


}