// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./common/ERC721.sol";
import "./common/RandomlyAssigned.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";
error InvalidTokenId();
error NoMoreTokenIds();
error WithdrawFailed();

contract ArgoPetz is ERC721, ERC2981, RandomlyAssigned, Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    uint16 public immutable MAX_SUPPLY;
    uint256 public currentSupply;
    uint256 public immutable WHITELIST_MAX_MINT;
    address public immutable WITHDRAW_ADDRESS;
    address public immutable WHITELIST_SIGNER_ADDRESS;
    mapping(address => uint256) public whitelistMintCount;
    uint256 public whitelistMintPrice = 449 ether;
    uint256 public publicMintPrice = 499 ether;
    uint8 public stage;
    string public baseURI;
    bool revealed;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint16 maxSupply_,
        address withdrawAddress,
        address _whitelistSignerAddress,
        uint256 _whitelistMaxMint
    ) ERC721(_name, _symbol) RandomlyAssigned(maxSupply_, 6) {
        MAX_SUPPLY = maxSupply_;
        setBaseURI(_baseURI);
        WITHDRAW_ADDRESS = withdrawAddress;
        WHITELIST_SIGNER_ADDRESS = _whitelistSignerAddress;
        WHITELIST_MAX_MINT = _whitelistMaxMint;
        // Mint first 5 tokens to contract creator
        for (uint256 i = 1; i <= 5; ) {
            _mint(msg.sender, i);
            unchecked {
                ++i;
            }
        }
        revealed = false;
    }

    function whitelistMint(
        uint256 _amount,
        bytes calldata nonce,
        bytes calldata signature
    ) external payable {
        // Check if user is whitelisted
        require(whitelistSigned(msg.sender, nonce, signature, stage), "ArgoPetz: Invalid Signature!");

        // Check if whitelist sale is open
        require(stage == 1, "ArgoPetz: Whitelist Mint is not open");

        // Check if enough ETH is sent
        require(msg.value == _amount * whitelistMintPrice, "ArgoPetz: Insufficient CRO!");

        // Check if mints does not exceed MAX_SUPPLY
        require(totalSupply() + _amount <= MAX_SUPPLY, "ArgoPetz: Exceeded Max Supply for ArgoPetz!");

        // Check if mints does not exceed max wallet allowance for public sale
        require(
            whitelistMintCount[msg.sender] + _amount <= WHITELIST_MAX_MINT,
            "ArgoPetz: Wallet has already minted Max Amount for Whitelist Mint!"
        );

        currentSupply+= _amount;

        whitelistMintCount[msg.sender] += _amount;
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = nextToken();
            _mint(msg.sender, tokenId);
            unchecked {
                ++i;
            }
        }
    }

    function publicMint(uint256 _amount) external payable {
        // Check if public sale is open
        require(stage == 2, "ArgoPetz: Public Sale Closed!");
        // Check if enough ETH is sent
        require(msg.value == _amount * publicMintPrice, "ArgoPetz: Insufficient CRO!");

        // Check if mints does not exceed total max supply
        require(totalSupply() + _amount <= MAX_SUPPLY, "ArgoPetz: Max Supply for Public Mint Reached!");
        currentSupply+= _amount;
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = nextToken();
            _mint(msg.sender, tokenId);
            unchecked {
                ++i;
            }
        }
    }


    function devMint(uint256 _amount) external onlyOwner {
        // Check if mints does not exceed total max supply
        require(totalSupply() + _amount <= MAX_SUPPLY, "ArgoPetz: Max Supply for Public Mint Reached!");
        currentSupply+= _amount;
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = nextToken();
            _mint(msg.sender, tokenId);
            unchecked {
                ++i;
            }
        }
    }

    function whitelistSigned(
        address sender,
        bytes calldata nonce,
        bytes calldata signature,
        uint8 _stage
    ) private view returns (bool) {
        bytes32 _hash = keccak256(abi.encodePacked(sender, nonce, _stage));
        console.log("Address: ",ECDSA.toEthSignedMessageHash(_hash).recover(signature));
        return WHITELIST_SIGNER_ADDRESS == ECDSA.toEthSignedMessageHash(_hash).recover(signature);
    }

    function withdraw() external {
        (bool sent, ) = WITHDRAW_ADDRESS.call{ value: address(this).balance }("");
        if (!sent) {
            revert WithdrawFailed();
        }
    }

    // ------------
    // Mint
    // ------------

    function setPublicMintPrice(uint256 _publicMintPrice) public onlyOwner {
        publicMintPrice = _publicMintPrice;
    }

    function setWhitelistMintPrice(uint256 _whitelistMintPrice) public onlyOwner {
        whitelistMintPrice = _whitelistMintPrice;
    }

    function setStage(uint8 _newStage) public onlyOwner {
        stage = _newStage;
    }

    // ------------
    // Total Supply
    // ------------
    function totalSupply() public view returns (uint256) {
        return currentSupply;
    }

    // --------
    // Metadata
    // --------
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf[tokenId] == address(0)) {
            revert InvalidTokenId();
        }
         if (!revealed) {
        string memory unrevealedJson = 
            string(
                abi.encodePacked(
                    '{',
                    '"name": "ArgoPetz Lootbox #', tokenId.toString(), '",',
                    '"description": "ArgoPetz is a collection of 8,888 unique utility-enabled characters and are partners to the Argonauts collection on the Cronos chain. Each ArgoPetz holder gets access to utility across the entire Argo ecosystem, lucrative rewards, airdrops, and will be a key asset in future Argo developments.",',
                    '"image": "ipfs://bafybeigdgghjdunvqpsjqekn55ptm43kh7cjsnzu2hrqd72uwle4tgxuqm/Argo%20Petz.mp4",',
                    '"id": ', tokenId.toString(), ',',
                    '"attributes": [{',
                    '   "trait_type": "Type",',
                    '   "value": "Unrevealed"',
                    '}]',
                    '}'
                )
            );
        return unrevealedJson;
    }
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function setBaseURI(string memory _baseURI_) public onlyOwner {
        baseURI = _baseURI_;
    }

    function reveal(string memory _revealedURI) public onlyOwner {
        revealed = true;
        setBaseURI(_revealedURI);
    }

    // ---------------
    // Name and symbol
    // ---------------
    function setNameAndSymbol(string calldata _newName, string calldata _newSymbol) external onlyOwner {
        name = _newName;
        symbol = _newSymbol;
    }

    // --------
    // EIP-2981
    // --------
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    // -------
    // EIP-165
    // -------
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }
}
