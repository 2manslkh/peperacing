// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract AddressRegistry {
    mapping(bytes32 => address) public addresses;

    function getAddress(bytes32 _identifier) public view returns (address) {
        return addresses[_identifier];
    }

    function _setAddress(bytes32 _identifier, address contractAddress) internal {
        addresses[_identifier] = contractAddress;
    }
}
