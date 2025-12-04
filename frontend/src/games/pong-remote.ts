/**
 * Remote Pong Game - Multiplayer via WebSocket
 * Part of ft_transcendence project
 * Client is just a display - all game logic runs on server
 */

import { PongGameRenderer } from './pong-render';
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './pong-engine';

// Simplified interfaces matching server data
interface ServerBall {
  x: number;
  y: number;
  radius: number;
  speed: number;
  velocityX: number;
  velocityY: number;
}

interface ServerPaddle {
  x: number;
  y: number;
  targety : number;
  width: number;
  height: number;
  score: number;
  speed: number;
  velocityY: number;
  upPressed: boolean;
  downPressed: boolean;
}

export interface RemotePongGameOptions {
  roomCode: string;
  onConnectionEstablished?: (playerNumber: number, isHost: boolean) => void;
  onPlayerJoined?: (displayName: string) => void;
  onMatchReady?: () => void;
  onOpponentDisconnect?: () => void;
  onGameOver?: (result: { winner: string; player1Score: number; player2Score: number }) => void;
}

interface RemoteGameState {
  ball: ServerBall;
  player1: { y: number; score: number };
  player2: { y: number; score: number };
  gameTime: number;
  started: boolean;
  gameOver: boolean;
}

export class RemotePongGame {
  private ws: WebSocket | null = null;
  private renderer: PongGameRenderer;
  private roomCode: string;
  private playerNumber: number | null = null;
  private isHost: boolean = false;
  private animationFrameId: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private isDestroyed: boolean = false;
  
  // Game state (synced from server)
  private ball: ServerBall;
  private player1: ServerPaddle;
  private player2: ServerPaddle;
  private started: boolean = false;
  private gameOver: boolean = false;
  
  // Ready system
  private player1Ready: boolean = false;
  private player2Ready: boolean = false;
  private localPlayerReady: boolean = false;
  private inCountdown: boolean = false;
  
  // Player names
  private player1Name: string = 'Player 1';
  private player2Name: string = 'Player 2';
  private fakeEngine: any; // Référence au fake engine pour mise à jour
  
  // Callbacks
  private onConnectionEstablished?: (playerNumber: number, isHost: boolean) => void;
  private onPlayerJoined?: (displayName: string) => void;
  private onMatchReady?: () => void;
  private onOpponentDisconnect?: () => void;
  private onGameOver?: (result: { winner: string; player1Score: number; player2Score: number }) => void;
  
  // Input handling
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;
  private keys: { [key: string]: boolean } = {};

  constructor(canvasId: string, options: RemotePongGameOptions) {
    this.roomCode = options.roomCode;
    this.onConnectionEstablished = options.onConnectionEstablished;
    this.onPlayerJoined = options.onPlayerJoined;
    this.onMatchReady = options.onMatchReady;
    this.onOpponentDisconnect = options.onOpponentDisconnect;
    this.onGameOver = options.onGameOver;

    // Initialize game objects
    const paddleHeight = 90;
    const paddleWidth = 12;
    
    this.ball = {
      x: VIRTUAL_WIDTH / 2,
      y: VIRTUAL_HEIGHT / 2,
      radius: 10,
      speed: 350,
      velocityX: 0,
      velocityY: 0,
    };

    this.player1 = {
      x: 30,
      y: VIRTUAL_HEIGHT / 2 - paddleHeight / 2,
      targety: VIRTUAL_HEIGHT / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      score: 0,
      speed: 12,
      velocityY: 0,
      upPressed: false,
      downPressed: false,
    };

    this.player2 = {
      x: VIRTUAL_WIDTH - 30 - paddleWidth,
      y: VIRTUAL_HEIGHT / 2 - paddleHeight / 2,
      targety: VIRTUAL_HEIGHT / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      score: 0,
      speed: 12,
      velocityY: 0,
      upPressed: false,
      downPressed: false,
    };

    // Create a fake engine object for the renderer
    this.fakeEngine = {
      width: VIRTUAL_WIDTH,
      height: VIRTUAL_HEIGHT,
      ball: this.ball,
      player1: this.player1,
      player2: this.player2,
      running: true,
      started: this.started,
      gameOver: this.gameOver,
      winner: null,
      player1Name: this.player1Name,
      player2Name: this.player2Name,
      gameMode: '2p_remote',
      gameTime: 0,
    };

    this.renderer = new PongGameRenderer(canvasId, this.fakeEngine as any);

    // Setup keyboard input
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // Connect to WebSocket
    this.connectWebSocket();

    // Start render loop
    this.startRenderLoop();
  }

