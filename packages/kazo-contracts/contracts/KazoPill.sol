// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./common/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KazoPill is ERC721A, Ownable {
    
    string private _baseTokenURI;
    uint256 public immutable COST;
    uint256 public immutable MAX_FREE_MINT_PER_WALLET;
    address public immutable WITHDRAW_ADDRESS;
    bool public mintEnded = false;
    mapping(uint256 tokenId => bool isRed) public isRed;
    error WithdrawFailed();
    constructor(string memory _name, string memory _symbol, uint256 _cost, uint256 _freeMint, address _withdrawAddress) ERC721A(_name, _symbol) {
        COST = _cost;
        MAX_FREE_MINT_PER_WALLET = _freeMint;
        WITHDRAW_ADDRESS = _withdrawAddress;
    }

    function freeMint() external {
        require(!mintEnded, "Mint ended");
        uint256 amount = MAX_FREE_MINT_PER_WALLET;
        require(amount + _numberMinted(msg.sender) <= MAX_FREE_MINT_PER_WALLET, "Max Free Mint");
        _mint(msg.sender, MAX_FREE_MINT_PER_WALLET);
    }

    function mint(uint256 quantity) external payable {
        require(!mintEnded, "Mint ended");
        require(quantity*COST <= msg.value, "Not enough ETH");
        _mint(msg.sender, quantity);
    }

    function _beforeTokenTransfers(address from, address to, uint256 startTokenId, uint256 quantity) internal override {
         for (uint256 i = 0; i < quantity; i++) {
        uint256 currentTokenId = startTokenId + i;
        
        // Pseudo-randomly determine if isRed should be true (roughly 50% chance)
        if (uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, currentTokenId))) % 2 == 0) {
            isRed[currentTokenId] = true;
        }
    }
    }

    function modifyMint(bool _status) external onlyOwner {
        mintEnded = _status;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    
    function withdraw() external onlyOwner {
        (bool sent, ) = WITHDRAW_ADDRESS.call{ value: address(this).balance }("");
        if (!sent) {
            revert WithdrawFailed();
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
    if (isRed[tokenId]) return "ipfs://bafybeifh4zt45ryjczhvfohwnclhy6475qtea3zbermnpvlemrf7jxhjhe/red.json";
    return "ipfs://bafybeifh4zt45ryjczhvfohwnclhy6475qtea3zbermnpvlemrf7jxhjhe/blue.json";
    
}


}