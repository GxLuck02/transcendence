// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TournamentScore
 * @dev Store and retrieve tournament scores on the blockchain
 */
contract TournamentScore {

    struct Tournament {
        uint256 tournamentId;
        string tournamentName;
        address winner;
        string winnerUsername;
        uint256 winnerScore;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from tournament ID to Tournament data
    mapping(uint256 => Tournament) public tournaments;

    // Array to keep track of all tournament IDs
    uint256[] public tournamentIds;

    // Events
    event TournamentStored(
        uint256 indexed tournamentId,
        string tournamentName,
        address winner,
        string winnerUsername,
        uint256 winnerScore,
        uint256 timestamp
    );

    /**
     * @dev Store a tournament result on the blockchain
     * @param _tournamentId The ID of the tournament
     * @param _tournamentName The name of the tournament
     * @param _winnerUsername The username of the winner
     * @param _winnerScore The score of the winner
     */
    function storeTournament(
        uint256 _tournamentId,
        string memory _tournamentName,
        string memory _winnerUsername,
        uint256 _winnerScore
    ) public {
        require(!tournaments[_tournamentId].exists, "Tournament already stored");

        tournaments[_tournamentId] = Tournament({
            tournamentId: _tournamentId,
            tournamentName: _tournamentName,
            winner: msg.sender,
            winnerUsername: _winnerUsername,
            winnerScore: _winnerScore,
            timestamp: block.timestamp,
            exists: true
        });

        tournamentIds.push(_tournamentId);

        emit TournamentStored(
            _tournamentId,
            _tournamentName,
            msg.sender,
            _winnerUsername,
            _winnerScore,
            block.timestamp
        );
    }

    /**
     * @dev Get tournament data by ID
     * @param _tournamentId The ID of the tournament
     * @return tournamentId Tournament ID
     * @return tournamentName Tournament name
     * @return winner Winner's address
     * @return winnerUsername Winner's username
     * @return winnerScore Winner's score
     * @return timestamp Timestamp when stored
     */
    function getTournament(uint256 _tournamentId)
        public
        view
        returns (
            uint256 tournamentId,
            string memory tournamentName,
            address winner,
            string memory winnerUsername,
            uint256 winnerScore,
            uint256 timestamp
        )
    {
        require(tournaments[_tournamentId].exists, "Tournament not found");

        Tournament memory t = tournaments[_tournamentId];
        return (
            t.tournamentId,
            t.tournamentName,
            t.winner,
            t.winnerUsername,
            t.winnerScore,
            t.timestamp
        );
    }

    /**
     * @dev Get tournament winner and score (simplified function for backend compatibility)
     * @param _tournamentId The ID of the tournament
     * @return winnerUsername Winner's username
     * @return winnerScore Winner's score
     */
    function getTournamentWinner(uint256 _tournamentId)
        public
        view
        returns (
            string memory winnerUsername,
            uint256 winnerScore
        )
    {
        require(tournaments[_tournamentId].exists, "Tournament not found");

        Tournament memory t = tournaments[_tournamentId];
        return (t.winnerUsername, t.winnerScore);
    }

    /**
     * @dev Get total number of tournaments stored
     * @return count Number of tournaments
     */
    function getTournamentCount() public view returns (uint256 count) {
        return tournamentIds.length;
    }

    /**
     * @dev Get all tournament IDs
     * @return Array of tournament IDs
     */
    function getAllTournamentIds() public view returns (uint256[] memory) {
        return tournamentIds;
    }
}
