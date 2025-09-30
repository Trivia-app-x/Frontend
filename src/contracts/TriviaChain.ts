export const TRIVIA_CONTRACT_ADDRESS = '0xb619a20ace8e373752c960347f96805434129e89';

export const TRIVIA_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "room_code", "type": "bytes32" },
      { "internalType": "uint256", "name": "max_players", "type": "uint256" },
      { "internalType": "uint256", "name": "question_duration", "type": "uint256" }
    ],
    "name": "createSession",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "session_id", "type": "uint256" },
      { "internalType": "bytes32", "name": "room_code", "type": "bytes32" },
      { "internalType": "bytes32", "name": "display_name", "type": "bytes32" }
    ],
    "name": "joinSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "session_id", "type": "uint256" }
    ],
    "name": "startSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "session_id", "type": "uint256" },
      { "internalType": "uint256", "name": "question_index", "type": "uint256" }
    ],
    "name": "startQuestion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "session_id", "type": "uint256" },
      { "internalType": "uint256", "name": "question_index", "type": "uint256" },
      { "internalType": "bytes32", "name": "answer_hash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "correct_answer_hash", "type": "bytes32" },
      { "internalType": "uint8", "name": "difficulty", "type": "uint8" }
    ],
    "name": "submitAnswer",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "session_id", "type": "uint256" }
    ],
    "name": "endSession",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "session_id", "type": "uint256" }
    ],
    "name": "getWinner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "session_id", "type": "uint256" },
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerScore",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "host", "type": "address" },
      { "indexed": false, "internalType": "bytes32", "name": "roomCode", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "maxPlayers", "type": "uint256" },
      { "indexed": false, "internalType": "uint64", "name": "timestamp", "type": "uint64" }
    ],
    "name": "SessionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "playerCount", "type": "uint256" }
    ],
    "name": "PlayerJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "host", "type": "address" },
      { "indexed": false, "internalType": "uint64", "name": "startTime", "type": "uint64" }
    ],
    "name": "SessionStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "pointsEarned", "type": "uint256" }
    ],
    "name": "AnswerSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "winningScore", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalPlayers", "type": "uint256" },
      { "indexed": false, "internalType": "uint64", "name": "endTime", "type": "uint64" }
    ],
    "name": "SessionEnded",
    "type": "event"
  }
] as const;