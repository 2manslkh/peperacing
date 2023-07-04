// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interface/IMintBurnToken.sol";
import "./AtlantisAddressRegistry.sol";

/// @title Atlantis Stardust Contract
/// @author Kratos
contract Stardust is ERC20, IMintBurnToken {
    AtlantisAddressRegistry public atlantisRegistry;
    event Minted(address to, uint256 amount);

    constructor(AtlantisAddressRegistry _atlantisRegistry) ERC20("Stardust", "STARDUST") {
        atlantisRegistry = _atlantisRegistry;
    }

    /**
     * @notice Mints Stardust Tokens to the specified address.
     * @dev Can only be called by StakingWithLock
     * @param _to Address to mint to
     * @param _amount Amount of Stardust to mint
     */
    function mint(address _to, uint256 _amount) external override returns (bool) {
        require(
            msg.sender == atlantisRegistry.getStakingWithLock(),
            "Stardust: Only StakingWithLock can mint Stardust"
        );
        _mint(_to, _amount);
        emit Minted(_to, _amount);
        return true;
    }

    /**
     * @notice Burn `amount` tokens and decreasing the total supply.
     * @dev Can only be called by StakingWithLock
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external override returns (bool) {
        require(
            msg.sender == atlantisRegistry.getStakingWithLock(),
            "Stardust: Only StakingWithLock can burn Stardust"
        );
        _burn(_msgSender(), amount);
        return true;
    }
}
