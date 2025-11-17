/**
 * Main entry point for ft_transcendence
 * SPA Router with TypeScript
 */

import { authService } from './services/auth.service';
import { chatClient, ChatClient } from './services/chat.service';
import { PongGame } from './games/pong';
import { RemotePongGame } from './games/pong-remote';
import { rpsGame } from './games/rps';
import { tournamentManager } from './services/tournament.service';

class Router {
  private routes: Record<string, () => void>;
  private currentChatClient: any = null;
  private currentPongGame: any = null;
  private matchmakingInterval: number | null = null;

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
    };

    this.init();
  }

  private init(): void {
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

    // Cleanup RPS game
    rpsGame.reset();
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
            <li>✅ <strong>Backend Framework</strong>: Django REST Framework</li>
            <li>✅ <strong>Frontend</strong>: TypeScript (SPA)</li>
            <li>✅ <strong>Database</strong>: PostgreSQL</li>
            <li>✅ <strong>User Management</strong>: Authentication complète avec JWT</li>
            <li>✅ <strong>Remote Players</strong>: Multijoueur en ligne via WebSocket</li>
            <li>✅ <strong>Live Chat</strong>: Messagerie en temps réel</li>
            <li>✅ <strong>Jeu supplémentaire</strong>: Pierre-Feuille-Ciseaux avec matchmaking</li>
            <li>✅ <strong>AI Opponent</strong>: 3 niveaux de difficulté</li>
            <li>✅ <strong>Blockchain</strong>: Stockage des scores de tournois</li>
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
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="game-page">
        <h2>Matchmaking Pong</h2>
        <p>Chargement...</p>
      </div>
    `;
  }

  private pongRemotePage(): void {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="game-page">
        <h2>Pong Remote</h2>
        <p>Chargement...</p>
      </div>
    `;
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
        <h2>💬 Chat en direct</h2>
        <p>Bienvenue ${user?.display_name || user?.username} !</p>

        <div class="chat-container" style="display: grid; grid-template-columns: 1fr 250px; gap: 1rem; margin-top: 2rem;">
          <!-- Messages area -->
          <div class="chat-main">
            <div class="chat-messages" id="chat-messages" style="
              height: 400px;
              overflow-y: auto;
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(0, 212, 255, 0.3);
              border-radius: 8px;
              padding: 1rem;
              margin-bottom: 1rem;
            ">
              <!-- Messages will appear here -->
            </div>

            <form id="chat-form" class="chat-form" style="display: flex; gap: 0.5rem;">
              <input
                type="text"
                id="chat-input"
                placeholder="Tapez votre message..."
                autocomplete="off"
                style="
                  flex: 1;
                  padding: 0.75rem;
                  background: rgba(0, 0, 0, 0.5);
                  border: 1px solid rgba(0, 212, 255, 0.5);
                  border-radius: 4px;
                  color: #fff;
                "
              />
              <button type="submit" class="btn btn-primary">Envoyer</button>
            </form>
          </div>

          <!-- Users list -->
          <div class="chat-sidebar">
            <h3 style="margin-top: 0;">Utilisateurs en ligne</h3>
            <ul id="chat-users" style="
              list-style: none;
              padding: 0;
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(0, 212, 255, 0.3);
              border-radius: 8px;
              max-height: 400px;
              overflow-y: auto;
            ">
              <li style="padding: 0.5rem; color: #888;">Chargement...</li>
            </ul>
          </div>
        </div>

        <div style="margin-top: 2rem;">
          <p style="color: #888; font-size: 0.9rem;">
            ℹ️ Les messages sont envoyés en temps réel via WebSocket sécurisé (WSS)
          </p>
        </div>
      </div>
    `;

    // Initialize chat client
    this.initChatClient();
  }

  private initChatClient(): void {
    // Create new chat client instance
    this.currentChatClient = new ChatClient();

    // Initialize with DOM element IDs
    this.currentChatClient.init('chat-messages', 'chat-input', 'chat-users');
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

    content.innerHTML = `
      <div class="tournament-page">
        <h2>Tournoi</h2>
        <p>Chargement...</p>
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
