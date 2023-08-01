// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./common/Base64.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title [CONTRACT_NAME] Mint Contract
/// @dev Max Supply of 6000 planets
/// @dev First 12 planets are EPIC planets
contract Diamonds is ERC721, Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    /**
     * The signature must be by the correct signer
     */
    error InvalidSignature();

    /**
     * The minting stage must be correct
     */
    error InvalidStage(uint8 currentStage, uint8 requiredStage);

    /**
     * The user has exceeded allowed mint count
     */
    error ExceedMaxMintPerWallet();

    error InsufficientCRO(uint256 amountPaid, uint256 amountRequired);

    string public baseURI = "https://bafybeibbnkwf2dduwslfza4o5uhfhubok4sohezu2knp47cvtezlbnicci.ipfs.nftstorage.link/";

    uint8 public stage;
    uint256 public whitelistPhase;

    // Total index
    uint256 tokenIndex = 1;

    // VIP Whitelist Mint Settings
    uint256 public vipMintMaxPerWallet = 10; // VIP Sale Address Mint Cap
    uint256 public vipMintPrice = 0 ether; // VIP Sale Mint Price
    mapping(address => uint256) public vipMintCount;

    // Whitelist Mint Settings
    uint256 public whitelistMintMaxPerWallet = 20; // Private Sale Address Mint Cap
    uint256 public whitelistMintPrice = 1 ether; // Private Sale Mint Price
    mapping(address => uint256) public whitelistMintCount;
    address private whitelistSignerAddress;

    // Public Sale Mint Settings
    uint256 public publicMintPrice = 0 ether;
    uint256 public publicMintMaxPerWallet = type(uint256).max; // Unlimited mint
    mapping(address => uint256) public publicMintCount;

    // Treasury
    address public treasury;

    bool public revealed = false;
    string public unrevealedImageURI = "ipfs://bafybeicabmv4ccbblnnpfq6q5rg5sr2qqq4mc7y7y3tqyfztiwzrkff5vi";

    // -------------------- MODIFIERS ----------------------

    /**
     * @dev Prevent Smart Contracts from calling the functions with this modifier
     */
    modifier onlyEOA() {
        require(msg.sender == tx.origin, "DiamondNFT: must use EOA");
        _;
    }

    constructor() ERC721("DIAMONDS", "DIAMONDS") {
        setTreasury(msg.sender);
        setWhitelistSignerAddress(msg.sender);
    }

    /**
     * @dev Set Revealed Metadata URI
     */
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    /**
     * @dev Set Unrevealed Metadata URI
     */
    function setUnrevealedImageURI(string memory _newUnrevealedImageURI) public onlyOwner {
        unrevealedImageURI = _newUnrevealedImageURI;
    }

    /**
     * @notice Returns total supply of DiamondNFT
     */
    function totalSupply() public view returns (uint256) {
        return tokenIndex;
    }

    // -------------------- MINT FUNCTIONS --------------------------

    /**
     * @dev Mint planet (Whitelist only)
     * @param _mintAmount Amount of planets to mint
     * @param nonce Unique Nonce
     * @param signature Signature provided by the signerAddress
     */
    function whitelistMint(uint256 _mintAmount, bytes memory nonce, bytes memory signature) external payable onlyEOA {
        // Check if user is whitelisted
        if (!whitelistSigned(msg.sender, nonce, signature, whitelistPhase)) revert InvalidSignature();

        // Check if whitelist sale is open
        if (stage != 1) revert InvalidStage(stage, 1);
        if (whitelistPhase == 1) {
            // Check if enough ETH is sent
            if (msg.value != _mintAmount * vipMintPrice) revert InsufficientCRO(msg.value, _mintAmount * vipMintPrice);

            // Check if mints does not exceed max wallet allowance for public sale
            if (vipMintCount[msg.sender] + _mintAmount > vipMintMaxPerWallet) revert ExceedMaxMintPerWallet();

            vipMintCount[msg.sender] += _mintAmount;
        }
        if (whitelistPhase == 2) {
            // Check if enough ETH is sent
            if (msg.value != _mintAmount * whitelistMintPrice)
                revert InsufficientCRO(msg.value, _mintAmount * whitelistMintPrice);

            // Check if mints does not exceed max wallet allowance for public sale
            if (whitelistMintCount[msg.sender] + _mintAmount > whitelistMintMaxPerWallet)
                revert ExceedMaxMintPerWallet();

            whitelistMintCount[msg.sender] += _mintAmount;
        }

        for (uint256 i; i < _mintAmount; i++) {
            _mintPlanet();
        }
    }

    /**
     * @notice Public Mint
     * @param _mintAmount Amount that is minted
     */
    function mint(uint256 _mintAmount) external payable onlyEOA {
        for (uint256 i; i < _mintAmount; i++) {
            _mintPlanet();
        }
    }

    /**
     * @notice Mint planet
     * @dev Set initial planet level to 1 and random mint to msg.sender
     */
    function _mintPlanet() internal {
        // Get next token Id
        uint256 _tokenId = tokenIndex;
        tokenIndex++;
        // Mint planet
        _safeMint(msg.sender, _tokenId);
    }

    /**
     * @notice Set whitelist phase
     * @param _whitelistPhase Phase of whitelist
     */
    function setWhitelistPhase(uint256 _whitelistPhase) external onlyOwner {
        whitelistPhase = _whitelistPhase;
    }

    // -------------------- WHITELIST FUNCTION ----------------------

    /**
     * @dev Checks if the the signature is signed by a valid signer for whitelist
     * @param sender Address of minter
     * @param nonce Random bytes32 nonce
     * @param signature Signature generated off-chain
     */
    function whitelistSigned(
        address sender,
        bytes memory nonce,
        bytes memory signature,
        uint256 _whitelistPhase
    ) private view returns (bool) {
        bytes32 _hash = keccak256(abi.encodePacked(sender, nonce, _whitelistPhase));
        return whitelistSignerAddress == ECDSA.toEthSignedMessageHash(_hash).recover(signature);
    }

    // ------------------------- ADMIN FUNCTIONS ----------------------------

    /**
     * @dev Set stage of minting
     */
    function setStage(uint8 _newStage) public onlyOwner {
        stage = _newStage;
    }

    /**
     * @dev Toggle Reveal
     */
    function toggleReveal() public onlyOwner {
        revealed = !revealed;
    }

    /**
     * @dev Set signer address for whitelist mint
     */
    function setWhitelistSignerAddress(address signer) public onlyOwner {
        whitelistSignerAddress = signer;
    }

    /**
     * @dev Set vip mint max per wallet
     */
    function setVipMaxMintPerWallet(uint256 amount) public onlyOwner {
        vipMintMaxPerWallet = amount;
    }

    /**
     * @dev Set vip mint price
     */
    function setVipMintPrice(uint256 _vipMintPrice) public onlyOwner {
        vipMintPrice = _vipMintPrice;
    }

    /**
     * @dev Set whitelist mint max per wallet
     */
    function setWhitelistMaxMintPerWallet(uint256 amount) public onlyOwner {
        whitelistMintMaxPerWallet = amount;
    }

    /**
     * @dev Set public mint price
     */
    function setPublicMintPrice(uint256 _publicMintPrice) public onlyOwner {
        publicMintPrice = _publicMintPrice;
    }

    /**
     * @dev Set whitelist mint price
     */
    function setWhitelistMintPrice(uint256 _whitelistMintPrice) public onlyOwner {
        whitelistMintPrice = _whitelistMintPrice;
    }

    /**
     * @notice Withdraw all CRO from this account to the owner
     */
    function withdrawFund() external onlyOwner {
        (bool success, ) = payable(treasury).call{ value: address(this).balance }("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Sets the treasury address
     */
    function setTreasury(address _treasury) public onlyOwner {
        treasury = _treasury;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, it can be overridden in child contracts.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @notice Returns if given tokenId exists in DiamondNFT
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    // ------------------------- TOKEN METADATA ----------------------------

    /**
     * @notice Returns token metadata
     * @dev Metadata is stored on-chain
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "DiamondNFT: URI query for nonexistent token");
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".jpeg"));
    }
}
