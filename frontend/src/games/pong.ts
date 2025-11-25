/**
 * Pong Game - TypeScript implementation
 * Part of ft_transcendence project
 */

interface Ball {
  x: number;
  y: number;
  radius: number;
  speed: number;
  velocityX: number;
  velocityY: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  speed: number;
  upPressed: boolean;
  downPressed: boolean;
}

interface PongGameOptions {
  width?: number;
  height?: number;
  gameMode?: 'vs_local' | '2p_local' | 'vs_ai' | '2p_remote';
  matchId?: number | null;
  maxScore?: number;
  onScoreUpdate?: (scores: { player1: number; player2: number }) => void;
  onGameOver?: (result: { winner: string; player1Score: number; player2Score: number }) => void;
}

interface GameState {
  player1Score: number;
  player2Score: number;
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  winner: string | null;
}

export class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private gameMode: string;
  private ball: Ball;
  private paddleHeight: number;
  private paddleWidth: number;
  private player1: Paddle;
  private player2: Paddle;
  private running: boolean = false;
  private paused: boolean = false;
  private gameOver: boolean = false;
  private winner: string | null = null;
  private maxScore: number;
  private aiReactionSpeed: number = 0.05;
  private onScoreUpdate: ((scores: { player1: number; player2: number }) => void) | null;
  private onGameOver: ((result: { winner: string; player1Score: number; player2Score: number }) => void) | null;
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;

  constructor(canvasId: string, options: PongGameOptions = {}) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    this.canvas = canvas;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;

    // Game settings
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game mode
    this.gameMode = options.gameMode || '2p_local';

    // Ball
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      radius: 10,
      speed: 5,
      velocityX: 5,
      velocityY: 5,
    };

    // Paddles
    this.paddleHeight = 100;
    this.paddleWidth = 10;
    this.player1 = {
      x: 0,
      y: this.height / 2 - this.paddleHeight / 2,
      width: this.paddleWidth,
      height: this.paddleHeight,
      score: 0,
      speed: 8,
      upPressed: false,
      downPressed: false,
    };

    this.player2 = {
      x: this.width - this.paddleWidth,
      y: this.height / 2 - this.paddleHeight / 2,
      width: this.paddleWidth,
      height: this.paddleHeight,
      score: 0,
      speed: 8,
      upPressed: false,
      downPressed: false,
    };

    // Game state
    this.maxScore = options.maxScore || 11;

    // Callbacks
    this.onScoreUpdate = options.onScoreUpdate || null;
    this.onGameOver = options.onGameOver || null;

    // Setup controls
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    this.setupControls();

    // Start game loop
    this.gameLoop();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'w':
        this.player1.upPressed = true;
        break;
      case 's':
        this.player1.downPressed = true;
        break;
      case 'arrowup':
        e.preventDefault();
        this.player2.upPressed = true;
        break;
      case 'arrowdown':
        e.preventDefault();
        this.player2.downPressed = true;
        break;
      case ' ':
        e.preventDefault();
        this.togglePause();
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'w':
        this.player1.upPressed = false;
        break;
      case 's':
        this.player1.downPressed = false;
        break;
      case 'arrowup':
        this.player2.upPressed = false;
        break;
      case 'arrowdown':
        this.player2.downPressed = false;
        break;
    }
  }

  private setupControls(): void {
    // Player 1 controls: W/S
    // Player 2 controls: Arrow Up/Down
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  public start(): void {
    this.running = true;
    this.paused = false;
    this.resetBall();
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  public togglePause(): void {
    if (this.gameOver) return;
    this.paused = !this.paused;
  }

  public stop(): void {
    this.running = false;
    // Cleanup event listeners
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
  }

  private resetBall(): void {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;

    // Random initial direction
    const angle = Math.random() * Math.PI / 2 - Math.PI / 4;
    const direction = Math.random() > 0.5 ? 1 : -1;

    this.ball.velocityX = direction * this.ball.speed * Math.cos(angle);
    this.ball.velocityY = this.ball.speed * Math.sin(angle);
  }

  private updatePaddles(): void {
    // Player 1
    if (this.player1.upPressed && this.player1.y > 0) {
      this.player1.y -= this.player1.speed;
    }
    if (this.player1.downPressed && this.player1.y < this.height - this.player1.height) {
      this.player1.y += this.player1.speed;
    }

    // Player 2 (or AI)
    if (this.gameMode === 'vs_ai') {
      this.updateAI();
    } else {
      if (this.player2.upPressed && this.player2.y > 0) {
        this.player2.y -= this.player2.speed;
      }
      if (this.player2.downPressed && this.player2.y < this.height - this.player2.height) {
        this.player2.y += this.player2.speed;
      }
    }
  }

  private updateAI(): void {
    // AI follows ball's Y position
    const paddleCenter = this.player2.y + this.player2.height / 2;
    const targetY = this.ball.y;

    // Only move if ball is moving towards AI
    if (this.ball.velocityX > 0) {
      if (paddleCenter < targetY - 35) {
        this.player2.y += this.player2.speed * this.aiReactionSpeed * 100;
      } else if (paddleCenter > targetY + 35) {
        this.player2.y -= this.player2.speed * this.aiReactionSpeed * 100;
      }
    }

    // Clamp AI paddle position
    if (this.player2.y < 0) this.player2.y = 0;
    if (this.player2.y > this.height - this.player2.height) {
      this.player2.y = this.height - this.player2.height;
    }
  }

  private updateBall(): void {
    // Move ball
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    // Top and bottom wall collision
    if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.height) {
      this.ball.velocityY *= -1;
    }

    // Paddle collision
    const player = this.ball.x < this.width / 2 ? this.player1 : this.player2;

    if (this.collision(this.ball, player)) {
      // Calculate where ball hit the paddle
      const collidePoint = this.ball.y - (player.y + player.height / 2);
      const collisionAngle = (collidePoint / (player.height / 2)) * (Math.PI / 4);

      // Change ball direction
      const direction = this.ball.x < this.width / 2 ? 1 : -1;
      this.ball.velocityX = direction * this.ball.speed * Math.cos(collisionAngle);
      this.ball.velocityY = this.ball.speed * Math.sin(collisionAngle);

      // Increase speed slightly
      this.ball.speed += 0.1;
    }

    // Score
    if (this.ball.x - this.ball.radius < 0) {
      // Player 2 scores
      this.player2.score++;
      this.onScore('player2');
    } else if (this.ball.x + this.ball.radius > this.width) {
      // Player 1 scores
      this.player1.score++;
      this.onScore('player1');
    }
  }

  private collision(ball: Ball, player: Paddle): boolean {
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;

    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;

    return (
      ballRight > playerLeft &&
      ballLeft < playerRight &&
      ballBottom > playerTop &&
      ballTop < playerBottom
    );
  }

  private onScore(_scorer: string): void {
    // Reset ball
    this.resetBall();
    this.ball.speed = 5; // Reset speed

    // Check for game over
    if (this.player1.score >= this.maxScore) {
      this.endGame('player1');
    } else if (this.player2.score >= this.maxScore) {
      this.endGame('player2');
    }

    // Callback
    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        player1: this.player1.score,
        player2: this.player2.score,
      });
    }
  }

  private endGame(winner: string): void {
    this.gameOver = true;
    this.running = false;
    this.winner = winner;

    if (this.onGameOver) {
      this.onGameOver({
        winner: winner,
        player1Score: this.player1.score,
        player2Score: this.player2.score,
      });
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw center line
    this.ctx.strokeStyle = '#FFF';
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 0);
    this.ctx.lineTo(this.width / 2, this.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw paddles
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(this.player1.x, this.player1.y, this.player1.width, this.player1.height);
    this.ctx.fillRect(this.player2.x, this.player2.y, this.player2.width, this.player2.height);

    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFF';
    this.ctx.fill();
    this.ctx.closePath();

    // Draw scores
    this.ctx.font = '48px monospace';
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillText(this.player1.score.toString(), this.width / 4, 60);
    this.ctx.fillText(this.player2.score.toString(), (3 * this.width) / 4, 60);

    // Draw pause message
    if (this.paused) {
      this.ctx.font = '32px monospace';
      this.ctx.fillStyle = '#FFF';
      const text = 'PAUSED';
      const textWidth = this.ctx.measureText(text).width;
      this.ctx.fillText(text, (this.width - textWidth) / 2, this.height / 2);
    }

    // Draw game over message
    if (this.gameOver && this.winner) {
      this.ctx.font = '48px monospace';
      this.ctx.fillStyle = '#0F0';
      const text = `${this.winner.toUpperCase()} WINS!`;
      const textWidth = this.ctx.measureText(text).width;
      this.ctx.fillText(text, (this.width - textWidth) / 2, this.height / 2);
    }

    // Draw controls hint
    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#888';
    this.ctx.fillText('P1: W/S | P2: ↑/↓ | SPACE: Pause', 10, this.height - 10);
  }

  private update(): void {
    if (!this.running || this.paused || this.gameOver) {
      return;
    }

    this.updatePaddles();
    this.updateBall();
  }

  private gameLoop(): void {
    this.update();
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  public getState(): GameState {
    return {
      player1Score: this.player1.score,
      player2Score: this.player2.score,
      running: this.running,
      paused: this.paused,
      gameOver: this.gameOver,
      winner: this.winner,
    };
  }
}

console.log('✅ Pong game loaded (TypeScript)');
