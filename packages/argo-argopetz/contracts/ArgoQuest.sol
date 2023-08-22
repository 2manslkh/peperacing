// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract ArgoQuest is ERC721Holder, Ownable {
    IERC721 public argonauts;
    IERC721 public argopetz;
    bool public canQuest;
    uint8 public maxCrews = 5;
    // Track ownership of argonauts
    mapping(uint256 => address) public argonautsOwners;
    // Track ownership of argopetz
    mapping(uint256 => address) public argopetzOwners;
    mapping(uint256 => uint256) public tokensLastQuestedAt; // argonaut tokenId => timestamp
    mapping(uint256 => uint256[]) public questCrews; // argonaut tokenId => argopetz tokenIds
    mapping(uint256 => uint256[]) public argopetzCrew; // argopetz tokenId => argonaut tokenId [array of 1 uint256]
    uint256 private constant MAX_SUPPLY = 8888;
    event QuestStarted(uint256 indexed tokenId, uint256 questStartedAt, uint256[] crews);
    event QuestEdited(uint256 indexed tokenId, uint256 questStartedAt, uint256[] crews, uint256 questEditedAt);
    event QuestStopped(uint256 indexed tokenId, uint256 questStartedAt, uint256 questStoppedAt);

    constructor(address _argonauts, address _argopetz) {
        argonauts = IERC721(_argonauts);
        argopetz = IERC721(_argopetz);
    }

    // =============== Questing ===============

    struct QuestInfo {
        uint256 tokenId;
        uint256[] argopetzTokenIds;
    }

    function batchStartQuest(QuestInfo[] calldata questInfos) external {
        uint256 batch = questInfos.length;
        for (uint256 i; i < batch; ) {
            startQuest(questInfos[i].tokenId, questInfos[i].argopetzTokenIds);
            unchecked {
                ++i;
            }
        }
    }

    function batchEditQuest(QuestInfo[] calldata questInfos) external {
        require(canQuest, "questing not open");
        require(address(argopetz) != address(0), "Argopetz contract not set");

        uint256 batch = questInfos.length;
        for (uint256 i; i < batch; ) {
            uint256 tokenId = questInfos[i].tokenId;
            require(tokensLastQuestedAt[tokenId] > 0, "quested not started for [argonaut tokenId]");

            _resetCrew(tokenId);
            unchecked {
                ++i;
            }
        }

        for (uint256 i; i < batch; ) {
            uint256 tokenId = questInfos[i].tokenId;
            uint256[] calldata argopetzTokenIds = questInfos[i].argopetzTokenIds;

            require(argopetzTokenIds.length <= maxCrews, "too many crews [argopetzTokenIds]");

            _addCrew(tokenId, argopetzTokenIds);
            emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], argopetzTokenIds, block.timestamp);
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

    function startQuest(uint256 tokenId, uint256[] calldata argopetzTokenIds) public {
        require(canQuest, "questing not open");
        require(address(argopetz) != address(0), "argopetz not set");
        require(tokensLastQuestedAt[tokenId] == 0, "quested already started for [argonaut tokenId]");
        require(argopetzTokenIds.length <= maxCrews, "too many crews [argopetzTokenIds]");
        _addCrew(tokenId, argopetzTokenIds);

        tokensLastQuestedAt[tokenId] = block.timestamp;

        emit QuestStarted(tokenId, block.timestamp, argopetzTokenIds);
    }

    function editQuest(uint256 tokenId, uint256[] calldata argopetzTokenIds) public {
        require(canQuest, "questing not open");
        require(address(argopetz) != address(0), "argopetz not set");
        require(tokensLastQuestedAt[tokenId] > 0, "quested not started for [argonaut tokenId]");
        require(argopetzTokenIds.length <= maxCrews, "too many crews [argopetzTokenIds]");

        _resetCrew(tokenId);
        _addCrew(tokenId, argopetzTokenIds);

        emit QuestEdited(tokenId, tokensLastQuestedAt[tokenId], argopetzTokenIds, block.timestamp);
    }

    function _addCrew(uint256 tokenId, uint256[] calldata argopetzTokenIds) private {
        uint256 crews = argopetzTokenIds.length;
        argonautsOwners[tokenId] = msg.sender;
        uint256[] memory wrapper = new uint256[](1);
        wrapper[0] = tokenId;
        if (crews >= 1) {
            for (uint256 i; i < crews; ) {
                uint256 pTokenId = argopetzTokenIds[i];
                argopetzOwners[pTokenId] = msg.sender;
                uint256[] storage existCheck = argopetzCrew[pTokenId];
                if (existCheck.length != 0) {
                    removeCrew(pTokenId);
                }
                argopetz.safeTransferFrom(msg.sender, address(this), pTokenId);
                argopetzCrew[pTokenId] = wrapper;
                unchecked {
                    ++i;
                }
            }
            questCrews[tokenId] = argopetzTokenIds;
        }
        argonauts.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function removeCrew(uint256 argopetzTokenId) public {
        require(address(argopetz) != address(0), "argopetz not set");
        require(argopetzOwners[argopetzTokenId] == msg.sender, "not argopetz owner");

        uint256[] storage existCheck = argopetzCrew[argopetzTokenId];
        require(existCheck.length != 0, "argopetzTokenId not questing");
        uint256 tokenId = existCheck[0];
        uint256 empty = MAX_SUPPLY;

        uint256[] memory pTokenIds = questCrews[tokenId];
        uint256 crews = pTokenIds.length;
        uint256 crewLength = pTokenIds.length;
        for (uint256 i; i < crews; ) {
            uint256 pTokenId = pTokenIds[i];
            if (pTokenId == argopetzTokenId) {
                argopetzOwners[pTokenId] = address(0);
                pTokenIds[i] = empty;
                crewLength--;
                // Transfer back to owner
                argopetz.safeTransferFrom(address(this), msg.sender, pTokenId);
            }
            unchecked {
                ++i;
            }
        }

        require(pTokenIds.length != crewLength, "argopetzTokenId not in crew");

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
        argopetzCrew[argopetzTokenId] = new uint256[](0);
    }

    function _resetCrew(uint256 tokenId) private {
        uint256[] storage argopetzTokenIds = questCrews[tokenId];
        uint256 crews = argopetzTokenIds.length;
        if (crews >= 1) {
            uint256[] memory empty = new uint256[](0);
            for (uint256 i; i < crews; ) {
                uint256 pTokenId = argopetzTokenIds[i];
                argopetzCrew[pTokenId] = empty;
                // Transfer back to owner
                argopetz.safeTransferFrom(address(this), argopetzOwners[pTokenId], pTokenId);
                unchecked {
                    ++i;
                }
            }
            questCrews[tokenId] = empty;
        }
        argonauts.safeTransferFrom(address(this), argonautsOwners[tokenId], tokenId);
    }

    function stopQuest(uint256 tokenId) public {
        require(tokensLastQuestedAt[tokenId] > 0, "quested not started for [argonaut tokenId]");
        require(argonautsOwners[tokenId] == msg.sender, "not argonauts owner");
        _resetCrew(tokenId);

        uint256 tlqa = tokensLastQuestedAt[tokenId];
        tokensLastQuestedAt[tokenId] = 0;
        emit QuestStopped(tokenId, tlqa, block.timestamp);
    }

    function isArgopetzQuesting(uint256 tokenId) external view returns (bool) {
        uint256[] storage existCheck = argopetzCrew[tokenId];
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

    function setArgopetz(address addr) external onlyOwner {
        argopetz = IERC721(addr);
    }

    function setArgonauts(address addr) external onlyOwner {
        argonauts = IERC721(addr);
    }

    function setMaxQuest(uint8 n) external onlyOwner {
        maxCrews = n;
    }
}
