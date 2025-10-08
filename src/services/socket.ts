import { io, Socket } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface PlayerInfo {
  address: string;
  displayName: string;
  socketId: string;
  joinedAt: number;
}

interface GameState {
  sessionId: string;
  roomCode: string;
  host: string;
  players: PlayerInfo[];
  status: "lobby" | "active" | "ended";
  currentQuestionIndex: number;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  category: "tech" | "general" | "party";
  difficulty: 0 | 1 | 2;
  timeLimit: number;
}

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to backend, socket ID:", this.socket?.id);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from backend, reason:", reason);
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Connection error:", error);
      });

      this.socket.on("error", (error: { message: string }) => {
        console.error("❌ Socket error:", error.message);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("🔌 Socket disconnected");
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ========== EMIT EVENTS (Client -> Server) ==========

  joinGame(sessionId: string, playerAddress: string) {
    console.log("📤 Emitting game:join", { sessionId, playerAddress });
    this.socket?.emit("game:join", { sessionId, playerAddress });
  }

  startGame(sessionId: string, questionCount: number, category?: "tech" | "general" | "party" | "mixed") {
    console.log("📤 Emitting game:start", { sessionId, questionCount, category });
    this.socket?.emit("game:start", { sessionId, questionCount, category });
  }

  startQuestion(sessionId: string, questionIndex: number) {
    console.log("📤 Emitting question:start", { sessionId, questionIndex });
    this.socket?.emit("question:start", { sessionId, questionIndex });
  }

  submitAnswer(sessionId: string, questionIndex: number, answer: number, timeTaken: number) {
    console.log("📤 Emitting answer:submit", { sessionId, questionIndex, answer, timeTaken });
    this.socket?.emit("answer:submit", { sessionId, questionIndex, answer, timeTaken });
  }

  endGame(sessionId: string) {
    console.log("📤 Emitting game:end", { sessionId });
    this.socket?.emit("game:end", { sessionId });
  }

  // ========== LISTEN TO EVENTS (Server -> Client) ==========

  onPlayerJoined(callback: (data: { player: PlayerInfo; totalPlayers: number }) => void) {
    this.socket?.on("player:joined", (data) => {
      console.log("📥 player:joined event received:", data);
      callback(data);
    });
  }

  onGameState(callback: (data: GameState) => void) {
    this.socket?.on("game:state", (data) => {
      console.log("📥 game:state event received:", data);
      callback(data);
    });
  }

  onGameStarted(callback: (data: { sessionId: string; questions: Question[]; startTime: number }) => void) {
    this.socket?.on("game:started", (data) => {
      console.log("📥 game:started event received:", data);
      callback(data);
    });
  }

  onQuestionStarted(callback: (data: { sessionId: string; questionIndex: number; question: Question; startTime: number }) => void) {
    this.socket?.on("question:started", (data) => {
      console.log("📥 question:started event received:", data);
      callback(data);
    });
  }

  onAnswerSubmitted(callback: (data: { sessionId: string; questionIndex: number; playerSocketId: string; isCorrect: boolean; timeTaken: number }) => void) {
    this.socket?.on("answer:submitted", (data) => {
      console.log("📥 answer:submitted event received:", data);
      callback(data);
    });
  }

  onGameEnded(callback: (data: { sessionId: string; endTime: number }) => void) {
    this.socket?.on("game:ended", (data) => {
      console.log("📥 game:ended event received:", data);
      callback(data);
    });
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket?.on("error", (error) => {
      console.error("📥 error event received:", error);
      callback(error);
    });
  }

  // ========== CLEANUP LISTENERS ==========

  offPlayerJoined() {
    this.socket?.off("player:joined");
  }

  offGameState() {
    this.socket?.off("game:state");
  }

  offGameStarted() {
    this.socket?.off("game:started");
  }

  offQuestionStarted() {
    this.socket?.off("question:started");
  }

  offAnswerSubmitted() {
    this.socket?.off("answer:submitted");
  }

  offGameEnded() {
    this.socket?.off("game:ended");
  }

  offError() {
    this.socket?.off("error");
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();
