// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

// Import IERC20, IERC721, IERC1155
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract Airdropper {
    /**
     * @dev Airdrop ERC20 tokens
     * @param token The address of the ERC20 token
     * @param _addresses The addresses of the recipients
     * @param _amounts The amounts of tokens to send
     */
    function airdropERC20(IERC20 token, address[] calldata _addresses, uint256[] calldata _amounts) external {
        for (uint256 i; i < _addresses.length; i++) {
            token.transferFrom(msg.sender, _addresses[i], _amounts[i]);
        }
    }

    /**
     * @dev Airdrop ERC721 tokens
     * @param token The address of the ERC721 token
     * @param _addresses The addresses of the recipients
     * @param _tokenIds The token IDs of the tokens to send
     */
    function airdropERC721(IERC721 token, address[] calldata _addresses, uint256[] calldata _tokenIds) external {
        for (uint256 i; i < _addresses.length; i++) {
            token.transferFrom(msg.sender, _addresses[i], _tokenIds[i]);
        }
    }

    /**
     * @dev Airdrop ERC1155 tokens
     * @param token The address of the ERC1155 token
     * @param _addresses The addresses of the recipients
     * @param _tokenIds The token IDs of the tokens to send
     * @param _amounts The amounts of tokens to send
     */
    function airdropERC1155(
        IERC1155 token,
        address[] calldata _addresses,
        uint256[] calldata _tokenIds,
        uint256[] calldata _amounts
    ) external {
        for (uint256 i; i < _addresses.length; i++) {
            token.safeTransferFrom(msg.sender, _addresses[i], _tokenIds[i], _amounts[i], "");
        }
    }

    /**
     * @dev Airdrop ETH
     * @param _addresses The addresses of the recipients
     * @param _amounts The amounts of ETH to send
     */
    function airdropETH(address[] calldata _addresses, uint256[] calldata _amounts) external payable {
        for (uint256 i; i < _addresses.length; i++) {
            payable(_addresses[i]).transfer(_amounts[i]);
        }
    }
}
