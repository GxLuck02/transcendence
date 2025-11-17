/**
 * Rock-Paper-Scissors Game Client
 * Handles RPS game logic and matchmaking
 */

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'win' | 'lose' | 'draw';

interface RPSMatch {
  id: number;
  player1: number;
  player2: number;
  player1_choice: RPSChoice | null;
  player2_choice: RPSChoice | null;
  winner: number | null;
  status: 'waiting' | 'completed';
  created_at: string;
}

interface MatchmakingResponse {
  matchFound: boolean;
  match?: RPSMatch;
  queue?: any;
}

interface PlayMoveResponse {
  completed: boolean;
  result?: RPSMatch;
  match?: RPSMatch;
}

export class RPSGame {
  private readonly baseURL: string = 'https://localhost:8443/api';
  private currentMatch: RPSMatch | null = null;
  private matchCheckInterval: number | null = null;
  private myChoice: RPSChoice | null = null;

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  public async joinMatchmaking(): Promise<MatchmakingResponse> {
    const response = await fetch(`${this.baseURL}/rps/matchmaking/join/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join matchmaking');
    }

    const data = await response.json();

    if (data.match) {
      // Match found
      this.currentMatch = data.match as RPSMatch;
      return { matchFound: true, match: data.match };
    } else {
      // Waiting for opponent
      return { matchFound: false, queue: data.queue };
    }
  }

  public async leaveMatchmaking(): Promise<any> {
    const response = await fetch(`${this.baseURL}/rps/matchmaking/leave/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to leave matchmaking');
    }

    return await response.json();
  }

  public async getMatchmakingStatus(): Promise<any> {
    const response = await fetch(`${this.baseURL}/rps/matchmaking/status/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get matchmaking status');
    }

    return await response.json();
  }

  public async getMatch(matchId: number): Promise<RPSMatch> {
    const response = await fetch(`${this.baseURL}/rps/matches/${matchId}/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get match details');
    }

    const match = (await response.json()) as RPSMatch;
    this.currentMatch = match;
    return match;
  }

  public async playMove(matchId: number, choice: RPSChoice): Promise<PlayMoveResponse> {
    this.myChoice = choice;

    const response = await fetch(`${this.baseURL}/rps/matches/${matchId}/play/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ choice }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to play move');
    }

    const data = await response.json();

    if (data.result) {
      // Match completed
      this.currentMatch = data.result as RPSMatch;
      return { completed: true, result: data.result };
    } else {
      // Waiting for opponent
      this.currentMatch = data.match as RPSMatch;
      return { completed: false, match: data.match };
    }
  }

  public async getHistory(limit: number = 10): Promise<RPSMatch[]> {
    const response = await fetch(`${this.baseURL}/rps/history/?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get match history');
    }

    return (await response.json()) as RPSMatch[];
  }

  public async getStats(): Promise<any> {
    const response = await fetch(`${this.baseURL}/rps/stats/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get stats');
    }

    return await response.json();
  }

  public startMatchChecking(callback: (match: RPSMatch) => void): void {
    this.matchCheckInterval = window.setInterval(async () => {
      if (!this.currentMatch) return;

      try {
        const match = await this.getMatch(this.currentMatch.id);
        if (callback) {
          callback(match);
        }
      } catch (error) {
        console.error('Error checking match:', error);
      }
    }, 2000); // Check every 2 seconds
  }

  public stopMatchChecking(): void {
    if (this.matchCheckInterval !== null) {
      clearInterval(this.matchCheckInterval);
      this.matchCheckInterval = null;
    }
  }

  public reset(): void {
    this.stopMatchChecking();
    this.currentMatch = null;
    this.myChoice = null;
  }

  public getChoiceEmoji(choice: RPSChoice | null): string {
    switch (choice) {
      case 'rock':
        return '🪨';
      case 'paper':
        return '📄';
      case 'scissors':
        return '✂️';
      default:
        return '?';
    }
  }

  public getResultText(result: string, winnerId: number | null, currentUserId: number): string {
    if (result === 'draw') {
      return 'Égalité !';
    } else if (winnerId === currentUserId) {
      return 'Vous avez gagné !';
    } else {
      return 'Vous avez perdu !';
    }
  }

  public getCurrentMatch(): RPSMatch | null {
    return this.currentMatch;
  }

  public getMyChoice(): RPSChoice | null {
    return this.myChoice;
  }
}

// Export singleton instance
export const rpsGame = new RPSGame();

console.log('✅ RPS game client loaded (TypeScript)');
