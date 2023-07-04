//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interface/IStakingWithLock.sol";
import { IAtlantisGemstones } from "./interface/IAtlantisGemstones.sol";
import "./AtlantisAddressRegistry.sol";
import "./common/Base64.sol";

/// @title Atlantis - Gemstones contract
/// @dev Fuse 3 gemstones of the same tier to receive 1 from the next tier. Gemstones can be used to upgrade planets and are also required for certain levels of equipment fusion.
contract AtlantisGemstones is ERC1155, Pausable, Ownable, IAtlantisGemstones, ReentrancyGuard {
    using Strings for uint256;
    /// @notice Address registry contract
    AtlantisAddressRegistry public addressRegistry;
    /// @notice Name of contract
    string public name;
    /// @notice Symbol of contract
    string public symbol;
    /// @notice Base token URI
    string public baseTokenURI;
    /// @notice Total amount of Ids
    uint256 public constant TOTAL_TOKEN_IDS = 12;
    /// @notice Total supply of each tokenId
    mapping(uint256 => uint256) private _totalSupply;
    /// @notice Stardust fusion cost
    uint256 public FUSION_COST = 200 ether;
    /// @notice Whitelisted addresses who can call airdrop
    mapping(address => bool) public devAddresses;
    // ------------------------- EVENTS --------------------------
    event MintGemstone(address indexed _to, uint256 indexed _id, uint256 _amount, uint256 _totalSupply);
    event FuseGemstone(address indexed _from, uint256 indexed _id, uint256 _amount, uint256 _totalSupply);
    error IdNotExistsError();

    // ----------------------- MODIFIERS -------------------------

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        address owner,
        address _registry
    ) ERC1155(_uri) {
        name = _name;
        symbol = _symbol;
        addressRegistry = AtlantisAddressRegistry(_registry);

        setBaseMetadataURI(_uri);
        transferOwnership(owner);
        devAddresses[owner] = true;
    }

    // ------------------------- PUBLIC FUNCTIONS ------------------------------
    /**
     * @dev Fuse 3 Gemstones to get another Gemstone of a higher tier
     * @param _id The Gemstone id
     * @param _amountToCreate The amount of Gemstones to create
     * Gemstone Upgrade Sheet
     *           Tier 1 -> Tier 2 -> Tier 3 -> Tier 4
     * FIRE      ID 1   -> ID 4   -> ID 7   -> ID 10
     * LIGHTNING ID 2   -> ID 5   -> ID 8   -> ID 11
     * STEEL     ID 3   -> ID 6   -> ID 9   -> ID 12
     */
    function fuseGemstones(uint8 _id, uint8 _toId, uint256 _amountToCreate) external nonReentrant whenNotPaused {
        IStakingWithLock stakingWithLock = IStakingWithLock(addressRegistry.getStakingWithLock());
        // Calculate Gemstone required to fuse
        uint256 _amountToBurn = calculateGemstoneCost(_id, _toId, _amountToCreate);
        // Burn Gemstones
        _burn(msg.sender, _id, _amountToBurn);
        // Mint new Gemstone
        _mint(msg.sender, _toId, _amountToCreate, "");
        // Total fusion cost
        uint256 fusionCost = calculateFusionCost(_id, _toId, _amountToCreate);
        // Burn stardust
        stakingWithLock.unstakeAndBurn(fusionCost);
        // Emit fuse event
        emit FuseGemstone(msg.sender, _toId, _amountToCreate, totalSupply(_toId));
    }

    // View function to calculate fusion cost
    function calculateFusionCost(uint8 _id, uint8 _toId, uint256 _amountToCreate) public view returns (uint256) {
        // Calculate Gemstone required to fuse
        uint256 _amountToBurn = calculateGemstoneCost(_id, _toId, _amountToCreate);
        return (_amountToBurn * FUSION_COST) / 3;
    }

    // View function to see how many Gemstones required to fuse to amountToCreate
    function calculateGemstoneCost(uint8 _id, uint8 _toId, uint256 _amountToCreate) public view returns (uint256) {
        if (_amountToCreate == 0) revert InvalidInputAmount();
        if (!exists(_id) || !exists(_toId)) revert NonExistentToken();
        if ((_toId % 3 != _id % 3)) revert InvalidElement();

        if (_id >= _toId) revert InvalidUpgrade();

        // Require toId to be more than id
        // Require toId to be in multiples of 3 more than id
        // Calculate how many Gemstones to fuse to get toId
        // Get tier difference
        uint8 tierDifference = (_toId - _id) / 3;
        // Get amount of Gemstones to fuse
        uint256 amountToFuse = 3 ** tierDifference * _amountToCreate;
        return amountToFuse;
    }

    // Setter for fusion cost
    function setFusionCost(uint256 _cost) external onlyOwner {
        FUSION_COST = _cost;
        emit FusionCostUpdated(_cost);
    }

    // Get element from id
    function getElement(uint256 _id) public pure returns (uint8) {
        if (_id > 12 || _id == 0) {
            revert IdNotExistsError();
        }
        uint8 _element = uint8(_id) % 3;
        return _element;
    }

    function _tokenIdtoElementString(uint256 _id) internal pure returns (string memory) {
        if (_id > 12) {
            revert IdNotExistsError();
        }
        uint8 _element = uint8(_id) % 3;
        if (_element == 0) {
            return "Steel";
        } else if (_element == 1) {
            return "Fire";
        } else {
            return "Lightning";
        }
    }

    // Get tier from id
    function getTier(uint256 _id) public pure returns (uint8) {
        if (_id > 12) {
            revert IdNotExistsError();
        }
        uint8 _tier = uint8(_id) / 3;
        if (uint8(_id) % 3 == 0) {
            return _tier;
        } else {
            return _tier + 1;
        }
    }

    /**
     * @dev Mints some amount of tokens to an address
     * @param _to          Address of the future owner of the token
     * @param _id          Token ID to mint
     * @param _quantity    Amount of tokens to mint
     */
    function mint(address _to, uint256 _id, uint256 _quantity) external {
        if (!(addressRegistry.isControllerContract(msg.sender) || msg.sender == owner())) revert OnlyAtlantisOrOwner();
        if (!exists(_id)) revert NonExistentToken();
        _mint(_to, _id, _quantity, "");
        // emit Mint event
        emit MintGemstone(_to, _id, _quantity, totalSupply(_id));
    }

    /**
     * @dev Burns some amount of tokens from an address
     */
    function burn(address _user, uint256 _id, uint256 _quantity) external {
        if (!(addressRegistry.isControllerContract(msg.sender) || msg.sender == owner())) revert OnlyAtlantisOrOwner();
        if (!exists(_id)) revert NonExistentToken();
        _burn(_user, _id, _quantity);
    }

    // ------------------------- PUBLIC VIEW FUNCTIONS ------------------------------
    // Get Image Uri
    /**
     * @notice Get ImageURI
     * @param _tokenId The Gemstone id
     */
    function _getImageURI(uint256 _tokenId) internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    uint256(getElement(_tokenId)).toString(),
                    "/",
                    uint256(getTier(_tokenId)).toString(),
                    ".png"
                )
            );
    }

    function uri(uint256 _tokenId) public view override returns (string memory) {
        if (!exists(_tokenId)) revert NonExistentToken();
        string memory element = _tokenIdtoElementString(_tokenId);
        string memory json = string(
            abi.encodePacked('{"name": "', element, " Gemstone Tier ", uint256(getTier(_tokenId)).toString(), '",')
        );
        // Description
        json = string(
            abi.encodePacked(
                json,
                '"description": "Welcome to the captivating realm of Atlantis, the game-verse and home of the legendary Argonauts. Gemstones are powerful resources in Atlantis and exist in four different tiers. Acquire Gemstones to level up your planets and equipment parts. Fuse 3 Gemstones of the same tier to get a higher tier Gemstone!",'
            )
        );
        // Attributes
        json = string(
            abi.encodePacked(
                json,
                '"attributes": [{"trait_type": "Element", "value": "',
                element,
                '"},',
                '{"trait_type": "Tier", "value": "',
                uint256(getTier(_tokenId)).toString(),
                '"}],'
            )
        );
        json = Base64.encode(bytes(string(abi.encodePacked(json, '"image": "', _getImageURI(_tokenId), '"}'))));
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // ------------------------- ADMIN FUNCTIONS ------------------------------

    /**
     * @dev Will update the base URL of token's URI
     * @param _newBaseMetadataURI New base URL of token's URI
     */
    function setBaseMetadataURI(string memory _newBaseMetadataURI) public onlyOwner {
        baseTokenURI = _newBaseMetadataURI;
        emit BaseMetadataURIUpdated(_newBaseMetadataURI);
    }

    /**
     * @notice Set the Address Registry
     * @param _addressRegistry The address of the Address Registry
     */
    function setAddressRegistry(AtlantisAddressRegistry _addressRegistry) external onlyOwner {
        // Require that the address is not null
        require(address(_addressRegistry) != address(0), "Address cannot be null");
        addressRegistry = _addressRegistry;
        emit AddressRegistryUpdated(address(_addressRegistry));
    }

    // ------------------------- INTERNAL FUNCTIONS ------------------------------

    /**
     * @dev Gets baseToken URI
     */
    function _baseURI() internal view returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @dev Gets baseToken URI
     */
    function baseURI() external view returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view virtual returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Indicates whether any token exist with a given id, or not.
     * @dev There are only Gemstones with tokenIds 1-12
     */
    function exists(uint256 _id) public view virtual returns (bool) {
        return _id > 0 && _id <= TOTAL_TOKEN_IDS;
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the contract must not be paused.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        require(!paused(), "ERC1155Pausable: token transfer while paused");

        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 supply = _totalSupply[id];
                require(supply >= amount, "ERC1155: burn amount exceeds totalSupply");
                unchecked {
                    _totalSupply[id] = supply - amount;
                }
            }
        }
    }

    /**
     * @dev Airdrops some gemstones to an address; for giveaways
     * @param _to          Address of the future owner of the token
     * @param _id          Token ID to mint
     * @param _quantity    Amount of tokens to mint
     * @param _data        Data to pass if receiver is contract
     */
    function airdrop(address _to, uint256 _id, uint256 _quantity, bytes memory _data) external {
        // Only whitelisted addresses can call this function
        require(devAddresses[msg.sender], "Only whitelisted addresses can call this function");
        // Only allow ids from 1-12
        if (!exists(_id)) revert NonExistentToken();
        _mint(_to, _id, _quantity, _data);
    }

    // Whitelist dev addresses
    function whitelistDevAddresses(address[] memory _devAddresses) external onlyOwner {
        for (uint256 i = 0; i < _devAddresses.length; i++) {
            devAddresses[_devAddresses[i]] = true;
        }
    }

    /**
     * @dev Pause contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract in case of emergency
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
