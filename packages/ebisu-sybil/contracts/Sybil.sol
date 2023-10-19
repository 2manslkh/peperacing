// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "./interfaces/IResources.sol";
contract Sybil {
    
    IResources constant resources = IResources(0xce3f4e59834b5B52B301E075C5B3D427B6884b3d);

    address public masterWallet;

    struct BulkTransfer {
    address from;
    address to;
    uint256 id;
    uint256 amount;
    bytes data;
}


    constructor(address _masterWallet) {
        masterWallet = _masterWallet;
    }


    function bulkMintWithSig(IResources.MintRequest[] calldata requests, bytes[] calldata signatures) external payable {
        uint256 length = requests.length;
        for (uint256 i; i < length; i++) {
            resources.mintWithSig(requests[i], signatures[i]);
        }
    }

function bulkSafeTransferFrom(BulkTransfer[] calldata transfers) external {
    require(msg.sender == masterWallet, "Only the master wallet can trigger this");
    uint256 length = transfers.length;
    for (uint256 i = 0; i < length; i++) {
        BulkTransfer memory transfer = transfers[i];
        resources.safeTransferFrom(transfer.from, transfer.to, transfer.id, transfer.amount, transfer.data);
    }
}

 function airdropETH(address[] calldata _addresses, uint256[] calldata _amounts) external payable {
        for (uint256 i; i < _addresses.length; i++) {
            payable(_addresses[i]).transfer(_amounts[i]);
        }
    }

}
