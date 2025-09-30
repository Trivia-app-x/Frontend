import React, { useState } from "react";
import toast from "react-hot-toast";
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { stringToHex, pad, decodeEventLog } from "viem";
import {
  TRIVIA_CONTRACT_ADDRESS,
  TRIVIA_CONTRACT_ABI,
} from "../contracts/TriviaChain";

interface HostGameProps {
  account: string;
  onGameCreated: (
    sessionId: string,
    roomCode: string,
    maxPlayers: number,
    questionCount: number
  ) => void;
  onBack: () => void;
}

export const HostGame: React.FC<HostGameProps> = ({
  account,
  onGameCreated,
  onBack,
}) => {
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionCount, setQuestionCount] = useState(10);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });
  const publicClient = usePublicClient();

  const [generatedRoomCode, setGeneratedRoomCode] = useState("");

  const createGame = () => {
    // Generate a random room code (6 characters)
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedRoomCode(roomCode);

    // Convert room code to bytes32 using viem
    const roomCodeHex = stringToHex(roomCode, { size: 32 });

    // Call the smart contract to create the session
    writeContract({
      address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
      abi: TRIVIA_CONTRACT_ABI,
      functionName: "createSession",
      args: [roomCodeHex, BigInt(maxPlayers), BigInt(timeLimit)],
    });
  };

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isPending) {
      toast.loading("Waiting for wallet confirmation...", {
        id: "create-game",
      });
    }
  }, [isPending]);

  React.useEffect(() => {
    if (isConfirming) {
      toast.loading("Creating game on-chain...", { id: "create-game" });
    }
  }, [isConfirming]);

  React.useEffect(() => {
    if (isSuccess && hash && generatedRoomCode && receipt) {
      toast.success("Game created successfully!", { id: "create-game" });

      try {
        // Extract session ID from SessionCreated event
        const sessionCreatedEvent = receipt.logs.find((log) => {
          try {
            const decoded = decodeEventLog({
              abi: TRIVIA_CONTRACT_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === 'SessionCreated';
          } catch {
            return false;
          }
        });

        if (sessionCreatedEvent) {
          const decoded = decodeEventLog({
            abi: TRIVIA_CONTRACT_ABI,
            data: sessionCreatedEvent.data,
            topics: sessionCreatedEvent.topics,
          });

          if (decoded.eventName === 'SessionCreated') {
            const sessionId = decoded.args.sessionId.toString();
            console.log("Session ID:", sessionId);
            console.log("Generated Room Code:", generatedRoomCode);
            console.log("Max Players:", maxPlayers);
            onGameCreated(sessionId, generatedRoomCode, maxPlayers, questionCount);
          }
        } else {
          // Fallback: use timestamp as session ID
          const sessionId = Date.now().toString();
          onGameCreated(sessionId, generatedRoomCode, maxPlayers);
        }
      } catch (error) {
        console.error('Error extracting session ID:', error);
        // Fallback: use timestamp as session ID
        const sessionId = Date.now().toString();
        onGameCreated(sessionId, generatedRoomCode, maxPlayers);
      }
    }
  }, [isSuccess, hash, generatedRoomCode, maxPlayers, onGameCreated, receipt]);

  React.useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      toast.error(error.message || "Failed to create game", {
        id: "create-game",
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="absolute top-6 left-6 text-white hover:text-gray-300 transition-colors flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </button>

          <div className="text-6xl mb-4">🎪</div>
          <h1 className="text-3xl font-bold text-white mb-2">Host a Game</h1>
          <p className="text-gray-300">Configure your trivia session</p>
        </div>

        {/* Settings Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 space-y-6">
          {/* Max Players */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">
              Maximum Players
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="2"
                max="50"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none slider"
              />
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold py-2 px-4 rounded-lg min-w-[60px] text-center">
                {maxPlayers}
              </div>
            </div>
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">
              Time per Question (seconds)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none slider"
              />
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-2 px-4 rounded-lg min-w-[60px] text-center">
                {timeLimit}s
              </div>
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">
              Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    questionCount === count
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white transform scale-105"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Host</span>
              <span className="text-white">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network</span>
              <span className="text-emerald-400">Arbitrum Sepolia</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Est. Gas Cost</span>
              <span className="text-blue-400">~$0.05</span>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={createGame}
            disabled={isPending || isConfirming}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isPending || isConfirming
                ? "bg-gray-700 cursor-not-allowed text-gray-400"
                : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white transform hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isPending || isConfirming ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isPending ? "Creating Game..." : "Confirming..."}
              </span>
            ) : (
              "Create Game Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
