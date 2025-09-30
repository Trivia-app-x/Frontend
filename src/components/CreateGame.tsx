import React, { useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface CreateGameProps {
  contract: ethers.Contract;
  account: string;
  onGameCreated: (sessionId: string, roomCode: string) => void;
  onBack: () => void;
}

export const CreateGame: React.FC<CreateGameProps> = ({
  contract,
  account,
  onGameCreated,
  onBack,
}) => {
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [questionDuration, setQuestionDuration] = useState('30');
  const [category, setCategory] = useState<'tech' | 'general' | 'mixed'>('tech');
  const [creating, setCreating] = useState(false);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createGame = async () => {
    try {
      setCreating(true);
      const roomCode = generateRoomCode();

      // Convert room code to bytes32
      const roomCodeBytes = ethers.encodeBytes32String(roomCode);

      // Create the game session on-chain
      const tx = await contract.createSession(
        roomCodeBytes,
        BigInt(maxPlayers),
        BigInt(questionDuration)
      );

      toast.loading('Creating game session...');
      const receipt = await tx.wait();

      // Get session ID from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'SessionCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        const sessionId = parsed?.args[0].toString();

        toast.success('Game created successfully!');
        onGameCreated(sessionId, roomCode);
      } else {
        throw new Error('Failed to get session ID');
      }
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast.error(error.message || 'Failed to create game');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-white hover:text-gray-300 transition-colors flex items-center"
      >
        ← Back to Home
      </button>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-8">Create a New Game</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Players
            </label>
            <input
              type="number"
              min="2"
              max="50"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter max players"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Question Time Limit (seconds)
            </label>
            <select
              value={questionDuration}
              onChange={(e) => setQuestionDuration(e.target.value)}
              className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="15">15 seconds</option>
              <option value="20">20 seconds</option>
              <option value="30">30 seconds</option>
              <option value="45">45 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Question Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="tech">Tech & Blockchain</option>
              <option value="general">General Knowledge</option>
              <option value="mixed">Mixed Categories</option>
            </select>
          </div>

          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-400 border-opacity-30">
            <p className="text-sm text-blue-200">
              <strong>Note:</strong> Creating a game will cost a small gas fee on Arbitrum.
              Make sure you have some ETH in your wallet.
            </p>
          </div>

          <button
            onClick={createGame}
            disabled={creating}
            className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
              creating
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
            } text-white`}
          >
            {creating ? 'Creating Game...' : 'Create Game Session'}
          </button>
        </div>
      </div>
    </div>
  );
};