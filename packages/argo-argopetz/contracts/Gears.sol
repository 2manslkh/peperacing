pragma solidity 0.8.23;

import "erc721a/contracts/ERC721A.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract Gears is ERC721A, Ownable {
    uint256 public mintPrice;
    address public withdrawAddress;

    constructor(
        string _baseURI,
        string _name,
        string _symbol,
        uint256 _mintPrice,
        address _withdrawAddress
    ) ERC721A(_name, _symbol) {
        mintPrice = _mintPrice;
        _setBaseURI(_baseURI);
        WITHDRAW_ADDRESS = _withdrawAddress;
    }

    function mint(uint256 quantity) external payable {
        require(msg.value == _amount * mintPrice, "Insufficient ETH");
        _mint(msg.sender, quantity);
    }

    // Function to withdraw the ETH
    function withdraw() external {
        (bool sent, ) = withdrawAddress.call{ value: address(this).balance }("");
        require(sent, "Failed to send Ether");
    }

    // Function to set the mint price
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }

    // Function to set the base URI
    function setBaseURI(string memory _baseURI) external onlyOwner {
        _setBaseURI(_baseURI);
    }

    // Function to set the withdraw address
    function setWithdrawAddress(address _withdrawAddress) external onlyOwner {
        withdrawAddress = _withdrawAddress;
    }
}
