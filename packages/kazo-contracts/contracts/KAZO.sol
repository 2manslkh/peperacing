// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./common/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

error InvalidTokenId();
error NoMoreTokenIds();
error WithdrawFailed();

// Cred: Elementals contract -> learning from the best!
contract KAZO is ERC2981, ERC721, Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    uint16 public immutable MAX_SUPPLY;
    uint16 internal _numAvailableRemainingTokens;
    // Data structure used for Fisher Yates shuffle
    uint16[65536] internal _availableRemainingTokens;
    uint256 public constant PUBLIC_MAX_MINT = 20;
    uint256 public constant WHITELIST_MAX_MINT = 5;
    address public immutable WITHDRAW_ADDRESS;
    address public immutable WHITELIST_SIGNER_ADDRESS;
    mapping(address => uint256) public whitelistMintCount;
    mapping(address => uint256) public publicMintCount;
    uint256 public whitelistMintPrice = 1 ether;
    uint256 public publicMintPrice = 2 ether;
    uint8 public stage;
    string public baseURI;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint16 maxSupply_,
        address withdrawAddress,
        address _whitelistSignerAddress
    ) ERC721(_name, _symbol) {
        MAX_SUPPLY = maxSupply_;
        _numAvailableRemainingTokens = maxSupply_;
        setBaseURI(_baseURI);
        WITHDRAW_ADDRESS = withdrawAddress;
        WHITELIST_SIGNER_ADDRESS = _whitelistSignerAddress;
    }

    // ---------------
    // Name and symbol
    // ---------------
    function setNameAndSymbol(string calldata _newName, string calldata _newSymbol) external onlyOwner {
        name = _newName;
        symbol = _newSymbol;
    }

    function _useRandomAvailableTokenId() internal returns (uint256) {
        uint256 numAvailableRemainingTokens = _numAvailableRemainingTokens;
        if (numAvailableRemainingTokens == 0) {
            revert NoMoreTokenIds();
        }

        uint256 randomNum = _getRandomNum(numAvailableRemainingTokens);
        uint256 randomIndex = randomNum % numAvailableRemainingTokens;
        uint256 valAtIndex = _availableRemainingTokens[randomIndex];

        uint256 result;
        if (valAtIndex == 0) {
            // This means the index itself is still an available token
            result = randomIndex;
        } else {
            // This means the index itself is not an available token, but the val at that index is.
            result = valAtIndex;
        }

        uint256 lastIndex = numAvailableRemainingTokens - 1;
        if (randomIndex != lastIndex) {
            // Replace the value at randomIndex, now that it's been used.
            // Replace it with the data from the last index in the array, since we are going to decrease the array size afterwards.
            uint256 lastValInArray = _availableRemainingTokens[lastIndex];
            if (lastValInArray == 0) {
                // This means the index itself is still an available token
                // Cast is safe as we know that lastIndex cannot > MAX_SUPPLY, which is a uint16
                _availableRemainingTokens[randomIndex] = uint16(lastIndex);
            } else {
                // This means the index itself is not an available token, but the val at that index is.
                // Cast is safe as we know that lastValInArray cannot > MAX_SUPPLY, which is a uint16
                _availableRemainingTokens[randomIndex] = uint16(lastValInArray);
                delete _availableRemainingTokens[lastIndex];
            }
        }

        --_numAvailableRemainingTokens;

        return result;
    }

    function _getRandomNum(uint256 numAvailableRemainingTokens) internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(
                        block.prevrandao,
                        blockhash(block.number - 1),
                        address(this),
                        numAvailableRemainingTokens
                    )
                )
            );
    }

    function whitelistMint(
        address to,
        uint256 _amount,
        bytes calldata nonce,
        bytes calldata signature
    ) external payable {
        // Check if user is whitelisted
        require(whitelistSigned(msg.sender, nonce, signature, stage), "ArgoPetz: Invalid Signature!");

        // Check if whitelist sale is open
        require(stage == 1, "ArgoPetz: Whitelist Mint is not open");

        // Check if enough ETH is sent
        require(msg.value == _amount * whitelistMintPrice, "ArgoPetz: Insufficient CRO!");

        // Check if mints does not exceed MAX_SUPPLY
        require(totalSupply() + _amount <= MAX_SUPPLY, "ArgoPetz: Exceeded Max Supply for ArgoPetz!");

        // Check if mints does not exceed max wallet allowance for public sale
        require(
            whitelistMintCount[msg.sender] + _amount <= WHITELIST_MAX_MINT,
            "ArgoPetz: Wallet has already minted Max Amount for Whitelist Mint!"
        );

        whitelistMintCount[msg.sender] += _amount;
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = _useRandomAvailableTokenId();
            _safeMint(to, tokenId);
            unchecked {
                ++i;
            }
        }
    }

    function publicMint(address to, uint256 _amount) external payable {
        // Check if public sale is open
        require(stage == 2, "ArgoPetz: Public Sale Closed!");
        // Check if enough ETH is sent
        require(msg.value == _amount * publicMintPrice, "ArgoPetz: Insufficient CRO!");

        // Check if mints does not exceed total max supply
        require(totalSupply() + _amount <= MAX_SUPPLY, "ArgoPetz: Max Supply for Public Mint Reached!");
        // Check if mints does not exceed max wallet allowance for public sale
        require(
            publicMintCount[msg.sender] + _amount <= PUBLIC_MAX_MINT,
            "ArgoPetz: Wallet has already minted Max Amount for Public Mint!"
        );
        publicMintCount[msg.sender] += _amount;
        for (uint256 i; i < _amount; ) {
            uint256 tokenId = _useRandomAvailableTokenId();
            _safeMint(to, tokenId);
            unchecked {
                ++i;
            }
        }
    }

    function whitelistSigned(
        address sender,
        bytes calldata nonce,
        bytes calldata signature,
        uint8 _stage
    ) private view returns (bool) {
        bytes32 _hash = keccak256(abi.encodePacked(sender, nonce, _stage));
        return WHITELIST_SIGNER_ADDRESS == ECDSA.toEthSignedMessageHash(_hash).recover(signature);
    }

    function withdraw() external {
        (bool sent, ) = WITHDRAW_ADDRESS.call{ value: address(this).balance }("");
        if (!sent) {
            revert WithdrawFailed();
        }
    }

    // ------------
    // Mint
    // ------------

    function setPublicMintPrice(uint256 _publicMintPrice) public onlyOwner {
        publicMintPrice = _publicMintPrice;
    }

    function setWhitelistMintPrice(uint256 _whitelistMintPrice) public onlyOwner {
        whitelistMintPrice = _whitelistMintPrice;
    }

    function setStage(uint8 _newStage) public onlyOwner {
        stage = _newStage;
    }

    // ------------
    // Total Supply
    // ------------
    function totalSupply() public view returns (uint256) {
        unchecked {
            // Does not need to account for burns as they aren't supported.
            return MAX_SUPPLY - _numAvailableRemainingTokens;
        }
    }

    // --------
    // Metadata
    // --------
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf[tokenId] == address(0)) {
            revert InvalidTokenId();
        }
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function setBaseURI(string memory _baseURI_) public onlyOwner {
        baseURI = _baseURI_;
    }

    // --------
    // Questing
    // --------
    
    function safeMint(address receiver, uint256 quantity) internal {
        require(_totalMinted() + quantity <= MAX_SUPPLY, "exceed MAX_SUPPLY");
        _mint(receiver, quantity);
    }

    // =============== Airdrop ===============

    function airdropWithAmounts(
        address[] memory receivers,
        uint256[] memory amounts
    ) external onlyOwner {
        require(receivers.length >= 1, "at least 1 receiver");
        for (uint256 i; i < receivers.length; i++) {
            address receiver = receivers[i];
            safeMint(receiver, amounts[i]);
        }
    }

    // =============== URI ===============

    function compareStrings(string memory a, string memory b)
        public
        pure
        returns (bool)
    {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721AUpgradeable, IERC721AUpgradeable)
        returns (string memory)
    {
        if (bytes(tokenURIOverride).length > 0) {
            return tokenURIOverride;
        }
        return string.concat(super.tokenURI(_tokenId), tokenURISuffix);
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        baseTokenURI = baseURI;
    }

    function setTokenURISuffix(string calldata _tokenURISuffix)
        external
        onlyOwner
    {
        if (compareStrings(_tokenURISuffix, "!empty!")) {
            tokenURISuffix = "";
        } else {
            tokenURISuffix = _tokenURISuffix;
        }
    }

    function setTokenURIOverride(string calldata _tokenURIOverride)
        external
        onlyOwner
    {
        if (compareStrings(_tokenURIOverride, "!empty!")) {
            tokenURIOverride = "";
        } else {
            tokenURIOverride = _tokenURIOverride;
        }
    }

    // =============== Stake + MARKETPLACE CONTROL ===============

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721x) onlyAllowedOperator(from) {
        require(
            tokensLastQuestedAt[tokenId] == 0,
            "Cannot transfer questing token"
        );
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public override(ERC721x) onlyAllowedOperator(from) {
        require(
            tokensLastQuestedAt[tokenId] == 0,
            "Cannot transfer questing token"
        );
        super.safeTransferFrom(from, to, tokenId, _data);
    }

    // =============== Questing ===============

    struct QuestInfo {
        uint256 tokenId;
        uint256[] potatozTokenIds;
    }

    function batchStartQuest(QuestInfo[] calldata questInfos) external {
        uint256 batch = questInfos.length;
        for (uint256 i; i < batch;) {
            startQuest(questInfos[i].tokenId, questInfos[i].potatozTokenIds);
            unchecked { ++i; }
        }
    }

    function batchEditQuest(QuestInfo[] calldata questInfos) external {
        require(canQuest, "questing not open");
        require(address(potatozContract) != address(0), "potatozContract not set");

        uint256 batch = questInfos.length;
        for (uint256 i; i < batch;) {
            uint256 tokenId = questInfos[i].tokenId;

            require(msg.sender == ownerOf(tokenId), "not owner of [captainz tokenId]");
            require(tokensLastQuestedAt[tokenId] > 0, "quested not started for [captainz tokenId]");

            _resetCrew(tokenId);
            unchecked { ++i; }
        }

        for (uint256 i; i < batch;) {
            uint256 tokenId = questInfos[i].tokenId;
            uint256[] calldata potatozTokenIds = questInfos[i].potatozTokenIds;

            require(potatozTokenIds.length <= MAX_CREWS, "too many crews [potatozTokenIds]");

            _addCrew(tokenId, potatozTokenIds);
            emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], potatozTokenIds, block.timestamp);
            unchecked { ++i; }
        }
    }

    function batchStopQuest(uint256[] calldata tokenIds) external {
        uint256 batch = tokenIds.length;
        for (uint256 i; i < batch;) {
            stopQuest(tokenIds[i]);
            unchecked { ++i; }
        }
    }

    function startQuest(uint256 tokenId, uint256[] calldata potatozTokenIds) public {
        require(canQuest, "questing not open");
        require(address(potatozContract) != address(0), "potatozContract not set");

        require(msg.sender == ownerOf(tokenId), "not owner of [captainz tokenId]");
        require(tokensLastQuestedAt[tokenId] == 0, "quested already started for [captainz tokenId]");
        require(potatozTokenIds.length <= MAX_CREWS, "too many crews [potatozTokenIds]");

        _addCrew(tokenId, potatozTokenIds);

        tokensLastQuestedAt[tokenId] = block.timestamp;
        emit QuestStarted(tokenId, block.timestamp, potatozTokenIds);

        if (!revealed[tokenId]) {
            revealed[tokenId] = true;
            emit ChestRevealed(tokenId);
        }
    }

    function editQuest(uint256 tokenId, uint256[] calldata potatozTokenIds) public {
        require(canQuest, "questing not open");
        require(address(potatozContract) != address(0), "potatozContract not set");

        require(msg.sender == ownerOf(tokenId), "not owner of [captainz tokenId]");
        require(tokensLastQuestedAt[tokenId] > 0, "quested not started for [captainz tokenId]");
        require(potatozTokenIds.length <= MAX_CREWS, "too many crews [potatozTokenIds]");

        _resetCrew(tokenId);
        _addCrew(tokenId, potatozTokenIds);

        emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], potatozTokenIds, block.timestamp);
    }

    function _addCrew(uint256 tokenId, uint256[] calldata potatozTokenIds) private {
        uint256 crews = potatozTokenIds.length;
        if (crews >= 1) {
            uint256[] memory wrapper = new uint256[](1);
            wrapper[0] = tokenId;
            for (uint256 i; i < crews;) {
                uint256 pTokenId = potatozTokenIds[i];
                require(potatozContract.nftOwnerOf(pTokenId) == msg.sender, "not owner of [potatoz tokenId]");
                if (!potatozContract.isPotatozStaking(pTokenId)) {
                    potatozContract.stakeExternal(pTokenId);
                }
                uint256[] storage existCheck = potatozCrew[pTokenId];
                if (existCheck.length != 0) {
                    removeCrew(pTokenId);
                }
                potatozCrew[pTokenId] = wrapper;
                unchecked { ++i; }
            }
            questCrews[tokenId] = potatozTokenIds;
        }
    }

    function removeCrew(uint256 potatozTokenId) public {
        require(address(potatozContract) != address(0), "potatozContract not set");
        require(
            msg.sender == potatozContract.nftOwnerOf(potatozTokenId) || msg.sender == address(potatozContract),
            "caller must be any: potatoz owner, potatoz"
        );

        uint256[] storage existCheck = potatozCrew[potatozTokenId];
        require(existCheck.length != 0, "potatozTokenId not questing");
        uint256 tokenId = existCheck[0];
        uint256 empty = MAX_SUPPLY;

        uint256[] memory pTokenIds = questCrews[tokenId];
        uint256 crews = pTokenIds.length;
        uint256 crewLength = pTokenIds.length;
        for (uint256 i; i < crews;) {
            uint256 pTokenId = pTokenIds[i];
            if (pTokenId == potatozTokenId) {
                pTokenIds[i] = empty;
                crewLength--;
            }
            unchecked { ++i; }
        }

        require(pTokenIds.length != crewLength, "potatozTokenId not in crew");

        uint256[] memory newCrews = new uint256[](crewLength);
        uint256 activeIdx;
        for (uint256 i; i < crews;) {
            if (pTokenIds[i] != empty) {
                newCrews[activeIdx++] = pTokenIds[i];
            }
            unchecked { ++i; }
        }

        questCrews[tokenId] = newCrews;
        potatozCrew[potatozTokenId] = new uint256[](0);
    }

    function _resetCrew(uint256 tokenId) private {
        uint256[] storage potatozTokenIds = questCrews[tokenId];
        uint256 crews = potatozTokenIds.length;
        if (crews >= 1) {
            uint256[] memory empty = new uint256[](0);
            for (uint256 i; i < crews;) {
                uint256 pTokenId = potatozTokenIds[i];
                potatozCrew[pTokenId] = empty;
                unchecked { ++i; }
            }
            questCrews[tokenId] = empty;
        }
    }

    function stopQuest(uint256 tokenId) public {
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner() || moderators[msg.sender],
            "not owner of [captainz tokenId]"
        );
        require(tokensLastQuestedAt[tokenId] > 0, "quested not started for [captainz tokenId]");
        if (address(mvpContract) != address(0) && mvpContract.isCaptainzBoosting(tokenId)) {
            mvpContract.removeCaptainz(tokenId);
        }
        _resetCrew(tokenId);

        uint256 tlqa = tokensLastQuestedAt[tokenId];
        tokensLastQuestedAt[tokenId] = 0;
        emit QuestStopped(tokenId, tlqa, block.timestamp);
    }

    function isPotatozQuesting(uint256 tokenId) external view returns (bool) {
        uint256[] storage existCheck = potatozCrew[tokenId];
        return existCheck.length > 0;
    }

    function getTokenInfo(uint256 tokenId) external view returns (uint256 lastQuestedAt, uint256[] memory crewTokenIds, bool hasRevealed) {
        return (tokensLastQuestedAt[tokenId], questCrews[tokenId], revealed[tokenId]);
    }

    function getActiveCrews(uint256 tokenId) external view returns (uint256[] memory) {
        require(address(potatozContract) != address(0), "potatozContract not set");
        address owner = ownerOf(tokenId);

        uint256[] memory pTokenIds = questCrews[tokenId];
        uint256 crews = pTokenIds.length;
        uint256 activeLength = pTokenIds.length;
        uint256 empty = MAX_SUPPLY;
        for (uint256 i; i < crews;) {
            uint256 pTokenId = pTokenIds[i];
            if (potatozContract.nftOwnerOf(pTokenId) != owner || !potatozContract.isPotatozStaking(pTokenId)) {
                pTokenIds[i] = empty;
                activeLength--;
            }
            unchecked { ++i; }
        }

        uint256[] memory activeCrews = new uint256[](activeLength);
        uint256 activeIdx;
        for (uint256 i; i < crews;) {
            if (pTokenIds[i] != empty) {
                activeCrews[activeIdx++] = pTokenIds[i];
            }
            unchecked { ++i; }
        }

        return activeCrews;
    }

    // =============== Admin ===============

    function setCanQuest(bool b) external onlyOwner {
        canQuest = b;
    }

    function setPotatozContract(address addr) external onlyOwner {
        potatozContract = IPotatoz(addr);
    }

    function setMvpContract(address addr) external onlyOwner {
        mvpContract = IMVP(addr);
    }

    function setModerator(address addr, bool add) external onlyOwner {
        moderators[addr] = add;
    }
}




    // --------
    // EIP-2981
    // --------
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    // -------
    // EIP-165
    // -------
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }
}
