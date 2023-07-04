// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AtlantisAddressRegistry.sol";

// Official incentivised testnet version
contract AtlantisFaucet is Ownable {
    // Whitelist Mapping
    mapping(address => bool) public whitelisted;
    mapping(address => bool) public dripped;
    AtlantisAddressRegistry public addressRegistry;

    // // onlyWhitelisted modifier
    // modifier onlyWhitelisted() {
    //     require(whitelisted[msg.sender], "Faucet: Not whitelisted");
    //     _;
    // }

    // receive
    receive() external payable {}

    constructor(AtlantisAddressRegistry _addressRegistry) {
        addressRegistry = _addressRegistry;
        whitelisted[msg.sender] = true;
    }

    function drip() external {
        //  require(!dripped[msg.sender], "Faucet: Already dripped");
        address argonauts = addressRegistry.getArgonauts();
        address equipment = addressRegistry.getEquipments();
        address gemstones = addressRegistry.getGemstones();
        address spaceships = addressRegistry.getSpaceships();
        address planets = addressRegistry.getAtlantisPlanets();
        address xargo = addressRegistry.getXargo();
        address gold = addressRegistry.getGold();

        // Transfer 500 cro to user
        //payable(msg.sender).transfer(500 ether);

        // Transfer 750000 xArgo to user
        (bool success, ) = xargo.call(abi.encodeWithSignature("devMint(uint256)", 750000 ether));
        require(success, "Faucet: xargo mint failed");

        // Transfer 1000000 gold to user
        (success, ) = gold.call(abi.encodeWithSignature("mint(uint256,address)", 1000000 ether, msg.sender));
        require(success, "Faucet: gold mint failed");

        // devMint Gemstones
        for (uint8 i = 1; i <= 3; i++) {
            (success, ) = gemstones.call(
                abi.encodeWithSignature("airdrop(address,uint256,uint256,bytes)", msg.sender, i, 100000, "0x")
            );
            require(success, "Faucet: gemstone mint failed");
            (success, ) = equipment.call(
                abi.encodeWithSignature("airdrop(address,uint256,uint256,bytes)", msg.sender, i, 1000, "0x")
            );
            require(success, "Faucet: equipment mint failed");
        }
        // devMint Argonauts using external call
        (success, ) = argonauts.call(abi.encodeWithSignature("mint(uint256)", 30));
        require(success, "Faucet: argonaut mint failed");

        // devMint Spaceships
        uint8[] memory spaceshipRarity = new uint8[](4);
        spaceshipRarity[0] = 0;
        spaceshipRarity[1] = 1;
        spaceshipRarity[2] = 2;
        spaceshipRarity[3] = 3;
        address[] memory addresses = new address[](4);
        addresses[0] = msg.sender;
        addresses[1] = msg.sender;
        addresses[2] = msg.sender;
        addresses[3] = msg.sender;
        (success, ) = spaceships.call(
            abi.encodeWithSignature("airdrop(address[],uint8[])", addresses, spaceshipRarity)
        );
        require(success, "Faucet: spaceship mint failed");
        // devMint Planets
        (success, ) = planets.call(abi.encodeWithSignature("faucetMint(address)", msg.sender));
        require(success, "Faucet: planet mint failed");

        // dripped[msg.sender] = true;
    }

    function whitelistAddresses(address[] calldata _addresses) external onlyOwner {
        for (uint256 i; i < _addresses.length; i++) {
            whitelisted[_addresses[i]] = true;
        }
    }
}
