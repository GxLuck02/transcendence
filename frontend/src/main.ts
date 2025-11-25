/**
 * Main entry point for ft_transcendence
 * SPA Router with TypeScript
 */

import { authService } from './services/auth.service';
import {
  chatClient,
  ChatClient,
  fetchConversations,
  fetchDirectMessages,
  sendDirectMessage,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './services/chat.service';
import { PongGame } from './games/pong';
import { RemotePongGame } from './games/pong-remote';
import { rpsGame } from './games/rps';
import { tournamentManager } from './services/tournament.service';
import type { User } from './types';

type LocalParticipant = {
  id: number;
  alias: string;
  eliminated: boolean;
};

type LocalTournamentMatch = {
  id: number;
  round: number;
  player1: LocalParticipant;
  player2: LocalParticipant | null;
  winner: LocalParticipant | null;
  status: 'pending' | 'completed' | 'bye';
};

class Router {
  private routes: Record<string, () => void>;
  private currentChatClient: any = null;
  private currentPongGame: any = null;
  private matchmakingInterval: number | null = null;
  private pongMatchmakingInterval: number | null = null;
  private apiBaseUrl: string = 'https://localhost:8443/api';
  private pendingInviteRoomCode: string | null = null;
  private activeConversationUserId: number | null = null;
  private blockedUserIds: Set<number> = new Set();
  private remoteMatchInfo: { roomCode: string; matchId?: number; opponent?: { display_name?: string; username?: string } } | null = null;
  private isInPongQueue: boolean = false;
  private activeConversationDisplayName: string | null = null;

  constructor() {
    this.routes = {
      '/': this.homePage.bind(this),
      '/login': this.loginPage.bind(this),
      '/register': this.registerPage.bind(this),
      '/game/pong': this.pongPage.bind(this),
      '/game/pong/matchmaking': this.pongMatchmakingPage.bind(this),
      '/game/pong/remote': this.pongRemotePage.bind(this),
      '/game/rps': this.rpsPage.bind(this),
      '/chat': this.chatPage.bind(this),
      '/profile': this.profilePage.bind(this),
      '/tournament': this.tournamentPage.bind(this),
      '/stats': this.statsPage.bind(this),
    };

    this.init();
  }

  private init(): void {
    // Handle OAuth callback tokens
    this.handleOAuthCallback();

    // Handle link clicks
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-route]')) {
        e.preventDefault();
        const route = target.getAttribute('data-route') || target.getAttribute('href') || '/';
        this.navigateTo(route);
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.loadRoute();
    });

    // Load initial route
    this.loadRoute();
  }

  private async handleOAuthCallback(): Promise<void> {
    // Check for OAuth tokens in URL query parameters
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      console.log('OAuth tokens detected, processing authentication...');

      try {
        // Save tokens using private method (we need to add a public method)
        // For now, we'll save directly to localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Fetch current user info
        const response = await fetch(`${this.apiBaseUrl}/users/me/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          localStorage.setItem('current_user', JSON.stringify(user));

          // Reload authService to pick up the new tokens
          (authService as any).accessToken = accessToken;
          (authService as any).refreshToken = refreshToken;
          (authService as any).currentUser = user;

          console.log('✅ OAuth authentication successful:', user);

          // Clean up URL by removing query parameters
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Show success message
          setTimeout(() => {
            alert(`Bienvenue ${user.display_name} ! Vous êtes connecté via OAuth.`);
          }, 100);
        } else {
          console.error('Failed to fetch user info after OAuth');
          // Clean up invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        // Clean up on error
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }

  public navigateTo(route: string): void {
    history.pushState(null, '', route);
    this.loadRoute();
  }

  private loadRoute(): void {
    const path = window.location.pathname;
    const handler = this.routes[path] || this.notFound.bind(this);

    // Cleanup previous page resources
    this.cleanup();

    // Update active link in navigation
    document.querySelectorAll('#main-nav a').forEach((link) => {
      link.classList.remove('active');
      const linkRoute = link.getAttribute('data-route') || link.getAttribute('href');
      if (linkRoute === path) {
        link.classList.add('active');
      }
    });

    // Load page content
    handler();
  }

  private cleanup(): void {
    // Cleanup chat client if exists
    if (this.currentChatClient) {
      this.currentChatClient.cleanup();
      this.currentChatClient = null;
    }

    // Cleanup pong game if exists
    if (this.currentPongGame) {
      if (this.currentPongGame.destroy) {
        this.currentPongGame.destroy();
      } else if (this.currentPongGame.stop) {
        this.currentPongGame.stop();
      }
      this.currentPongGame = null;
    }

    // Clear matchmaking interval if exists
    if (this.matchmakingInterval !== null) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
    }

    if (this.pongMatchmakingInterval !== null) {
      clearInterval(this.pongMatchmakingInterval);
      this.pongMatchmakingInterval = null;
    }

    if (this.isInPongQueue) {
      void this.leavePongMatchmakingQueue(true);
    }

    this.pendingInviteRoomCode = null;
    this.activeConversationUserId = null;
    this.remoteMatchInfo = null;

    // Cleanup RPS game
    rpsGame.reset();
  }

  private async apiRequest(path: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('Authentification requise');
    }

    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...options,
      headers,
    });

    authService.handleUnauthorizedResponse(response);
    if (!response.ok) {
      let message = 'Erreur serveur';
      try {
        const payload = await response.json();
        if (typeof payload === 'string') {
          message = payload;
        } else if (payload.error) {
          message = payload.error;
        } else {
          message = Object.values(payload)[0] as string;
        }
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  // Utility method to load external scripts dynamically
  static async loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.type = 'module';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Pages
  private homePage(): void {
    const content = document.getElementById('content');
    if (!content) return;

    const user = authService.currentUser;
    const greeting = user ? `Bienvenue, ${user.display_name || user.username} !` : 'Bienvenue sur ft_transcendence';

    content.innerHTML = `
      <div class="home">
        <h2>${greeting}</h2>
        <p>Le meilleur site de tournoi Pong en ligne !</p>

        <div style="margin-top: 2rem;">
          <h3>Modules implémentés :</h3>
          <ul style="list-style: none; padding: 1rem;">
            <li>✅ <strong>Frontend</strong> : SPA 100% TypeScript avec router maison</li>
            <li>✅ <strong>Docker + HTTPS</strong> : Nginx, certificats et WebSocket sécurisés</li>
            <li>✅ <strong>Base de données</strong> : SQLite conformément au sujet</li>
            <li>✅ <strong>User Management</strong> : Auth JWT + profils + stats</li>
            <li>✅ <strong>Pong</strong> : local, IA multi niveaux et remote WebSocket</li>
            <li>✅ <strong>Tournois</strong> : saisie d’alias & bracket dynamique</li>
            <li>✅ <strong>Live Chat</strong> : global, MP, blocages, invitations</li>
            <li>✅ <strong>Jeu supplémentaire</strong> : Pierre-Feuille-Ciseaux avec matchmaking</li>
            <li>✅ <strong>Blockchain</strong> : Scores signés sur Avalanche (testnet)</li>
          </ul>
        </div>

        <div class="home-actions" style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          ${!authService.isAuthenticated() ? `
            <a href="/login" data-route="/login" class="btn btn-primary">Se connecter</a>
            <a href="/register" data-route="/register" class="btn btn-secondary">S'inscrire</a>
          ` : `
            <a href="/game/pong" data-route="/game/pong" class="btn btn-primary">Jouer au Pong</a>
            <a href="/game/rps" data-route="/game/rps" class="btn btn-primary">Pierre-Feuille-Ciseaux</a>
            <a href="/tournament" data-route="/tournament" class="btn btn-secondary">Tournoi</a>
            <a href="/profile" data-route="/profile" class="btn btn-secondary">Mon profil</a>
          `}
        </div>
      </div>
    `;
  }

  private loginPage(): void {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="auth-container">
        <h2>Connexion</h2>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input type="password" id="password" name="password" required>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Se connecter</button>
          </div>
          <div class="form-footer">
            <p>Pas encore de compte ? <a href="/register" data-route="/register">S'inscrire</a></p>
          </div>
          <div id="error-message" class="error-message"></div>
        </form>

        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="text-align: center; margin-bottom: 1rem; color: #888;">Ou se connecter avec :</p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <a href="/api/auth/oauth/42/" class="btn" style="background: #00babc; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; display: inline-block;">
              Se connecter avec 42
            </a>
            <a href="/api/auth/oauth/github/" class="btn" style="background: #333; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; display: inline-block;">
              Se connecter avec GitHub
            </a>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('login-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      const errorDiv = document.getElementById('error-message');

      try {
        await authService.login(username, password);
        this.navigateTo('/');
      } catch (error) {
        if (errorDiv) {
          errorDiv.textContent = (error as Error).message;
          errorDiv.style.display = 'block';
        }
      }
    });
  }

  private registerPage(): void {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="auth-container">
        <h2>Inscription</h2>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <input type="text" id="username" name="username" required minlength="3">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="display_name">Nom d'affichage</label>
            <input type="text" id="display_name" name="display_name" required>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input type="password" id="password" name="password" required minlength="8">
          </div>
          <div class="form-group">
            <label for="password_confirm">Confirmer le mot de passe</label>
            <input type="password" id="password_confirm" name="password_confirm" required>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">S'inscrire</button>
          </div>
          <div class="form-footer">
            <p>Déjà un compte ? <a href="/login" data-route="/login">Se connecter</a></p>
          </div>
          <div id="error-message" class="error-message"></div>
        </form>
      </div>
    `;

    const form = document.getElementById('register-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const displayName = formData.get('display_name') as string;
      const password = formData.get('password') as string;
      const passwordConfirm = formData.get('password_confirm') as string;
      const errorDiv = document.getElementById('error-message');

      try {
        await authService.register(username, email, displayName, password, passwordConfirm);
        this.navigateTo('/');
      } catch (error) {
        if (errorDiv) {
          errorDiv.textContent = (error as Error).message;
          errorDiv.style.display = 'block';
        }
      }
    });
  }

  private pongPage(): void {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="game-page">
        <h2>🏓 Pong</h2>

        <div class="game-mode-selector">
          <h3>Choisissez un mode de jeu :</h3>
          <div class="mode-buttons">
            <button id="mode-local" class="btn btn-primary">2 Joueurs (Local)</button>
            <button id="mode-ai-easy" class="btn btn-secondary">vs IA (Facile)</button>
            <button id="mode-ai-medium" class="btn btn-secondary">vs IA (Moyen)</button>
            <button id="mode-ai-hard" class="btn btn-secondary">vs IA (Difficile)</button>
            <button id="mode-remote" class="btn btn-success">Multijoueur en ligne</button>
          </div>
        </div>

        <div id="game-container" style="display: none; text-align: center; margin-top: 2rem;">
          <canvas id="pongCanvas" width="800" height="600" style="border: 2px solid #00d4ff; background: #000;"></canvas>
          <div style="margin-top: 1rem;">
            <button id="back-to-modes" class="btn btn-secondary">Retour aux modes</button>
          </div>
        </div>
      </div>
    `;

    // Event listeners for game modes
    document.getElementById('mode-local')?.addEventListener('click', () => {
      this.startPongGame('2p_local');
    });

    document.getElementById('mode-ai-easy')?.addEventListener('click', () => {
      this.startPongGame('vs_ai', 'easy');
    });

    document.getElementById('mode-ai-medium')?.addEventListener('click', () => {
      this.startPongGame('vs_ai', 'medium');
    });

    document.getElementById('mode-ai-hard')?.addEventListener('click', () => {
      this.startPongGame('vs_ai', 'hard');
    });

    document.getElementById('mode-remote')?.addEventListener('click', () => {
      this.navigateTo('/game/pong/matchmaking');
    });

    document.getElementById('back-to-modes')?.addEventListener('click', () => {
      if (this.currentPongGame) {
        this.currentPongGame.stop();
        this.currentPongGame = null;
      }
      (document.querySelector('.game-mode-selector') as HTMLElement)!.style.display = 'block';
      document.getElementById('game-container')!.style.display = 'none';
    });
  }

  private renderRemoteGamePage(focus: 'matchmaking' | 'manual'): void {
    if (!authService.isAuthenticated()) {
      this.navigateTo('/login');
      return;
    }

    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="game-page">
        <h2>Multijoueur Pong en ligne</h2>
        <p>Trouvez un adversaire via le matchmaking officiel ou rejoignez un salon en entrant le code partagé par un ami.</p>

        <div class="remote-layout" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
          <section id="remote-queue" class="card" style="${focus === 'matchmaking' ? 'border: 2px solid #00d4ff;' : ''}">
            <h3>Matchmaking officiel</h3>
            <p>Un salon sécurisé est créé automatiquement dès qu'un second joueur est disponible.</p>
            <div id="queue-status" class="panel muted">Vous n'êtes pas dans la file.</div>
            <div id="queue-match-found" style="display: none; margin-top: 1rem;">
              <div id="queue-match-details" style="margin-bottom: 0.5rem;"></div>
              <button id="start-remote-match" class="btn btn-success">Lancer la partie</button>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
              <button id="join-pong-queue" class="btn btn-primary">Rejoindre la file</button>
              <button id="cancel-pong-queue" class="btn btn-secondary" disabled>Quitter</button>
            </div>
          </section>

          <section id="remote-manual" class="card" style="${focus === 'manual' ? 'border: 2px solid #00d4ff;' : ''}">
            <h3>Rejoindre via code d'invitation</h3>
            <form id="remote-room-form" class="auth-form" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <input type="text" id="remote-room-code" placeholder="Code de la salle (ex: ABC123)" style="flex: 1; min-width: 180px;" required />
              <button type="submit" class="btn btn-primary">Rejoindre</button>
            </form>
            <p style="margin-top: 0.5rem; color: #888;">Vous recevez ce code lorsqu'un ami vous invite via le chat.</p>
          </section>
        </div>

        <section id="remote-game-section" class="card" style="margin-top: 2rem; display: none;">
          <h3>Salon de jeu</h3>
          <div id="remote-game-info" class="panel muted">Aucun salon actif.</div>
          <canvas id="remotePongCanvas" width="800" height="500" style="border: 2px solid #00d4ff; background: #000; border-radius: 8px; margin-top: 1rem;"></canvas>
          <div style="margin-top: 1rem; display: flex; gap: 1rem;">
            <button id="leave-remote-game" class="btn btn-secondary">Quitter la partie</button>
          </div>
        </section>
      </div>
    `;

    this.setupRemoteGameHandlers();

    if (focus === 'manual' && this.pendingInviteRoomCode) {
      const input = document.getElementById('remote-room-code') as HTMLInputElement | null;
      if (input) {
        input.value = this.pendingInviteRoomCode;
        this.launchRemoteGame(this.pendingInviteRoomCode);
        this.pendingInviteRoomCode = null;
      }
    } else if (this.pendingInviteRoomCode) {
      // Focus sur matchmaking mais un code est disponible
      this.launchRemoteGame(this.pendingInviteRoomCode);
      this.pendingInviteRoomCode = null;
    }
  }

  private setupRemoteGameHandlers(): void {
    document.getElementById('join-pong-queue')?.addEventListener('click', () => {
      void this.joinPongMatchmakingQueue();
    });

    document.getElementById('cancel-pong-queue')?.addEventListener('click', () => {
      void this.leavePongMatchmakingQueue();
    });

    document.getElementById('start-remote-match')?.addEventListener('click', () => {
      if (this.remoteMatchInfo) {
        this.launchRemoteGame(this.remoteMatchInfo.roomCode);
      }
    });

    const roomForm = document.getElementById('remote-room-form') as HTMLFormElement | null;
    const roomInput = document.getElementById('remote-room-code') as HTMLInputElement | null;
    roomForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!roomInput) return;
      const code = roomInput.value.trim();
      if (!code) return;
      this.launchRemoteGame(code);
    });

    document.getElementById('leave-remote-game')?.addEventListener('click', () => {
      this.stopRemoteGame();
    });
  }

  private async joinPongMatchmakingQueue(): Promise<void> {
    if (this.isInPongQueue) {
      this.renderQueueState('waiting', 'Déjà dans la file...');
      return;
    }

    try {
      const result = await this.apiRequest('/pong/matchmaking/join/', {
        method: 'POST',
      });

      this.isInPongQueue = true;
      this.renderQueueState('waiting', 'Recherche d’un adversaire...');

      if (result.status === 'matched') {
        this.isInPongQueue = false;
        this.remoteMatchInfo = {
          roomCode: result.room_code,
          matchId: result.match_id,
          opponent: result.opponent,
        };
        this.showMatchFound();
        return;
      }

      this.startPongMatchmakingPolling();
    } catch (error) {
      this.renderQueueState('error', (error as Error).message);
    }
  }

  private startPongMatchmakingPolling(): void {
    if (this.pongMatchmakingInterval !== null) {
      clearInterval(this.pongMatchmakingInterval);
    }

    this.pongMatchmakingInterval = window.setInterval(async () => {
      try {
        const status = await this.apiRequest('/pong/matchmaking/status/');
        if (status.status === 'matched') {
          if (this.pongMatchmakingInterval !== null) {
            clearInterval(this.pongMatchmakingInterval);
            this.pongMatchmakingInterval = null;
          }
          this.isInPongQueue = false;
          this.remoteMatchInfo = {
            roomCode: status.room_code,
            matchId: status.match_id,
            opponent: status.opponent,
          };
          this.showMatchFound();
        }
      } catch (error) {
        console.error('Matchmaking polling error:', error);
        if (this.pongMatchmakingInterval !== null) {
          clearInterval(this.pongMatchmakingInterval);
          this.pongMatchmakingInterval = null;
        }
        this.renderQueueState('error', 'Perte de connexion au matchmaking.');
      }
    }, 2500);
  }

  private async leavePongMatchmakingQueue(silent: boolean = false): Promise<void> {
    if (!this.isInPongQueue) {
      if (!silent) {
        this.renderQueueState('idle', 'Vous n’êtes pas dans la file.');
      }
      return;
    }

    try {
      await this.apiRequest('/pong/matchmaking/leave/', {
        method: 'POST',
      });
    } catch (error) {
      if (!silent) {
        this.renderQueueState('error', (error as Error).message);
      }
      return;
    } finally {
      this.isInPongQueue = false;
      if (this.pongMatchmakingInterval !== null) {
        clearInterval(this.pongMatchmakingInterval);
        this.pongMatchmakingInterval = null;
      }
    }

    if (!silent) {
      this.renderQueueState('idle', 'Vous avez quitté la file.');
    } else {
      this.renderQueueState('idle');
    }
  }

  private showMatchFound(): void {
    const panel = document.getElementById('queue-match-found');
    const details = document.getElementById('queue-match-details');
    const opponentName =
      this.remoteMatchInfo?.opponent?.display_name ||
      this.remoteMatchInfo?.opponent?.username ||
      'Adversaire inconnu';

    if (details && this.remoteMatchInfo) {
      details.innerHTML = `
        <p>Adversaire : <strong>${opponentName}</strong></p>
        <p>Code de salon : <code>${this.remoteMatchInfo.roomCode}</code></p>
      `;
    }

    if (panel) {
      panel.style.display = 'block';
    }

    this.renderQueueState('matched', 'Salon créé ! Lancez la partie quand vous êtes prêts.');
  }

  private renderQueueState(state: 'idle' | 'waiting' | 'matched' | 'error', message?: string): void {
    const statusBox = document.getElementById('queue-status');
    const joinBtn = document.getElementById('join-pong-queue') as HTMLButtonElement | null;
    const cancelBtn = document.getElementById('cancel-pong-queue') as HTMLButtonElement | null;

    if (statusBox) {
      let color = '#00d4ff';
      if (state === 'waiting') color = '#ffaa00';
      if (state === 'matched') color = '#4caf50';
      if (state === 'error') color = '#ff4d4f';

      statusBox.textContent =
        message ||
        (state === 'idle'
          ? 'Vous n’êtes pas dans la file.'
          : state === 'waiting'
            ? 'Recherche d’un adversaire...'
            : state === 'matched'
              ? 'Salon prêt.'
              : 'Une erreur est survenue.');
      statusBox.setAttribute('style', `color: ${color};`);
    }

    if (joinBtn) {
      joinBtn.disabled = state === 'waiting' || state === 'matched';
    }

    if (cancelBtn) {
      cancelBtn.disabled = !this.isInPongQueue;
    }

    if (state !== 'matched') {
      const panel = document.getElementById('queue-match-found');
      if (panel) panel.style.display = 'none';
    }
  }

  private launchRemoteGame(roomCode: string): void {
    const normalized = roomCode.trim();
    if (!normalized) {
      this.renderQueueState('error', 'Code de salle invalide.');
      return;
    }

    const section = document.getElementById('remote-game-section');
    const infoBox = document.getElementById('remote-game-info');
    const canvas = document.getElementById('remotePongCanvas') as HTMLCanvasElement | null;

    if (!section || !infoBox || !canvas) return;

    section.style.display = 'block';
    infoBox.textContent = `Connexion au salon ${normalized}...`;

    if (this.currentPongGame) {
      if (this.currentPongGame.destroy) {
        this.currentPongGame.destroy();
      } else if (this.currentPongGame.stop) {
        this.currentPongGame.stop();
      }
      this.currentPongGame = null;
    }

    this.currentPongGame = new RemotePongGame(canvas.id, {
      roomCode: normalized,
      onConnectionEstablished: (playerNumber, isHost) => {
        infoBox.textContent = `Connecté en tant que joueur ${playerNumber} (${isHost ? 'hôte' : 'invité'}). En attente d'un adversaire...`;
      },
      onPlayerJoined: (displayName) => {
        infoBox.textContent = `Adversaire connecté : ${displayName}. La partie démarre dès que les deux joueurs sont prêts.`;
      },
      onMatchReady: () => {
        infoBox.textContent = 'Match prêt ! Préparez-vous.';
      },
      onOpponentDisconnect: () => {
        infoBox.textContent = 'Votre adversaire s’est déconnecté.';
      },
      onGameOver: (result) => {
        infoBox.textContent = `Partie terminée. Gagnant : ${result.winner}`;
      },
    });
  }

  private stopRemoteGame(): void {
    const section = document.getElementById('remote-game-section');
    const infoBox = document.getElementById('remote-game-info');

    if (this.currentPongGame) {
      if (this.currentPongGame.destroy) {
        this.currentPongGame.destroy();
      } else if (this.currentPongGame.stop) {
        this.currentPongGame.stop();
      }
      this.currentPongGame = null;
    }

    if (section) {
      section.style.display = 'none';
    }

    if (infoBox) {
      infoBox.textContent = 'Aucun salon actif.';
    }
  }


  private startPongGame(mode: 'vs_local' | '2p_local' | 'vs_ai' | '2p_remote', difficulty?: 'easy' | 'medium' | 'hard'): void {
    // Hide mode selector, show game
    (document.querySelector('.game-mode-selector') as HTMLElement)!.style.display = 'none';
    document.getElementById('game-container')!.style.display = 'block';

    // Stop previous game if exists
    if (this.currentPongGame) {
      this.currentPongGame.stop();
    }

    // Create new game
    this.currentPongGame = new PongGame('pongCanvas', {
      gameMode: mode,
      aiDifficulty: difficulty,
      onGameOver: (result) => {
        alert(`${result.winner} a gagné ! Score: ${result.player1Score} - ${result.player2Score}`);
      }
    });

    this.currentPongGame.start();
  }

  private pongMatchmakingPage(): void {
    this.renderRemoteGamePage('matchmaking');
  }

  private pongRemotePage(): void {
    this.renderRemoteGamePage('manual');
  }

  private rpsPage(): void {
    if (!authService.isAuthenticated()) {
      this.navigateTo('/login');
      return;
    }

    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="game-page">
        <h2>✊✋✌️ Pierre-Feuille-Ciseaux</h2>

        <div id="rps-matchmaking" class="rps-section">
          <h3>Matchmaking</h3>
          <p>Trouvez un adversaire pour jouer !</p>
          <button id="rps-join-matchmaking" class="btn btn-primary">Rejoindre le matchmaking</button>
        </div>

        <div id="rps-waiting" class="rps-section" style="display: none;">
          <h3>⏳ Recherche d'adversaire...</h3>
          <p>En attente d'un autre joueur...</p>
          <button id="rps-cancel-matchmaking" class="btn btn-secondary">Annuler</button>
        </div>

        <div id="rps-game" class="rps-section" style="display: none;">
          <h3>🎮 Match en cours</h3>
          <p>Faites votre choix :</p>
          <div class="rps-choices" style="display: flex; gap: 1rem; justify-content: center; margin: 2rem 0;">
            <button id="choice-rock" class="btn btn-primary" style="font-size: 2rem; padding: 1rem 2rem;">🪨 Pierre</button>
            <button id="choice-paper" class="btn btn-primary" style="font-size: 2rem; padding: 1rem 2rem;">📄 Feuille</button>
            <button id="choice-scissors" class="btn btn-primary" style="font-size: 2rem; padding: 1rem 2rem;">✂️ Ciseaux</button>
          </div>
          <div id="rps-choice-made" style="display: none;">
            <p style="font-size: 1.5rem;">Vous avez choisi : <span id="my-choice"></span></p>
            <p>En attente du choix de l'adversaire...</p>
          </div>
        </div>

        <div id="rps-result" class="rps-section" style="display: none;">
          <h3>🏆 Résultat</h3>
          <div id="result-content" style="margin: 2rem 0;"></div>
          <button id="rps-play-again" class="btn btn-primary">Rejouer</button>
          <button id="rps-back-home" class="btn btn-secondary">Retour à l'accueil</button>
        </div>

        <div id="rps-stats" style="margin-top: 3rem;">
          <h3>📊 Statistiques</h3>
          <div id="stats-content">
            <p>Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    `;

    this.initRPSHandlers();
    this.loadRPSStats();
  }

  private initRPSHandlers(): void {
    // Join matchmaking
    document.getElementById('rps-join-matchmaking')?.addEventListener('click', async () => {
      await this.joinRPSMatchmaking();
    });

    // Cancel matchmaking
    document.getElementById('rps-cancel-matchmaking')?.addEventListener('click', async () => {
      try {
        await rpsGame.leaveMatchmaking();
        this.showRPSSection('matchmaking');
      } catch (error) {
        console.error('Failed to leave matchmaking:', error);
        alert('Erreur lors de l\'annulation');
      }
    });

    // Rock choice
    document.getElementById('choice-rock')?.addEventListener('click', () => {
      this.makeRPSChoice('rock');
    });

    // Paper choice
    document.getElementById('choice-paper')?.addEventListener('click', () => {
      this.makeRPSChoice('paper');
    });

    // Scissors choice
    document.getElementById('choice-scissors')?.addEventListener('click', () => {
      this.makeRPSChoice('scissors');
    });

    // Play again
    document.getElementById('rps-play-again')?.addEventListener('click', async () => {
      rpsGame.reset();
      await this.joinRPSMatchmaking();
    });

    // Back home
    document.getElementById('rps-back-home')?.addEventListener('click', () => {
      rpsGame.reset();
      this.navigateTo('/');
    });
  }

  private showRPSSection(section: 'matchmaking' | 'waiting' | 'game' | 'result'): void {
    const sections = ['rps-matchmaking', 'rps-waiting', 'rps-game', 'rps-result'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = id === `rps-${section}` ? 'block' : 'none';
      }
    });
  }

  private async joinRPSMatchmaking(): Promise<void> {
    try {
      this.showRPSSection('waiting');
      const result = await rpsGame.joinMatchmaking();

      if (result.matchFound && result.match) {
        // Match found immediately
        this.showRPSSection('game');
      } else {
        // Waiting for opponent - poll for match
        this.pollForRPSMatch();
      }
    } catch (error) {
      console.error('Failed to join matchmaking:', error);
      alert('Erreur lors de la connexion au matchmaking');
      this.showRPSSection('matchmaking');
    }
  }

  private pollForRPSMatch(): void {
    const intervalId = window.setInterval(async () => {
      try {
        const status = await rpsGame.getMatchmakingStatus();
        if (status.in_queue && status.match) {
          // Match found!
          clearInterval(intervalId);
          this.showRPSSection('game');
        }
      } catch (error) {
        console.error('Error polling matchmaking:', error);
        clearInterval(intervalId);
      }
    }, 2000);

    // Store interval for cleanup
    this.matchmakingInterval = intervalId;
  }

  private async makeRPSChoice(choice: 'rock' | 'paper' | 'scissors'): Promise<void> {
    const match = rpsGame.getCurrentMatch();
    if (!match) {
      alert('Aucun match en cours');
      return;
    }

    try {
      // Hide choice buttons
      const choicesDiv = document.querySelector('.rps-choices') as HTMLElement;
      if (choicesDiv) choicesDiv.style.display = 'none';

      // Show choice made
      const choiceMadeDiv = document.getElementById('rps-choice-made');
      const myChoiceSpan = document.getElementById('my-choice');
      if (choiceMadeDiv && myChoiceSpan) {
        myChoiceSpan.textContent = rpsGame.getChoiceEmoji(choice);
        choiceMadeDiv.style.display = 'block';
      }

      // Send choice to server
      const result = await rpsGame.playMove(match.id, choice);

      if (result.completed && result.result) {
        // Match completed - show result
        this.showRPSResult(result.result);
      } else {
        // Wait for opponent
        rpsGame.startMatchChecking((updatedMatch) => {
          if (updatedMatch.status === 'completed') {
            rpsGame.stopMatchChecking();
            this.showRPSResult(updatedMatch);
          }
        });
      }
    } catch (error) {
      console.error('Failed to play move:', error);
      alert('Erreur lors de l\'envoi du choix');
    }
  }

  private showRPSResult(match: any): void {
    this.showRPSSection('result');

    const resultContent = document.getElementById('result-content');
    if (!resultContent) return;

    const user = authService.currentUser;
    const userId = user?.id;

    let resultText = '';
    let resultColor = '';

    if (match.winner === null) {
      resultText = '🤝 Égalité !';
      resultColor = '#ffaa00';
    } else if (match.winner === userId) {
      resultText = '🎉 Vous avez gagné !';
      resultColor = '#00ff00';
    } else {
      resultText = '😢 Vous avez perdu !';
      resultColor = '#ff0000';
    }

    resultContent.innerHTML = `
      <div style="text-align: center;">
        <h2 style="color: ${resultColor}; font-size: 2rem;">${resultText}</h2>
        <div style="margin: 2rem 0; font-size: 3rem;">
          <span>Vous : ${rpsGame.getChoiceEmoji(rpsGame.getMyChoice())}</span>
          <span style="margin: 0 2rem;">VS</span>
          <span>Adversaire : ${rpsGame.getChoiceEmoji(match.player1 === userId ? match.player2_choice : match.player1_choice)}</span>
        </div>
      </div>
    `;

    // Reload stats
    this.loadRPSStats();
  }

  private async loadRPSStats(): Promise<void> {
    try {
      const stats = await rpsGame.getStats();
      const statsContent = document.getElementById('stats-content');
      if (!statsContent) return;

      const winRate = stats.total_matches > 0 ? ((stats.wins / stats.total_matches) * 100).toFixed(1) : '0.0';

      statsContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div style="background: rgba(0,212,255,0.1); padding: 1rem; border-radius: 8px;">
            <h4>Victoires</h4>
            <p style="font-size: 2rem; color: #00d4ff;">${stats.wins}</p>
          </div>
          <div style="background: rgba(0,212,255,0.1); padding: 1rem; border-radius: 8px;">
            <h4>Défaites</h4>
            <p style="font-size: 2rem; color: #00d4ff;">${stats.losses}</p>
          </div>
          <div style="background: rgba(0,212,255,0.1); padding: 1rem; border-radius: 8px;">
            <h4>Égalités</h4>
            <p style="font-size: 2rem; color: #00d4ff;">${stats.draws}</p>
          </div>
          <div style="background: rgba(0,212,255,0.1); padding: 1rem; border-radius: 8px;">
            <h4>Taux de victoire</h4>
            <p style="font-size: 2rem; color: #00d4ff;">${winRate}%</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load stats:', error);
      const statsContent = document.getElementById('stats-content');
      if (statsContent) {
        statsContent.innerHTML = '<p style="color: #888;">Impossible de charger les statistiques</p>';
      }
    }
  }

  private chatPage(): void {
    if (!authService.isAuthenticated()) {
      this.navigateTo('/login');
      return;
    }

    const content = document.getElementById('content');
    if (!content) return;

    const user = authService.currentUser;

    content.innerHTML = `
      <div class="chat-page">
        <div class="chat-header">
          <h2>💬 Espace de discussion</h2>
          <p>Bienvenue ${user?.display_name || user?.username}. Discutez globalement, envoyez des messages privés, bloquez des utilisateurs ou invitez vos amis à un Pong.</p>
        </div>

        <div class="chat-layout" style="display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem;">
          <aside class="chat-sidebar" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="sidebar-block">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Conversations</h3>
                <button id="chat-refresh" class="btn btn-secondary btn-small">↻</button>
              </div>
              <div id="chat-conversations" class="list-panel muted">Chargement...</div>
            </div>

            <div class="sidebar-block">
              <h3>Amis</h3>
              <div id="chat-friends" class="list-panel muted">Chargement...</div>
            </div>

            <div class="sidebar-block">
              <h3>Bloqués</h3>
              <div id="chat-blocked" class="list-panel muted">Chargement...</div>
            </div>
          </aside>

          <section class="chat-main">
            <div class="chat-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
              <button data-chat-tab="global" class="btn btn-secondary active">Chat global</button>
              <button data-chat-tab="direct" class="btn btn-secondary">Messages privés</button>
              <button data-chat-tab="notifications" class="btn btn-secondary">Notifications</button>
            </div>

            <div id="chat-panel-global" class="chat-panel">
              <div style="display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 1rem;">
                <div>
                  <div class="chat-messages" id="chat-global-messages" style="height: 360px;"></div>
                  <form id="chat-global-form" class="chat-form" style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                    <input type="text" id="chat-global-input" placeholder="Tapez votre message..." autocomplete="off" style="flex: 1;" />
                    <button type="submit" class="btn btn-primary">Envoyer</button>
                  </form>
                </div>
                <div class="chat-users-panel">
                  <h4>Utilisateurs connectés</h4>
                  <ul id="chat-global-users" class="user-list" style="max-height: 360px; overflow-y: auto;">
                    <li style="color: #888;">Connexion en cours...</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="chat-panel-direct" class="chat-panel" style="display: none;">
              <div id="chat-direct-header" class="panel muted">Sélectionnez un contact pour commencer une conversation.</div>
              <div class="chat-messages" id="chat-direct-messages" style="height: 320px; margin-top: 1rem;"></div>
              <form id="chat-direct-form" style="margin-top: 0.75rem;">
                <textarea id="chat-direct-input" rows="3" placeholder="Votre message..." style="width: 100%;"></textarea>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                  <button type="submit" class="btn btn-primary">Envoyer</button>
                  <button type="button" id="chat-direct-invite" class="btn btn-secondary" disabled>Inviter à jouer</button>
                  <button type="button" id="chat-direct-block" class="btn btn-secondary" disabled>Bloquer</button>
                </div>
              </form>
            </div>

            <div id="chat-panel-notifications" class="chat-panel" style="display: none;">
              <div style="display: flex; justify-content: flex-end; margin-bottom: 0.5rem;">
                <button id="chat-notifications-markall" class="btn btn-secondary">Tout marquer comme lu</button>
              </div>
              <div id="chat-notifications-list" class="list-panel muted">Chargement...</div>
            </div>
          </section>
        </div>
      </div>
    `;

    this.initGlobalChat();
    this.setupChatEvents();
    void this.loadChatSidebarData();
    void this.loadChatNotifications();
  }

  private initGlobalChat(): void {
    this.currentChatClient = new ChatClient();
    this.currentChatClient.init('chat-global-messages', 'chat-global-input', 'chat-global-users');
  }

  private setupChatEvents(): void {
    document.getElementById('chat-refresh')?.addEventListener('click', () => {
      void this.loadChatSidebarData();
      void this.loadChatNotifications();
    });

    document.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-chat-tab') as 'global' | 'direct' | 'notifications';
        this.switchChatTab(tab);
      });
    });

    const directForm = document.getElementById('chat-direct-form') as HTMLFormElement | null;
    const directInput = document.getElementById('chat-direct-input') as HTMLTextAreaElement | null;
    directForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!this.activeConversationUserId || !directInput) return;
      const message = directInput.value.trim();
      if (!message) return;

      try {
        await sendDirectMessage({
          recipientId: this.activeConversationUserId,
          content: message,
        });
        directInput.value = '';
        await this.selectConversation(this.activeConversationUserId, this.activeConversationDisplayName || 'Utilisateur');
      } catch (error) {
        alert((error as Error).message);
      }
    });

    document.getElementById('chat-direct-invite')?.addEventListener('click', () => {
      if (this.activeConversationUserId) {
        void this.inviteUserToPong(this.activeConversationUserId);
      }
    });

    document.getElementById('chat-direct-block')?.addEventListener('click', () => {
      if (!this.activeConversationUserId) return;
      if (this.blockedUserIds.has(this.activeConversationUserId)) {
        void this.unblockUserFromChat(this.activeConversationUserId);
      } else {
        void this.blockUserFromChat(this.activeConversationUserId);
      }
    });

    document.getElementById('chat-direct-messages')?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target && target.hasAttribute('data-join-room')) {
        const code = target.getAttribute('data-join-room');
        if (code) {
          this.handleJoinRoomFromChat(code);
        }
      }
    });

    document.getElementById('chat-notifications-markall')?.addEventListener('click', async () => {
      try {
        await markAllNotificationsRead();
        await this.loadChatNotifications();
      } catch (error) {
        alert((error as Error).message);
      }
    });
  }

  private switchChatTab(tab: 'global' | 'direct' | 'notifications'): void {
    const panels: Record<string, HTMLElement | null> = {
      global: document.getElementById('chat-panel-global'),
      direct: document.getElementById('chat-panel-direct'),
      notifications: document.getElementById('chat-panel-notifications'),
    };

    Object.entries(panels).forEach(([key, panel]) => {
      if (panel) panel.style.display = key === tab ? 'block' : 'none';
    });

    document.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-chat-tab') === tab);
    });
  }

  private async loadChatSidebarData(): Promise<void> {
    const conversationsContainer = document.getElementById('chat-conversations');
    const friendsContainer = document.getElementById('chat-friends');
    const blockedContainer = document.getElementById('chat-blocked');

    if (conversationsContainer) conversationsContainer.textContent = 'Chargement...';
    if (friendsContainer) friendsContainer.textContent = 'Chargement...';
    if (blockedContainer) blockedContainer.textContent = 'Chargement...';

    try {
      const [conversations, friends, blocked] = await Promise.all([
        fetchConversations(),
        authService.getFriends(),
        authService.getBlockedUsers(),
      ]);

      this.blockedUserIds = new Set(blocked.map((user) => user.id));
      this.renderConversationList(conversations || []);
      this.renderFriendList(friends || []);
      this.renderBlockedList(blocked || []);
    } catch (error) {
      if (conversationsContainer) {
        conversationsContainer.textContent = `Erreur: ${(error as Error).message}`;
      }
    }
  }

  private renderConversationList(conversations: any[]): void {
    const container = document.getElementById('chat-conversations');
    if (!container) return;

    if (!conversations.length) {
      container.innerHTML = '<p style="color: #888;">Pas encore de messages privés.</p>';
      return;
    }

    container.innerHTML = conversations
      .map((conversation: any) => {
        const userData = conversation.user as User;
        const unreadCount = conversation.unread_count || 0;
        const isActive = this.activeConversationUserId === userData.id;
        const lastMessage = conversation.last_message ? this.sanitizeHTML(conversation.last_message.content) : 'Aucun message';

        return `
          <button class="conversation-item ${isActive ? 'active' : ''}" data-conversation-id="${userData.id}" style="display: block; width: 100%; text-align: left;">
            <div style="display: flex; justify-content: space-between;">
              <span>${this.sanitizeHTML(userData.display_name || userData.username)}</span>
              ${unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : ''}
            </div>
            <small style="color: #888;">${lastMessage}</small>
          </button>
        `;
      })
      .join('');

    container.querySelectorAll<HTMLButtonElement>('[data-conversation-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-conversation-id'));
        const label = btn.querySelector('span')?.textContent || 'Utilisateur';
        void this.selectConversation(id, label);
      });
    });
  }

  private renderFriendList(friends: User[]): void {
    const container = document.getElementById('chat-friends');
    if (!container) return;

    if (!friends.length) {
      container.innerHTML = '<p style="color: #888;">Aucun ami enregistré.</p>';
      return;
    }

    container.innerHTML = friends
      .map(
        (friend) => `
          <div class="friend-item" data-user-id="${friend.id}" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <span>${this.sanitizeHTML(friend.display_name || friend.username)}</span>
            <button class="btn btn-secondary btn-small" data-start-conversation="${friend.id}">Discuter</button>
          </div>
        `
      )
      .join('');

    container.querySelectorAll<HTMLButtonElement>('[data-start-conversation]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-start-conversation'));
        const label = btn.closest('.friend-item')?.querySelector('span')?.textContent || 'Utilisateur';
        void this.selectConversation(id, label);
      });
    });
  }

  private renderBlockedList(blocked: User[]): void {
    const container = document.getElementById('chat-blocked');
    if (!container) return;

    if (!blocked.length) {
      container.innerHTML = '<p style="color: #888;">Aucun utilisateur bloqué.</p>';
      return;
    }

    container.innerHTML = blocked
      .map(
        (user) => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <span>${this.sanitizeHTML(user.display_name || user.username)}</span>
            <button class="btn btn-secondary btn-small" data-unblock-user="${user.id}">Débloquer</button>
          </div>
        `
      )
      .join('');

    container.querySelectorAll<HTMLButtonElement>('[data-unblock-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-unblock-user'));
        void this.unblockUserFromChat(id);
      });
    });
  }

  private async selectConversation(userId: number, label: string): Promise<void> {
    this.activeConversationUserId = userId;
    this.activeConversationDisplayName = label;
    this.switchChatTab('direct');
    this.updateDirectPanelActions();

    const header = document.getElementById('chat-direct-header');
    if (header) {
      header.innerHTML = `En conversation avec <strong>${this.sanitizeHTML(label)}</strong>`;
    }

    const messageContainer = document.getElementById('chat-direct-messages');
    if (messageContainer) {
      messageContainer.innerHTML = '<p style="color: #888;">Chargement des messages...</p>';
    }

    try {
      const messages = await fetchDirectMessages(userId);
      this.renderDirectMessages(messages || []);
      await this.loadChatSidebarData();
    } catch (error) {
      if (messageContainer) {
        messageContainer.innerHTML = `<p style="color: #ff4d4f;">${(error as Error).message}</p>`;
      }
    }
  }

  private updateDirectPanelActions(): void {
    const inviteBtn = document.getElementById('chat-direct-invite') as HTMLButtonElement | null;
    const blockBtn = document.getElementById('chat-direct-block') as HTMLButtonElement | null;
    const directForm = document.getElementById('chat-direct-form') as HTMLFormElement | null;

    const hasConversation = !!this.activeConversationUserId;
    const isBlocked = !!this.activeConversationUserId && this.blockedUserIds.has(this.activeConversationUserId);

    if (inviteBtn) inviteBtn.disabled = !hasConversation || isBlocked;
    if (blockBtn) {
      blockBtn.disabled = !hasConversation;
      blockBtn.textContent = isBlocked ? 'Débloquer' : 'Bloquer';
    }
    if (directForm) {
      directForm.classList.toggle('disabled', !hasConversation);
    }
  }

  private renderDirectMessages(messages: any[]): void {
    const container = document.getElementById('chat-direct-messages');
    if (!container) return;

    if (!messages.length) {
      container.innerHTML = '<p style="color: #888;">Aucun message pour le moment.</p>';
      return;
    }

    container.innerHTML = messages.map((message) => this.renderDirectMessage(message)).join('');
    container.scrollTop = container.scrollHeight;
  }

  private renderDirectMessage(message: any): string {
    const me = authService.currentUser;
    const isOwn = me && message.sender && me.id === message.sender.id;
    const senderName = isOwn ? 'Vous' : this.sanitizeHTML(message.sender?.display_name || message.sender?.username || 'Utilisateur');
    const timestamp = new Date(message.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const baseContent = this.sanitizeHTML(message.content || '');

    let extra = '';
    if (message.message_type === 'game_invite' && message.game_room_code) {
      extra = `
        <div style="margin-top: 0.5rem;">
          <span style="color: #00d4ff;">Invitation à une partie de Pong</span>
          <button class="btn btn-primary btn-small" data-join-room="${message.game_room_code}" style="margin-left: 0.5rem;">Rejoindre le salon</button>
        </div>
      `;
    }

    return `
      <div class="direct-message ${isOwn ? 'me' : ''}" style="margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between;">
          <strong>${senderName}</strong>
          <span style="color: #888; font-size: 0.8rem;">${timestamp}</span>
        </div>
        <div>${baseContent}</div>
        ${extra}
      </div>
    `;
  }

  private async loadChatNotifications(): Promise<void> {
    const container = document.getElementById('chat-notifications-list');
    if (!container) return;

    container.textContent = 'Chargement...';

    try {
      const notifications = await fetchNotifications();
      if (!notifications.length) {
        container.innerHTML = '<p style="color: #888;">Aucune notification.</p>';
        return;
      }

      container.innerHTML = notifications
        .map(
          (notification: any) => `
            <div class="notification-item ${notification.is_read ? 'read' : ''}" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 0;">
              <div style="display: flex; justify-content: space-between;">
                <strong>${this.sanitizeHTML(notification.title)}</strong>
                <small>${new Date(notification.created_at).toLocaleString('fr-FR')}</small>
              </div>
              <p>${this.sanitizeHTML(notification.content)}</p>
              ${!notification.is_read ? `<button class="btn btn-secondary btn-small" data-notification-read="${notification.id}">Marquer comme lu</button>` : ''}
            </div>
          `
        )
        .join('');

      container.querySelectorAll<HTMLButtonElement>('[data-notification-read]').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = Number(button.getAttribute('data-notification-read'));
          await markNotificationRead(id);
          await this.loadChatNotifications();
        });
      });
    } catch (error) {
      container.textContent = `Erreur: ${(error as Error).message}`;
    }
  }

  private async inviteUserToPong(userId: number): Promise<void> {
    try {
      const match = await this.apiRequest('/pong/matches/create/', {
        method: 'POST',
        body: JSON.stringify({
          player2_id: userId,
          game_mode: '2p_remote',
        }),
      });

      const room = await this.apiRequest('/pong/rooms/create/', {
        method: 'POST',
        body: JSON.stringify({
          match_id: match.id,
        }),
      });

      await sendDirectMessage({
        recipientId: userId,
        content: 'Je t’invite pour un match de Pong !',
        messageType: 'game_invite',
        gameInviteType: 'pong',
        gameRoomCode: room.room_code,
      });

      alert('Invitation envoyée ! Votre ami reçoit le code du salon dans la conversation.');
    } catch (error) {
      alert((error as Error).message);
    }
  }

  private async blockUserFromChat(userId: number): Promise<void> {
    try {
      await authService.blockUser(userId);
      this.blockedUserIds.add(userId);
      await this.loadChatSidebarData();
      this.updateDirectPanelActions();
      alert('Utilisateur bloqué.');
    } catch (error) {
      alert((error as Error).message);
    }
  }

  private async unblockUserFromChat(userId: number): Promise<void> {
    try {
      await authService.unblockUser(userId);
      this.blockedUserIds.delete(userId);
      await this.loadChatSidebarData();
      this.updateDirectPanelActions();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  private handleJoinRoomFromChat(roomCode: string): void {
    this.pendingInviteRoomCode = roomCode;
    this.navigateTo('/game/pong/remote');
  }

  private sanitizeHTML(text: string = ''): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private profilePage(): void {
    if (!authService.isAuthenticated()) {
      this.navigateTo('/login');
      return;
    }

    const content = document.getElementById('content');
    if (!content) return;

    const user = authService.currentUser;

    content.innerHTML = `
      <div class="profile-page">
        <h2>Profil</h2>
        <div class="profile-info">
          <p><strong>Nom d'utilisateur:</strong> ${user?.username}</p>
          <p><strong>Email:</strong> ${user?.email}</p>
          <p><strong>Nom d'affichage:</strong> ${user?.display_name}</p>
        </div>
        <button id="logout-btn" class="btn btn-danger">Se déconnecter</button>
      </div>
    `;

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', async () => {
      await authService.logout();
      this.navigateTo('/login');
    });
  }

  private tournamentPage(): void {
    const content = document.getElementById('content');
    if (!content) return;

    const defaultAlias = authService.currentUser?.display_name || authService.currentUser?.username || '';

    content.innerHTML = `
      <div class="tournament-page">
        <h2>Organisation d'un tournoi Pong</h2>
        <p>Ajoutez des joueurs en saisissant leur alias, générez un bracket et suivez l'avancement des matchs.</p>

        <div class="tournament-layout" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <section class="card">
            <h3>Inscription des joueurs</h3>
            <form id="tournament-alias-form" class="auth-form" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <input type="text" id="alias-input" placeholder="Alias du joueur" value="${defaultAlias}" style="flex: 1; min-width: 180px;" required />
              <button type="submit" class="btn btn-primary">Ajouter</button>
            </form>
            <div id="tournament-message" class="notice" style="display: none; margin-top: 0.5rem;"></div>
            <ul id="tournament-participants" class="participant-list" style="margin-top: 1rem; list-style: none; padding: 0;"></ul>
            <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
              <button id="start-tournament" class="btn btn-success">Générer le bracket</button>
              <button id="reset-tournament" class="btn btn-secondary">Réinitialiser</button>
            </div>
          </section>

          <section class="card">
            <h3>Suivi en direct</h3>
            <div id="tournament-next-match" class="panel muted">Ajoutez au moins deux joueurs pour lancer un match.</div>
            <div id="tournament-winner" class="panel success" style="display: none; margin-top: 1rem;"></div>
          </section>
        </div>

        <section class="card" style="margin-top: 2rem;">
          <h3>Bracket</h3>
          <div id="tournament-bracket" class="bracket-grid"></div>
        </section>
      </div>
    `;

    this.bindTournamentEvents();
    this.updateTournamentUI();
  }

  private bindTournamentEvents(): void {
    const form = document.getElementById('tournament-alias-form') as HTMLFormElement | null;
    const aliasInput = document.getElementById('alias-input') as HTMLInputElement | null;

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!aliasInput) return;

      const alias = aliasInput.value.trim();
      if (!alias) {
        this.displayTournamentMessage('Veuillez saisir un alias.', 'error');
        return;
      }

      try {
        tournamentManager.registerPlayer(alias);
        aliasInput.value = '';
        this.displayTournamentMessage(`${alias} rejoint la compétition.`, 'success');
        this.updateTournamentUI();
      } catch (error) {
        this.displayTournamentMessage((error as Error).message, 'error');
      }
    });

    document.getElementById('start-tournament')?.addEventListener('click', () => {
      const participants = tournamentManager.getParticipants();
      if (participants.length < 2) {
        this.displayTournamentMessage('Deux joueurs minimum sont requis.', 'error');
        return;
      }

      if (tournamentManager.hasStarted()) {
        this.displayTournamentMessage('Un bracket est déjà en cours. Réinitialisez avant de régénérer.', 'error');
        return;
      }

      tournamentManager.startTournament();
      this.displayTournamentMessage('Bracket généré ! Bonne chance aux joueurs.', 'success');
      this.updateTournamentUI();
    });

    document.getElementById('reset-tournament')?.addEventListener('click', () => {
      tournamentManager.reset();
      this.displayTournamentMessage('Tournoi réinitialisé.', 'info');
      this.updateTournamentUI();
    });
  }

  private displayTournamentMessage(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    const box = document.getElementById('tournament-message');
    if (!box) return;

    let color = '#00d4ff';
    if (type === 'error') color = '#ff4d4f';
    if (type === 'success') color = '#4caf50';

    box.textContent = message;
    box.setAttribute('style', `display: block; color: ${color}; font-weight: bold; margin-top: 0.5rem;`);
  }

  private updateTournamentUI(): void {
    this.renderParticipantList();
    this.renderTournamentBracket();
    this.renderTournamentStatus();
  }

  private renderParticipantList(): void {
    const container = document.getElementById('tournament-participants');
    const participants = tournamentManager.getParticipants() as LocalParticipant[];
    const startBtn = document.getElementById('start-tournament') as HTMLButtonElement | null;

    if (!container) return;

    if (!participants.length) {
      container.innerHTML = '<li style="color: #888;">Aucun joueur inscrit pour le moment.</li>';
    } else {
      container.innerHTML = participants
        .map(
          (participant) => `
            <li style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span>${participant.alias}</span>
              <button class="btn btn-secondary" data-remove-player="${participant.id}" aria-label="Retirer ${participant.alias}">✖</button>
            </li>
          `
        )
        .join('');
    }

    container.querySelectorAll<HTMLButtonElement>('[data-remove-player]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-remove-player'));
        tournamentManager.removePlayer(id);
        this.displayTournamentMessage('Joueur retiré du tournoi.', 'info');
        this.updateTournamentUI();
      });
    });

    if (startBtn) {
      startBtn.disabled = participants.length < 2 || tournamentManager.hasStarted();
    }
  }

  private renderTournamentBracket(): void {
    const container = document.getElementById('tournament-bracket');
    if (!container) return;

    const matches = tournamentManager.getAllMatches() as LocalTournamentMatch[];

    if (!matches.length) {
      container.innerHTML = '<p style="color: #888;">Ajoutez des joueurs puis générez le bracket pour visualiser les rencontres.</p>';
      return;
    }

    const rounds = new Map<number, LocalTournamentMatch[]>();
    matches.forEach((match) => {
      const list = rounds.get(match.round) || [];
      list.push(match);
      rounds.set(match.round, list);
    });

    const html = Array.from(rounds.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => {
        const matchesHtml = roundMatches
          .map((match) => this.renderMatchCard(match))
          .join('');
        return `
          <div class="bracket-round">
            <h4>Round ${round}</h4>
            ${matchesHtml}
          </div>
        `;
      })
      .join('');

    container.innerHTML = `<div class="bracket-rounds" style="display: grid; gap: 1rem;">${html}</div>`;

    container.querySelectorAll<HTMLButtonElement>('[data-complete-match]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const matchId = Number(btn.getAttribute('data-match-id'));
        const winnerId = Number(btn.getAttribute('data-winner-id'));
        this.finishTournamentMatch(matchId, winnerId);
      });
    });
  }

  private renderMatchCard(match: LocalTournamentMatch): string {
    const player1 = match.player1 ? match.player1.alias : '???';
    const player2 = match.player2 ? match.player2.alias : '???';
    const winner = match.winner ? match.winner.alias : null;
    const isBye = match.status === 'bye';

    const controls =
      match.status === 'pending' && match.player2
        ? `
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button class="btn btn-primary" data-complete-match data-match-id="${match.id}" data-winner-id="${match.player1.id}">${player1} gagne</button>
            <button class="btn btn-primary" data-complete-match data-match-id="${match.id}" data-winner-id="${match.player2.id}">${player2} gagne</button>
          </div>
        `
        : '';

    const status =
      winner
        ? `<span style="color: #4caf50;">Vainqueur: ${winner}</span>`
        : isBye
          ? `<span style="color: #ffaa00;">${player1} passe automatiquement au tour suivant</span>`
          : `<span style="color: #888;">En attente de résultat</span>`;

    return `
      <div class="match-card" style="border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 0.75rem;">
        <div style="display: flex; justify-content: space-between;">
          <strong>${player1}</strong>
          <span style="color: #00d4ff;">VS</span>
          <strong>${player2}</strong>
        </div>
        <div style="margin-top: 0.5rem;">${status}</div>
        ${controls}
      </div>
    `;
  }

  private finishTournamentMatch(matchId: number, winnerId: number): void {
    try {
      tournamentManager.completeMatch(matchId, winnerId);
      this.displayTournamentMessage('Match mis à jour.', 'success');
      this.updateTournamentUI();
    } catch (error) {
      this.displayTournamentMessage((error as Error).message, 'error');
    }
  }

  private renderTournamentStatus(): void {
    const nextMatchBox = document.getElementById('tournament-next-match');
    const winnerBox = document.getElementById('tournament-winner');

    if (!nextMatchBox || !winnerBox) return;

    const winner = tournamentManager.getWinner();
    if (winner) {
      nextMatchBox.textContent = 'Tous les matchs sont terminés.';
      winnerBox.style.display = 'block';
      winnerBox.textContent = `🏆 Champion : ${winner.alias}`;
      return;
    }

    winnerBox.style.display = 'none';

    const nextMatch = tournamentManager.getNextMatch() as LocalTournamentMatch | undefined;
    if (!nextMatch) {
      nextMatchBox.textContent = 'Aucun match planifié. Lancez le tournoi pour commencer.';
      return;
    }

    if (!nextMatch.player2) {
      nextMatchBox.textContent = `${nextMatch.player1.alias} bénéficie d'un passage automatique au prochain tour.`;
    } else {
      nextMatchBox.textContent = `Prochaine rencontre : ${nextMatch.player1.alias} vs ${nextMatch.player2.alias}`;
    }
  }

  private statsPage(): void {
    const content = document.getElementById('content');
    if (!content) return;

    const user = authService.currentUser;

    content.innerHTML = `
      <div class="stats-page">
        <h2>Dashboards Stats</h2>
        <div class="stats-info" style="margin-top: 2rem;">
          <div class="panel" style="background: rgba(0,212,255,0.1); padding: 2rem; border-radius: 8px; text-align: center;">
            <h3 style="color: #00d4ff; margin-bottom: 1rem;">En construction</h3>

            <!-- TODO: Intégrer le module "User and game stats dashboards" -->
            <!-- TODO: Connexion au service stats.service.ts -->
            <!-- TODO: Afficher les statistiques utilisateur depuis l'API -->
            <div id="stats-dashboard-placeholder" style="display: none;">
              <!-- Les dashboards seront rendus ici -->
            </div>
          </div>
        </div>

        <div style="margin-top: 2rem; text-align: center;">
          <a href="/" data-route="/" class="btn btn-primary">Retour à l'accueil</a>
          ${user ? `<a href="/profile" data-route="/profile" class="btn btn-secondary" style="margin-left: 1rem;">Mon profil</a>` : ''}
        </div>
      </div>
    `;
  }

  private notFound(): void {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="not-found">
        <h2>404 - Page non trouvée</h2>
        <p>La page que vous recherchez n'existe pas.</p>
        <a href="/" data-route="/" class="btn btn-primary">Retour à l'accueil</a>
      </div>
    `;
  }
}

// Initialize router
const router = new Router();

// Expose to window for debugging and compatibility
(window as any).router = router;
(window as any).authService = authService;
(window as any).chatClient = chatClient;
(window as any).ChatClient = ChatClient;
(window as any).PongGame = PongGame;
(window as any).RemotePongGame = RemotePongGame;
(window as any).rpsGame = rpsGame;
(window as any).tournamentManager = tournamentManager;

console.log('✅ ft_transcendence loaded (TypeScript)');
