import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Question } from '../data/questions';
import { getRandomQuestions } from '../data/questions';
import { TRIVIA_CONTRACT_ADDRESS, TRIVIA_CONTRACT_ABI } from '../contracts/TriviaChain';
import { socketService } from '../services/socket';

interface GameSession {
  sessionId: string;
  roomCode: string;
  isHost: boolean;
  playerCount: number;
  maxPlayers: number;
}

interface GamePlayProps {
  account: string;
  gameSession: GameSession;
  onGameEnd: (winner: string) => void;
  onBack: () => void;
}


export const GamePlay: React.FC<GamePlayProps> = ({
  account,
  gameSession,
  onGameEnd,
  onBack,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [scores, setScores] = useState<{ [address: string]: number }>({});
  const [gamePhase, setGamePhase] = useState<'waiting' | 'playing' | 'review' | 'ended'>('waiting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerAnswers, setPlayerAnswers] = useState<{
    questionIndex: number;
    selectedAnswer: number;
    isCorrect: boolean;
    pointsEarned: number;
    timeTaken: number;
  }[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [totalGameTime, setTotalGameTime] = useState<number>(0);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  // Blockchain hooks for final score submission
  const { writeContract: writeScore, data: scoreHash, isPending: isScorePending, error: scoreError } = useWriteContract();
  const { isLoading: isScoreConfirming, isSuccess: isScoreSuccess } = useWaitForTransactionReceipt({
    hash: scoreHash,
  });

  // Blockchain hooks for ending session
  const { writeContract: writeEndSession, data: endHash, isPending: isEndPending, error: endError } = useWriteContract();
  const { isLoading: isEndConfirming, isSuccess: isEndSuccess } = useWaitForTransactionReceipt({
    hash: endHash,
  });

  // Initialize questions when component mounts
  useEffect(() => {
    // Try to get shared questions from localStorage first
    const sharedQuestionsKey = `game_${gameSession.roomCode}_questions`;
    const storedQuestions = localStorage.getItem(sharedQuestionsKey);

    if (storedQuestions) {
      try {
        const parsedQuestions = JSON.parse(storedQuestions);
        console.log('Using shared questions from localStorage:', parsedQuestions.length);
        setQuestions(parsedQuestions);
      } catch (error) {
        console.error('Error parsing shared questions:', error);
        // Fallback to random questions
        const storedQuestionCount = localStorage.getItem(`game_${gameSession.roomCode}_questionCount`);
        const questionCount = storedQuestionCount ? parseInt(storedQuestionCount, 10) : 10;
        console.log(`Using fallback: generating ${questionCount} questions`);
        const gameQuestions = getRandomQuestions(questionCount);
        setQuestions(gameQuestions);
      }
    } else {
      // If no shared questions, generate random ones (fallback)
      console.log('No shared questions found, generating random ones');
      const storedQuestionCount = localStorage.getItem(`game_${gameSession.roomCode}_questionCount`);
      const questionCount = storedQuestionCount ? parseInt(storedQuestionCount, 10) : 10;
      console.log(`Using second fallback: generating ${questionCount} questions`);
      const gameQuestions = getRandomQuestions(questionCount);
      setQuestions(gameQuestions);
    }
  }, [gameSession.roomCode]);

  // Initialize game state - wait for proper initialization
  useEffect(() => {
    // Don't auto-start; wait for the game phase to be set properly
    console.log('GamePlay mounted, waiting for questions to load...');
    if (questions.length > 0) {
      setGamePhase('playing');
      setCurrentQuestionIndex(0);
      const firstQuestion = questions[0];
      setTimeLeft(firstQuestion.timeLimit);
      setQuestionStartTime(Date.now()); // Set start time for first question
      setGameStartTime(Date.now()); // Set start time for entire game

      // Calculate total game time (sum of all question time limits)
      const totalTime = questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0);
      setTotalGameTime(totalTime);
      console.log(`🕐 Total game time: ${totalTime} seconds for ${questions.length} questions`);
    }
  }, [questions]);

  // Socket integration: Listen for real-time gameplay events
  useEffect(() => {
    console.log('🔌 GamePlay: Setting up socket listeners');

    // Listen for other players submitting answers (for live leaderboard)
    socketService.onAnswerSubmitted((data) => {
      const { playerSocketId, isCorrect, questionIndex, timeTaken } = data;

      console.log('📥 Answer submitted by another player:', {
        playerSocketId,
        isCorrect,
        questionIndex,
        timeTaken
      });

      // You could update a live leaderboard here
      // For now, just show a notification
      if (isCorrect) {
        toast.success(`Another player got question ${questionIndex + 1} correct!`, {
          duration: 2000,
          icon: '🎯'
        });
      }
    });

    // Listen for game ended event from host
    socketService.onGameEnded((data) => {
      console.log('📥 Game ended event received:', data);
      toast.info('Host has ended the game!');

      // Trigger local end game
      setTimeout(() => {
        localEndGame();
      }, 1000);
    });

    // Cleanup listeners on unmount
    return () => {
      console.log('🔌 GamePlay: Cleaning up socket listeners');
      socketService.offAnswerSubmitted();
      socketService.offGameEnded();
    };
  }, [gameSession.sessionId]);

  // Timer for questions - only run when actively playing, not in review mode
  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0 && !isSubmitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === 'playing' && !isSubmitting) {
      handleTimeUp();
    }
  }, [timeLeft, gamePhase, isSubmitting]);

  // Total game timer - monitors entire game duration
  useEffect(() => {
    if (gameStartTime && totalGameTime > 0 && gamePhase !== 'ended') {
      const checkTotalTime = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        const remainingTime = totalGameTime - elapsedSeconds;

        if (remainingTime <= 0 && gamePhase !== 'review' && gamePhase !== 'ended') {
          console.log('⏰ Total game time expired! Auto-transitioning to review...');
          toast.info('Time\'s up! Moving to review...', { duration: 3000 });

          // Mark all unanswered questions as missed
          const unansweredQuestions = questions
            .map((_, index) => index)
            .filter(index => !playerAnswers.some(a => a.questionIndex === index));

          if (unansweredQuestions.length > 0) {
            console.log(`📝 Marking ${unansweredQuestions.length} unanswered questions as missed`);
            setPlayerAnswers(prev => [
              ...prev,
              ...unansweredQuestions.map(index => ({
                questionIndex: index,
                selectedAnswer: -1,
                isCorrect: false,
                pointsEarned: 0,
                timeTaken: 0
              }))
            ]);
          }

          setGamePhase('review');
        }
      }, 1000);

      return () => clearInterval(checkTotalTime);
    }
  }, [gameStartTime, totalGameTime, gamePhase, questions, playerAnswers]);

  // Auto-submit final score after review delay
  useEffect(() => {
    if (gamePhase === 'review' && !hasAutoSubmitted && playerAnswers.length > 0) {
      console.log('📝 In review phase, starting auto-submit countdown...');
      toast.info('Submitting your score in 5 seconds...', { duration: 5000, id: 'auto-submit-info' });

      const autoSubmitTimer = setTimeout(() => {
        console.log('⚡ Auto-submitting final score...');
        setHasAutoSubmitted(true);
        submitAllAnswersBatch();
      }, 5000); // 5 second delay

      return () => clearTimeout(autoSubmitTimer);
    }
  }, [gamePhase, hasAutoSubmitted, playerAnswers]);

  // Handle final score transaction states
  useEffect(() => {
    if (isScorePending) {
      toast.loading('Waiting for wallet confirmation...', { id: 'batch-submit' });
    }
  }, [isScorePending]);

  useEffect(() => {
    if (isScoreConfirming) {
      toast.loading('Submitting final score on-chain...', { id: 'batch-submit' });
    }
  }, [isScoreConfirming]);

  useEffect(() => {
    if (isScoreSuccess && scoreHash) {
      toast.success(`🎉 Final score submitted successfully!`, { id: 'batch-submit', duration: 3000 });
      console.log(`✅ Final score transaction hash: ${scoreHash}`);
    }
  }, [isScoreSuccess, scoreHash]);

  useEffect(() => {
    if (scoreError) {
      console.error('❌ Score submission error:', scoreError);
      toast.error('Failed to submit final score', { id: 'batch-submit' });
    }
  }, [scoreError]);

  // Handle endSession transaction states
  useEffect(() => {
    if (isEndPending) {
      toast.loading('Waiting for wallet confirmation...', { id: 'end-game' });
    }
  }, [isEndPending]);

  useEffect(() => {
    if (isEndConfirming) {
      toast.loading('Ending game on-chain...', { id: 'end-game' });
    }
  }, [isEndConfirming]);

  useEffect(() => {
    if (isEndSuccess && endHash) {
      toast.success('Game ended on-chain!', { id: 'end-game' });
      localEndGame();
    }
  }, [isEndSuccess, endHash]);

  useEffect(() => {
    if (endError) {
      console.error('EndSession transaction error:', endError);
      toast.error(endError.message || 'Failed to end session on-chain', { id: 'end-game' });
      // Fallback to local end
      localEndGame();
    }
  }, [endError]);

  const startGame = async () => {
    if (!gameSession.isHost) return;

    try {
      // For demo purposes, just start the game locally
      toast.loading('Starting game...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Game started!');
      setGamePhase('playing');
      startNextQuestion();
    } catch (error: any) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  const startNextQuestion = () => {
    console.log(`Starting question ${currentQuestionIndex + 1} of ${questions.length}`);

    if (currentQuestionIndex >= questions.length) {
      console.log('No more questions, ending game');
      endGame();
      return;
    }

    const question = questions[currentQuestionIndex];
    if (!question) {
      console.error('Question not found at index:', currentQuestionIndex);
      return;
    }

    setTimeLeft(question.timeLimit || 30);
    setSelectedAnswer(null);
    setGamePhase('playing');

    if (gameSession.isHost) {
      console.log('Host starting question:', currentQuestionIndex);
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || isSubmitting) return;

    setIsSubmitting(true);
    const question = questions[currentQuestionIndex];

    try {
      console.log(`📝 Processing answer locally for question ${currentQuestionIndex + 1}`);
      toast.loading('Processing answer...', { id: 'submit-answer' });

      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // Calculate results locally (NO BLOCKCHAIN CALLS HERE)
      const isCorrect = selectedAnswer === question.correctAnswer;
      const pointsEarned = isCorrect ? 100 * question.difficulty : 0;
      const timeTaken = Date.now() - questionStartTime;

      console.log(`🎯 Answer ${isCorrect ? 'CORRECT' : 'INCORRECT'} - Points: ${pointsEarned}`);

      // Emit socket event for real-time updates
      console.log('📤 Emitting answer:submit to socket');
      socketService.submitAnswer(gameSession.sessionId, currentQuestionIndex, selectedAnswer, timeTaken);

      // Store this answer for batch submission later (update existing or add new)
      setPlayerAnswers(prev => {
        const existingIndex = prev.findIndex(a => a.questionIndex === currentQuestionIndex);
        const newAnswer = {
          questionIndex: currentQuestionIndex,
          selectedAnswer,
          isCorrect,
          pointsEarned,
          timeTaken
        };

        if (existingIndex >= 0) {
          // Update existing answer
          console.log(`🔄 Updating existing answer for question ${currentQuestionIndex + 1}`);
          const updated = [...prev];
          updated[existingIndex] = newAnswer;
          return updated;
        } else {
          // Add new answer
          console.log(`➕ Adding new answer for question ${currentQuestionIndex + 1}`);
          return [...prev, newAnswer];
        }
      });

      // Show result feedback
      if (isCorrect) {
        toast.success(`Correct! +${pointsEarned} points`, { id: 'submit-answer' });
      } else {
        toast.error('Incorrect answer', { id: 'submit-answer' });
      }

      // Update scores locally (recalculate total score from all answers)
      const totalScore = playerAnswers
        .filter(a => a.questionIndex !== currentQuestionIndex) // Exclude current question
        .reduce((sum, a) => sum + a.pointsEarned, 0) + pointsEarned; // Add current points

      setScores(prev => ({
        ...prev,
        [account]: totalScore
      }));

      console.log(`💯 Total score updated: ${totalScore}`);

      // Determine next action based on if this was called from review or normal play
      const isReviewing = gamePhase === 'review' || playerAnswers.length >= questions.length;

      if (isReviewing) {
        // If reviewing, go back to review phase after showing result
        console.log('🔍 Answer updated during review, returning to review phase');
        setTimeout(() => {
          setIsSubmitting(false);
          setGamePhase('review');
        }, 2000);
      } else {
        // Normal progression: move to next question or review
        const nextIndex = currentQuestionIndex + 1;
        console.log(`➡️ Moving to question ${nextIndex + 1} of ${questions.length}`);

        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
          setTimeout(() => {
            const nextQuestion = questions[nextIndex];
            setTimeLeft(nextQuestion.timeLimit || 30);
            setSelectedAnswer(null);
            setIsSubmitting(false);
            setQuestionStartTime(Date.now()); // Reset timer for next question
          }, 2000);
        } else {
          console.log('✅ All questions answered! Player can review and finish game.');
          setTimeout(() => {
            setIsSubmitting(false);
            setQuestionStartTime(Date.now()); // Reset timer for last question
            setGamePhase('review'); // Allow player to review before ending
          }, 2000);
        }
      }

    } catch (error: any) {
      console.error('❌ Error processing answer:', error);
      toast.error('Failed to process answer', { id: 'submit-answer' });
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      toast.error('Time\'s up!');

      // Record that this question was not answered (timeout)
      const timeTaken = Date.now() - questionStartTime;
      setPlayerAnswers(prev => [...prev, {
        questionIndex: currentQuestionIndex,
        selectedAnswer: -1, // -1 indicates no answer (timeout)
        isCorrect: false,
        pointsEarned: 0,
        timeTaken
      }]);

      const nextIndex = currentQuestionIndex + 1;
      console.log(`Time up! Moving to question ${nextIndex + 1} of ${questions.length}`);

      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => {
          const nextQuestion = questions[nextIndex];
          setTimeLeft(nextQuestion.timeLimit || 30);
          setSelectedAnswer(null);
        }, 2000);
      } else {
        console.log('All questions completed (time up), allowing review');
        setTimeout(() => setGamePhase('review'), 2000);
      }
    }
  };

  const endGame = async () => {
    // This function is no longer used with the new auto-submit flow
    // Keeping it for backwards compatibility with socket events
    console.log('🏁 endGame called - transitioning to review...');
    setGamePhase('review');
  };

  const submitAllAnswersBatch = async () => {
    if (playerAnswers.length === 0) {
      console.log('No answers to submit');
      return;
    }

    try {
      // Calculate total score and correct answers count
      const totalScore = playerAnswers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
      const correctCount = playerAnswers.filter(answer => answer.isCorrect).length;

      console.log(`🎯 Submitting final score: ${totalScore} points, ${correctCount}/${playerAnswers.length} correct`);
      toast.loading('Submitting your final score...', { id: 'batch-submit' });

      // Submit using the new submitFinalScore function (single transaction!)
      writeScore({
        address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
        abi: TRIVIA_CONTRACT_ABI,
        functionName: 'submitFinalScore',
        args: [
          BigInt(gameSession.sessionId),
          BigInt(totalScore),
          BigInt(correctCount),
        ],
      });

      toast.success(`✅ Final score submitted: ${totalScore} points!`, { id: 'batch-submit' });
      console.log(`✅ Final score submitted successfully with 1 transaction!`);

    } catch (error: any) {
      console.error('❌ Final score submission failed:', error);
      toast.error(`Failed to submit final score: ${error.message}`, { id: 'batch-submit' });
    }
  };

  const localEndGame = () => {
    try {
      console.log('🏠 Ending game locally...');

      // Set game phase to ended first to prevent any further interactions
      setGamePhase('ended');
      setIsSubmitting(false);

      // Clean up shared questions from localStorage
      try {
        localStorage.removeItem(`game_${gameSession.roomCode}_questions`);
        localStorage.removeItem(`game_${gameSession.roomCode}_started`);
        localStorage.removeItem(`game_${gameSession.roomCode}_questionCount`);
        console.log('✅ localStorage cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Error cleaning up localStorage:', cleanupError);
      }

      // Calculate final scores from playerAnswers
      const totalScore = playerAnswers.reduce((sum, answer) => sum + answer.pointsEarned, 0);

      // Update final scores
      setScores(prev => ({
        ...prev,
        [account]: totalScore
      }));

      // For demo purposes, determine winner locally
      const currentScores = { ...scores, [account]: totalScore };
      const sortedScores = Object.entries(currentScores).sort(([, a], [, b]) => b - a);
      const winnerAddress = sortedScores.length > 0 ? sortedScores[0][0] : account;

      console.log('🏆 Game ended with scores:', currentScores);
      console.log('🏆 Winner:', winnerAddress);

      // Notify parent component
      onGameEnd(winnerAddress);
      toast.success('Game ended!', { id: 'end-game' });

    } catch (error: any) {
      console.error('💥 Error ending game locally:', error);
      toast.error('Failed to end game properly', { id: 'end-game' });

      // Fallback: force end game
      setGamePhase('ended');
      onGameEnd(account); // Fallback winner
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors flex items-center"
        >
          ← Leave Game
        </button>
        <div className="text-white">
          <span className="font-semibold">Room Code:</span> {gameSession.roomCode} |
          <span className="font-semibold ml-2">Session ID:</span> {gameSession.sessionId}
        </div>
      </div>

      {gamePhase === 'waiting' && (
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-6">Waiting for Players</h2>

          <div className="mb-8">
            <div className="text-6xl font-mono font-bold text-yellow-400 mb-2">
              {gameSession.roomCode}
            </div>
            <p className="text-gray-300">Share this code with other players</p>
          </div>

          {gameSession.isHost && (
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Start Game
            </button>
          )}

          {!gameSession.isHost && (
            <p className="text-gray-300">Waiting for the host to start the game...</p>
          )}
        </div>
      )}

      {gamePhase === 'playing' && currentQuestion && (
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <div className="mb-6 flex justify-between items-center">
            <span className="text-white text-lg font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className={`text-2xl font-bold ${
              timeLeft <= 10 ? 'text-red-400' : 'text-green-400'
            }`}>
              {timeLeft}s
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-8 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isSubmitting && setSelectedAnswer(index)}
                disabled={isSubmitting}
                className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                  selectedAnswer === index
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 transform scale-105 shadow-lg'
                    : 'bg-gray-800/50 text-white border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
              >
                <span className="font-bold text-lg mr-3 text-blue-400">{String.fromCharCode(65 + index)}.</span>
                <span className="text-white">{option}</span>
              </button>
            ))}
          </div>

          {selectedAnswer !== null && !isSubmitting && (
            <button
              onClick={submitAnswer}
              className="mt-6 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Submit Answer
            </button>
          )}

          {isSubmitting && (
            <div className="mt-6 w-full bg-gray-700 text-gray-300 font-bold py-4 px-8 rounded-xl text-lg flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </div>
          )}
        </div>
      )}

      {gamePhase === 'review' && (
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-6">📝 Review Your Answers</h2>

          {!hasAutoSubmitted ? (
            <p className="text-gray-300 mb-4">
              Review your answers below. Your final score will be submitted automatically in a few seconds...
            </p>
          ) : isScoreSuccess ? (
            <div className="mb-6">
              <p className="text-green-400 mb-2">✅ Score submitted successfully!</p>
              {gameSession.isHost && (
                <p className="text-yellow-400">As the host, you can now end the session for all players.</p>
              )}
            </div>
          ) : (
            <p className="text-yellow-400 mb-4">⏳ Submitting your final score...</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {questions.map((_, index) => {
              const hasAnswer = playerAnswers.some(a => a.questionIndex === index);
              const answer = playerAnswers.find(a => a.questionIndex === index);
              return (
                <button
                  key={index}
                  onClick={() => {
                    console.log(`Navigating to question ${index + 1} from review mode`);
                    setCurrentQuestionIndex(index);
                    setGamePhase('playing');
                    setTimeLeft(questions[index].timeLimit || 30);
                    setQuestionStartTime(Date.now());
                    setIsSubmitting(false); // Reset submitting state
                    // Pre-select their previous answer if they had one
                    if (answer && answer.selectedAnswer !== -1) {
                      setSelectedAnswer(answer.selectedAnswer);
                    } else {
                      setSelectedAnswer(null);
                    }
                  }}
                  className={`p-4 rounded-xl font-bold transition-all ${
                    hasAnswer && answer?.isCorrect
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : hasAnswer && !answer?.isCorrect
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  Q{index + 1}
                  <br />
                  {hasAnswer ? (answer?.isCorrect ? '✅' : '❌') : '❓'}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            {!hasAutoSubmitted && (
              <>
                <button
                  onClick={() => {
                    console.log('Starting review from question 1');
                    setCurrentQuestionIndex(0);
                    setGamePhase('playing');
                    setTimeLeft(questions[0].timeLimit || 30);
                    setQuestionStartTime(Date.now());
                    setIsSubmitting(false); // Reset submitting state
                    setSelectedAnswer(playerAnswers.find(a => a.questionIndex === 0)?.selectedAnswer ?? null);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  📚 Review Questions
                </button>
                <button
                  onClick={() => {
                    setHasAutoSubmitted(true);
                    submitAllAnswersBatch();
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  🏁 Submit Now
                </button>
              </>
            )}

            {hasAutoSubmitted && isScoreSuccess && gameSession.isHost && (
              <button
                onClick={() => {
                  console.log('🎯 Host ending session on-chain...');
                  writeEndSession({
                    address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
                    abi: TRIVIA_CONTRACT_ABI,
                    functionName: "endSession",
                    args: [BigInt(gameSession.sessionId)],
                  });
                  // Also emit socket event
                  socketService.endGame(gameSession.sessionId);
                }}
                disabled={isEndPending || isEndConfirming}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEndPending || isEndConfirming ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ending Session...
                  </span>
                ) : (
                  '🔚 End Session (Host Only)'
                )}
              </button>
            )}

            {hasAutoSubmitted && isScoreSuccess && !gameSession.isHost && (
              <p className="text-gray-400 text-sm">Waiting for host to end the session...</p>
            )}
          </div>
        </div>
      )}

      {gamePhase === 'ended' && (
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10">
          <h2 className="text-4xl font-bold text-white mb-6">Game Over!</h2>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Final Scores</h3>
            <div className="space-y-2">
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([address, score], index) => (
                  <div
                    key={address}
                    className="flex justify-between items-center bg-gray-800/50 border border-gray-700 rounded-lg p-3"
                  >
                    <span className="text-white">
                      {index + 1}. {address === account ? 'You' : `${address.slice(0, 6)}...${address.slice(-4)}`}
                    </span>
                    <span className="text-yellow-400 font-bold">{score} pts</span>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={onBack}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};