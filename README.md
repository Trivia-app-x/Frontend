# TriviaChain - Decentralized Trivia Game 🎮

> **⚠️ DEVELOPMENT STATUS: MVP IN PROGRESS**
> This is an early-stage MVP under active development. Backend functionality is currently being built. The smart contract is deployed on Arbitrum Sepolia testnet.

A blockchain-based multiplayer trivia game built on Arbitrum Stylus, leveraging Web3 technologies for real-time, trustless gaming experiences.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Smart Contract](#smart-contract)
- [Project Structure](#project-structure)
- [Game Flow](#game-flow)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)

## 🎯 About

TriviaChain is a decentralized trivia game where players can create or join game sessions, compete in real-time, and have their scores recorded on-chain. The game leverages Arbitrum Stylus smart contracts written in Rust for efficient, low-cost blockchain interactions.

## ✨ Features

### Current (MVP)
- ✅ **Wallet Connection**: Connect with MetaMask, Rainbow, and other Web3 wallets via RainbowKit
- ✅ **Create Game Sessions**: Host games with customizable settings (max players, question count, difficulty)
- ✅ **Join Game Sessions**: Join games using unique room codes
- ✅ **Game Lobby**: Real-time player tracking before game starts
- ✅ **Multiple Question Categories**: Tech, General Knowledge, and Party questions
- ✅ **Difficulty Levels**: Easy, Medium, and Hard questions with varying time limits
- ✅ **On-chain Score Recording**: Player scores stored on Arbitrum blockchain
- ✅ **Winner Determination**: Smart contract determines and records winners

### Planned Features
- 🔄 **Backend Integration**: Real-time game synchronization
- 🔄 **Leaderboards**: Global and session-based rankings
- 🔄 **NFT Rewards**: Winner badges and achievements as NFTs
- 🔄 **Custom Question Pools**: Allow users to create custom trivia sets
- 🔄 **Spectator Mode**: Watch ongoing games
- 🔄 **Tournament Mode**: Multi-round elimination tournaments

## 🛠 Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Wagmi** - Ethereum interactions
- **Viem** - Ethereum utilities
- **RainbowKit** - Wallet connection UI
- **React Hot Toast** - Notifications

### Blockchain
- **Arbitrum Stylus** - Layer 2 smart contract platform
- **Rust** - Smart contract language (backend contract)
- **Arbitrum Sepolia** - Testnet deployment

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **Git**
- **MetaMask** or another Web3 wallet browser extension

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd trivia-app/Frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_TRIVIA_CONTRACT_ADDRESS=0xb619a20ace8e373752c960347f96805434129e89
```

**Get your WalletConnect Project ID:**
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID

### 4. Add Arbitrum Sepolia to Your Wallet

**Network Details:**
- **Network Name**: Arbitrum Sepolia
- **RPC URL**: `https://sepolia-rollup.arbitrum.io/rpc`
- **Chain ID**: `421614`
- **Currency Symbol**: `ETH`
- **Block Explorer**: `https://sepolia.arbiscan.io/`

**Get Testnet ETH:**
- Use [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- Or bridge from Sepolia ETH via [Arbitrum Bridge](https://bridge.arbitrum.io/)

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 🌐 Environment Setup

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Yes |
| `VITE_TRIVIA_CONTRACT_ADDRESS` | Deployed smart contract address | Yes |

### Network Configuration

The app is configured to work with **Arbitrum Sepolia** testnet. Configuration can be found in `src/wagmi.ts`.

## 📝 Smart Contract

### Contract Details

- **Address**: `0xb619a20ace8e373752c960347f96805434129e89`
- **Network**: Arbitrum Sepolia
- **Language**: Rust (Stylus)
- **Block Explorer**: [View on Arbiscan](https://sepolia.arbiscan.io/address/0xb619a20ace8e373752c960347f96805434129e89)

### Key Contract Functions

```rust
// Create a new game session
createSession(room_code: bytes32, max_players: uint256, question_duration: uint256) -> uint256

// Join an existing session
joinSession(session_id: uint256, room_code: bytes32, display_name: bytes32)

// Start the game (host only)
startSession(session_id: uint256)

// Submit an answer
submitAnswer(session_id: uint256, question_index: uint256, answer_hash: bytes32, correct_answer_hash: bytes32, difficulty: uint8) -> uint256

// End game and determine winner
endSession(session_id: uint256) -> address

// Get winner address
getWinner(session_id: uint256) -> address

// Get player score
getPlayerScore(session_id: uint256, player: address) -> uint256
```

### Contract Events

- `SessionCreated` - Emitted when a new game is created
- `PlayerJoined` - Emitted when a player joins
- `SessionStarted` - Emitted when host starts the game
- `AnswerSubmitted` - Emitted when a player submits an answer
- `SessionEnded` - Emitted when game ends with winner info

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/           # React components
│   │   ├── HomePage.tsx      # Landing page with wallet connection
│   │   ├── HostGame.tsx      # Create game interface
│   │   ├── JoinGame.tsx      # Join game interface
│   │   ├── GameLobby.tsx     # Pre-game lobby
│   │   ├── GamePlay.tsx      # Main game interface
│   │   └── GameResults.tsx   # Post-game results
│   ├── contracts/
│   │   └── TriviaChain.ts    # Contract ABI and address
│   ├── data/
│   │   └── questions.ts      # Question pool
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # App entry point
│   ├── wagmi.ts              # Wagmi configuration
│   └── index.css             # Global styles
├── public/                   # Static assets
├── .env.example              # Environment template
├── package.json              # Dependencies
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## 🎮 Game Flow

### 1. Connect Wallet
- User connects Web3 wallet via RainbowKit
- Supports MetaMask, Rainbow, WalletConnect, and more

### 2. Host or Join Game

**Host:**
- Set max players (2-10)
- Choose question count (5-20)
- Select difficulty (Easy/Medium/Hard/Mixed)
- Choose category (Tech/General/Party/Mixed)
- Receive unique 6-character room code

**Join:**
- Enter 6-character room code
- Provide display name

### 3. Game Lobby
- Wait for players to join
- Host can see all connected players
- Host starts game when ready

### 4. Gameplay
- Questions displayed one at a time
- Time-limited answers (15-30s based on difficulty)
- Points awarded based on:
  - Correctness
  - Speed of answer
  - Question difficulty
- Progress tracked on-chain

### 5. Results
- Winner determined by smart contract
- Final scores displayed
- Option to play again

## 🗺 Development Roadmap

### Phase 1: MVP (Current) ✅
- [x] Frontend UI/UX
- [x] Wallet integration
- [x] Smart contract integration
- [x] Basic game flow
- [x] Question system

### Phase 2: Backend & Real-time (In Progress) 🔄
- [ ] WebSocket server for real-time sync
- [ ] Backend API for game state management
- [ ] Database for game history
- [ ] Improved player synchronization

### Phase 3: Enhanced Features 📋
- [ ] Leaderboards and statistics
- [ ] NFT reward system
- [ ] Custom question pools
- [ ] Tournament mode
- [ ] Spectator mode
- [ ] Social features (friend challenges, chat)

### Phase 4: Scaling & Optimization 🚀
- [ ] Performance optimization
- [ ] Multi-chain support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Community governance

## 🤝 Contributing

Contributions are welcome! This is an active development project.

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Comment complex logic

## 🐛 Known Issues

- Backend synchronization not implemented (frontend-only MVP)
- Real-time player updates rely on blockchain events (may have delays)
- Question pool is limited (hardcoded)
- No persistence of game history

## 📄 License

This project is part of the Web3Bridge Rust Masterclass program.

## 🔗 Links

- [Arbitrum Docs](https://docs.arbitrum.io/)
- [Stylus Docs](https://docs.arbitrum.io/stylus/stylus-gentle-introduction)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Wagmi Docs](https://wagmi.sh/)

## 📧 Support

For questions or issues, please open an issue in the repository.

---

**Built with ❤️ for Web3Bridge Rust Masterclass**