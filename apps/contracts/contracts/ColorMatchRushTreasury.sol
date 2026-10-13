// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ColorMatchRushTreasury {
    uint256 public constant MAX_PARTICIPANT_PAGE_SIZE = 50;
    uint256 public constant MIN_ROUND_DURATION = 60 seconds;
    uint256 public constant MAX_ROUND_DURATION = 30 days;

    enum RoundStatus {
        None,
        Open,
        Settled,
        Cancelled
    }

    struct Round {
        uint64 startsAt;
        uint64 endsAt;
        uint256 totalPool;
        uint256 playerCount;
        RoundStatus status;
        address[3] winners;
        uint256[3] prizes;
    }

    address public owner;
    uint256 public immutable entryFee;
    uint256 public currentRoundId;

    mapping(uint256 => Round) private roundData;
    mapping(uint256 => address[]) private roundParticipants;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(address => bool)) public hasRefunded;

    event RoundCreated(uint256 indexed roundId, uint64 startsAt, uint64 endsAt, uint256 entryFee);
    event EntryFeeReceived(uint256 indexed roundId, address indexed player, uint256 amount);
    event RoundCancelled(uint256 indexed roundId);
    event EntryRefunded(uint256 indexed roundId, address indexed player, uint256 amount);
    event RoundSettled(
        uint256 indexed roundId,
        address firstPlace,
        address secondPlace,
        address thirdPlace,
        uint256 firstPrize,
        uint256 secondPrize,
        uint256 thirdPrize
    );
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _entryFee) {
        require(_entryFee > 0, "Entry fee is zero");
        owner = msg.sender;
        entryFee = _entryFee;
    }

    function createRound(uint64 durationSeconds) external onlyOwner returns (uint256 roundId) {
        require(
            durationSeconds >= MIN_ROUND_DURATION && durationSeconds <= MAX_ROUND_DURATION,
            "Invalid duration"
        );
        if (currentRoundId != 0) {
            Round storage previousRound = roundData[currentRoundId];
            require(
                previousRound.status != RoundStatus.Open || block.timestamp >= previousRound.endsAt,
                "Previous round is still open"
            );
        }

        roundId = ++currentRoundId;
        uint64 startsAt = uint64(block.timestamp);
        uint64 endsAt = uint64(block.timestamp + durationSeconds);
        Round storage round = roundData[roundId];
        round.startsAt = startsAt;
        round.endsAt = endsAt;
        round.status = RoundStatus.Open;

        emit RoundCreated(roundId, startsAt, endsAt, entryFee);
    }

    function joinRound(uint256 roundId) external payable {
        Round storage round = roundData[roundId];
        require(round.status == RoundStatus.Open, "Round is not open");
        require(block.timestamp < round.endsAt, "Round has ended");
        require(!hasJoined[roundId][msg.sender], "Already joined");
        require(msg.value == entryFee, "Incorrect entry fee");

        hasJoined[roundId][msg.sender] = true;
        roundParticipants[roundId].push(msg.sender);
        round.totalPool += msg.value;
        round.playerCount += 1;

        emit EntryFeeReceived(roundId, msg.sender, msg.value);
    }

    function getRound(uint256 roundId) external view returns (Round memory) {
        require(roundId != 0 && roundId <= currentRoundId, "Unknown round");
        return roundData[roundId];
    }

    function getRoundParticipants(
        uint256 roundId,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory page) {
        require(roundId != 0 && roundId <= currentRoundId, "Unknown round");
        require(limit > 0 && limit <= MAX_PARTICIPANT_PAGE_SIZE, "Invalid page size");

        address[] storage participants = roundParticipants[roundId];
        uint256 length = participants.length;
        if (offset >= length) {
            return new address[](0);
        }

        uint256 remaining = length - offset;
        uint256 pageLength = limit < remaining ? limit : remaining;
        page = new address[](pageLength);
        for (uint256 i; i < pageLength; ++i) {
            page[i] = participants[offset + i];
        }
    }

    function isRoundOpen(uint256 roundId) external view returns (bool) {
        Round storage round = roundData[roundId];
        return round.status == RoundStatus.Open && block.timestamp < round.endsAt;
    }

    function cancelRound(uint256 roundId) external onlyOwner {
        Round storage round = roundData[roundId];
        require(round.status == RoundStatus.Open, "Round is not open");
        require(block.timestamp >= round.endsAt, "Round has not ended");
        require(round.playerCount < 3, "Round has enough entrants to settle");

        round.status = RoundStatus.Cancelled;
        emit RoundCancelled(roundId);
    }

    function refundEntry(uint256 roundId) external {
        Round storage round = roundData[roundId];
        require(round.status == RoundStatus.Cancelled, "Round was not cancelled");
        require(hasJoined[roundId][msg.sender], "Not a participant");
        require(!hasRefunded[roundId][msg.sender], "Already refunded");

        hasRefunded[roundId][msg.sender] = true;
        round.totalPool -= entryFee;

        (bool success, ) = payable(msg.sender).call{value: entryFee}("");
        require(success, "Refund failed");

        emit EntryRefunded(roundId, msg.sender, entryFee);
    }

    function settleRound(
        uint256 roundId,
        address firstPlace,
        address secondPlace,
        address thirdPlace
    ) external onlyOwner {
        Round storage round = roundData[roundId];
        require(round.status == RoundStatus.Open, "Round is not open");
        require(block.timestamp >= round.endsAt, "Round has not ended");
        require(round.playerCount >= 3, "At least three players required");
        require(
            firstPlace != address(0) &&
                secondPlace != address(0) &&
                thirdPlace != address(0) &&
                firstPlace != secondPlace &&
                firstPlace != thirdPlace &&
                secondPlace != thirdPlace,
            "Invalid winners"
        );
        require(
            hasJoined[roundId][firstPlace] &&
                hasJoined[roundId][secondPlace] &&
                hasJoined[roundId][thirdPlace],
            "Winner did not join"
        );

        uint256 firstPrize = (round.totalPool * 50) / 100;
        uint256 secondPrize = (round.totalPool * 30) / 100;
        uint256 thirdPrize = round.totalPool - firstPrize - secondPrize;

        round.status = RoundStatus.Settled;
        round.winners = [firstPlace, secondPlace, thirdPlace];
        round.prizes = [firstPrize, secondPrize, thirdPrize];

        _payWinner(firstPlace, firstPrize);
        _payWinner(secondPlace, secondPrize);
        _payWinner(thirdPlace, thirdPrize);

        emit RoundSettled(
            roundId,
            firstPlace,
            secondPlace,
            thirdPlace,
            firstPrize,
            secondPrize,
            thirdPrize
        );
    }

    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {
        revert("Use joinRound");
    }

    function _payWinner(address winner, uint256 amount) private {
        (bool success, ) = payable(winner).call{value: amount}("");
        require(success, "Prize transfer failed");
    }
}