  private connectWebSocket(): void {
    if (this.isDestroyed) return;

    const token = localStorage.getItem('access_token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/pong/${this.roomCode}`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected to room:', this.roomCode);
      this.reconnectAttempts = 0; // Reset reconnection counter
      
      // Authenticate
      if (token) {
        this.send({
          type: 'authenticate',
          token: token,
        });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      
      if (this.isDestroyed) return;

      // Try to reconnect if not intentionally closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`⏳ Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
          this.connectWebSocket();
        }, this.reconnectDelay);
      } else {
        if (this.onOpponentDisconnect) {
          this.onOpponentDisconnect();
        }
      }
    };
  }

  private handleServerMessage(data: any): void {
    switch (data.type) {
      case 'player_assigned':
        this.playerNumber = data.player_number;
        this.isHost = data.is_host;
        console.log(`Assigned as player ${this.playerNumber} (${this.isHost ? 'host' : 'guest'})`);
        
        // Mettre à jour les noms des joueurs déjà connectés
        if (data.player1Name) {
          this.player1Name = data.player1Name;
          this.fakeEngine.player1Name = data.player1Name;
        }
        if (data.player2Name) {
          this.player2Name = data.player2Name;
          this.fakeEngine.player2Name = data.player2Name;
        }
        
        // Mettre à jour l'affichage si des noms sont disponibles
        if (data.player1Name || data.player2Name) {
          this.renderer.updatePlayerNames(this.player1Name, this.player2Name);
        }
        
        if (this.onConnectionEstablished && this.playerNumber !== null) {
          this.onConnectionEstablished(this.playerNumber, this.isHost);
        }
        break;

      case 'player_joined':
        console.log(`Player ${data.player_number} joined: ${data.display_name}`);
        
        // Mettre à jour le nom du joueur
        if (data.player_number === 1) {
          this.player1Name = data.display_name;
          this.fakeEngine.player1Name = data.display_name;
        } else if (data.player_number === 2) {
          this.player2Name = data.display_name;
          this.fakeEngine.player2Name = data.display_name;
        }
        
        // Recréer l'affichage des noms
        this.renderer.updatePlayerNames(this.player1Name, this.player2Name);
        
        if (this.onPlayerJoined && data.player_number !== this.playerNumber) {
          this.onPlayerJoined(data.display_name);
        }
        break;

      case 'game_start':
        console.log('Both players connected! Press SPACE when ready.');
        this.started = false;
        this.fakeEngine.started = false;
        this.player1Ready = false;
        this.player2Ready = false;
        this.localPlayerReady = false;
        this.renderer.showReadyScreen();
        
        setTimeout(() => {
          const canvas = this.renderer['canvas'];
          if (canvas) {
            canvas.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          }
        }, 100);
        
        if (this.onMatchReady) {
          this.onMatchReady();
        }
        break;

      case 'player_ready':
        console.log(`Player ${data.player_number} is ready!`);
        if (data.player_number === 1) {
          this.player1Ready = true;
        } else if (data.player_number === 2) {
          this.player2Ready = true;
        }
        this.renderer.updateReadyStatus(this.player1Ready, this.player2Ready);
        break;

      case 'both_players_ready':
        console.log('✅ Both players ready! Starting countdown...');
        this.player1Ready = true;
        this.player2Ready = true;
        this.inCountdown = true;
        this.renderer.hideReadyScreen();
        
        // Centrer la balle au début
        this.ball.x = VIRTUAL_WIDTH / 2;
        this.ball.y = VIRTUAL_HEIGHT / 2;
        this.ball.velocityX = 0;
        this.ball.velocityY = 0;
        
        if (data.player1Name) {
          this.player1Name = data.player1Name;
          this.fakeEngine.player1Name = data.player1Name;
        }
        if (data.player2Name) {
          this.player2Name = data.player2Name;
          this.fakeEngine.player2Name = data.player2Name;
        }
        
        this.renderer.startCountdown(10, () => {
          console.log('🎮 Countdown finished! Game starting!');
          this.started = true;
          this.fakeEngine.started = true;
          this.inCountdown = false;
        });
        break;

      case 'game_started':
        console.log('✅ Game started! Press SPACE to begin.');
        this.started = true;
        this.fakeEngine.started = true;
        break;

      case 'game_resumed':
        console.log('▶️ Game resumed!');
        this.started = true;
        this.fakeEngine.started = true;
        break;

      case 'game_paused':
        console.log('⏸️ Game paused!');
        this.started = false;
        this.fakeEngine.started = false;
        break;

      case 'game_state':
        this.updateGameState(data);
        break;

      case 'score_update':
        this.player1.score = data.player1Score;
        this.player2.score = data.player2Score;
        break;

      case 'game_over':
        this.gameOver = true;
        console.log('Game over:', data);
        
        // Mettre à jour les scores avec les valeurs finales du serveur
        if (data.player1Score !== undefined) {
          this.player1.score = data.player1Score;
        }
        if (data.player2Score !== undefined) {
          this.player2.score = data.player2Score;
        }
        
        if (data.player1Name) {
          this.player1Name = data.player1Name;
          this.fakeEngine.player1Name = data.player1Name;
        }
        if (data.player2Name) {
          this.player2Name = data.player2Name;
          this.fakeEngine.player2Name = data.player2Name;
        }
        if (data.gameTime !== undefined) {
          this.fakeEngine.gameTime = data.gameTime;
        }
        this.fakeEngine.winner = data.winner;
        this.fakeEngine.gameOver = true;
        
        if (this.onGameOver) {
          this.onGameOver({
            winner: data.winner,
            player1Score: data.player1Score,
            player2Score: data.player2Score,
          });
        }
        
        // Show game over screen avec callback restart
        this.renderer.showGameOverScreen(() => {
          // Envoyer la demande de restart au serveur
          this.send({
            type: 'restart_game',
          });
          console.log('🔄 Restart requested...');
        });
        break;

      case 'game_restart':
        console.log('🔄 Game restarting! Press SPACE when ready.');
        this.gameOver = false;
        this.fakeEngine.gameOver = false;
        this.started = false;
        this.fakeEngine.started = false;
        this.inCountdown = false;
        this.player1Ready = false;
        this.player2Ready = false;
        this.localPlayerReady = false;
        this.player1.score = 0;
        this.player2.score = 0;
        this.fakeEngine.gameTime = 0;
        
        // Centrer la balle
        this.ball.x = VIRTUAL_WIDTH / 2;
        this.ball.y = VIRTUAL_HEIGHT / 2;
        this.ball.velocityX = 0;
        this.ball.velocityY = 0;
        
        // Remove game over screen
        this.renderer.removeGameOverScreen();
        
        // Show ready screen
        this.renderer.showReadyScreen();
        break;

      case 'player_disconnected':
        console.log(`Player ${data.player_number} disconnected`);
        if (this.onOpponentDisconnect) {
          this.onOpponentDisconnect();
        }
        break;

      case 'error':
        console.error('Server error:', data.message);
        break;

      case 'auth_error':
        console.error('Authentication error:', data.message);
        break;
    }
  }

  private updateGameState(state: RemoteGameState): void {
    // Update ball with client-side prediction
    if (state.ball) {
      // Store server position for reconciliation
      const serverX = state.ball.x;
      const serverY = state.ball.y;
      
      // Check distance from server (if too far, snap to server position)
      const distanceFromServer = Math.hypot(this.ball.x - serverX, this.ball.y - serverY);
      
      if (distanceFromServer > 50) {
        // Too far from server - teleport to correct position
        this.ball.x = serverX;
        this.ball.y = serverY;
      } else if (distanceFromServer > 5) {
        // Small error - smooth correction
        const correctionFactor = 0.3;
        this.ball.x += (serverX - this.ball.x) * correctionFactor;
        this.ball.y += (serverY - this.ball.y) * correctionFactor;
      }
      // else: very close, client prediction is good, keep it
      
      // Always update velocity from server
      this.ball.velocityX = state.ball.velocityX;
      this.ball.velocityY = state.ball.velocityY;
      this.ball.speed = state.ball.speed;
    }

    // Update paddles
    if (state.player1) {
      this.player1.targety = state.player1.y;
      this.player1.score = state.player1.score;
    }

    if (state.player2) {
      this.player2.targety = state.player2.y;
      this.player2.score = state.player2.score;
    }

    // Update game state
    this.started = state.started;
    this.gameOver = state.gameOver;
    this.fakeEngine.started = state.started;
    this.fakeEngine.gameOver = state.gameOver;
    
    // Update game time from server
    if (state.gameTime !== undefined) {
      this.fakeEngine.gameTime = state.gameTime;
    }
  }

  private toggleReady(): void {
    if (this.localPlayerReady) return;
    this.localPlayerReady = true;
    this.send({
      type: 'player_ready',
    });
    console.log('✅ You are ready! Waiting for opponent...');
  }

  private handleKeyDown(e: KeyboardEvent): void {
      const key = e.key.toLowerCase();
      
      console.log(`🔑 Key down: ${key}, started: ${this.started}, inCountdown: ${this.inCountdown}, localPlayerReady: ${this.localPlayerReady}`);
      
      // Empêcher le comportement par défaut pour TOUTES les touches de jeu
      if (key === ' ' || key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
          e.preventDefault();
      }
      
      if (this.keys[key]) return;
      this.keys[key] = true;
      
      // Espace pour toggle ready (seulement si pas encore prêt)
      if (key === ' ' && !this.started && !this.localPlayerReady && !this.inCountdown) {
          console.log('🚀 Calling toggleReady()...');
          this.toggleReady();
          return;
      }
      
      // Envoyer les touches de mouvement pendant le countdown ET pendant le jeu
      if ((key === 'arrowup' || key === 'arrowdown') && this.playerNumber && (this.inCountdown || this.started)) {
          this.send({
              type: 'key_input',
              key: key,
              state: true
          });
      }
  }

  private handleKeyUp(e: KeyboardEvent): void {
      const key = e.key.toLowerCase();
      
      // Empêcher le comportement par défaut pour TOUTES les touches de jeu
      if (key === ' ' || key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
          e.preventDefault();
      }
      
      this.keys[key] = false;
      
      // Envoyer les touches de mouvement pendant le countdown ET pendant le jeu
      if ((key === 'arrowup' || key === 'arrowdown') && this.playerNumber && (this.inCountdown || this.started)) {
          this.send({
              type: 'key_input',
              key: key,
              state: false
          });
      }
  }

 
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startRenderLoop(): void {
    let lastTime = performance.now();
    
    const render = (currentTime: number) => {
      // Calculate delta time
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      // Paddles: smooth interpolation
      const lerpFactor = Math.min(deltaTime * 30, 1.0); // Adaptive
      this.player1.y += (this.player1.targety - this.player1.y) * lerpFactor;
      this.player2.y += (this.player2.targety - this.player2.y) * lerpFactor;
      
      // Ball: CLIENT-SIDE PREDICTION
      // Predict next position based on current velocity
      this.ball.x += this.ball.velocityX * deltaTime;
      this.ball.y += this.ball.velocityY * deltaTime;
      
      // Bounce on top/bottom (client-side prediction)
      if (this.ball.y + this.ball.radius > VIRTUAL_HEIGHT) {
        this.ball.y = VIRTUAL_HEIGHT - this.ball.radius;
        this.ball.velocityY = -Math.abs(this.ball.velocityY);
      } else if (this.ball.y - this.ball.radius < 0) {
        this.ball.y = this.ball.radius;
        this.ball.velocityY = Math.abs(this.ball.velocityY);
      }
      
      this.renderer.render();
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  public destroy(): void {
    // Mark as destroyed to prevent reconnection
    this.isDestroyed = true;

    // Stop render loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected'); // 1000 = normal closure
      this.ws = null;
    }

    // Remove event listeners
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);

    // Cleanup renderer
    this.renderer.cleanup();
  }
}

console.log('✅ Remote Pong game loaded (TypeScript)');
