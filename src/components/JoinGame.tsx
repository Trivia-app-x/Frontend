import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { stringToHex } from 'viem';
import { TRIVIA_CONTRACT_ADDRESS, TRIVIA_CONTRACT_ABI } from '../contracts/TriviaChain';
import { socketService } from '../services/socket';

interface JoinGameProps {
  account: string;
  onGameJoined: (sessionId: string, roomCode: string) => void;
  onBack: () => void;
}

export const JoinGame: React.FC<JoinGameProps> = ({
  account,
  onGameJoined,
  onBack,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [enteredRoomCode, setEnteredRoomCode] = useState('');
  const [isFetchingSession, setIsFetchingSession] = useState(false);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const joinGame = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    if (roomCode.length !== 6) {
      toast.error('Room code must be 6 characters');
      return;
    }

    setEnteredRoomCode(roomCode.toUpperCase());
    setIsFetchingSession(true);

    try {
      // Step 1: Fetch session ID from backend using room code
      toast.loading('Finding game session...', { id: 'fetch-session' });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/game/room/${roomCode.toUpperCase()}`);

      if (!response.ok) {
        throw new Error('Game not found with this room code');
      }

      const data = await response.json();

      if (!data.success || !data.sessionId) {
        throw new Error('Invalid game session');
      }

      const fetchedSessionId = data.sessionId;
      setSessionId(fetchedSessionId);

      toast.success('Game found!', { id: 'fetch-session' });
      console.log('📋 Fetched session ID:', fetchedSessionId);

      // Step 2: Join on blockchain
      toast.loading('Joining game on-chain...', { id: 'join-blockchain' });

      // Convert room code and display name to bytes32
      const roomCodeHex = stringToHex(roomCode.toUpperCase(), { size: 32 });
      const displayNameHex = stringToHex(`Player_${account.slice(0, 6)}`, { size: 32 });

      // Call the smart contract to join the session
      writeContract({
        address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
        abi: TRIVIA_CONTRACT_ABI,
        functionName: "joinSession",
        args: [BigInt(fetchedSessionId), roomCodeHex, displayNameHex],
      });

    } catch (error: any) {
      console.error('❌ Error joining game:', error);
      toast.error(error.message || 'Failed to find game', { id: 'fetch-session' });
      setIsFetchingSession(false);
    }
  };

  // Handle transaction states
  React.useEffect(() => {
    if (isPending) {
      toast.loading("Waiting for wallet confirmation...", { id: "join-blockchain" });
    }
  }, [isPending]);

  React.useEffect(() => {
    if (isConfirming) {
      toast.loading("Joining game on-chain...", { id: "join-blockchain" });
    }
  }, [isConfirming]);

  React.useEffect(() => {
    if (isSuccess && hash && sessionId) {
      toast.success('Joined game on-chain!', { id: "join-blockchain", duration: 2000 });

      // Step 3: Emit socket event to join the game room
      console.log('📤 Emitting socket event game:join');
      socketService.joinGame(sessionId, account);

      toast.success('Successfully joined the game!', { duration: 3000 });
      setIsFetchingSession(false);

      // Dismiss any lingering toasts before navigating
      setTimeout(() => {
        toast.dismiss();
        // Navigate to game lobby
        onGameJoined(sessionId, enteredRoomCode.toUpperCase());
      }, 500);
    }
  }, [isSuccess, hash, sessionId, enteredRoomCode, account, onGameJoined]);

  // Cleanup effect: dismiss toasts on unmount
  React.useEffect(() => {
    return () => {
      toast.dismiss('join-blockchain');
      toast.dismiss('fetch-session');
      toast.dismiss('join-complete');
    };
  }, []);

  React.useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      toast.error(error.message || "Failed to join game", { id: "join-blockchain" });
      setIsFetchingSession(false);
    }
  }, [error]);

  const handleInputChange = (value: string) => {
    // Only allow alphanumeric characters and limit to 6 chars
    const filtered = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
    setRoomCode(filtered.toUpperCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomCode.length === 6 && !isPending && !isConfirming && !isFetchingSession) {
      joinGame();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="absolute top-6 left-6 text-white hover:text-gray-300 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>

          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-white mb-2">Join a Game</h1>
          <p className="text-gray-300">Enter the room code to join</p>
        </div>

        {/* Join Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
          <div className="space-y-6">
            {/* Room Code Input */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ABC123"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                disabled={isPending || isConfirming || isFetchingSession}
              />
              <p className="text-gray-400 text-xs mt-2 text-center">
                Enter the 6-character code from your host
              </p>
            </div>

            {/* Character Indicator */}
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index < roomCode.length
                      ? 'bg-blue-500'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Player Info */}
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Player</span>
                <span className="text-white">{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network</span>
                <span className="text-emerald-400">Arbitrum Sepolia</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Est. Gas Cost</span>
                <span className="text-blue-400">~$0.02</span>
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={joinGame}
              disabled={isPending || isConfirming || isFetchingSession || roomCode.length !== 6}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isPending || isConfirming || isFetchingSession || roomCode.length !== 6
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isFetchingSession || isPending || isConfirming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isFetchingSession ? 'Finding game...' : isPending ? 'Confirming...' : 'Joining...'}
                </span>
              ) : (
                'Join Game'
              )}
            </button>

            {/* Quick Join Tips */}
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-2">Quick tips:</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>• Ask your host for the 6-character room code</p>
                <p>• Make sure you're on Arbitrum Sepolia network</p>
                <p>• Have a small amount of ETH for gas fees</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};