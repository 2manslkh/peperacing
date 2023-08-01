// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

// Import IERC721
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// Import IERC20
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Bank {
    mapping(address => uint256) public balances;
    mapping(IERC721 => mapping(uint256 => address)) public nftOwner;
    mapping(IERC20 => mapping(address => uint256)) public tokenBalances;
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DepositedNFT(address indexed user, IERC721 nftAddress, uint256 tokenId);
    event WithdrawnNFT(address indexed user, IERC721 nftAddress, uint256 tokenId);
    event DepositedToken(address indexed user, IERC20 tokenAddress, uint256 amount);
    event WithdrawnToken(address indexed user, IERC20 tokenAddress, uint256 amount);

    /**
     * @dev Deposit ETH to the contract
     */
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw ETH from the contract
     */
    function withdraw() external {
        require(balances[msg.sender] > 0, "Insufficient balance!");
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
        emit Withdrawn(msg.sender, balance);
    }

    function depositNFT(IERC721 nftAddress, uint256 tokenId) external {
        nftOwner[nftAddress][tokenId] = msg.sender;
        nftAddress.safeTransferFrom(msg.sender, address(this), tokenId);
        emit DepositedNFT(msg.sender, nftAddress, tokenId);
    }

    function withdrawNFT(IERC721 nftAddress, uint256 tokenId) external {
        require(nftOwner[nftAddress][tokenId] == msg.sender, "Bank: Sender is not the owner of the NFT");
        nftOwner[nftAddress][tokenId] = address(0);
        nftAddress.safeTransferFrom(address(this), msg.sender, tokenId);

        emit WithdrawnNFT(msg.sender, nftAddress, tokenId);
    }

    function depositToken(IERC20 tokenAddress, uint256 balance) external {
        tokenBalances[tokenAddress][msg.sender] += balance;
        tokenAddress.transferFrom(msg.sender, address(this), balance);
        emit Deposited(msg.sender, balance);
    }

    function withdrawToken(IERC20 tokenAddress, uint256 balance) external {
        require(tokenBalances[tokenAddress][msg.sender] >= balance, "Bank: Insufficient balance!");
        tokenBalances[tokenAddress][msg.sender] -= balance;
        tokenAddress.transferFrom(address(this), msg.sender, balance);
        emit Withdrawn(msg.sender, balance);
    }

    function getBalance(address _user) external view returns (uint256) {
        return balances[_user];
    }
}
