//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interface/IAtlantisEquipments.sol";
import "./interface/IAtlantisGemstones.sol";
import "./interface/IStakingWithLock.sol";
import "./AtlantisAddressRegistry.sol";
import "./common/Base64.sol";

/// @title Atlantis - Equipment contract
/// @dev Fuse 2 equipment of the same tier to receive 1 from the next tier. Equipment can be equipped on spaceships to boost their speed in a race.
contract AtlantisEquipments is ERC1155, Pausable, Ownable, IAtlantisEquipments, ReentrancyGuard {
    using Strings for uint256;
    using SafeERC20 for IERC20;
    /// @notice Current payment mode
    PaymentMode public paymentMode;
    /// @notice Current payment token
    IERC20 public paymentToken;
    /// @notice Name of contract
    string public name;
    /// @notice Name of symbol
    string public symbol;
    /// @notice Total supply for each collection ids
    mapping(uint256 => uint256) private _totalSupply;
    /// @notice Base token URI
    string public baseTokenURI;
    /// @notice Max number of tokeniDS
    uint256 public constant TOTAL_TOKEN_IDS = 30;
    /// @notice Mint cost of equipments
    uint256 public mintCost = 200 ether;
    /// @notice Contract address of address registry
    AtlantisAddressRegistry public addressRegistry;
    /// @notice Cost of stardust required
    uint256[5] public stardustCost;
    /// @notice Number of gemstones required
    uint16[5] public gemstonesRequired;
    /// @notice Speeds of equipment
    uint16[10] public equipmentSpeeds;
    /// @notice Nonce used for calculation purposes
    uint256 private nonce;
    /// @notice Address of treasury
    address public treasury;
    /// @notice Max number of gemstones required
    uint16 public constant MAX_GEMSTONES_REQUIRED = 500;
    /// @notice Max stardust cost
    uint256 public constant MAX_STARDUST_COST = 500000 ether;
    /// @notice Max mint cost
    uint256 public constant MAX_MINT_COST = 10000000 ether;
    /// @notice Whitelisted addresses who can call airdrop
    mapping(address => bool) public devAddresses;

    /**
     * @notice Constructor for Atlantis Equipments
     * @param _name Name of contract
     * @param _symbol Symbol of contract
     * @param baseURI base URI with images
     * @param owner Address of owner
     * @param _registry Registry of Atlantis
     * @param _treasury Address of treaury
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        address owner,
        AtlantisAddressRegistry _registry,
        address _treasury,
        uint256[5] memory _stardustCost,
        uint16[5] memory _gemstonesRequired,
        uint16[10] memory _equipmentSpeeds
    ) ERC1155(baseURI) {
        // Check that registry and treasury are not address(0)
        require(address(_registry) != address(0), "AtlantisEquipment: Registry is address(0)");
        require(_treasury != address(0), "AtlantisEquipment: Treasury is address(0)");
        // Set name and symbol
        name = _name;
        symbol = _symbol;
        // Set metadata uri
        setBaseMetadataURI(baseURI);
        // Transform ownership to the owner
        transferOwnership(owner);
        // Get atlantis address
        addressRegistry = _registry;
        // Get treasury
        treasury = _treasury;
        // Initialise stardustCost, gemstonesRequired and equipmentSpeeds
        stardustCost = _stardustCost;
        gemstonesRequired = _gemstonesRequired;
        equipmentSpeeds = _equipmentSpeeds;

        // Set default payment mode
        paymentMode = PaymentMode.TOKEN;

        // Initialise paymentToken to stardust
        paymentToken = IERC20(addressRegistry.getStardust());

        // Add owner to the devAddresses
        devAddresses[owner] = true;
    }

    // ------------------------- VIEW FUNCTIONS ------------------------------

    /**
     * @dev Total amount of tokens in with a given id.
     * @return uint256
     */
    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @notice Get ImageURI
     * @param _tokenId The id of the equipment
     * @return returns string of imageURI
     */
    function _getImageURI(uint256 _tokenId) internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    uint256(getElement(_tokenId)).toString(),
                    "/",
                    uint256(getLevel(_tokenId)).toString(),
                    ".png"
                )
            );
    }

    /**
     * @notice Get token metadata with tokenId
     * @param _tokenId The id of the equipment
     * @return returns string of token metadata
     */
    function uri(uint256 _tokenId) public view override returns (string memory) {
        require(exists(_tokenId), "Resources: URI query for nonexistent token");
        string memory _name = _tokenIdToEquipmentNameString(_tokenId);
        string memory json = string(
            abi.encodePacked('{"name": "', _name, " Level ", uint256(getLevel(_tokenId)).toString(), '",')
        );
        // Description
        json = string(
            abi.encodePacked(
                json,
                '"description": "Welcome to the captivating realm of Atlantis, the game-verse and home of the legendary Argonauts. Equipment are valuable items which provides speed boost to your Spaceships. Fuse 2 Equipment of the same level to level it up!",'
            )
        );
        // Attributes
        json = string(
            abi.encodePacked(
                json,
                '"attributes": [{"trait_type": "Type", "value": "',
                _name,
                '"},',
                '{"trait_type": "Level", "value": "',
                uint256(getLevel(_tokenId)).toString(),
                '"},',
                '{"trait_type": "Speed", "value": "',
                uint256(getSpeed(_tokenId)).toString(),
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
     * @dev Set Address Registry contract address
     * @param _addressRegistry Address of Address Registry contract
     */
    function setAddressRegistry(AtlantisAddressRegistry _addressRegistry) external onlyOwner {
        require(address(_addressRegistry) != address(0), "AtlantisEquipments: Address Registry is address(0)");
        addressRegistry = _addressRegistry;
        emit AddressRegistryUpdated(address(_addressRegistry));
    }

    function random() private view returns (uint) {
        uint randomHash = uint(
            keccak256(
                abi.encodePacked(msg.sender, block.coinbase, block.difficulty, block.gaslimit, block.timestamp, nonce)
            )
        );
        return randomHash % 3;
    }

    function mint(address _to, uint256 _quantity) public payable {
         IStakingWithLock stakingWithLock = IStakingWithLock(addressRegistry.getStakingWithLock());
        uint256 _id;
        if (paymentMode == PaymentMode.CRYPTO) {
            require(msg.value == _quantity * mintCost, "AtlantisEquipments: Insufficient CRO!");
        } else {
             // If paymentToken is stardust, burn the tokens
            if (address(paymentToken) == addressRegistry.getStardust()) {
                stakingWithLock.unstakeAndBurn(mintCost * _quantity);
            }
            else{
            // Transfer the required tokens from the user
            require(paymentToken.transferFrom(msg.sender, address(this), mintCost * _quantity), "Transfer failed");
            }
        }

        // Loop through quantity
        for (uint256 i = 0; i < _quantity; i++) {
            _id = random() + 1;
            nonce += 1;
            _mint(_to, _id, 1, "");
        }
    }

    // Set mint cost
    function setMintCost(uint256 _newMintCost) external onlyOwner {
        // Mint cost cannot be above max mint cost
        require(_newMintCost <= MAX_MINT_COST, "AtlantisEquipments: Mint cost cannot be above max mint cost");
        mintCost = _newMintCost;
        emit MintCostUpdated(_newMintCost);
    }

    // Set payment mode
    function setPaymentMode(PaymentMode _paymentMode) public onlyOwner {
        paymentMode = _paymentMode;
        emit PaymentModeUpdated(_paymentMode);
    }

    // Set payment token
    function setPaymentToken(IERC20 _paymentToken) public onlyOwner {
        // Cannot be 0
        require(address(_paymentToken) != address(0), "AtlantisEquipments: Payment token cannot be address(0)");
        paymentToken = _paymentToken;
        emit PaymentTokenUpdated(address(_paymentToken));
    }

    /**
     * @dev Mint tokens for each id in _ids
     * @param _to          The address to mint tokens to
     * @param _ids         Array of ids to mint
     * @param _quantities  Array of amounts of tokens to mint per id
     * @param _data        Data to pass if receiver is contract
     */
    function batchMint(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _quantities,
        bytes memory _data
    ) public onlyOwner {
        _mintBatch(_to, _ids, _quantities, _data);
    }

    /**
     * @notice Withdraw all CRO from this account to the owner
     */
    function withdrawFund() external onlyOwner {
        (bool success, ) = payable(treasury).call{ value: address(this).balance }("");
        require(success, "Transfer failed");
    }

      /**
     * @notice Withdraw all specified ERC20 tokens from this account to the owner
     */
    function withdrawERC20(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Token is address(0)");
        IERC20 token = IERC20(_token);
        require(token.transfer(treasury, _amount), "Transfer failed");
    }

    // ------------------------- INTERNAL FUNCTIONS ------------------------------

    /// @dev Gets baseToken URI
    function _baseURI() internal view returns (string memory) {
        return baseTokenURI;
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
     * @dev Indicates whether any token exist with a given id, or not.
     */
    function exists(uint256 _id) public view virtual returns (bool) {
        return _id > 0 && _id <= TOTAL_TOKEN_IDS;
    }

    /**
     * @dev Get gemstone id from equipment Id
     */
    function getGemstoneIdFromEquipmentId(uint256 _id) public pure returns (uint256) {
        if (_id > 27) {
            revert UpgradeError();
        }
        uint256 _element = (_id % 3);
        uint256 _gemstoneId;
        if (_element == 1) {
            _gemstoneId = 10;
        } else if (_element == 2) {
            _gemstoneId = 11;
        } else if (_element == 0) {
            _gemstoneId = 12;
        }
        return _gemstoneId;
    }

    /**
     * @notice Get equipment name from tokenId
     * @param _tokenId The id of the equipment
     */
    function _tokenIdToEquipmentNameString(uint256 _tokenId) internal pure returns (string memory) {
        uint256 _element = (_tokenId % 3);
        string memory _elementName;
        if (_element == 1) {
            _elementName = "Inferno Thrusters";
        } else if (_element == 2) {
            _elementName = "Thunderbolt Wings";
        } else if (_element == 0) {
            _elementName = "Argonium Exoshell";
        }
        return _elementName;
    }

    /**
     * @notice Fuse equipment
     * @param _id The id of the equipment
     * @param _amountToCreate Amount of next tier equipment to create
     */
    function fuseEquipment(uint256 _id, uint16 _amountToCreate) external nonReentrant {
        IAtlantisGemstones atlantisGemstones = IAtlantisGemstones(addressRegistry.getGemstones());
        IStakingWithLock stakingWithLock = IStakingWithLock(addressRegistry.getStakingWithLock());
        // Total fusion cost
        uint256 _fusionCost = calculateFusionCost(_id, _amountToCreate);

        // gemstone cost
        uint256 _gemstoneCost = calculateGemstonesCost(_id, _amountToCreate);
        // Calculate Equipment required to fuse
        uint256 _amountToBurn = fuseEquipmentsView(_id, _amountToCreate);
        uint256 _toId = _id + 3;
        _burn(msg.sender, _id, _amountToBurn);
        // Mint new Equipment
        _mint(msg.sender, _toId, _amountToCreate, "");
        // Burn Gemstone
        atlantisGemstones.burn(msg.sender, getGemstoneIdFromEquipmentId(_id), _gemstoneCost);
        // Burn stardust if _fusionCost is more than 0
        if (_fusionCost > 0) {
            stakingWithLock.unstakeAndBurn(_fusionCost);
        }
        // Emit fuse event
        emit FuseEquipment(msg.sender, _toId, _amountToCreate, totalSupply(_toId));
    }

    /**
     * @notice Get equipment speed from id
     * @param _id Specific equipment id
     * @return speed of equipment
     */
    function getSpeed(uint256 _id) public view returns (uint16) {
        if (_id > 30) {
            revert IdNotExistsError();
        } else if (_id == 0) {
            return 0;
        }
        uint8 _level = getLevel(_id);
        return equipmentSpeeds[_level - 1];
    }

    /**
     * @notice Get level of equipment from its id
     * @param _id Specific equipment id
     * @return level of equipment
     */
    function getLevel(uint256 _id) public pure returns (uint8) {
        if (_id > 30) {
            revert IdNotExistsError();
        } else if (_id == 0) {
            return 0;
        }
        // Logic above level 5
        uint8 _level;
        if ((_id % 3) == 0) {
            _level = uint8(_id) / 3;
        } else {
            _level = uint8(_id) / 3 + 1;
        }

        return _level;
    }

    /**
     * @notice Get element from id
     * @param _id Specific equipment id
     * @return element
     */
    function getElement(uint256 _id) public pure returns (uint8) {
        if (_id > 30 || _id == 0) {
            revert IdNotExistsError();
        }
        uint8 _element = uint8(_id) % 3;
        return _element;
    }

    /** Token Ids
     * 1 2 3 Fire Lightning Steel Equipment Level 1
     * 4 5 6 Fire Lightning Steel Equipment Level 2
     * 7 8 9 Fire Lightning Steel Equipment Level 3
     * 10 11 12 Fire Lightning Steel Equipment Level 4
     * 13 14 15 Fire Lightning Steel Equipment Level 5
     * 16 17 18 Fire Lightning Steel Equipment Level 6
     * 19 20 21 Fire Lightning Steel Equipment Level 7
     * 22 23 24 Fire Lightning Steel Equipment Level 8
     * 25 26 27 Fire Lightning Steel Equipment Level 9
     * 28 29 30 Fire Lightning Steel Equipment Level 10
     */

    /**
     * @notice Calculates cost of fusing equipment
     * @param _id Specific equipment id
     * @param _amountToCreate Amount of next tier equipment to create
     * @return Fusion cost
     */
    function calculateFusionCost(uint256 _id, uint16 _amountToCreate) public view returns (uint256) {
        // Logic for level 1 - 4
        if (_id < 13) {
            return 0;
        } else if (_id > 27) {
            revert UpgradeError();
        }
        // Logic above level 5
        uint8 _level = getLevel(_id);
        return uint256(_amountToCreate) * stardustCost[_level - 5];
    }

    /**
     * @notice Calculates gemstone cost of fusing equipmenet
     * @param _id Specific equipment id
     * @param _amountToCreate Amount of next tier equipment to create
     * @return Gemstone cost
     */
    function calculateGemstonesCost(uint256 _id, uint16 _amountToCreate) public view returns (uint16) {
        // Logic for level 1 - 4
        if (_id < 13) {
            return 0;
        }
        // Logic above level 5
        uint8 _level;
        if ((_id % 3) == 0) {
            _level = uint8(_id) / 3;
        } else {
            _level = uint8(_id) / 3 + 1;
        }
        return _amountToCreate * gemstonesRequired[_level - 5];
    }

    /**
     * @notice Calculates how much is require dto fuse to get amountToCreate
     * @param _id Specific equipment id
     * @param _amountToCreate Amount of next tier equipment to create
     * @return amount to fuse
     */
    function fuseEquipmentsView(uint256 _id, uint16 _amountToCreate) public view override returns (uint16) {
        if (!exists(_id) || _amountToCreate == 0) {
            revert UpgradeError();
        }
        // Get amount of gemstones to fuse
        uint16 amountToFuse = 2 * _amountToCreate;
        return amountToFuse;
    }

    /**
     * @notice Sets stardust costs
     * @param _stardustCost Array of stardust costs
     */
    function setStardustCosts(uint256[] calldata _stardustCost) external onlyOwner {
        // Loop through and set stardust
        for (uint256 i = 0; i < _stardustCost.length; i++) {
            // Check if the provided value is within the allowed range
            require(_stardustCost[i] <= MAX_STARDUST_COST, "Value exceeds the maximum allowed");
            stardustCost[i] = _stardustCost[i];
        }
        emit StardustCostsUpdated(_stardustCost);
    }

    /**
     * @notice Sets gemstones required
     * @param _gemstonesRequired Array of gemstonesRequired
     */
    function setGemstonesRequired(uint16[] memory _gemstonesRequired) external onlyOwner {
        // Loop through and set gemstonesRequired
        for (uint8 i = 0; i < _gemstonesRequired.length; i++) {
            // Check if the provided value is within the allowed range
            require(_gemstonesRequired[i] <= MAX_GEMSTONES_REQUIRED, "Value exceeds the maximum allowed");
            gemstonesRequired[i] = _gemstonesRequired[i];
        }
        emit GemstonesRequiredUpdated(_gemstonesRequired);
    }

    /**
     * @notice Sets speeds of equipments
     * @param _equipmentSpeeds Array of equipment speeds
     */
    function setEquipmentSpeeds(uint16[] memory _equipmentSpeeds) external onlyOwner {
        // Loop through and set equipmentSpeeds
        for (uint8 i = 0; i < _equipmentSpeeds.length; i++) {
            equipmentSpeeds[i] = _equipmentSpeeds[i];
        }
        emit EquipmentSpeedsUpdated(_equipmentSpeeds);
    }

    /**
     * @dev Airdrop some equipments to an address
     * @param _to          Address of the future owner of the token
     * @param _id          Token ID to mint
     * @param _quantity    Amount of tokens to mint
     * @param _data        Data to pass if receiver is contract
     */
    function airdrop(address _to, uint256 _id, uint256 _quantity, bytes memory _data) external {
        // Only whitelisted addresses can call this function
        require(devAddresses[msg.sender], "Only whitelisted addresses can call this function");
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
