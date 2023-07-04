// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interface/IAtlantisSpaceships.sol";
import "./interface/IAtlantisEquipments.sol";
import "./AtlantisAddressRegistry.sol";
import "./common/Base64.sol";

/// @title Atlantis Spaceships Contract
/// @dev Race your spaceships on the racing contract! Equip equipments to boost speed!
contract AtlantisSpaceships is ERC721, Ownable, IAtlantisSpaceships, IERC1155Receiver, ReentrancyGuard {
    using Strings for uint256;

    AtlantisAddressRegistry public addressRegistry;

    string public baseURI;

    uint256 public currentSupply;
    uint256 public currentIndex = 1;
    // Mapping of spaceshipIDs to spaceships
    mapping(uint256 => Spaceship) public spaceships;

    // Events
    event EquipmentModified(
        uint256 indexed spaceshipId,
        string fireEquipmentString,
        string lightningEquipmentString,
        string steelEquipmentString,
        uint256 speed
    );
    event PublicMint(address indexed to);
    event AddressRegistryUpdated(address indexed newAddressRegistry);
    event BaseURIUpdated(string indexed newBaseURI);
    event SpaceshipRaritySet(uint256 indexed spaceshipId, string rarityString, uint256 speed);

    constructor(
        address _owner,
        string memory __baseURI,
        AtlantisAddressRegistry _addressRegistry
    ) ERC721("Atlantis Spaceships", "SPACESHIPS") {
        setBaseURI(__baseURI);
        transferOwnership(_owner);
        addressRegistry = _addressRegistry;
    }

    // -------------------- ATLANTIS FUNCTIONS --------------------------
    /** Token Ids of equipments
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

    function modifyEquipment(
        uint256 _spaceshipId,
        uint256 _fireEquipmentId,
        uint256 _lightningEquipmentId,
        uint256 _steelEquipmentId
    ) external nonReentrant {
        // Check if the spaceship is owned by the caller if not throw notOwner error
        if (ownerOf(_spaceshipId) != msg.sender) {
            revert NotOwner();
        }
        IAtlantisEquipments atlantisEquipments = IAtlantisEquipments(addressRegistry.getEquipments());
        // Get spaceship
        Spaceship storage spaceship = spaceships[_spaceshipId];

        // Set spaceship Equipments to new Equipments
        _equipHelper(spaceship.fireEquipmentId, _fireEquipmentId, 1);
        _equipHelper(spaceship.lightningEquipmentId, _lightningEquipmentId, 2);
        _equipHelper(spaceship.steelEquipmentId, _steelEquipmentId, 0);

        spaceship.fireEquipmentId = _fireEquipmentId;
        spaceship.lightningEquipmentId = _lightningEquipmentId;
        spaceship.steelEquipmentId = _steelEquipmentId;

        emit EquipmentModified(
            _spaceshipId,
            atlantisEquipments.getLevel(_fireEquipmentId) != 0
                ? uint256(atlantisEquipments.getLevel(_fireEquipmentId)).toString()
                : "Unequipped",
            atlantisEquipments.getLevel(_lightningEquipmentId) != 0
                ? uint256(atlantisEquipments.getLevel(_lightningEquipmentId)).toString()
                : "Unequipped",
            atlantisEquipments.getLevel(_steelEquipmentId) != 0
                ? uint256(atlantisEquipments.getLevel(_steelEquipmentId)).toString()
                : "Unequipped",
            getSpeed(_spaceshipId)
        );
    }

    /**
     * @dev Internal function to handle equipping
     * @param _oldId Token ID of old equipment
     * @param _newId Token ID of new equipment
     * @param _element Element of equipment
     */
    function _equipHelper(uint256 _oldId, uint256 _newId, uint8 _element) internal {
        IAtlantisEquipments atlantisEquipments = IAtlantisEquipments(addressRegistry.getEquipments());

        // Do nothing if oldId and newId are the same
        if (_oldId == _newId) {
            return;
        }
        // Check that newId is the correct element if not throw wrongelement
        if (_newId != 0 && atlantisEquipments.getElement(_newId) != _element) {
            revert WrongElement();
        }
        // Check if newId is not zero
        if (_newId != 0) {
            // Transfer newId to contract
            IERC1155(address(atlantisEquipments)).safeTransferFrom(msg.sender, address(this), _newId, 1, "");
        }
        // Check if oldId is not zero
        if (_oldId != 0) {
            // Transfer oldId to owner
            IERC1155(address(atlantisEquipments)).safeTransferFrom(address(this), msg.sender, _oldId, 1, "");
        }
        return;
    }

    /**
     * @notice Get details of a spaceship from its id
     * @param _tokenId Token ID of spaceship
     */
    function getSpaceship(uint256 _tokenId) external view returns (SpaceshipData memory) {
        SpaceshipData memory _spaceshipData = SpaceshipData(spaceships[_tokenId], getSpeed(_tokenId));
        return _spaceshipData;
    }

    /**
     * @notice Get speed of a spaceship from its id
     * @param _tokenId Token ID of spaceship
     */

    function getSpeed(uint256 _tokenId) public view returns (uint256) {
        IAtlantisEquipments atlantisEquipments = IAtlantisEquipments(addressRegistry.getEquipments());
        // Get spaceship
        Spaceship memory spaceship = spaceships[_tokenId];
        // Get rarity
        AtlantisLib.Rarity _rarity = spaceship.rarity;
        uint16 fireSpeed = atlantisEquipments.getSpeed(spaceship.fireEquipmentId);
        uint16 lightningSpeed = atlantisEquipments.getSpeed(spaceship.lightningEquipmentId);
        uint16 steelSpeed = atlantisEquipments.getSpeed(spaceship.steelEquipmentId);

        return (uint16(_rarity) + 1) * (fireSpeed + lightningSpeed + steelSpeed + 1);
    }

    /**
     * @notice Get rarity of a spaceship from its id
     * @param _tokenId Token ID of spaceship
     */
    function getRarity(uint256 _tokenId) external view returns (AtlantisLib.Rarity) {
        // Check exists
        require(_exists(_tokenId), "Spaceship does not exist");
        // Get spaceship
        Spaceship memory spaceship = spaceships[_tokenId];
        return spaceship.rarity;
    }

    /**
     * @dev Set rarity of all spaceships
     * @param _tokenId Token id of spaceship
     * @param _rarity Rarity of spaceship
     */
    function setSpaceshipRarity(uint256 _tokenId, AtlantisLib.Rarity _rarity) internal {
        spaceships[_tokenId].rarity = _rarity;
        uint256 _speed = getSpeed(_tokenId);
        emit SpaceshipRaritySet(_tokenId, _spaceshipRarityToString(_rarity), _speed);
    }

    // -------------------- ATLANTIS METADATA FUNCTIONS --------------------------

    /**
     * @notice Returns planet orbit as string
     * @param _rarity Rarity of spaceship
     * @return String of planet orbit
     */
    function _spaceshipRarityToString(AtlantisLib.Rarity _rarity) internal pure returns (string memory) {
        if (_rarity == AtlantisLib.Rarity.COMMON) {
            return "Common";
        } else if (_rarity == AtlantisLib.Rarity.UNCOMMON) {
            return "Uncommon";
        } else if (_rarity == AtlantisLib.Rarity.RARE) {
            return "Rare";
        } else if (_rarity == AtlantisLib.Rarity.EPIC) {
            return "Epic";
        }
    }

    /**
     * @notice Get ImageURI
     * @param _rarity Rarity of spaceship
     * @param _lightningLevel Lightning level of spaceship
     * @param _fireLevel Fire level of spaceship
     * @param _steelLevel Steel level of spaceship
     */
    function getImageURI(
        AtlantisLib.Rarity _rarity,
        uint8 _lightningLevel,
        uint8 _fireLevel,
        uint8 _steelLevel
    ) public view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    uint256(_rarity).toString(),
                    "/",
                    uint256(AtlantisLib._getEquipmentTier(_steelLevel)).toString(),
                    "/",
                    uint256(AtlantisLib._getEquipmentTier(_fireLevel)).toString(),
                    "/",
                    uint256(AtlantisLib._getEquipmentTier(_lightningLevel)).toString(),
                    ".png"
                )
            );
    }

    /**
     * @notice Returns token metadata
     * @param _tokenId Token ID of spaceship
     * @dev Metadata is stored on-chain
     * @dev Metadata is stored in JSON format
     * @return String of token metadata
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireMinted(_tokenId);
        IAtlantisEquipments atlantisEquipments = IAtlantisEquipments(addressRegistry.getEquipments());
        // Get Spaceship
        Spaceship memory spaceship = spaceships[_tokenId];

        // Get rarity
        AtlantisLib.Rarity rarity = spaceship.rarity;

        // Name
        string memory json = string(abi.encodePacked('{"name": "', name(), " #", _tokenId.toString(), '",'));

        uint8 lightningLevel = atlantisEquipments.getLevel(spaceship.lightningEquipmentId);
        uint8 fireLevel = atlantisEquipments.getLevel(spaceship.fireEquipmentId);
        uint8 steelLevel = atlantisEquipments.getLevel(spaceship.steelEquipmentId);

        string memory lightningString = lightningLevel != 0 ? uint256(lightningLevel).toString() : "Unequipped";
        string memory fireString = fireLevel != 0 ? uint256(fireLevel).toString() : "Unequipped";
        string memory steelString = steelLevel != 0 ? uint256(steelLevel).toString() : "Unequipped";
        // Description
        json = string(
            abi.encodePacked(
                json,
                '"description": "Welcome to the captivating realm of Atlantis, the game-verse and home of the legendary Argonauts. Acquire Spaceships to take part in the Atlantis race and earn attractive rewards!",'
            )
        );

        // Attributes
        json = string(
            abi.encodePacked(
                json,
                '"attributes": [{"trait_type": "Rarity", "value": "',
                _spaceshipRarityToString(rarity),
                '"},',
                '{"trait_type": "Thunderbolt Wings Level", "value": "',
                lightningString,
                '"},',
                '{"trait_type": "Inferno Thrusters Level", "value": "',
                fireString,
                '"},',
                '{"trait_type": "Argonium Exoshell Level", "value": "',
                steelString,
                '"},'
            )
        );

        json = string(
            abi.encodePacked(json, '{"trait_type": "Speed", "value": "', uint256(getSpeed(_tokenId)).toString(), '"}],')
        );

        json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        json,
                        '"image": "',
                        getImageURI(rarity, lightningLevel, fireLevel, steelLevel),
                        '"}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // -------------------- MINT FUNCTIONS --------------------------

    /**
     * @notice Public Mint
     * @param _address Address of user
     */
    function _mintOne(address _address) internal {
        currentSupply += 1;
        _safeMint(_address, currentIndex);
        currentIndex += 1;

        emit PublicMint(_address);
    }

    /**
     * @notice Airdrop multiple nfts to multiple addresses
     * @param _addresses All addresses that will receive nfts
     * @param _rarities Amount of nfts that will be minted for each address
     */
    function airdrop(address[] calldata _addresses, uint8[] calldata _rarities) external onlyOwner {
        // Check that both arrays are the same length
        require(_addresses.length == _rarities.length, "Arrays must be the same length");
        for (uint256 i; i < _addresses.length; i++) {
            _mintOne(_addresses[i]);
            setSpaceshipRarity(currentIndex - 1, AtlantisLib.Rarity(_rarities[i]));
        }
    }

    // ------------------------- OWNER FUNCTIONS ----------------------------
    /**
     * @dev Set Metadata URI
     * @param _newBaseURI new base uri
     */
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    // Set Address registry
    function setAddressRegistry(AtlantisAddressRegistry _addressRegistry) public onlyOwner {
        addressRegistry = _addressRegistry;
        emit AddressRegistryUpdated(address(_addressRegistry));
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
     * @notice Checks if token exists
     * @param tokenId Token ID
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @notice Returns total supply of spaceships
     */
    function totalSupply() public view returns (uint256) {
        return currentSupply;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
