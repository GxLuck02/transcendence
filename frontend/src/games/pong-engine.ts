/**
 * Pong Game Engine - Logic and Physics
 * Part of ft_transcendence project
 */

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;

export interface Ball {
  x: number;
  y: number;
  radius: number;
  speed: number;
  velocityX: number;
  velocityY: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  speed: number;
  velocityY: number;
  upPressed: boolean;
  downPressed: boolean;
}

export interface PongGameOptions {
  width?: number;
  height?: number;
  initialBallSpeed?: number;
  maxBallSpeed?: number;
  speedIncrement?: number;
  gameMode?: 'vs_local' | '2p_local' | 'vs_ai' | '2p_remote';
  matchId?: number | null;
  maxScore?: number;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  player1Name?: string;
  player2Name?: string;
  onScoreUpdate?: (scores: { player1: number; player2: number }) => void;
  onGameOver?: (result: { winner: string; player1Score: number; player2Score: number }) => void;
}

export interface GameState {
  player1Score: number;
  player2Score: number;
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  winner: string | null;
}

export class PongGameEngine {
  public width: number;
  public height: number;
  public gameMode: string;
  public ball: Ball;
  public player1: Paddle;
  public player2: Paddle;
  public running: boolean = false;
  public paused: boolean = true;
  public gameOver: boolean = false;
  public winner: string | null = null;
  public started: boolean = false;
  public player1Name: string;
  public player2Name: string;
  public gameTime: number = 0;
  
  private initialBallSpeed: number;
  private maxBallSpeed: number;
  private speedIncrement: number;
  private paddleHeight: number;
  private paddleWidth: number;
  private maxScore: number;
  private aiDifficulty: 'easy' | 'medium' | 'hard';
  private onScoreUpdate: ((scores: { player1: number; player2: number }) => void) | null;
  private onGameOver: ((result: { winner: string; player1Score: number; player2Score: number }) => void) | null;
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;

  constructor(options: PongGameOptions = {}) {
    // Game settings
    this.width = options.width || 800;
    this.height = options.height || 600;

    // Game mode
    this.gameMode = options.gameMode || '2p_local';

    // Ball
    this.initialBallSpeed = options.initialBallSpeed || 350;
    this.maxBallSpeed = options.maxBallSpeed || 1200;
    this.speedIncrement = options.speedIncrement || 45;
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      radius: 10,
      speed: this.initialBallSpeed,
      velocityX: this.initialBallSpeed * 0.6,
      velocityY: this.initialBallSpeed * 0.2,
    };

    // Paddles
    this.paddleHeight = 90;
    this.paddleWidth = 12;
    this.player1 = {
      x: 30,
      y: VIRTUAL_HEIGHT / 2 - this.paddleHeight / 2,
      width: this.paddleWidth,
      height: this.paddleHeight,
      score: 0,
      speed: 12,
      velocityY: 0,
      upPressed: false,
      downPressed: false,
    };

    this.player2 = {
      x: VIRTUAL_WIDTH - 30 - this.paddleWidth,
      y: VIRTUAL_HEIGHT / 2 - this.paddleHeight / 2,
      width: this.paddleWidth,
      height: this.paddleHeight,
      score: 0,
      speed: 12,
      velocityY: 0,
      upPressed: false,
      downPressed: false,
    };

    // Game state
    this.maxScore = options.maxScore || 11;

    // AI settings
    this.aiDifficulty = options.aiDifficulty || 'medium';

    // Player names
    this.player1Name = options.player1Name || 'Player 1';
    this.player2Name = options.player2Name || (this.gameMode === 'vs_ai' ? `IA (${this.aiDifficulty})` : 'Player 2');

    // Callbacks
    this.onScoreUpdate = options.onScoreUpdate || null;
    this.onGameOver = options.onGameOver || null;

