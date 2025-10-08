import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useWatchContractEvent, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TRIVIA_CONTRACT_ADDRESS, TRIVIA_CONTRACT_ABI } from '../contracts/TriviaChain';
import { socketService } from '../services/socket';

interface GameSession {
  sessionId: string;
  roomCode: string;
  isHost: boolean;
  playerCount: number;
  maxPlayers: number;
}

interface GameLobbyProps {
  account: string;
  gameSession: GameSession;
  onStartGame: () => void;
  onBack: () => void;
  onUpdatePlayerCount: (count: number) => void;
}

interface Player {
  address: string;
  displayName: string;
  isHost: boolean;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  account,
  gameSession,
  onStartGame,
  onBack,
  onUpdatePlayerCount,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Socket integration: Join game room (run once on mount)
  useEffect(() => {
    console.log('🔌 GameLobby mounted, joining socket room');

    // Join the socket room
    if (!gameSession.isHost) {
      // Non-host players join via socket (host already created the game)
      socketService.joinGame(gameSession.sessionId, account);
    }
  }, [gameSession.sessionId, gameSession.isHost, account]);

  // Socket integration: Set up real-time event listeners (run once on mount)
  useEffect(() => {
    console.log('🔌 Setting up socket event listeners');

    // Listen for new players joining
    const handlePlayerJoined = (data: { player: any; totalPlayers: number }) => {
      console.log('📥 Player joined event:', data);

      const { player, totalPlayers } = data;

      // Update player count
      onUpdatePlayerCount(totalPlayers);

      // Add the new player to the list if not already there
      setPlayers(prev => {
        const playerExists = prev.some(p => p.address === player.address);
        if (!playerExists) {
          toast.success(`${player.displayName} joined the game!`);
          return [...prev, {
            address: player.address,
            displayName: player.displayName,
            isHost: false
          }];
        }
        return prev;
      });
    };

    // Listen for game started event (from host)
    const handleGameStarted = (data: { questions: any[]; sessionId: string }) => {
      console.log('📥 Game started event:', data);

      const { questions, sessionId } = data;

      if (sessionId === gameSession.sessionId) {
        console.log(`✅ Game started! Received ${questions.length} questions`);

        // Store questions in localStorage for gameplay
        localStorage.setItem(`game_${gameSession.roomCode}_questions`, JSON.stringify(questions));

        toast.success('Game is starting!', { duration: 2000 });

        // Give a moment for the toast, then start
        setTimeout(() => {
          onStartGame();
        }, 1500);
      }
    };

    // Listen for errors
    const handleError = (error: { message: string }) => {
      console.error('❌ Socket error:', error.message);
      toast.error(error.message);
    };

    // Attach listeners
    socketService.onPlayerJoined(handlePlayerJoined);
    socketService.onGameStarted(handleGameStarted);
    socketService.onError(handleError);

    // Cleanup on unmount
    return () => {
      console.log('🔌 GameLobby unmounting, cleaning up socket listeners');
      socketService.offPlayerJoined();
      socketService.offGameStarted();
      socketService.offError();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Blockchain hooks for starting session
  const { writeContract, data: startHash, isPending: isStartPending, error: startError } = useWriteContract();
  const { isLoading: isStartConfirming, isSuccess: isStartSuccess } = useWaitForTransactionReceipt({
    hash: startHash,
  });

  // Watch for PlayerJoined events
  useWatchContractEvent({
    address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
    abi: TRIVIA_CONTRACT_ABI,
    eventName: 'PlayerJoined',
    args: {
      sessionId: BigInt(gameSession.sessionId),
    },
    onLogs(logs) {
      logs.forEach((log) => {
        const { sessionId, player, playerCount } = log.args;
        console.log('Player joined:', { sessionId, player, playerCount });

        // Update player count
        if (sessionId?.toString() === gameSession.sessionId) {
          onUpdatePlayerCount(Number(playerCount));

          // Add the new player to the list if not already there
          const playerName = `Player_${player?.slice(0, 6)}`;
          setPlayers(prev => {
            const playerExists = prev.some(p => p.address === player);
            if (!playerExists && player) {
              return [...prev, {
                address: player as string,
                displayName: playerName,
                isHost: false
              }];
            }
            return prev;
          });

          toast.success(`${playerName} joined the game!`);
        }
      });
    },
  });

  // Initialize players list with current user
  useEffect(() => {
    const displayName = gameSession.isHost
      ? `Host_${account.slice(0, 6)}`
      : `Player_${account.slice(0, 6)}`;

    setPlayers([{
      address: account,
      displayName,
      isHost: gameSession.isHost
    }]);
  }, [account, gameSession.isHost]);

  // Handle startSession transaction states
  useEffect(() => {
    if (isStartPending) {
      toast.loading('Waiting for wallet confirmation...', { id: 'start-game' });
    }
  }, [isStartPending]);

  useEffect(() => {
    if (isStartConfirming) {
      toast.loading('Starting game on-chain...', { id: 'start-game' });
    }
  }, [isStartConfirming]);

  useEffect(() => {
    if (isStartSuccess && startHash) {
      toast.success('Game started on-chain!', { id: 'start-game' });

      // Now proceed with local game start logic and socket broadcast
      const proceedWithGameStart = async () => {
        try {
          // Generate questions for all players to share (host generates and shares)
          const { getRandomQuestions } = await import('../data/questions');

          // Get question count from localStorage (set by host)
          const storedQuestionCount = localStorage.getItem(`game_${gameSession.roomCode}_questionCount`);
          const questionCount = storedQuestionCount ? parseInt(storedQuestionCount, 10) : 10;
          console.log(`🎲 Generating ${questionCount} questions for game`);

          const gameQuestions = getRandomQuestions(questionCount);

          // Store shared questions in localStorage for this player
          localStorage.setItem(`game_${gameSession.roomCode}_questions`, JSON.stringify(gameQuestions));
          console.log('✅ Shared questions stored for room:', gameSession.roomCode);

          // Emit socket event to start game for all players
          console.log('📤 Emitting game:start via socket');
          socketService.startGame(gameSession.sessionId, questionCount, 'mixed');

          toast.success('Game starting for all players!', { id: 'start-game' });

          // Give players a moment to see the notification, then transition
          setTimeout(() => {
            onStartGame();
          }, 1500);
        } catch (error) {
          console.error('Error with local game start:', error);
          toast.error('Failed to start local game');
        } finally {
          setIsStarting(false);
        }
      };

      proceedWithGameStart();
    }
  }, [isStartSuccess, startHash, gameSession.roomCode, onStartGame]);

  useEffect(() => {
    if (startError) {
      console.error('StartSession transaction error:', startError);
      toast.error(startError.message || 'Failed to start session', { id: 'start-game' });
      setIsStarting(false);
    }
  }, [startError]);

  // Watch for SessionStarted event (blockchain confirmation)
  useWatchContractEvent({
    address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
    abi: TRIVIA_CONTRACT_ABI,
    eventName: 'SessionStarted',
    args: {
      sessionId: BigInt(gameSession.sessionId),
    },
    onLogs(logs) {
      logs.forEach((log) => {
        const { sessionId, host, startTime } = log.args;
        console.log('📋 Blockchain SessionStarted event:', { sessionId, host, startTime });

        // Just log for confirmation - socket handles the actual game start
        if (sessionId?.toString() === gameSession.sessionId) {
          console.log('✅ Blockchain confirmed game start');
        }
      });
    },
  });


  const startGame = async () => {
    if (!gameSession.isHost) {
      return;
    }

    setIsStarting(true);
    try {
      toast.loading('Starting game on-chain...', { id: 'start-game' });

      // Call blockchain startSession function
      writeContract({
        address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
        abi: TRIVIA_CONTRACT_ABI,
        functionName: "startSession",
        args: [BigInt(gameSession.sessionId)],
      });

    } catch (error: any) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game', { id: 'start-game' });
      setIsStarting(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameSession.roomCode);
    toast.success('Room code copied!');
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(gameSession.sessionId);
    toast.success('Session ID copied!');
  };

  const shareLink = `${window.location.origin}?join=${gameSession.roomCode}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied!');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="text-white hover:text-gray-300 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Leave Game
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Game Lobby</h1>
            <p className="text-gray-400">Session ID: {gameSession.sessionId}</p>
          </div>

          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Room Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-4">Game Details</h2>

                {/* Session ID */}
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl p-3 mb-3">
                  <div className="text-sm text-white/80 mb-1">Session ID</div>
                  <div className="text-2xl font-mono font-bold text-white tracking-wider">
                    {gameSession.sessionId}
                  </div>
                </div>

                {/* Room Code */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-3 mb-4">
                  <div className="text-sm text-white/80 mb-1">Room Code</div>
                  <div className="text-2xl font-mono font-bold text-white tracking-wider">
                    {gameSession.roomCode}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={copySessionId}
                    className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy Session ID
                  </button>

                  <button
                    onClick={copyRoomCode}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy Room Code
                  </button>

                  <button
                    onClick={copyShareLink}
                    className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Share Link
                  </button>
                </div>
              </div>

              {/* Game Stats */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Players</span>
                  <span className="text-white font-semibold">{gameSession.playerCount}/{gameSession.maxPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-yellow-400 font-semibold">Waiting</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network</span>
                  <span className="text-emerald-400 font-semibold">Arbitrum</span>
                </div>
              </div>

              {/* Start Game Button */}
              {gameSession.isHost && (
                <button
                  onClick={startGame}
                  disabled={isStarting || isStartPending || isStartConfirming || gameSession.playerCount < 1}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    isStarting || isStartPending || isStartConfirming || gameSession.playerCount < 1
                      ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white transform hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isStarting || isStartPending || isStartConfirming ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isStartPending ? 'Confirming...' : isStartConfirming ? 'Starting on-chain...' : 'Starting...'}
                    </span>
                  ) : (
                    `Start Game (${gameSession.playerCount} players)`
                  )}
                </button>
              )}

              {!gameSession.isHost && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Waiting for host to start the game...</p>
                  <div className="flex justify-center mt-2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Players List */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                Players ({gameSession.playerCount})
              </h2>

              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.address}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        player.isHost ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{player.displayName}</span>
                          {player.isHost && (
                            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                              HOST
                            </span>
                          )}
                          {player.address === account && (
                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{player.address.slice(0, 6)}...{player.address.slice(-4)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">Ready</span>
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, gameSession.maxPlayers - players.length) }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-4 border-2 border-dashed border-white/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
                        {players.length + index + 1}
                      </div>
                      <span className="text-gray-400">Waiting for player...</span>
                    </div>
                    <span className="text-gray-500 text-sm">Empty</span>
                  </div>
                ))}
              </div>

              {/* Game Rules */}
              <div className="mt-8 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg p-4 border border-violet-500/20">
                <h3 className="text-white font-semibold mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  How to Play
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Answer trivia questions as quickly as possible</li>
                  <li>• Faster correct answers earn more points</li>
                  <li>• Build streaks for bonus points</li>
                  <li>• Winner is determined by total score</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};