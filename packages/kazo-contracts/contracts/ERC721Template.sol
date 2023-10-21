// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "solady/src/tokens/ERC721.sol";
import "solady/src/auth/Ownable.sol";
import "solady/src/utils/LibString.sol";
import "solady/src/utils/ECDSA.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract ERC721Template is ERC721, ERC2981, Ownable {
    using LibString for uint256;
    using ECDSA for bytes32;
    /// @notice Error codes
    error InvalidTokenId();
    error NoMoreTokenIds();
    error WithdrawFailed();
    /// @notice Address to withdraw ETH to
    address public withdrawAddress;
    /// @notice Backend signer address - used to check if user is whitelisted
    address public whitelistSignerAddress;
    /// @notice Current stage
    uint8 public stage;
    /// @notice Max supply of tokens
    uint16 public immutable MAX_SUPPLY;
    /// @notice Number of available remaining tokens
    uint16 internal _numAvailableRemainingTokens;
    /// @notice Array of available remaining tokens
    uint16[65536] internal _availableRemainingTokens;
    /// @notice Public mint price
    uint256 public publicMintPrice;
    /// @notice Base URI of token metadata
    string public baseURI;
    /// @notice Name of token
    string internal _name;
    /// @notice Symbol of token
    string internal _symbol;
    /// @notice Event emitted when stage is changed
    event StageChanged(uint8 newStage);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory _baseURI,
        uint16 maxSupply_,
        address _withdrawAddress,
        address _whitelistSignerAddress,
        uint256 _publicMintPrice
    ) {
        // Set max supply
        MAX_SUPPLY = maxSupply_;
        // Set available remaining tokens
        _numAvailableRemainingTokens = maxSupply_;
        // Set address to withdraw ETH to
        withdrawAddress = _withdrawAddress;
        // Set backend signer address
        whitelistSignerAddress = _whitelistSignerAddress;
        // Set public mint price
        publicMintPrice = _publicMintPrice;
        // Set name and symbol
        _name = name_;
        _symbol = symbol_;
        // Set base URI
        baseURI = _baseURI;
    }

    /**
     * @notice Used to set royalty fees for all tokens, according to EIP-2981
     * @param _receiver Address to receive royalties
     * @param _feeNumerator Fee numerator, in basis points
     */
    function setDefaultRoyalty(address _receiver, uint96 _feeNumerator) external onlyOwner {
        _setDefaultRoyalty(_receiver, _feeNumerator);
    }

    /**
     * @notice Used to set royalty fees for a specific token, according to EIP-2981
     * @param _tokenId Token ID
     * @param _receiver Address to receive royalties
     * @param _feeNumerator Fee numerator, in basis points
     */

    function setTokenRoyalty(uint256 _tokenId, address _receiver, uint96 _feeNumerator) external onlyOwner {
        _setTokenRoyalty(_tokenId, _receiver, _feeNumerator);
    }

    /**
     * @dev Sets the mint price for public mint
     * @param _publicMintPrice New public mint price
     */
    function setPublicMintPrice(uint256 _publicMintPrice) external onlyOwner {
        publicMintPrice = _publicMintPrice;
    }

    /**
     * @dev Sets the stage
     * @param _newStage New stage
     */
    function setStage(uint8 _newStage) external onlyOwner {
        stage = _newStage;
        emit StageChanged(_newStage);
    }

    /**
     * @dev Sets the backend whitelist signer address
     * @param _newSigner New signer address
     */
    function setWhitelistSignerAddress(address _newSigner) external onlyOwner {
        whitelistSignerAddress = _newSigner;
    }

    /**
     * @dev Sets the withdraw address which mint funds are sent to
     * @param _newWithdrawAddress New withdraw address
     */
    function setWithdrawAddress(address _newWithdrawAddress) external onlyOwner {
        withdrawAddress = _newWithdrawAddress;
    }

    /**
     * @dev Set base URI for token metadata
     * @param _baseURI_ New base URI
     */
    function setBaseURI(string memory _baseURI_) public onlyOwner {
        baseURI = _baseURI_;
    }

    /**
     * @dev Withdraws ETH from contract to withdraw address
     */
    function withdraw() external {
        (bool sent, ) = withdrawAddress.call{ value: address(this).balance }("");
        if (!sent) {
            revert WithdrawFailed();
        }
    }

    /**
     * @dev Returns a random available token ID, used in pseudo random token Id generation
     */
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

        return result + 1;
    }

    /**
     * @dev Returns a pseudo random number
     * @param numAvailableRemainingTokens Number of available remaining tokens
     * @return Pseudo random number
     */
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

    /**
     * @dev Mint tokens with signature
     * @param _amount Amount of tokens to mint
     * @param nonce Nonce to prevent replay attacks
     * @param signature Signature from backend signed by signer address if user is whitelisted
     * @param _mintPrice Mint price
     */
    function _mintWithSignature(
        uint256 _amount,
        bytes calldata nonce,
        bytes calldata signature,
        uint256 _mintPrice
    ) internal {
        // Check if user is whitelisted
        require(_whitelistSigned(msg.sender, nonce, signature, stage), "Invalid Signature!");

        // Check if enough ETH is sent
        require(msg.value == _amount * _mintPrice, "Insufficient ETH!");

        // Check if mints does not exceed MAX_SUPPLY
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeded Max Supply!");

        _mintWithRandomness(_amount);
    }

    /**
     * @dev Mint tokens with public mint
     * @param _amount Amount of tokens to mint
     */
    function _publicMint(uint256 _amount) internal {
        // Check if enough ETH is sent
        require(msg.value == _amount * publicMintPrice, "Insufficient ETH");

        // Check if mints does not exceed MAX_SUPPLY
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeded Max Supply!");

        _mintWithRandomness(_amount);
    }

    /**
     * @dev Dev Mint
     * @param _amount Amount of tokens to mint
     */
    function _devMint(uint256 _amount) internal {
        // Check if mints does not exceed MAX_SUPPLY
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeded Max Supply!");

        _mintWithRandomness(_amount);
    }

    /**
     * @dev Mint tokens with pseudo random token ID
     * @param _amount Amount of tokens to mint
     */
    function _mintWithRandomness(uint256 _amount) internal {
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = _useRandomAvailableTokenId();
            super._mint(msg.sender, tokenId);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Authenticate if user is whitelisted
     * @param sender Sender address
     * @param nonce Nonce to prevent replay attacks
     * @param signature Signature from backend signed by signer address if user is whitelisted
     * @param _stage Stage to check if user is whitelisted for
     * @return True if user is whitelisted
     */
    function _whitelistSigned(
        address sender,
        bytes calldata nonce,
        bytes calldata signature,
        uint8 _stage
    ) internal view returns (bool) {
        bytes32 _hash = keccak256(abi.encodePacked(sender, nonce, _stage));
        return whitelistSignerAddress == ECDSA.toEthSignedMessageHash(_hash).recover(signature);
    }

    /**
     * @dev Function to adhere to EIP-2981
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the name of the token collection
     * @return Name of the token collection
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token collection
     * @return Symbol of the token collection
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Total supply of tokens
     * @return Total supply of tokens
     */
    function totalSupply() public view returns (uint256) {
        unchecked {
            // Does not need to account for burns as they aren't supported.
            return MAX_SUPPLY - _numAvailableRemainingTokens;
        }
    }

    /**
     * @dev Return the metadata URI for a token
     * @param tokenId Token ID
     * @return Metadata URI for token
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert InvalidTokenId();
        }
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }
}
