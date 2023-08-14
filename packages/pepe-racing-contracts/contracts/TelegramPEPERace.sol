// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns(bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function burn(uint256 amount) external;
}
import "@openzeppelin/contracts/access/Ownable.sol";
contract TelegramPEPERace is Ownable {
    
        struct Game {
        uint256 raceLength;
        uint256 minBet;
        // This is a SHA-256 hash of the random number generated by the bot.
        bytes32 hashedSuit;
        address[] players;
        uint256[] bets;
        bool inProgress;
        uint16 loser;
    }

    address public revenueWallet;

    IERC20 public immutable bettingToken;

    uint256 public immutable minimumBet;

    // The amount to take as revenue, in basis points.
    uint256 public immutable revenueBps;

    // The amount to burn forever, in basis points.
    uint256 public immutable burnBps;

    // Minimum race length
    uint256 public minRaceLength;

    // Max race length
    uint256 public maxRaceLength;

    // Map Telegram chat IDs to their games.
    mapping(int64 => Game) public games;

    // The Telegram chat IDs for each active game. Mainly used to
    // abort all active games in the event of a catastrophe.
    int64[] public activeTgGroups;

    // Stores the amount each player has bet for a game.
    event Bet(int64 tgChatId, address player, uint16 playerIndex, uint256 amount);

    // Stores the amount each player wins for a game.
    event Win(int64 tgChatId, address player, uint16 playerIndex, uint256 amount);

    // Stores the amount the loser lost.
    event Loss(int64 tgChatId, address player, uint16 playerIndex, uint256 amount);

    // Stores the amount collected by the protocol.
    event Revenue(int64 tgChatId, uint256 amount);

    // Stores the amount burned by the protocol.
    event Burn(int64 tgChatId, uint256 amount);

    constructor(
        address payable _bettingToken,
        uint256 _minimumBet,
        uint256 _revenueBps,
        uint256 _burnBps,
        address _revenueWallet,
        uint256 _minRaceLength,
        uint256 _maxRaceLength
    ) {
        revenueWallet = _revenueWallet;
        revenueBps = _revenueBps;
        burnBps = _burnBps;
        bettingToken = IERC20(_bettingToken);
        minimumBet = _minimumBet;
        minRaceLength = _minRaceLength;
        maxRaceLength = _maxRaceLength;
    }
    /**
     * @dev Check if there is a game in progress for a Telegram group.
     * @param _tgChatId Telegram group to check
     * @return true if there is a game in progress, otherwise false
     */
    function isGameInProgress(int64 _tgChatId) public view returns (bool) {
        return games[_tgChatId].inProgress;
    }

    /**
     * @dev Remove a Telegram chat ID from the array.
     * @param _tgChatId Telegram chat ID to remove
     */
    function removeTgId(int64 _tgChatId) internal {
        for (uint256 i = 0; i < activeTgGroups.length; i++) {
            if (activeTgGroups[i] == _tgChatId) {
                activeTgGroups[i] = activeTgGroups[activeTgGroups.length - 1];
                activeTgGroups.pop();
            }
        }
    }

    /**
     * @dev Create a new game. Transfer funds into escrow.
     * @param _tgChatId Telegram group of this game
     * @param _raceLength Length of race
     * @param _minBet minimum bet to play
     * @param _hashedSuit The suit drawn by the bot, hashed with keccak256
     * @param _players participating players
     * @param _bets each player's bet
     * @return The updated list of bets.
     */
    function newGame(
        int64 _tgChatId,
        uint256 _raceLength,
        uint256 _minBet,
        bytes32 _hashedSuit,
        address[] memory _players,
        uint256[] memory _bets
    ) public onlyOwner returns (uint256[] memory) {
        require(_raceLength <= maxRaceLength, "Race too long");
        require(_raceLength >= minRaceLength, "Race too short");
        require(_minBet >= minimumBet, "Minimum bet too small");
        require(_players.length == _bets.length, "Players/bets length mismatch");
        require(_players.length > 1, "Not enough players");
        require(!isGameInProgress(_tgChatId), "There is already a game in progress");

        // The bets will be capped so you can only lose what other
        // players bet. The updated bets will be returned to the
        // caller.
        //
        // O(N) by doing a prepass to sum all the bets in the
        // array. Use the sum to modify one bet at a time. Replace
        // each bet with its updated value.
        uint256 betTotal = 0;
        for (uint16 i = 0; i < _bets.length; i++) {
            require(_bets[i] >= _minBet, "Bet is smaller than the minimum");
            betTotal += _bets[i];
        }
        for (uint16 i = 0; i < _bets.length; i++) {
            betTotal -= _bets[i];
            if (_bets[i] > betTotal) {
                _bets[i] = betTotal;
            }
            betTotal += _bets[i];

            require(bettingToken.allowance(_players[i], address(this)) >= _bets[i], "Not enough allowance");
            bool isSent = bettingToken.transferFrom(_players[i], address(this), _bets[i]);
            require(isSent, "Funds transfer failed");

            emit Bet(_tgChatId, _players[i], i, _bets[i]);
        }

        Game memory g;
        g.raceLength = _raceLength;
        g.minBet = _minBet;
        g.hashedSuit = _hashedSuit;
        g.players = _players;
        g.bets = _bets;
        g.inProgress = true;

        games[_tgChatId] = g;
        activeTgGroups.push(_tgChatId);

        return _bets;
    }

    /**
     * @dev Declare a loser of the game and pay out the winnings.
     * @param _tgChatId Telegram group of this game
     * @param _loser index of the loser
     *
     * There is also a string array that will be passed in by the bot
     * containing labeled strings, for historical/auditing purposes:
     *
     * beta: The randomly generated number in hex.
     *
     * salt: The salt to append to beta for hashing, in hex.
     *
     * publickey: The VRF public key in hex.
     *
     * proof: The generated proof in hex.
     *
     * alpha: The input message to the VRF.
     */
    function endGame(int64 _tgChatId, uint16 _loser, string[] calldata) public onlyOwner {
        require(_loser != type(uint16).max, "Loser index shouldn't be the sentinel value");
        require(isGameInProgress(_tgChatId), "No game in progress for this Telegram chat ID");

        Game storage g = games[_tgChatId];

        require(_loser < g.players.length, "Loser index out of range");
        require(g.players.length > 1, "Not enough players");

        g.loser = _loser;
        g.inProgress = false;
        removeTgId(_tgChatId);

        // Parallel arrays
        address[] memory winners = new address[](g.players.length - 1);
        uint16[] memory winnersPlayerIndex = new uint16[](g.players.length - 1);

        // The total bets of the winners.
        uint256 winningBetTotal = 0;

        // Filter out the loser and calc the total winning bets.
        {
            uint16 numWinners = 0;
            for (uint16 i = 0; i < g.players.length; i++) {
                if (i != _loser) {
                    winners[numWinners] = g.players[i];
                    winnersPlayerIndex[numWinners] = i;
                    winningBetTotal += g.bets[i];
                    numWinners++;
                }
            }
        }

        uint256 totalPaidWinnings = 0;
        require(burnBps + revenueBps < 10_1000, "Total fees must be < 100%");

        // The share of tokens to burn.
        uint256 burnShare = (g.bets[_loser] * burnBps) / 10_000;

        // The share left for the contract. This is an approximate
        // value. The real value will be whatever is leftover after
        // each winner is paid their share.
        uint256 approxRevenueShare = (g.bets[_loser] * revenueBps) / 10_000;

        bool isSent;
        {
            uint256 totalWinnings = g.bets[_loser] - burnShare - approxRevenueShare;

            for (uint16 i = 0; i < winners.length; i++) {
                uint256 winnings = (totalWinnings * g.bets[winnersPlayerIndex[i]]) / winningBetTotal;

                isSent = bettingToken.transfer(winners[i], g.bets[winnersPlayerIndex[i]] + winnings);
                require(isSent, "Funds transfer failed");

                emit Win(_tgChatId, winners[i], winnersPlayerIndex[i], winnings);

                totalPaidWinnings += winnings;
            }
        }

        bettingToken.burn(burnShare);
        emit Burn(_tgChatId, burnShare);

        uint256 realRevenueShare = g.bets[_loser] - totalPaidWinnings - burnShare;
        isSent = bettingToken.transfer(revenueWallet, realRevenueShare);
        require(isSent, "Revenue transfer failed");
        emit Revenue(_tgChatId, realRevenueShare);

        require(
            (totalPaidWinnings + burnShare + realRevenueShare) == g.bets[_loser],
            "Calculated winnings do not add up"
        );
    }

    /**
     * @dev Abort a game and refund the bets. Use in emergencies
     *      e.g. bot crash.
     * @param _tgChatId Telegram group of this game
     */
    function abortGame(int64 _tgChatId) public onlyOwner {
        require(isGameInProgress(_tgChatId), "No game in progress for this Telegram chat ID");
        Game storage g = games[_tgChatId];

        for (uint16 i = 0; i < g.players.length; i++) {
            bool isSent = bettingToken.transfer(g.players[i], g.bets[i]);
            require(isSent, "Funds transfer failed");
        }

        g.inProgress = false;
        removeTgId(_tgChatId);
    }

    /**
     * @dev Abort all in progress games.
     */
    function abortAllGames() public onlyOwner {
        // abortGame modifies activeTgGroups with each call, so
        // iterate over a copy
        int64[] memory _activeTgGroups = activeTgGroups;
        for (uint256 i = 0; i < _activeTgGroups.length; i++) {
            abortGame(_activeTgGroups[i]);
        }
    }
}
