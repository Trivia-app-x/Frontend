import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { HomePage } from './components/HomePage';
import { HostGame } from './components/HostGame';
import { JoinGame } from './components/JoinGame';
import { GameLobby } from './components/GameLobby';
import { GamePlay } from './components/GamePlay';
import { GameResults } from './components/GameResults';
import { socketService } from './services/socket';
import type { GameState } from './types';
import './index.css';

interface GameSession {
  sessionId: string;
  roomCode: string;
  isHost: boolean;
  playerCount: number;
  maxPlayers: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [winner, setWinner] = useState<string>('');

  // Wagmi hooks
  const { address: account, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Initialize socket connection when user connects wallet
  useEffect(() => {
    if (isConnected && account) {
      console.log('🔌 User connected, initializing socket...');
      socketService.connect();
    } else {
      console.log('🔌 User disconnected, closing socket...');
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      socketService.removeAllListeners();
    };
  }, [isConnected, account]);

  const onGameCreated = (sessionId: string, roomCode: string, maxPlayers: number, questionCount: number) => {
    // Store question count in localStorage for game generation
    localStorage.setItem(`game_${roomCode}_questionCount`, questionCount.toString());

    setGameSession({
      sessionId,
      roomCode,
      isHost: true,
      playerCount: 1,
      maxPlayers
    });
    setGameState('waiting');
  };

  const onGameJoined = (sessionId: string, roomCode: string) => {
    setGameSession({
      sessionId,
      roomCode,
      isHost: false,
      playerCount: 0, // Will be updated
      maxPlayers: 0   // Will be updated
    });
    setGameState('waiting');
  };

  const handleBackToHome = useCallback(() => {
    // Clean up localStorage when leaving game
    if (gameSession) {
      localStorage.removeItem(`game_${gameSession.roomCode}_questions`);
      localStorage.removeItem(`game_${gameSession.roomCode}_started`);
    }

    setGameState('home');
    setGameSession(null);
    setWinner('');
  }, [gameSession]);

  const handleStartGame = useCallback(() => {
    setGameState('playing');
  }, []);

  const handleUpdatePlayerCount = useCallback((count: number) => {
    setGameSession(prev => prev ? {...prev, playerCount: count} : null);
  }, []);

  const handleGameEnd = useCallback((winner: string) => {
    setWinner(winner);
    setGameState('ended');
  }, []);

  const renderContent = () => {
    if (!isConnected || !account) {
      return (
        <HomePage
          ConnectButton={ConnectButton}
        />
      );
    }

    switch (gameState) {
      case 'home':
        return (
          <HomePage
            account={account}
            onHostGame={() => setGameState('create')}
            onJoinGame={() => setGameState('join')}
            onDisconnect={() => disconnect()}
            ConnectButton={ConnectButton}
          />
        );

      case 'create':
        return (
          <HostGame
            account={account}
            onGameCreated={onGameCreated}
            onBack={() => setGameState('home')}
          />
        );

      case 'join':
        return (
          <JoinGame
            account={account}
            onGameJoined={onGameJoined}
            onBack={() => setGameState('home')}
          />
        );

      case 'waiting':
        return (
          <GameLobby
            account={account}
            gameSession={gameSession!}
            onStartGame={handleStartGame}
            onBack={handleBackToHome}
            onUpdatePlayerCount={handleUpdatePlayerCount}
          />
        );

      case 'playing':
        return (
          <GamePlay
            account={account}
            gameSession={gameSession!}
            onGameEnd={handleGameEnd}
            onBack={handleBackToHome}
          />
        );

      case 'ended':
        return (
          <GameResults
            winner={winner}
            account={account}
            gameSession={gameSession!}
            onPlayAgain={() => setGameState('home')}
            onBack={handleBackToHome}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      {renderContent()}
    </div>
  );
}

export default App;