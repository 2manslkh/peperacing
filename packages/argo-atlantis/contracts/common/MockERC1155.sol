// SPDX-License-Identifier: MIT
// Mock ERC1155 contract for testing purposes
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockERC1155 is ERC1155 {
    constructor() ERC1155("testURI") {}

    function mint(address account, uint256 id, uint256 amount, bytes memory data) external {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external {
        _mintBatch(to, ids, amounts, data);
    }
}
