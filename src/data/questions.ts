export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: 'tech' | 'general' | 'party';
  difficulty: 0 | 1 | 2; // 0: Easy, 1: Medium, 2: Hard
  timeLimit: number; // in seconds
}

export const techQuestions: Question[] = [
  {
    id: 'tech-1',
    question: 'What does "DeFi" stand for in blockchain?',
    options: ['Decentralized Finance', 'Digital Finance', 'Distributed Files', 'Data Finance'],
    correctAnswer: 0,
    category: 'tech',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'tech-2',
    question: 'Which consensus mechanism does Ethereum use after "The Merge"?',
    options: ['Proof of Work', 'Proof of Stake', 'Proof of Authority', 'Delegated Proof of Stake'],
    correctAnswer: 1,
    category: 'tech',
    difficulty: 1,
    timeLimit: 25
  },
  {
    id: 'tech-3',
    question: 'What is the maximum supply of Bitcoin?',
    options: ['21 million', '100 million', '50 million', 'Unlimited'],
    correctAnswer: 0,
    category: 'tech',
    difficulty: 0,
    timeLimit: 15
  },
  {
    id: 'tech-4',
    question: 'What programming language is primarily used for Arbitrum Stylus contracts?',
    options: ['Solidity', 'Rust', 'JavaScript', 'Python'],
    correctAnswer: 1,
    category: 'tech',
    difficulty: 1,
    timeLimit: 20
  },
  {
    id: 'tech-5',
    question: 'What is a smart contract?',
    options: [
      'A legal document',
      'Self-executing code on blockchain',
      'A mobile app',
      'A type of cryptocurrency'
    ],
    correctAnswer: 1,
    category: 'tech',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'tech-6',
    question: 'What is gas in Ethereum?',
    options: [
      'A type of token',
      'Fee for transactions',
      'Storage space',
      'Network speed'
    ],
    correctAnswer: 1,
    category: 'tech',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'tech-7',
    question: 'What Layer 2 solution is Arbitrum?',
    options: ['Optimistic Rollup', 'ZK Rollup', 'Sidechain', 'State Channel'],
    correctAnswer: 0,
    category: 'tech',
    difficulty: 1,
    timeLimit: 25
  },
  {
    id: 'tech-8',
    question: 'What is the native token of Arbitrum?',
    options: ['ARB', 'ETH', 'ARBI', 'There is none'],
    correctAnswer: 0,
    category: 'tech',
    difficulty: 1,
    timeLimit: 20
  },
  {
    id: 'tech-9',
    question: 'What does NFT stand for?',
    options: [
      'Non-Fungible Token',
      'New Financial Technology',
      'Network File Transfer',
      'Native Function Type'
    ],
    correctAnswer: 0,
    category: 'tech',
    difficulty: 0,
    timeLimit: 15
  },
  {
    id: 'tech-10',
    question: 'Which of these is NOT a Web3 wallet?',
    options: ['MetaMask', 'Rainbow', 'PayPal', 'WalletConnect'],
    correctAnswer: 2,
    category: 'tech',
    difficulty: 0,
    timeLimit: 20
  }
];

export const generalQuestions: Question[] = [
  {
    id: 'gen-1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    category: 'general',
    difficulty: 0,
    timeLimit: 15
  },
  {
    id: 'gen-2',
    question: 'Who painted the Mona Lisa?',
    options: ['Van Gogh', 'Leonardo da Vinci', 'Picasso', 'Michelangelo'],
    correctAnswer: 1,
    category: 'general',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'gen-3',
    question: 'What is the largest planet in our solar system?',
    options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'],
    correctAnswer: 2,
    category: 'general',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'gen-4',
    question: 'In what year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: 2,
    category: 'general',
    difficulty: 1,
    timeLimit: 25
  },
  {
    id: 'gen-5',
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    category: 'general',
    difficulty: 1,
    timeLimit: 20
  },
  {
    id: 'gen-6',
    question: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    category: 'general',
    difficulty: 0,
    timeLimit: 15
  },
  {
    id: 'gen-7',
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correctAnswer: 1,
    category: 'general',
    difficulty: 1,
    timeLimit: 25
  },
  {
    id: 'gen-8',
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'],
    correctAnswer: 1,
    category: 'general',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'gen-9',
    question: 'What is the speed of light?',
    options: ['299,792 km/s', '150,000 km/s', '1,000,000 km/s', '500,000 km/s'],
    correctAnswer: 0,
    category: 'general',
    difficulty: 2,
    timeLimit: 30
  },
  {
    id: 'gen-10',
    question: 'Which ocean is the largest?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctAnswer: 3,
    category: 'general',
    difficulty: 0,
    timeLimit: 15
  }
];

export const partyQuestions: Question[] = [
  {
    id: 'party-1',
    question: 'What is the most popular pizza topping worldwide?',
    options: ['Mushrooms', 'Pepperoni', 'Pineapple', 'Olives'],
    correctAnswer: 1,
    category: 'party',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'party-2',
    question: 'Which social media platform has the most users?',
    options: ['Twitter', 'Instagram', 'Facebook', 'TikTok'],
    correctAnswer: 2,
    category: 'party',
    difficulty: 0,
    timeLimit: 20
  },
  {
    id: 'party-3',
    question: 'What percentage of people are left-handed?',
    options: ['5%', '10%', '15%', '20%'],
    correctAnswer: 1,
    category: 'party',
    difficulty: 1,
    timeLimit: 25
  },
  {
    id: 'party-4',
    question: 'What is the most common birthday month?',
    options: ['January', 'September', 'June', 'December'],
    correctAnswer: 1,
    category: 'party',
    difficulty: 1,
    timeLimit: 25
  },
  {
    id: 'party-5',
    question: 'How many minutes does the average person spend on social media per day?',
    options: ['30 minutes', '90 minutes', '145 minutes', '200 minutes'],
    correctAnswer: 2,
    category: 'party',
    difficulty: 2,
    timeLimit: 30
  }
];

export const getAllQuestions = () => [...techQuestions, ...generalQuestions, ...partyQuestions];

export const getQuestionsByCategory = (category: 'tech' | 'general' | 'party') => {
  switch (category) {
    case 'tech':
      return techQuestions;
    case 'general':
      return generalQuestions;
    case 'party':
      return partyQuestions;
    default:
      return [];
  }
};

export const getRandomQuestions = (count: number, category?: 'tech' | 'general' | 'party') => {
  const pool = category ? getQuestionsByCategory(category) : getAllQuestions();
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};