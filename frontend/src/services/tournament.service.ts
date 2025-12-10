/**
 * Tournament System
 * Handles tournament creation, registration, and matchmaking
 */

import { authService } from './auth.service';

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
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  player1Score?: number;
  player2Score?: number;
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
  private currentMatchId: number | null = null;
  private onMatchStart: ((match: TournamentMatch) => void) | null = null;
  private onMatchEnd: ((match: TournamentMatch) => void) | null = null;

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

  public startMatch(matchId: number): TournamentMatch | null {
    const match = this.matches.find((m) => m.id === matchId);
    if (!match || match.status !== 'pending' || !match.player2) {
      return null;
    }

    match.status = 'in_progress';
    this.currentMatchId = matchId;

    if (this.onMatchStart) {
      this.onMatchStart(match);
    }

    return match;
  }

  public getCurrentMatch(): TournamentMatch | null {
    if (this.currentMatchId === null) return null;
    return this.matches.find((m) => m.id === this.currentMatchId) || null;
  }

  public isMatchInProgress(): boolean {
    return this.currentMatchId !== null;
  }

  public setOnMatchStart(callback: ((match: TournamentMatch) => void) | null): void {
    this.onMatchStart = callback;
  }

  public setOnMatchEnd(callback: ((match: TournamentMatch) => void) | null): void {
    this.onMatchEnd = callback;
  }

  public completeMatch(matchId: number, winnerId: number, player1Score?: number, player2Score?: number): TournamentMatch {
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
    match.player1Score = player1Score;
    match.player2Score = player2Score;

    // Clear current match
    if (this.currentMatchId === matchId) {
      this.currentMatchId = null;
    }

    // Eliminate loser
    loser.eliminated = true;

    // Call onMatchEnd callback
    if (this.onMatchEnd) {
      this.onMatchEnd(match);
    }

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

  public completeMatchWithScores(matchId: number, player1Score: number, player2Score: number): TournamentMatch {
    const match = this.matches.find((m) => m.id === matchId);
    if (!match || !match.player2) {
      throw new Error('Match not found or invalid');
    }

    const winnerId = player1Score > player2Score ? match.player1.id : match.player2.id;
    return this.completeMatch(matchId, winnerId, player1Score, player2Score);
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

  /**
   * Récupère le match final (celui où le gagnant du tournoi a gagné)
   * @returns Le match final avec les scores, ou null si le tournoi n'est pas terminé
   */
  public getFinalMatch(): TournamentMatch | null {
    if (!this.winner) {
      return null;
    }

    // Trouver le match final (le dernier match où le gagnant a gagné)
    // C'est le match du dernier round où le gagnant est le winner
    const finalRound = Math.max(...this.matches.map(m => m.round));
    const winnerId = this.winner.id; // TypeScript sait maintenant que this.winner n'est pas null
    const finalMatches = this.matches.filter(m => m.round === finalRound && m.winner?.id === winnerId);
    
    // Retourner le premier match final trouvé (il ne devrait y en avoir qu'un)
    return finalMatches.length > 0 ? finalMatches[0] : null;
  }

  /**
   * Enregistre le résultat du tournoi sur la blockchain
   * @param tournamentId ID du tournoi (optionnel, généré automatiquement si non fourni)
   * @param tournamentName Nom du tournoi (optionnel)
   * @returns Promise avec le résultat de l'enregistrement
   */
  public async recordTournamentOnBlockchain(
    tournamentId?: number,
    tournamentName?: string
  ): Promise<{ success: boolean; tx_hash?: string; block_number?: number; error?: string }> {
    if (!this.winner) {
      return { success: false, error: 'Tournoi non terminé' };
    }

    const finalMatch = this.getFinalMatch();
    if (!finalMatch || finalMatch.player1Score === undefined || finalMatch.player2Score === undefined) {
      return { success: false, error: 'Match final non trouvé ou scores manquants' };
    }

    // Déterminer le score du gagnant
    const winnerScore = finalMatch.winner?.id === finalMatch.player1.id
      ? finalMatch.player1Score
      : finalMatch.player2Score;

    // Générer un ID de tournoi si non fourni (timestamp)
    const tournId = tournamentId || Math.floor(Date.now() / 1000);
    const tournName = tournamentName || `Tournament #${tournId}`;

    const token = this.getAuthToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification disponible pour l\'enregistrement blockchain');
      return { success: false, error: 'Authentification requise. Veuillez vous reconnecter.' };
    }

    try {
      console.log('📤 Envoi de la requête blockchain avec token:', token.substring(0, 20) + '...');
      const response = await fetch('https://localhost:8443/api/blockchain/tournament/record/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tournament_id: tournId,
          tournament_name: tournName,
          winner_username: this.winner.alias,
          winner_score: winnerScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('❌ Erreur API blockchain:', response.status, errorData);
        return { success: false, error: errorData.error || `Erreur HTTP ${response.status}` };
      }

      const result = await response.json();
      console.log('✅ Réponse API blockchain:', result);
      return {
        success: true,
        tx_hash: result.tx_hash,
        block_number: result.block_number,
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement sur la blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
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
    this.currentMatchId = null;
  }

  private getAuthToken(): string {
    const token = authService.getAccessToken();
    if (!token) {
      console.warn('⚠️ Aucun token d\'authentification disponible');
      return '';
    }
    return token;
  }
}

// Export singleton instance
export const tournamentManager = new TournamentManager();

console.log('✅ Tournament manager loaded (TypeScript)');
