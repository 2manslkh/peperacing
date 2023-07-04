// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IAtlantisPlanets.sol";
import "./interface/IAtlantisGemstones.sol";
import "./interface/IStakingWithLock.sol";
import "./common/WithLimitedSupply.sol";
import "./common/RandomlyAssigned.sol";
import "./common/Base64.sol";
import "./AtlantisAddressRegistry.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Atlantis Planets Mint Contract
/// @dev Max Supply of 6000 planets
/// @dev First 12 planets are EPIC planets
// Stages
// 0: Before all minting commence
// 1: WhiteList Sale
// 2: Public sale
// 3: Post-Mint (Admin Phase)
// 4: Game Phase

contract MockAtlantisPlanets is ERC721, Ownable, IAtlantisPlanets, RandomlyAssigned {
    using Strings for uint256;
    using ECDSA for bytes32;

    AtlantisAddressRegistry public addressRegistry;

    string public baseURI;

    uint8 public stage;
    uint256 currentSupply;
    uint256 public whitelistPhase;

    // VIP Whitelist Mint Settings 750 cro
    uint256 public vipMintMaxPerWallet = 10; // VIP Sale Address Mint Cap
    uint256 public vipMintPrice = 0 ether; // VIP Sale Mint Price
    mapping(address => uint256) public vipMintCount;

    // Whitelist Mint Settings 850 cro
    uint256 public whitelistMintMaxPerWallet = 20; // Private Sale Address Mint Cap
    uint256 public whitelistMintPrice = 1 ether; // Private Sale Mint Price
    mapping(address => uint256) public whitelistMintCount;
    address private whitelistSignerAddress;

    // Public Sale Mint Settings 950 cro
    uint256 public publicMintPrice = 0 ether;
    uint256 public publicMintMaxPerWallet = type(uint256).max; // Unlimited mint
    mapping(address => uint256) public publicMintCount;

    // Treasury
    address public treasury;

    // Levelling
    bytes public levelUpGemstone;
    // xARGO base cost
    uint256 public xArgoBaseCost = 200 ether;
    // stardust base cost
    uint256 public stardustBaseCost = 200 ether;
    // stardust base cost scaling
    uint256 public stardustBaseCostScaling = 25;
    // stardust rarity cost scaling
    uint256 public stardustRarityCostScaling = 20;
    // Mapping of planet token id to planet struct
    mapping(uint256 => AtlantisLib.Planet) public planets;

    // Variable to track Gemstone tiers
    uint16 public constant gemstoneTiers = 4;
    // Variable to track max planet level
    uint16 public constant maxPlanetLevel = 50;

    bool public revealed = false;
    string public unrevealedImageURI = "ipfs://bafybeicabmv4ccbblnnpfq6q5rg5sr2qqq4mc7y7y3tqyfztiwzrkff5vi";

    // gemstone token ids is in the following sequence:
    // 1 - Fire 1
    // 2 - Lightning 1
    // 3 - Steel 1
    // 4 - Fire 2
    // 5 - Lightning 2
    // 6 - Steel 2
    // 7 - Fire 3
    // 8 - Lightning 3
    // 9 - Steel 3
    // 10 - Fire 4
    // 11 - Lightning 4
    // 12 - Steel 4

    // Events
    event PlanetUpgraded(uint256 indexed tokenId, uint256 indexed level);
    event PrivateMint(address indexed to, uint256 amount);
    event PublicMint(address indexed to, uint256 amount);

    // -------------------- MODIFIERS ----------------------

    /**
     * @dev Prevent Smart Contracts from calling the functions with this modifier
     */
    modifier onlyEOA() {
        require(msg.sender == tx.origin, "Planets: must use EOA");
        _;
    }

    constructor(
        address _owner,
        address _whitelistSignerAddress,
        string memory __baseURI,
        AtlantisAddressRegistry _addressRegistry
    ) ERC721("Atlantis Planets", "PLANETS") RandomlyAssigned(6000, 13) {
        setTreasury(_owner);
        setWhitelistSignerAddress(_whitelistSignerAddress);
        setBaseURI(__baseURI);
        transferOwnership(_owner);
        currentSupply = 0;
        addressRegistry = _addressRegistry;
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

    // -------------------- ATLANTIS PUBLIC FUNCTIONS ----------------------

    /**
     * @dev Get gemstone upgrade requirements for upgrading a planet
     * @param _tokenId The token id of the planet
     * @param _levels The number of levels to upgrade
     * @return gemstoneRequirements The gemstone requirements for upgrading the planet
     */
    function getUpgradeRequirements(
        uint256 _tokenId,
        uint8 _levels
    ) internal view returns (uint16[4] memory gemstoneRequirements) {
        // Get planet struct
        AtlantisLib.Planet memory planet = planets[_tokenId];
        uint8 planetLevel = planet.level;
        uint8 newLevel = planetLevel + _levels;
        uint8 orbit = uint8(planet.orbit);

        if (planetLevel + _levels > maxPlanetLevel) revert ExceededMaxLevel();

        // Cumulative requirement at target level - Cumulative requirement at current level = requirement for upgrade
        gemstoneRequirements[0] =
            toUint16(levelUpGemstone, orbit, newLevel, 0) -
            toUint16(levelUpGemstone, orbit, planetLevel, 0);

        gemstoneRequirements[1] =
            toUint16(levelUpGemstone, orbit, newLevel, 1) -
            toUint16(levelUpGemstone, orbit, planetLevel, 1);

        gemstoneRequirements[2] =
            toUint16(levelUpGemstone, orbit, newLevel, 2) -
            toUint16(levelUpGemstone, orbit, planetLevel, 2);

        gemstoneRequirements[3] =
            toUint16(levelUpGemstone, orbit, newLevel, 3) -
            toUint16(levelUpGemstone, orbit, planetLevel, 3);
    }

    /**
     * @notice Get uint16 value from a byte array
     * @param _bytes The byte array
     * @param orbit Orbit of the planet
     * @param level Level of the planet
     * @param tier Tier of the gemstone
     * @dev This function was modified to serve retriving the gemstone upgrade requirements
     */
    function toUint16(
        bytes memory _bytes,
        uint256 orbit,
        uint256 level,
        uint256 tier
    ) internal pure returns (uint16 tempUint) {
        uint256 _start = orbit * 8 + (level - 1) * 32 + tier * 2;
        require(_bytes.length >= _start + 2, "toUint16_outOfBounds");

        assembly {
            tempUint := mload(add(add(_bytes, 0x2), _start))
        }
    }

    /**
     * @notice Get evolution stage of planet
     * @param level Level of a planet
     */
    function _getPlanetEvolution(
        uint16 level
    ) internal pure returns (AtlantisLib.Evolution evo, string memory evoString) {
        if (level < 20) {
            evo = AtlantisLib.Evolution.ALPHA;
            evoString = "Alpha";
        } else if (level >= 20 && level < 30) {
            evo = AtlantisLib.Evolution.BETA;
            evoString = "Beta";
        } else if (level >= 30 && level < 40) {
            evo = AtlantisLib.Evolution.GAMMA;
            evoString = "Gamma";
        } else if (level >= 40 && level < 50) {
            evo = AtlantisLib.Evolution.DELTA;
            evoString = "Delta";
        } else if (level == 50) {
            evo = AtlantisLib.Evolution.EPSILON;
            evoString = "Epsilon";
        }
    }

    /**
     * @notice Get planet details
     * @dev Planet details include: level, element, orbit, onExpedition
     */
    function getPlanetDetails(uint256 _planetId) external view returns (AtlantisLib.Planet memory) {
        AtlantisLib.Planet memory planet = planets[_planetId];
        return planet;
    }

    /**
     * @notice Return xArgo cost for upgrading a planet
     */
    function getxArgoCost(uint8 currentLevel, uint8 newLevel) internal view returns (uint256 xArgoCost) {
        if (currentLevel == 0 || currentLevel >= newLevel) revert InvalidUpgradeLevel(currentLevel, newLevel);

        // Loop through all levels and add up xArgo cost
        for (uint256 i = currentLevel; i < newLevel; i++) {
            xArgoCost += xArgoBaseCost * i;
        }
    }

    /**
     * @notice Return stardust cost for upgrading a planet
     * @param currentLevel Current Level of Planet
     * @param newLevel New planet level
     * @param orbit Orbit of planet
     */
    function getStardustCost(
        uint8 currentLevel,
        uint8 newLevel,
        uint8 orbit
    ) internal view returns (uint256 stardustCost) {
        if (currentLevel == 0 || currentLevel >= newLevel) revert InvalidUpgradeLevel(currentLevel, newLevel);

        // Loop through all levels and add up stardust cost
        for (uint256 i = currentLevel; i < newLevel; i++) {
            stardustCost +=
                (stardustBaseCost *
                    (((i - 1) * stardustBaseCostScaling + 100) * ((orbit) * stardustRarityCostScaling + 100))) /
                10000;
        }
    }

    /**
     * External function for frontend to retrieve stardust, xArgo, and gemstone costs in 1 multicall
     */
    function getUpgradeCosts(
        uint256 _tokenId,
        uint8 _levels
    ) external view returns (uint256 stardustCost, uint256 xArgoCost, uint16[4] memory gemstoneRequirements) {
        // Get planet struct
        AtlantisLib.Planet memory planet = planets[_tokenId];
        uint8 planetLevel = planet.level;
        uint8 newLevel = planetLevel + _levels;
        uint8 orbit = uint8(planet.orbit);

        require(planetLevel + _levels <= maxPlanetLevel, "Planets: Planet cannot be upgraded to this level!");

        // Get stardust cost
        stardustCost = getStardustCost(planetLevel, newLevel, orbit);

        // Get xArgo cost
        xArgoCost = getxArgoCost(planetLevel, newLevel);

        // Get gemstone requirements
        gemstoneRequirements = getUpgradeRequirements(_tokenId, _levels);
    }

    /**
     * @notice Returns total supply of AtlantisPlanets
     */
    function totalSupply() public view returns (uint256) {
        return currentSupply;
    }

    /**
     * @dev Upgrade a planet by `_levels` levels
     * @param _tokenId Token ID of planet
     * @param _levels Number of levels to upgrade planet by
     */
    function upgradePlanet(uint256 _tokenId, uint8 _levels) external {
        IERC20 xARGO = IERC20(addressRegistry.getXargo());
        IAtlantisGemstones atlantisGemstones = IAtlantisGemstones(addressRegistry.getGemstones());
        IStakingWithLock stakingWithLock = IStakingWithLock(addressRegistry.getStakingWithLock());

        // Check if upgrader is owner of planet
        if (ownerOf(_tokenId) != msg.sender) revert NotOwnerOfPlanet();
        // Check if stage 4
        if (stage != 4) revert InvalidStage(stage, 4);

        AtlantisLib.Planet storage planet = planets[_tokenId];

        uint8 orbit = uint8(planet.orbit);

        if (planet.level + _levels > maxPlanetLevel) revert ExceededMaxLevel();

        // Get xARGO requirements
        uint256 xArgoCost = getxArgoCost(planet.level, planet.level + _levels);
        // Get Stardust requirements
        // Base cost scaling for stardust 0.25 = 25, need math properly
        uint256 stardustCost = getStardustCost(planet.level, planet.level + _levels, orbit);

        // Get gemstone requirements
        uint16[4] memory gemstoneRequirements = getUpgradeRequirements(_tokenId, _levels);

        uint16 planetTypeTierStep = 0;
        uint16 step = 1;
        // Increase planet level
        planet.level += _levels;
        while (step <= gemstoneTiers) {
            uint256 toBurn = gemstoneRequirements[step - 1];
            // Burn gemstones
            if (toBurn > 0) {
                atlantisGemstones.burn(msg.sender, uint256(uint256(planet.element) + 1 + planetTypeTierStep), toBurn);
            }
            step++;
            planetTypeTierStep += 3;
        }
        // Transfer xARGO and Stardust to this contract
        xARGO.transferFrom(msg.sender, address(this), xArgoCost);
        if (stardustCost > 0) {
            stakingWithLock.unstakeAndBurn(stardustCost);
        }

        emit PlanetUpgraded(_tokenId, planet.level);
    }

    // -------------------- MINT FUNCTIONS --------------------------

    /**
     * @dev Mint planet (Whitelist only)
     * @param _mintAmount Amount of planets to mint
     * @param nonce Unique Nonce
     * @param signature Signature provided by the signerAddress
     */
    function whitelistMint(
        uint256 _mintAmount,
        bytes memory nonce,
        bytes memory signature
    ) external payable onlyEOA ensureAvailabilityFor(_mintAmount) {
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
        currentSupply += _mintAmount;

        for (uint256 i; i < _mintAmount; i++) {
            _mintPlanet();
        }
        emit PrivateMint(msg.sender, _mintAmount);
    }

    /**
     * @notice Public Mint
     * @param _mintAmount Amount that is minted
     */
    function mint(uint256 _mintAmount) external payable onlyEOA ensureAvailabilityFor(_mintAmount) {
        // Check if public sale is open
        if (stage != 2) revert InvalidStage(stage, 2);
        publicMintCount[msg.sender] += _mintAmount;
        currentSupply += _mintAmount;
        // Check if enough ETH is sent
        if (msg.value != _mintAmount * publicMintPrice)
            revert InsufficientCRO(msg.value, _mintAmount * publicMintPrice);
        // Check if mints does not exceed total max supply

        for (uint256 i; i < _mintAmount; i++) {
            _mintPlanet();
        }
        emit PublicMint(msg.sender, _mintAmount);
    }

    /**
     * @notice Mint planet
     * @dev Set initial planet level to 1 and random mint to msg.sender
     */
    function _mintPlanet() internal {
        // Get next token Id
        uint256 _tokenId = nextToken();
        // Initialize planet
        planets[_tokenId].level = 1;
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

    // -------------------- ATLANTIS ADMIN FUNCTIONS ----------------------
    /**
     * @dev Set planet backgrounds
     * @param _tokenIds Token ID of planets
     * @param _backgrounds Backgrounds of planets
     */
    function setPlanetBackgrounds(
        uint256[] calldata _tokenIds,
        AtlantisLib.Background[] calldata _backgrounds
    ) external onlyOwner {
        if (stage != 3) revert InvalidStage(stage, 3);
        // Loop through planet types and set planet type
        for (uint256 i; i < _backgrounds.length; i++) {
            planets[_tokenIds[i]].background = _backgrounds[i];
        }
    }

    /**
     * @dev Set planet orbit names
     * @param _tokenIds Token ID of planets
     * @param _planetOrbitNames Orbit Names of planets
     */

    function setPlanetOrbitNames(
        uint256[] calldata _tokenIds,
        AtlantisLib.OrbitName[] calldata _planetOrbitNames
    ) external onlyOwner {
        if (stage != 3) revert InvalidStage(stage, 3);
        // Loop through planet types and set planet type
        for (uint256 i; i < _planetOrbitNames.length; i++) {
            planets[_tokenIds[i]].orbitName = _planetOrbitNames[i];
        }
    }

    /**
     * @dev Set planet orbit
     * @param _tokenIds Token ID of planets
     * @param _planetOrbits Orbit of planets
     */
    function setPlanetOrbits(
        uint256[] calldata _tokenIds,
        AtlantisLib.Orbit[] calldata _planetOrbits
    ) external onlyOwner {
        if (stage != 3) revert InvalidStage(stage, 3);
        // Loop through planet types and set planet type
        for (uint256 i; i < _planetOrbits.length; i++) {
            planets[_tokenIds[i]].orbit = _planetOrbits[i];
        }
    }

    /**
     * @dev Set planet element
     * @param _tokenIds Token ID of planets
     * @param _gemstoneTypes Element of planets
     */
    function setPlanetElements(
        uint256[] calldata _tokenIds,
        AtlantisLib.Element[] calldata _gemstoneTypes
    ) external onlyOwner {
        // Require stage 3
        if (stage != 3) revert InvalidStage(stage, 3);
        // Set planet type
        for (uint256 i; i < _tokenIds.length; i++) {
            planets[_tokenIds[i]].element = _gemstoneTypes[i];
        }
    }

    /**
     * @notice Set level up gemstone costs
     * @param _data gemstone cost packed in bytes
     * @dev _data is packed as follows:
     *     Cumulative cost for each gemstone tier for each planet type
     *              | Common              | Uncommon            | Rare                | Epic
     *              | T1   T2   T3   T4   | T1   T2   T3   T4   | T1   T2   T3   T4   | T1   T2   T3   T4
     *     Level 1  | 0000 0000 0000 0000 | 0000 0000 0000 0000 | 0000 0000 0000 0000 | 0000 0000 0000 0000
     *     ...
     *     Level 50 | 0122 00af 00e1 0113 | 015c 00d2 010e 014a | 0196 00f5 013b 0181 | 01d0 0118 0168 01b8
     */
    function setLevelUpGemstone(bytes calldata _data) external onlyOwner {
        // Require stage 3
        if (stage != 3) revert InvalidStage(stage, 3);
        levelUpGemstone = _data;
    }

    /**
     * @dev Withdraw ERC20 Tokens From this contract
     * @param _tokenAddress Address of ERC20 token
     * @param _amount Amount of ERC20 token to withdraw
     */
    function withdrawERC20(IERC20 _tokenAddress, uint256 _amount) external onlyOwner {
        _tokenAddress.transfer(treasury, _amount);
    }

    // Setters for base costs
    /**
     * @dev Set xArgo And Stardust base costs
     * @param _xArgoBaseCost xArgo base cost
     * @param _stardustBaseCost Stardust base cost
     */
    function setBaseCosts(uint256 _xArgoBaseCost, uint256 _stardustBaseCost) external onlyOwner {
        xArgoBaseCost = _xArgoBaseCost;
        stardustBaseCost = _stardustBaseCost;
    }

    // Setters for scaling
    /**
     * @dev Set stardust scaling costs
     * @param _stardustBaseCostScaling sd base cost scaling
     * @param _stardustRarityCostScaling Stardust rarity cost scaling
     */
    function setScaling(uint256 _stardustBaseCostScaling, uint256 _stardustRarityCostScaling) external onlyOwner {
        stardustBaseCostScaling = _stardustBaseCostScaling;
        stardustRarityCostScaling = _stardustRarityCostScaling;
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
     * @notice Returns if given tokenId exists in AtlantisPlanets
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    // ------------------------- TOKEN METADATA ----------------------------

    /**
     * @notice Get ImageURI
     */
    function getImageURI(
        AtlantisLib.Background background,
        AtlantisLib.Element element,
        AtlantisLib.OrbitName orbitName,
        AtlantisLib.Evolution evo
    ) public view returns (string memory) {
        if (!revealed) {
            return unrevealedImageURI;
        }
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Strings.toString(uint(background)),
                    "/",
                    Strings.toString(uint(element)),
                    "/",
                    Strings.toString(uint(evo)),
                    "/",
                    Strings.toString(uint(orbitName)),
                    ".png"
                )
            );
    }

    /**
     * @notice Returns token metadata
     * @dev Metadata is stored on-chain
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        // Get Planet
        AtlantisLib.Planet memory planet = planets[tokenId];

        // Get Tier from Level
        (AtlantisLib.Evolution evo, string memory evoString) = _getPlanetEvolution(planet.level);

        // Name
        string memory json = string(abi.encodePacked('{"name": "', name(), " #", tokenId.toString(), '",'));

        // Description
        json = string(
            abi.encodePacked(
                json,
                '"description": "Welcome to the captivating realm of Atlantis, the game-verse and home of the legendary Argonauts. Planets are coveted lands that hold the key to your success in the game. Acquire planets, embark on exciting expeditions, and earn rewards that will supercharge your growth in Atlantis.",'
            )
        );

        // Attributes
        if (!revealed) {
            json = string(abi.encodePacked(json, '"attributes": [],'));
        } else {
            json = string(
                abi.encodePacked(
                    json,
                    '"attributes": [{"trait_type": "Element", "value": "',
                    AtlantisLib._planetElementToString(planet.element),
                    '"},',
                    '{"trait_type": "Background", "value": "',
                    AtlantisLib._planetBackgroundToString(planet.background),
                    '"},',
                    '{"trait_type": "Orbit Name", "value": "',
                    AtlantisLib._planetOrbitTypeToString(planet.orbitName),
                    '"},'
                )
            );
            json = string(
                abi.encodePacked(
                    json,
                    '{"trait_type": "Orbit", "value": "',
                    AtlantisLib._planetOrbitToString(planet.orbit),
                    '"},',
                    '{"trait_type": "Evolution", "value": "',
                    evoString,
                    '"},',
                    '{"trait_type": "Level", "value": "',
                    Strings.toString(planet.level),
                    '"}],'
                )
            );
        }

        json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        json,
                        '"image": "',
                        getImageURI(planet.background, planet.element, planet.orbitName, evo),
                        '"}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @notice Set the Address Registry
     * @param _addressRegistry The address of the Address Registry
     */
    function setAddressRegistry(AtlantisAddressRegistry _addressRegistry) external onlyOwner {
        addressRegistry = _addressRegistry;
    }

    function devMint(address _to, uint256 _mintAmount) public ensureAvailabilityFor(_mintAmount) onlyOwner {
        currentSupply += _mintAmount;
        for (uint256 i; i < _mintAmount; i++) {
            // Get next token Id
            uint256 _tokenId = nextToken();
            // Initialize planet
            planets[_tokenId].level = 1;
            // Mint planet
            _safeMint(tx.origin, _tokenId);
        }

        emit PublicMint(_to, _mintAmount);
    }

    function faucetMint(address _to) public {
        currentSupply += 12;
        // Mint 3 fire planets, common uncommon rare epic
        for (uint256 i = 0; i < 4; i++) {
            uint256 _tokenId;

            _tokenId = mintAndSetProperties(_to, AtlantisLib.Element.FIRE, AtlantisLib.Orbit(i));
            setOrbitAndBackground(_tokenId, i);

            _tokenId = mintAndSetProperties(_to, AtlantisLib.Element.LIGHTNING, AtlantisLib.Orbit(i));
            setOrbitAndBackground(_tokenId, i);

            _tokenId = mintAndSetProperties(_to, AtlantisLib.Element.STEEL, AtlantisLib.Orbit(i));
            setOrbitAndBackground(_tokenId, i);
        }
    }

    function mintAndSetProperties(
        address _to,
        AtlantisLib.Element element,
        AtlantisLib.Orbit orbit
    ) internal returns (uint256 _tokenId) {
        _tokenId = nextToken();
        _safeMint(_to, _tokenId);
        planets[_tokenId].element = element;
        planets[_tokenId].level = 1;
        planets[_tokenId].orbit = orbit;
        return _tokenId;
    }

    function setOrbitAndBackground(uint256 _tokenId, uint256 i) internal {
        if (i == 0) {
            planets[_tokenId].orbitName = AtlantisLib.OrbitName.HALO_RING;
            planets[_tokenId].background = AtlantisLib.Background.PURPLE_HUES;
        } else if (i == 1) {
            planets[_tokenId].orbitName = AtlantisLib.OrbitName.RAINBOW_CLOUDS;
            planets[_tokenId].background = AtlantisLib.Background.WAVY;
        } else if (i == 2) {
            planets[_tokenId].orbitName = AtlantisLib.OrbitName.INTERSTELLAR_GRADIENT;
            planets[_tokenId].background = AtlantisLib.Background.SHOOTING_STARS;
        } else {
            planets[_tokenId].orbitName = AtlantisLib.OrbitName.INTERSTELLAR_GOLD;
            planets[_tokenId].background = AtlantisLib.Background.GOLD_SKIES;
        }
    }

    function devEpicMint(address[12] calldata _auctionWinners) external onlyOwner {
        require(_auctionWinners.length == 12, "AtlantisPlanets: Invalid length");
        // Mint token Ids 1-12
        for (uint256 i = 1; i < 13; i++) {
            planets[i].level = 1;
            _safeMint(_auctionWinners[i - 1], i);
        }
    }
}
