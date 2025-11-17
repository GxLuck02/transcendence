/**
 * Remote Pong Game - WebSocket Multiplayer
 * Part of ft_transcendence project
 */

import { PongGame } from './pong';

interface RemotePongOptions {
  roomCode: string;
  width?: number;
  height?: number;
  maxScore?: number;
  onConnectionEstablished?: (playerNumber: number, isHost: boolean) => void;
  onPlayerJoined?: (displayName: string) => void;
  onOpponentDisconnect?: () => void;
  onMatchReady?: () => void;
  onScoreUpdate?: (scores: { player1: number; player2: number }) => void;
  onGameOver?: (result: { winner: string; player1Score: number; player2Score: number }) => void;
}

interface WSMessage {
  type: string;
  player_number?: number;
  is_host?: boolean;
  display_name?: string;
  paddleY?: number;
  ballX?: number;
  ballY?: number;
  velocityX?: number;
  velocityY?: number;
  speed?: number;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
  message?: string;
}

export class RemotePongGame extends PongGame {
  private roomCode: string;
  private wsProtocol: string;
  private wsHost: string;
  private ws: WebSocket | null = null;
  private playerNumber: number | null = null; // 1 or 2
  private isHost: boolean = false; // Player 1 is host
  private onConnectionEstablished: ((playerNumber: number, isHost: boolean) => void) | null;
  private onPlayerJoined: ((displayName: string) => void) | null;
  private onOpponentDisconnect: (() => void) | null;
  private onMatchReady: (() => void) | null;

  constructor(canvasId: string, options: RemotePongOptions) {
    super(canvasId, {
      ...options,
      gameMode: '2p_remote',
    });

    // WebSocket configuration
    this.roomCode = options.roomCode;
    this.wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    this.wsHost = window.location.host;

    // Connection callbacks
    this.onConnectionEstablished = options.onConnectionEstablished || null;
    this.onPlayerJoined = options.onPlayerJoined || null;
    this.onOpponentDisconnect = options.onOpponentDisconnect || null;
    this.onMatchReady = options.onMatchReady || null;

    // Connect to WebSocket
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const wsUrl = `${this.wsProtocol}${this.wsHost}/ws/pong/${this.roomCode}/`;
    console.log('Connecting to:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleWebSocketMessage(event);
    };

    this.ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Connection lost during game
      this.pause();
    };
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WSMessage;
      const messageType = data.type;

      switch (messageType) {
        case 'player_assigned':
          this.playerNumber = data.player_number || null;
          this.isHost = data.is_host || false;
          console.log(`Assigned as Player ${this.playerNumber}${this.isHost ? ' (Host)' : ''}`);

          if (this.onConnectionEstablished && this.playerNumber) {
            this.onConnectionEstablished(this.playerNumber, this.isHost);
          }
          break;

        case 'player_joined':
          console.log(`Player ${data.player_number} joined: ${data.display_name}`);

          // Store opponent info if it's not us
          if (data.player_number !== this.playerNumber && data.display_name) {
            if (this.onPlayerJoined) {
              this.onPlayerJoined(data.display_name);
            }
          }
          break;

        case 'game_start':
          console.log('Game starting!');
          if (this.onMatchReady) {
            this.onMatchReady();
          }
          // Start game after a short delay
          setTimeout(() => {
            this.start();
          }, 2000);
          break;

        case 'paddle_move':
          this.handleOpponentPaddleMove(data);
          break;

        case 'ball_state':
          if (!this.isHost) {
            this.handleBallStateUpdate(data);
          }
          break;

        case 'score_update':
          if (!this.isHost && data.player1Score !== undefined && data.player2Score !== undefined) {
            // Update scores - need to access protected properties
            // This is a limitation - we'll handle it differently
            console.log('Score update received:', data.player1Score, data.player2Score);
          }
          break;

        case 'game_over':
          if (!this.isHost && data.winner) {
            // This will call endGame which is protected
            // We need to handle this differently
          }
          break;

        case 'player_disconnected':
          console.log(`Player ${data.player_number} disconnected`);
          if (data.player_number !== this.playerNumber) {
            this.pause();

            if (this.onOpponentDisconnect) {
              this.onOpponentDisconnect();
            } else {
              alert('Opponent disconnected');
            }
          }
          break;

        case 'error':
          console.error('Server error:', data.message);
          alert('Error: ' + data.message);
          break;

        default:
          console.log('Unknown message type:', messageType, data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleOpponentPaddleMove(data: WSMessage): void {
    // Update opponent's paddle position
    const opponentPlayerNumber = data.player_number;
    const paddleY = data.paddleY;

    if (paddleY === undefined) return;

    // Access private properties through getState() and type casting
    // Note: This is a workaround - in production, we'd expose setters
    if (opponentPlayerNumber === 1 && this.playerNumber === 2) {
      // We are player 2, update player 1's paddle
      // @ts-ignore - accessing private property
      this.player1.y = paddleY;
    } else if (opponentPlayerNumber === 2 && this.playerNumber === 1) {
      // We are player 1, update player 2's paddle
      // @ts-ignore - accessing private property
      this.player2.y = paddleY;
    }
  }

  private handleBallStateUpdate(data: WSMessage): void {
    // Client receives ball state from host
    if (
      data.ballX !== undefined &&
      data.ballY !== undefined &&
      data.velocityX !== undefined &&
      data.velocityY !== undefined &&
      data.speed !== undefined
    ) {
      // @ts-ignore - accessing private property
      this.ball.x = data.ballX;
      // @ts-ignore - accessing private property
      this.ball.y = data.ballY;
      // @ts-ignore - accessing private property
      this.ball.velocityX = data.velocityX;
      // @ts-ignore - accessing private property
      this.ball.velocityY = data.velocityY;
      // @ts-ignore - accessing private property
      this.ball.speed = data.speed;
    }
  }

  // TODO: Implement paddle and ball state synchronization
  // These methods will be called by the game loop to sync state with server

  // Cleanup
  public destroy(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stop();
  }
}

console.log('✅ Remote Pong game loaded (TypeScript)');
