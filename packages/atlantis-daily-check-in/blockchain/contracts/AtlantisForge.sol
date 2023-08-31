// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


// Import IERC1155
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
// Import IERC1155Receiver
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
// Import Ownable
import "@openzeppelin/contracts/access/Ownable.sol";
// Import SafeERC20
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
interface IEquipment{
    function airdrop(address _to, uint256 _id, uint256 _quantity, bytes memory _data) external;
}
interface IForge{
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
}
contract AtlantisForge is IERC1155Receiver, Ownable {
    using SafeERC20 for IForge;
    IForge public forgeToken;
    IERC1155 public gemstoneContract;
    IEquipment public equipmentContract;

    enum Gemstone { Fire, Lightning, Steel }
    
    struct EquipmentRequirement {
        Gemstone gemstone;
        uint256 forgeAmount;
        uint256 gemstoneAmount;
    }

    mapping(uint256 => EquipmentRequirement) public equipmentRequirements;

    constructor(address _forgeToken, address _gemstoneContract, address _equipmentContract, uint256 _forgeAmount, uint256 _gemstoneAmount) {
        forgeToken = IForge(_forgeToken);
        gemstoneContract = IERC1155(_gemstoneContract);
        equipmentContract = IEquipment(_equipmentContract);
        for(uint256 i = 1; i<=3;){
        setEquipmentRequirement(i, Gemstone(i-1), _forgeAmount, _gemstoneAmount);
        unchecked {
            ++i;
        }
        }
    }

    function setEquipmentRequirement(uint256 _equipmentId, Gemstone _gemstone, uint256 _forgeAmount, uint256 _gemstoneAmount) public onlyOwner {
        equipmentRequirements[_equipmentId] = EquipmentRequirement(_gemstone, _forgeAmount, _gemstoneAmount);
    }

    function _mintEquipment(uint256 _equipmentId) internal {
        EquipmentRequirement memory requirement = equipmentRequirements[_equipmentId];
        
        gemstoneContract.safeTransferFrom(msg.sender, address(this), uint256(requirement.gemstone) + 1, requirement.gemstoneAmount, "0x00");
        
        forgeToken.safeTransferFrom(msg.sender, address(this), requirement.forgeAmount);
        forgeToken.burn(requirement.forgeAmount);
        
        equipmentContract.airdrop(msg.sender, _equipmentId, 1, "0x00");
    }

    function mintEquipmentBatch(uint256[] memory _equipmentIds) external {
        for (uint256 i = 0; i < _equipmentIds.length;) {
            _mintEquipment(_equipmentIds[i]);
            unchecked {
                ++i;
            }
        }
    }
    
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        // Add your custom logic for handling ERC1155 token transfers
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        // Add your custom logic for handling ERC1155 token transfers
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
