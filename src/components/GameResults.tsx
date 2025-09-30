import React from 'react';

interface GameSession {
  sessionId: string;
  roomCode: string;
  isHost: boolean;
  playerCount: number;
  maxPlayers: number;
}

interface GameResultsProps {
  winner: string;
  account: string;
  gameSession: GameSession;
  onPlayAgain: () => void;
  onBack: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({
  winner,
  account,
  gameSession,
  onPlayAgain,
  onBack,
}) => {
  const isWinner = winner === account;
  const shareText = `I just played Trivia Chain on Arbitrum! ${isWinner ? '🏆 I WON!' : '🎮 Great game!'} Join us at trivia-chain.com`;

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const copyShareText = () => {
    navigator.clipboard.writeText(shareText);
    // Could add toast here if available
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">
            {isWinner ? '🏆' : '🎉'}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isWinner ? 'Congratulations!' : 'Game Over'}
          </h1>
          <p className="text-gray-300">
            {isWinner ? 'You are the trivia champion!' : 'Thanks for playing!'}
          </p>
        </div>

        {/* Results Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 space-y-6">
          {/* Winner Announcement */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">🥇 Winner</h2>
            <div className={`p-4 rounded-xl ${isWinner ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-white/5'}`}>
              <p className="text-lg font-semibold text-white">
                {isWinner ? 'You!' : `${winner.slice(0, 6)}...${winner.slice(-4)}`}
              </p>
              {isWinner && (
                <p className="text-yellow-400 text-sm mt-1">
                  Amazing trivia skills! 🎯
                </p>
              )}
            </div>
          </div>

          {/* Game Stats */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold mb-3">Game Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Room Code</span>
              <span className="text-white font-mono">{gameSession.roomCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Players</span>
              <span className="text-white">{gameSession.playerCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Your Placement</span>
              <span className={`font-semibold ${isWinner ? 'text-yellow-400' : 'text-blue-400'}`}>
                {isWinner ? '🥇 1st Place' : 'Top Player'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network</span>
              <span className="text-emerald-400">Arbitrum Sepolia</span>
            </div>
          </div>

          {/* Share Section */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Share Your Result</h3>
            <div className="flex space-x-2">
              <button
                onClick={shareToTwitter}
                className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>
              <button
                onClick={copyShareText}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                </svg>
                Copy
              </button>
            </div>
          </div>

          {/* Achievement Badge */}
          {isWinner && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20 text-center">
              <div className="text-2xl mb-2">🏅</div>
              <p className="text-yellow-400 font-semibold text-sm">
                Trivia Champion
              </p>
              <p className="text-yellow-300 text-xs">
                First place in {gameSession.roomCode}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Play Again 🎮
            </button>

            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Back to Home
            </button>
          </div>

          {/* Fun Stats */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-gray-400 text-xs">
              Powered by Arbitrum Stylus • Gas efficient • Instant finality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};