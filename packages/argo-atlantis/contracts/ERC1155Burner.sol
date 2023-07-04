pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
// Import IERC1155Receiver
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

contract ERC1155Burner is IERC1155Receiver {
    // The address of the ERC-1155 token contract
    IERC1155 private immutable _erc1155Token;

    // Mapping of user to burnt
    mapping(address => uint256) public burnt;

    // Event to emit when tokens are burned
    event TokensBurned(address indexed user, uint256 indexed tokenId, uint256 amount);

    constructor(IERC1155 erc1155Token) {
        _erc1155Token = erc1155Token;
    }

    function burnTokens(uint256 tokenId, uint256 amount) external {
        // Update mapping to reflect burnt tokens
        burnt[msg.sender] += amount;
        // Transfer tokens to the zero address
        _erc1155Token.safeTransferFrom(msg.sender, address(0x0000dead), tokenId, amount, "");
        // Emit the TokensBurned event
        emit TokensBurned(msg.sender, tokenId, amount);
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
