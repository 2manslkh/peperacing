// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "./ERC721A.sol";

/// @title Argonauts Mint Contract v2
contract MockERC721 is ERC721A {
    address addressRegistry;

    constructor(string memory _name, string memory _symbol) ERC721A(_name, _symbol) {}

    function mint(uint256 _mintAmount) external {
        _safeMint(tx.origin, _mintAmount);
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, it can be overridden in child contracts.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return "https://argonauts-nft.herokuapp.com/metadata/";
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }
}
