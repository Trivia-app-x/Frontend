import React from 'react';

interface HomePageProps {
  account?: string;
  onConnect?: () => void;
  onHostGame?: () => void;
  onJoinGame?: () => void;
  onDisconnect?: () => void;
  isConnecting?: boolean;
  ConnectButton?: React.ComponentType;
}

export const HomePage: React.FC<HomePageProps> = ({
  account,
  onConnect,
  onHostGame,
  onJoinGame,
  onDisconnect,
  isConnecting = false,
  ConnectButton,
}) => {
  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="text-8xl mb-6">🎮</div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Trivia Chain
            </h1>
            <p className="text-gray-300 text-lg">
              Real-time trivia on Arbitrum
            </p>
          </div>

          {/* Connect Wallet Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-4 1-1-4 .257-.257A6 6 0 1118 8zm-6-2a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-3">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                Connect your MetaMask wallet to start playing trivia games with on-chain rewards
              </p>

              {ConnectButton ? (
                <div className="w-full">
                  <ConnectButton />
                </div>
              ) : (
                <button
                  onClick={onConnect}
                  disabled={isConnecting}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    isConnecting
                      ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white transform hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'Connect Wallet'
                  )}
                </button>
              )}

              <div className="mt-6 text-xs text-gray-500">
                Make sure you're on Arbitrum Sepolia network
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🎮</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Trivia Chain</h1>
              <p className="text-gray-400 text-sm">Built on Arbitrum</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {ConnectButton ? (
              <ConnectButton />
            ) : (
              <>
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  title="Disconnect"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Play! 🎯
            </h2>
            <p className="text-gray-300 text-lg">
              Choose your game mode and start earning on-chain rewards
            </p>
          </div>

          {/* Game Mode Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Host Game */}
            <div className="group cursor-pointer" onClick={onHostGame}>
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-lg rounded-2xl border border-emerald-500/30 p-8 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-400/50">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-2xl">
                    🎪
                  </div>
                  <div className="text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">Host a Game</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Create a new trivia session, configure game settings, and invite friends to join your room.
                </p>

                <div className="flex items-center space-x-4 text-sm text-emerald-400">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    Up to 50 players
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Real-time scoring
                  </span>
                </div>
              </div>
            </div>

            {/* Join Game */}
            <div className="group cursor-pointer" onClick={onJoinGame}>
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-lg rounded-2xl border border-blue-500/30 p-8 transition-all duration-300 hover:scale-[1.02] hover:border-blue-400/50">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-2xl">
                    🚀
                  </div>
                  <div className="text-blue-400 group-hover:translate-x-1 transition-transform">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">Join a Game</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Enter a room code to join an existing trivia session and compete for on-chain rewards.
                </p>

                <div className="flex items-center space-x-4 text-sm text-blue-400">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Instant join
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified rewards
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-400 mb-1">25+</div>
                <div className="text-gray-400 text-sm">Questions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400 mb-1">3</div>
                <div className="text-gray-400 text-sm">Categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400 mb-1">19KB</div>
                <div className="text-gray-400 text-sm">Contract Size</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};