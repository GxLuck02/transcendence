// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  display_name?: string;
  online?: boolean;
}

export interface UserStats {
  wins: number;
  losses: number;
  games_played: number;
  win_rate: number;
}

export interface UserProfile extends User {
  stats?: UserStats;
  friends?: User[];
  match_history?: Match[];
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// Game Types
export interface Match {
  id: number;
  player1: User;
  player2: User;
  score1: number;
  score2: number;
  winner?: User;
  created_at: string;
  game_type: 'pong' | 'pong_remote' | 'rps';
}

export interface Tournament {
  id: number;
  name: string;
  participants: User[];
  matches: Match[];
  winner?: User;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

// Chat Types
export interface ChatMessage {
  id: number;
  sender: User;
  receiver?: User;
  content: string;
  timestamp: string;
  read: boolean;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  data: any;
  timestamp?: string;
}

// Game State Types
export interface PongGameState {
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
  };
  paddles: {
    left: { y: number; height: number; };
    right: { y: number; height: number; };
  };
  score: {
    left: number;
    right: number;
  };
  gameOver: boolean;
  winner?: 'left' | 'right';
}

export interface RPSChoice {
  player_id: number;
  choice: 'rock' | 'paper' | 'scissors';
}

export interface RPSResult {
  winner: number | null;
  player1_choice: string;
  player2_choice: string;
}

// Router Types
export interface Route {
  path: string;
  handler: () => Promise<void> | void;
  title?: string;
  requiresAuth?: boolean;
}

// Global Window Extensions
declare global {
  interface Window {
    router?: any;
    authService?: any;
    ChatClient?: any;
    currentGame?: any;
  }
}
