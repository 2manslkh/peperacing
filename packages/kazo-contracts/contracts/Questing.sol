// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Questing is ERC721Holder, Ownable {
    IERC721 public leader;
    IERC721 public minion;
    bool public canQuest;
    uint8 public maxCrews = 5;
    uint256 private constant MAX_SUPPLY = 8888;
    // Track ownership of leader
    mapping(uint256 => address) public leaderOwners;
    // Track ownership of minion
    mapping(uint256 => address) public minionOwners;
    mapping(uint256 => uint256) public tokensLastQuestedAt; // leader tokenId => timestamp
    mapping(uint256 => uint256[]) public questCrews; // leader tokenId => minion tokenIds
    mapping(uint256 => uint256[]) public minionCrew; // minion tokenId => leader tokenId [array of 1 uint256]
    event QuestStarted(uint256 indexed tokenId, uint256 questStartedAt, uint256[] crews);
    event QuestEdited(uint256 indexed tokenId, uint256 questStartedAt, uint256[] crews, uint256 questEditedAt);
    event QuestStopped(uint256 indexed tokenId, uint256 questStartedAt, uint256 questStoppedAt);

    constructor(address _leader, address _minion) {
        leader = IERC721(_leader);
        minion = IERC721(_minion);
    }

    // =============== Questing ===============

    struct QuestInfo {
        uint256 tokenId;
        uint256[] minionTokenIds;
    }

    function batchStartQuest(QuestInfo[] calldata questInfos) external {
        uint256 batch = questInfos.length;
        for (uint256 i; i < batch; ) {
            startQuest(questInfos[i].tokenId, questInfos[i].minionTokenIds);
            unchecked {
                ++i;
            }
        }
    }

    function batchEditQuest(QuestInfo[] calldata questInfos) external {
        require(canQuest, "questing not open");
        require(address(minion) != address(0), "minion contract not set");

        uint256 batch = questInfos.length;
        for (uint256 i; i < batch; ) {
            uint256 tokenId = questInfos[i].tokenId;
            require(tokensLastQuestedAt[tokenId] > 0, "quested not started for id");

            _resetCrew(tokenId);
            unchecked {
                ++i;
            }
        }

        for (uint256 i; i < batch; ) {
            uint256 tokenId = questInfos[i].tokenId;
            uint256[] calldata minionTokenIds = questInfos[i].minionTokenIds;

            require(minionTokenIds.length <= maxCrews, "too many crews");

            _addCrew(tokenId, minionTokenIds);
            emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], minionTokenIds, block.timestamp);
            unchecked {
                ++i;
            }
        }
    }

    function batchStopQuest(uint256[] calldata tokenIds) external {
        uint256 batch = tokenIds.length;
        for (uint256 i; i < batch; ) {
            stopQuest(tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    function startQuest(uint256 tokenId, uint256[] calldata minionTokenIds) public {
        require(canQuest, "questing not open");
        require(address(minion) != address(0), "not set");
        require(tokensLastQuestedAt[tokenId] == 0, "quested already started for id");
        require(minionTokenIds.length <= maxCrews, "too many crews");
        _addCrew(tokenId, minionTokenIds);

        tokensLastQuestedAt[tokenId] = block.timestamp;

        emit QuestStarted(tokenId, block.timestamp, minionTokenIds);
    }

    function editQuest(uint256 tokenId, uint256[] calldata minionTokenIds) public {
        require(canQuest, "questing not open");
        require(address(minion) != address(0), "minion not set");
        require(tokensLastQuestedAt[tokenId] > 0, "quested not started for id");
        require(minionTokenIds.length <= maxCrews, "too many crews [minionTokenIds]");

        _resetCrew(tokenId);
        _addCrew(tokenId, minionTokenIds);

        emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], minionTokenIds, block.timestamp);
    }

    function _addCrew(uint256 tokenId, uint256[] calldata minionTokenIds) private {
        uint256 crews = minionTokenIds.length;
        leaderOwners[tokenId] = msg.sender;
        uint256[] memory wrapper = new uint256[](1);
        wrapper[0] = tokenId;
        if (crews >= 1) {
            for (uint256 i; i < crews; ) {
                uint256 pTokenId = minionTokenIds[i];
                minionOwners[pTokenId] = msg.sender;
                uint256[] storage existCheck = minionCrew[pTokenId];
                if (existCheck.length != 0) {
                    removeCrew(pTokenId);
                }
                minion.safeTransferFrom(msg.sender, address(this), pTokenId);
                minionCrew[pTokenId] = wrapper;
                unchecked {
                    ++i;
                }
            }
            questCrews[tokenId] = minionTokenIds;
        }
        leader.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function removeCrew(uint256 minionTokenId) public {
        require(address(minion) != address(0), "minion not set");
        require(minionOwners[minionTokenId] == msg.sender, "not minion owner");

        uint256[] storage existCheck = minionCrew[minionTokenId];
        require(existCheck.length != 0, "minionTokenId not questing");
        uint256 tokenId = existCheck[0];
        uint256 empty = MAX_SUPPLY;

        uint256[] memory pTokenIds = questCrews[tokenId];
        uint256 crews = pTokenIds.length;
        uint256 crewLength = pTokenIds.length;
        for (uint256 i; i < crews; ) {
            uint256 pTokenId = pTokenIds[i];
            if (pTokenId == minionTokenId) {
                minionOwners[pTokenId] = address(0);
                pTokenIds[i] = empty;
                crewLength--;
                // Transfer back to owner
                minion.safeTransferFrom(address(this), msg.sender, pTokenId);
            }
            unchecked {
                ++i;
            }
        }

        require(pTokenIds.length != crewLength, "minionTokenId not in crew");

        uint256[] memory newCrews = new uint256[](crewLength);
        uint256 activeIdx;
        for (uint256 i; i < crews; ) {
            if (pTokenIds[i] != empty) {
                newCrews[activeIdx++] = pTokenIds[i];
            }
            unchecked {
                ++i;
            }
        }

        questCrews[tokenId] = newCrews;
        minionCrew[minionTokenId] = new uint256[](0);
    }

    function _resetCrew(uint256 tokenId) private {
        uint256[] storage minionTokenIds = questCrews[tokenId];
        uint256 crews = minionTokenIds.length;
        if (crews >= 1) {
            uint256[] memory empty = new uint256[](0);
            for (uint256 i; i < crews; ) {
                uint256 pTokenId = minionTokenIds[i];
                minionCrew[pTokenId] = empty;
                // Transfer back to owner
                minion.safeTransferFrom(address(this), minionOwners[pTokenId], pTokenId);
                unchecked {
                    ++i;
                }
            }
            questCrews[tokenId] = empty;
        }
        leader.safeTransferFrom(address(this), leaderOwners[tokenId], tokenId);
    }

    function stopQuest(uint256 tokenId) public {
        require(tokensLastQuestedAt[tokenId] > 0, "quested not started for id");
        require(leaderOwners[tokenId] == msg.sender, "not leader owner");
        _resetCrew(tokenId);

        uint256 tlqa = tokensLastQuestedAt[tokenId];
        tokensLastQuestedAt[tokenId] = 0;
        emit QuestStopped(tokenId, tlqa, block.timestamp);
    }

    function isMinionQuesting(uint256 tokenId) external view returns (bool) {
        uint256[] memory existCheck = minionCrew[tokenId];
        return existCheck.length > 0;
    }

    function getTokenInfo(
        uint256 tokenId
    ) external view returns (uint256 lastQuestedAt, uint256[] memory crewTokenIds) {
        return (tokensLastQuestedAt[tokenId], questCrews[tokenId]);
    }

    // =============== Admin ===============

    function setCanQuest(bool b) external onlyOwner {
        canQuest = b;
    }

    function setMinion(address addr) external onlyOwner {
        minion = IERC721(addr);
    }

    function setLeader(address addr) external onlyOwner {
        leader = IERC721(addr);
    }

    function setMaxQuest(uint8 n) external onlyOwner {
        maxCrews = n;
    }
}
