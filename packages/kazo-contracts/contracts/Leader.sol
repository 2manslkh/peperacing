// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./interfaces/ILeader.sol";
import "./interfaces/IMinion.sol";
import "./ERC721Template.sol";
import "./common/DefaultOperatorFilterer.sol";

contract Leader is ERC721Template, DefaultOperatorFilterer, ILeader{
    
    event QuestStarted(uint256 indexed tokenId, uint256 questStartedAt, uint256[] crews);
    event QuestEdited(uint256 indexed tokenId, uint256 questStartedAt, uint256[] crews, uint256 questEditedAt);
    event QuestStopped(
        uint256 indexed tokenId,
        uint256 questStartedAt,
        uint256 questStoppedAt
    );

    event ChestRevealed(uint256 indexed tokenId);

    IMinion public minion;

    uint256 public immutable MAX_CREWS;
    bool public canQuest;
    mapping(uint256 => uint256) public tokensLastQuestedAt;
    mapping(uint256 => uint256[]) public questCrews;
    mapping(uint256 => uint256[]) public minionCrew;
    mapping(uint256 => bool) public revealed;

    // =============== V3 ===============
    mapping(address => bool) public moderators;
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint16 maxSupply_,
        address withdrawAddress,
        address _whitelistSignerAddress,
        uint256 _publicMaxMint,
        uint256 _whitelistMaxMint,
        uint256 _whitelistMintPrice,
        uint256 _publicMintPrice,
        uint256 _maxCrews
    ) ERC721Template(_name, _symbol, _baseURI, maxSupply_, withdrawAddress, _whitelistSignerAddress, _publicMaxMint, _whitelistMaxMint, _whitelistMintPrice, _publicMintPrice) {
        MAX_CREWS = _maxCrews;
    }

   
    // --------
    // Questing
    // --------
    
    // =============== Airdrop ===============

    function airdropWithAmounts(
        address[] memory receivers,
        uint256[] memory amounts
    ) external onlyOwner {
        require(receivers.length >= 1, "at least 1 receiver");
        for (uint256 i; i < receivers.length; i++) {
            address receiver = receivers[i];
            _safeMint(receiver, amounts[i]);
        }
    }

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
        bytes calldata _data
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
        uint256[] minionTokenIds;
    }

    function batchStartQuest(QuestInfo[] calldata questInfos) external {
        uint256 batch = questInfos.length;
        for (uint256 i; i < batch;) {
            startQuest(questInfos[i].tokenId, questInfos[i].minionTokenIds);
            unchecked { ++i; }
        }
    }

    function batchEditQuest(QuestInfo[] calldata questInfos) external {
        require(canQuest, "questing not open");
        require(address(minion) != address(0), "minion not set");

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
            uint256[] calldata minionTokenIds = questInfos[i].minionTokenIds;

            require(minionTokenIds.length <= MAX_CREWS, "too many crews [minionTokenIds]");

            _addCrew(tokenId, minionTokenIds);
            emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], minionTokenIds, block.timestamp);
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

    function startQuest(uint256 tokenId, uint256[] calldata minionTokenIds) public {
        require(canQuest, "questing not open");
        require(address(minion) != address(0), "minion not set");

        require(msg.sender == ownerOf(tokenId), "not owner of [captainz tokenId]");
        require(tokensLastQuestedAt[tokenId] == 0, "quested already started for [captainz tokenId]");
        require(minionTokenIds.length <= MAX_CREWS, "too many crews [minionTokenIds]");

        _addCrew(tokenId, minionTokenIds);

        tokensLastQuestedAt[tokenId] = block.timestamp;
        emit QuestStarted(tokenId, block.timestamp, minionTokenIds);

        if (!revealed[tokenId]) {
            revealed[tokenId] = true;
            emit ChestRevealed(tokenId);
        }
    }

    function editQuest(uint256 tokenId, uint256[] calldata minionTokenIds) public {
        require(canQuest, "questing not open");
        require(address(minion) != address(0), "minion not set");

        require(msg.sender == ownerOf(tokenId), "not owner of [captainz tokenId]");
        require(tokensLastQuestedAt[tokenId] > 0, "quested not started for [captainz tokenId]");
        require(minionTokenIds.length <= MAX_CREWS, "too many crews [minionTokenIds]");

        _resetCrew(tokenId);
        _addCrew(tokenId, minionTokenIds);

        emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], minionTokenIds, block.timestamp);
    }

    function _addCrew(uint256 tokenId, uint256[] calldata minionTokenIds) private {
        uint256 crews = minionTokenIds.length;
        if (crews >= 1) {
            uint256[] memory wrapper = new uint256[](1);
            wrapper[0] = tokenId;
            for (uint256 i; i < crews;) {
                uint256 pTokenId = minionTokenIds[i];
                require(minion.nftOwnerOf(pTokenId) == msg.sender, "not owner of [minion tokenId]");
                if (!minion.isMinionStaking(pTokenId)) {
                    minion.stakeExternal(pTokenId);
                }
                uint256[] storage existCheck = minionCrew[pTokenId];
                if (existCheck.length != 0) {
                    removeCrew(pTokenId);
                }
                minionCrew[pTokenId] = wrapper;
                unchecked { ++i; }
            }
            questCrews[tokenId] = minionTokenIds;
        }
    }

    function removeCrew(uint256 minionTokenId) public {
        require(address(minion) != address(0), "minion not set");
        require(
            msg.sender == minion.nftOwnerOf(minionTokenId) || msg.sender == address(minion),
            "caller must be any: minion owner, minion"
        );

        uint256[] storage existCheck = minionCrew[minionTokenId];
        require(existCheck.length != 0, "minionTokenId not questing");
        uint256 tokenId = existCheck[0];
        uint256 empty = MAX_SUPPLY;

        uint256[] memory pTokenIds = questCrews[tokenId];
        uint256 crews = pTokenIds.length;
        uint256 crewLength = pTokenIds.length;
        for (uint256 i; i < crews;) {
            uint256 pTokenId = pTokenIds[i];
            if (pTokenId == minionTokenId) {
                pTokenIds[i] = empty;
                crewLength--;
            }
            unchecked { ++i; }
        }

        require(pTokenIds.length != crewLength, "minionTokenId not in crew");

        uint256[] memory newCrews = new uint256[](crewLength);
        uint256 activeIdx;
        for (uint256 i; i < crews;) {
            if (pTokenIds[i] != empty) {
                newCrews[activeIdx++] = pTokenIds[i];
            }
            unchecked { ++i; }
        }

        questCrews[tokenId] = newCrews;
        minionCrew[minionTokenId] = new uint256[](0);
    }

    function _resetCrew(uint256 tokenId) private {
        uint256[] storage minionTokenIds = questCrews[tokenId];
        uint256 crews = minionTokenIds.length;
        if (crews >= 1) {
            uint256[] memory empty = new uint256[](0);
            for (uint256 i; i < crews;) {
                uint256 pTokenId = minionTokenIds[i];
                minionCrew[pTokenId] = empty;
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

        _resetCrew(tokenId);

        uint256 tlqa = tokensLastQuestedAt[tokenId];
        tokensLastQuestedAt[tokenId] = 0;
        emit QuestStopped(tokenId, tlqa, block.timestamp);
    }

    function isMinionQuesting(uint256 tokenId) external view returns (bool) {
        uint256[] storage existCheck = minionCrew[tokenId];
        return existCheck.length > 0;
    }

    function getTokenInfo(uint256 tokenId) external view returns (uint256 lastQuestedAt, uint256[] memory crewTokenIds, bool hasRevealed) {
        return (tokensLastQuestedAt[tokenId], questCrews[tokenId], revealed[tokenId]);
    }

    function getActiveCrews(uint256 tokenId) external view returns (uint256[] memory) {
        require(address(minion) != address(0), "minion not set");
        address owner = ownerOf(tokenId);

        uint256[] memory pTokenIds = questCrews[tokenId];
        uint256 crews = pTokenIds.length;
        uint256 activeLength = pTokenIds.length;
        uint256 empty = MAX_SUPPLY;
        for (uint256 i; i < crews;) {
            uint256 pTokenId = pTokenIds[i];
            if (minion.nftOwnerOf(pTokenId) != owner || !minion.isMinionStaking(pTokenId)) {
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

    function setMinion(address addr) external onlyOwner {
        minion = IMinion(addr);
    }

    function setModerator(address addr, bool add) external onlyOwner {
        moderators[addr] = add;
    }

}
