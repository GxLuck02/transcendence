/**
 * Tournament System
 * Handles tournament creation, registration, and matchmaking
 */

interface Participant {
  id: number;
  alias: string;
  eliminated: boolean;
}

interface TournamentMatch {
  id: number;
  round: number;
  player1: Participant;
  player2: Participant | null;
  winner: Participant | null;
  status: 'pending' | 'completed' | 'bye';
}

interface Tournament {
  id: number;
  name: string;
  status: string;
  participants: Participant[];
  created_at: string;
}

type TournamentStatus = 'registration' | 'in_progress' | 'completed';

export class TournamentManager {
  private participants: Participant[] = [];
  private matches: TournamentMatch[] = [];
  private currentRound: number = 1;
  private winner: Participant | null = null;

  public async createTournament(name: string): Promise<Tournament> {
    try {
      const response = await fetch('https://localhost:8443/api/pong/tournaments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      const tournament = (await response.json()) as Tournament;
      return tournament;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  public registerPlayer(alias: string): Participant {
    if (!alias || alias.trim() === '') {
      throw new Error('Alias cannot be empty');
    }

    if (this.participants.find((p) => p.alias === alias)) {
      throw new Error('Alias already taken');
    }

    const participant: Participant = {
      id: Date.now() + Math.random(),
      alias: alias.trim(),
      eliminated: false,
    };

    this.participants.push(participant);
    return participant;
  }

  public removePlayer(participantId: number): void {
    this.participants = this.participants.filter((p) => p.id !== participantId);
  }

  public startTournament(): TournamentMatch[] {
    if (this.participants.length < 2) {
      throw new Error('Need at least 2 players to start tournament');
    }

    // Generate first round matches
    this.generateMatches();
    return this.matches;
  }

  private generateMatches(): void {
    const activePlayers = this.participants.filter((p) => !p.eliminated);

    if (activePlayers.length < 2) {
      return;
    }

    // Shuffle players for random matchmaking
    const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);

    // Create matches (pair players)
    const roundMatches: TournamentMatch[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      roundMatches.push({
        id: Date.now() + Math.random(),
        round: this.currentRound,
        player1: shuffled[i],
        player2: shuffled[i + 1],
        winner: null,
        status: 'pending',
      });
    }

    // If odd number of players, last player gets a bye
    if (shuffled.length % 2 === 1) {
      roundMatches.push({
        id: Date.now() + Math.random(),
        round: this.currentRound,
        player1: shuffled[shuffled.length - 1],
        player2: null,
        winner: shuffled[shuffled.length - 1],
        status: 'bye',
      });
    }

    this.matches.push(...roundMatches);
  }

  public getNextMatch(): TournamentMatch | undefined {
    return this.matches.find((m) => m.status === 'pending');
  }

  public completeMatch(matchId: number, winnerId: number): TournamentMatch {
    const match = this.matches.find((m) => m.id === matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (!match.player2) {
      throw new Error('Invalid match: missing player2');
    }

    const winner = winnerId === match.player1.id ? match.player1 : match.player2;
    const loser = winnerId === match.player1.id ? match.player2 : match.player1;

    match.winner = winner;
    match.status = 'completed';

    // Eliminate loser
    loser.eliminated = true;

    // Check if round is complete
    const roundMatches = this.matches.filter((m) => m.round === this.currentRound);
    const allCompleted = roundMatches.every((m) => m.status === 'completed' || m.status === 'bye');

    if (allCompleted) {
      const remainingPlayers = this.participants.filter((p) => !p.eliminated);

      if (remainingPlayers.length > 1) {
        // Start next round
        this.currentRound++;
        this.generateMatches();
      } else if (remainingPlayers.length === 1) {
        // Tournament complete
        this.winner = remainingPlayers[0];
      }
    }

    return match;
  }

  public getCurrentRoundMatches(): TournamentMatch[] {
    return this.matches.filter((m) => m.round === this.currentRound);
  }

  public getAllMatches(): TournamentMatch[] {
    return this.matches;
  }

  public getTournamentStatus(): TournamentStatus {
    const remainingPlayers = this.participants.filter((p) => !p.eliminated);

    if (this.matches.length === 0) {
      return 'registration';
    } else if (remainingPlayers.length > 1) {
      return 'in_progress';
    } else if (remainingPlayers.length === 1) {
      return 'completed';
    }

    return 'registration';
  }

  public getWinner(): Participant | null {
    return this.winner;
  }

  public getParticipants(): Participant[] {
    return this.participants;
  }

  public getCurrentRound(): number {
    return this.currentRound;
  }

  public hasStarted(): boolean {
    return this.matches.length > 0;
  }

  public reset(): void {
    this.participants = [];
    this.matches = [];
    this.currentRound = 1;
    this.winner = null;
  }

  private getAuthToken(): string {
    return localStorage.getItem('access_token') || '';
  }
}

// Export singleton instance
export const tournamentManager = new TournamentManager();

console.log('✅ Tournament manager loaded (TypeScript)');
