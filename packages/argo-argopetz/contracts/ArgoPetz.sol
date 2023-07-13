// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./common/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

error InvalidTokenId();
error NoMoreTokenIds();
error WithdrawFailed();

// Cred: Elementals contract -> learning from the best!
contract ArgoPetz is ERC2981, ERC721, Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    uint16 public immutable MAX_SUPPLY;
    uint16 internal _numAvailableRemainingTokens;
    // Data structure used for Fisher Yates shuffle
    uint16[65536] internal _availableRemainingTokens;
    uint256 public constant PUBLIC_MAX_MINT = 20;
    uint256 public constant WHITELIST_MAX_MINT = 5;
    address public immutable WITHDRAW_ADDRESS;
    address public immutable WHITELIST_SIGNER_ADDRESS;
    mapping(address => uint256) public whitelistMintCount;
    mapping(address => uint256) public publicMintCount;
    uint256 public whitelistMintPrice = 1 ether;
    uint256 public publicMintPrice = 2 ether;
    uint8 public stage;
    string public baseURI;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint16 maxSupply_,
        address withdrawAddress,
        address _whitelistSignerAddress
    ) ERC721(_name, _symbol) {
        MAX_SUPPLY = maxSupply_;
        _numAvailableRemainingTokens = maxSupply_;
        setBaseURI(_baseURI);
        WITHDRAW_ADDRESS = withdrawAddress;
        WHITELIST_SIGNER_ADDRESS = _whitelistSignerAddress;
    }

    // ---------------
    // Name and symbol
    // ---------------
    function setNameAndSymbol(string calldata _newName, string calldata _newSymbol) external onlyOwner {
        name = _newName;
        symbol = _newSymbol;
    }

    function _useRandomAvailableTokenId() internal returns (uint256) {
        uint256 numAvailableRemainingTokens = _numAvailableRemainingTokens;
        if (numAvailableRemainingTokens == 0) {
            revert NoMoreTokenIds();
        }

        uint256 randomNum = _getRandomNum(numAvailableRemainingTokens);
        uint256 randomIndex = randomNum % numAvailableRemainingTokens;
        uint256 valAtIndex = _availableRemainingTokens[randomIndex];

        uint256 result;
        if (valAtIndex == 0) {
            // This means the index itself is still an available token
            result = randomIndex;
        } else {
            // This means the index itself is not an available token, but the val at that index is.
            result = valAtIndex;
        }

        uint256 lastIndex = numAvailableRemainingTokens - 1;
        if (randomIndex != lastIndex) {
            // Replace the value at randomIndex, now that it's been used.
            // Replace it with the data from the last index in the array, since we are going to decrease the array size afterwards.
            uint256 lastValInArray = _availableRemainingTokens[lastIndex];
            if (lastValInArray == 0) {
                // This means the index itself is still an available token
                // Cast is safe as we know that lastIndex cannot > MAX_SUPPLY, which is a uint16
                _availableRemainingTokens[randomIndex] = uint16(lastIndex);
            } else {
                // This means the index itself is not an available token, but the val at that index is.
                // Cast is safe as we know that lastValInArray cannot > MAX_SUPPLY, which is a uint16
                _availableRemainingTokens[randomIndex] = uint16(lastValInArray);
                delete _availableRemainingTokens[lastIndex];
            }
        }

        --_numAvailableRemainingTokens;

        return result;
    }

    function _getRandomNum(uint256 numAvailableRemainingTokens) internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(
                        block.prevrandao,
                        blockhash(block.number - 1),
                        address(this),
                        numAvailableRemainingTokens
                    )
                )
            );
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

        whitelistMintCount[msg.sender] += _amount;
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = _useRandomAvailableTokenId();
            _safeMint(msg.sender, tokenId);
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
        // Check if mints does not exceed max wallet allowance for public sale
        require(
            publicMintCount[msg.sender] + _amount <= PUBLIC_MAX_MINT,
            "ArgoPetz: Wallet has already minted Max Amount for Public Mint!"
        );
        publicMintCount[msg.sender] += _amount;
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = _useRandomAvailableTokenId();
            _safeMint(msg.sender, tokenId);
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
        unchecked {
            // Does not need to account for burns as they aren't supported.
            return MAX_SUPPLY - _numAvailableRemainingTokens;
        }
    }

    // --------
    // Metadata
    // --------
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf[tokenId] == address(0)) {
            revert InvalidTokenId();
        }
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function setBaseURI(string memory _baseURI_) public onlyOwner {
        baseURI = _baseURI_;
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