    // Setup controls
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    this.setupControls();
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
      case 'escape':
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
    this.paused = true;
    this.started = false;
    this.gameTime = 0;
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
    if (!this.started) {
      this.started = true;
    }
    this.paused = !this.paused;
  }

  public stop(): void {
    this.running = false;
    // Cleanup event listeners
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
  }

  private setBallDirection(directionSign: 1 | -1 = (Math.random() < 0.5 ? 1 : -1)): void {
    const maxAngle = Math.PI / 4;
    const angle = (Math.random() * maxAngle) - maxAngle / 2;
    this.ball.velocityX = directionSign * this.ball.speed * Math.cos(angle);
    this.ball.velocityY = this.ball.speed * Math.sin(angle);
  }

  public resetBall(directionSign?: 1 | -1): void {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;

    this.ball.speed = this.initialBallSpeed;
    const dir = directionSign ?? (Math.random() < 0.5 ? 1 : -1);
    this.setBallDirection(dir);
  }

  private computeVelocities(): void {
    // Player 1
    if (this.player1.upPressed) {
      this.player1.velocityY = -this.player1.speed * 60;  // 480 px/s
    } else if (this.player1.downPressed) {
      this.player1.velocityY = this.player1.speed * 60;
    } else {
      this.player1.velocityY = 0;  // Arrêt instantané
    }
    
    // Player 2 (si pas IA)
    if (this.gameMode !== 'vs_ai') {
      if (this.player2.upPressed) {
        this.player2.velocityY = -this.player2.speed * 60;
      } else if (this.player2.downPressed) {
        this.player2.velocityY = this.player2.speed * 60;
      } else {
        this.player2.velocityY = 0;
      }
    }
  }

  private updatePaddle(player: Paddle, dt: number): void {
    player.y += player.velocityY * dt;
    
    // Clamp
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > VIRTUAL_HEIGHT) {
      player.y = VIRTUAL_HEIGHT - player.height;
    }
  }

  private updateAI(dt: number): void {
    // AI follows ball's Y position with same speed as player
    const paddleCenter = this.player2.y + this.player2.height / 2;
    const targetY = this.ball.y;
    const deadzone = 15; // Zone where AI doesn't move (more realistic)

    // Only move if ball is moving towards AI
    if (this.ball.velocityX > 0) {
      const distanceToTarget = targetY - paddleCenter;
      
      if (Math.abs(distanceToTarget) > deadzone) {
        // Calculate AI velocity based on difficulty and player speed
        const aiSpeed = this.player2.speed * 60; // Same base speed as player
        
        // Apply difficulty modifier
        let speedMultiplier = 1.0;
        switch (this.aiDifficulty) {
          case 'easy':
            speedMultiplier = 0.6; // 60% of player speed
            break;
          case 'medium':
            speedMultiplier = 0.85; // 85% of player speed
            break;
          case 'hard':
            speedMultiplier = 1.0; // 100% of player speed
            break;
        }
        
        // Move AI paddle
        if (distanceToTarget > 0) {
          this.player2.velocityY = aiSpeed * speedMultiplier;
        } else {
          this.player2.velocityY = -aiSpeed * speedMultiplier;
        }
        
        this.player2.y += this.player2.velocityY * dt;
      } else {
        // In deadzone, stop moving
        this.player2.velocityY = 0;
      }
    } else {
      // Ball going away, center AI paddle slowly
      const centerY = VIRTUAL_HEIGHT / 2 - this.player2.height / 2;
      const distanceToCenter = centerY - this.player2.y;
      
      if (Math.abs(distanceToCenter) > 5) {
        const returnSpeed = this.player2.speed * 30; // Slow return to center
        this.player2.velocityY = distanceToCenter > 0 ? returnSpeed : -returnSpeed;
        this.player2.y += this.player2.velocityY * dt;
      } else {
        this.player2.velocityY = 0;
      }
    }

    // Clamp AI paddle position
    if (this.player2.y < 0) this.player2.y = 0;
    if (this.player2.y > this.height - this.player2.height) {
      this.player2.y = this.height - this.player2.height;
    }
  }

  private checkCollisionWithPlayer(b: Ball, player: Paddle): boolean {
    return (
      b.x - b.radius < player.x + player.width &&
      b.x + b.radius > player.x &&
      b.y + b.radius > player.y &&
      b.y - b.radius < player.y + player.height
    )
  }

  private updateBall(dt: number): void {
    const prevX = this.ball.x
    const prevY = this.ball.y
    const dx = this.ball.velocityX * dt
    const dy = this.ball.velocityY * dt
    const moveDist = Math.hypot(dx, dy)
    // choose step length relative to ball radius (smaller -> more accurate)
    const stepLen = Math.max(1, Math.floor(this.ball.radius * 0.5))
    const steps = Math.max(1, Math.ceil(moveDist / stepLen))

    let collided = false
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const nx = prevX + dx * t
      const ny = prevY + dy * t

      // top/bottom bounce
      if (ny + this.ball.radius > VIRTUAL_HEIGHT) {
        this.ball.y = VIRTUAL_HEIGHT - this.ball.radius
        this.ball.velocityY = -this.ball.velocityY
        collided = true
        break
      } else if (ny - this.ball.radius < 0) {
        this.ball.y = this.ball.radius
        this.ball.velocityY = -this.ball.velocityY
        collided = true
        break
      }

      // test collision against both paddles at this intermediate position
      const tempBall = { ...this.ball, x: nx, y: ny }
      const hitP1 = this.checkCollisionWithPlayer(tempBall, this.player1)
      const hitP2 = this.checkCollisionWithPlayer(tempBall, this.player2)
      if (hitP1 || hitP2) {
        const player = hitP1 ? this.player1 : this.player2
        const collidePoint = ny - (player.y + player.height / 2)
        const normalizedCollidePoint = collidePoint / (player.height / 2)
        const angleRad = (Math.PI / 4) * normalizedCollidePoint
        const direction: 1 | -1 = player.x < VIRTUAL_WIDTH / 2 ? 1 : -1

        // increment speed (reuse existing logic)
        if (this.ball.speed < this.maxBallSpeed / 4 * 3) {
          this.ball.speed = Math.min(this.maxBallSpeed, this.ball.speed + (this.speedIncrement * 1.5))
        }
        else if (this.ball.speed < this.maxBallSpeed) {
          this.ball.speed = Math.min(this.maxBallSpeed, this.ball.speed + this.speedIncrement)
        }
        else {
          this.ball.speed = this.maxBallSpeed
        }

        // set reflected velocity from speed and impact angle
        this.ball.velocityX = direction * this.ball.speed * Math.cos(angleRad)
        this.ball.velocityY = this.ball.speed * Math.sin(angleRad)

        // push ball out of the paddle to avoid sticking
        if (player.x < VIRTUAL_WIDTH / 2) {
          this.ball.x = player.x + player.width + this.ball.radius + 0.1
        } else {
          this.ball.x = player.x - this.ball.radius - 0.1
        }

        collided = true
        break
      }
    }

    if (!collided) {
      this.ball.x = prevX + dx
      this.ball.y = prevY + dy
    }
    
    // Score
    if (this.ball.x - this.ball.radius < 0) {
      // Player 2 scores
      this.player2.score++;
      this.onScore('player2');
    }
    else if (this.ball.x + this.ball.radius > this.width) {
      // Player 1 scores
      this.player1.score++;
      this.onScore('player1');
    }
  }

  private onScore(_scorer: string): void {
    // Reset ball
    this.resetBall();

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

  public restart(): void {
    // Reset scores
    this.player1.score = 0;
    this.player2.score = 0;
    
    // Reset game state
    this.gameOver = false;
    this.winner = null;
    this.paused = true;
    this.started = false;
    this.running = true;
    this.gameTime = 0;
    
    // Reset ball and paddles
    this.resetBall();
    this.player1.y = this.height / 2 - this.player1.height / 2;
    this.player2.y = this.height / 2 - this.player2.height / 2;
  }

  public update(dt: number): void {
    if (!this.running || this.paused || this.gameOver) return;
    
    // Update game time
    this.gameTime += dt;
    
    this.computeVelocities();
    this.updatePaddle(this.player1, dt);
    if (this.gameMode === 'vs_ai') {
      this.updateAI(dt);
    } else {
      this.updatePaddle(this.player2, dt);
    }
    this.updateBall(dt);
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
