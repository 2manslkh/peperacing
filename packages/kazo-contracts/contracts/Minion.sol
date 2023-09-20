// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ERC721Template.sol";

contract Minion is ERC721Template {
    /// @notice Address of the incentive contract
    address public incentiveAddress;
    /// @notice Price for whitelist mint
    uint256 public whitelistMintPrice;
    /// @notice Max amount of whitelist mint
    uint16 public whitelistMaxMint;
    /// @notice Flag to indicate if the collection is revealed
    bool public revealed;
    /// @notice Mapping used to track how many times an address has minted for whitelist mint
    mapping(address => uint16) public whitelistMintCount;
    /// @notice Mapping used to track who has already minted for free mint
    mapping(address => bool) public hasMinted;

    /**
     * @dev Throws if the input stage does not match the current stage
     * @param _stage Input stage
     */
    modifier onlyStage(uint8 _stage) {
        require(stage == _stage, "Wrong stage!");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint16 maxSupply_,
        address withdrawAddress,
        address _whitelistSignerAddress,
        uint16 _whitelistMaxMint,
        uint256 _whitelistMintPrice,
        uint256 _publicMintPrice,
        address _incentiveAddress
    ) ERC721Template(_name, _symbol, _baseURI, maxSupply_, withdrawAddress, _whitelistSignerAddress, _publicMintPrice) {
        whitelistMintPrice = _whitelistMintPrice;
        whitelistMaxMint = _whitelistMaxMint;
        incentiveAddress = _incentiveAddress;
    }

    /**
     * @dev Whitelist Mint Phase 1
     * @param _amount Amount to mint
     * @param _nonce Nonce to prevent replay attacks
     * @param _signature Signature from backend signed by signer address if user is whitelisted
     */
    function whitelistMint(
        uint256 _amount,
        bytes calldata _nonce,
        bytes calldata _signature
    ) external payable onlyStage(1) {
        // Check if whitelist max mint is reached
        require(whitelistMintCount[msg.sender] + _amount <= whitelistMaxMint, "Max mint reached!");
        // Increase whitelist mint count
        whitelistMintCount[msg.sender] += uint16(_amount);
        _mintWithSignature(_amount, _nonce, _signature, whitelistMintPrice);
    }

    /**
     * @dev Public Mint
     * @param _amount Amount to mint
     */
    function publicMint(uint256 _amount) external payable onlyStage(2) {
        _publicMint(_amount);
    }

    /*
     * @dev Reveal the collection
     * @param _baseURI Base URI for the collection
     */
    function reveal(string memory _baseURI) external onlyOwner {
        revealed = true;
        setBaseURI(_baseURI);
    }
}
