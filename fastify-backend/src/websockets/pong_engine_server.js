/**
 * Pong Game Engine - Logic and Physics
 * Part of ft_transcendence project
 * Converted to JavaScript for Node.js/Fastify backend
 */

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;

export class PongGameEngine {
  constructor(options = {}) {
    // Game settings
    this.width = options.width || 800;
    this.height = options.height || 600;

    // Ball
    this.initialBallSpeed = options.initialBallSpeed || 350;
    this.maxBallSpeed = options.maxBallSpeed || 1200;
    this.speedIncrement = options.speedIncrement || 45;
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      radius: 11, // Slightly bigger for better visibility (was 10)
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
    this.running = false;
    this.gameOver = false;
    this.winner = null;
    this.started = false;
    this.inCountdown = false;
    this.gameTime = 0;
    this.maxScore = options.maxScore || 11;

    // Player names
    this.player1Name = options.player1Name || 'Player 1';
    this.player2Name = options.player2Name || 'Player 2';

    // Callbacks
    this.onScoreUpdate = options.onScoreUpdate || null;
    this.onGameOver = options.onGameOver || null;
  }

  start() {
    this.running = true;
    this.started = true;
    this.gameTime = 0;
    // Ne réinitialiser la balle que si on n'est pas en countdown
    // (en countdown, la balle est déjà centrée sans vitesse)
    if (!this.inCountdown) {
      this.resetBall();
    } else {
      // Donner une vitesse à la balle maintenant que le countdown est fini
      this.ball.speed = this.initialBallSpeed;
      this.setBallDirection();
    }
  }

  stop() {
    this.running = false;
  }

  setBallDirection(directionSign = (Math.random() < 0.5 ? 1 : -1)) {
    const maxAngle = Math.PI / 4;
    const angle = (Math.random() * maxAngle) - maxAngle / 2;
    this.ball.velocityX = directionSign * this.ball.speed * Math.cos(angle);
    this.ball.velocityY = this.ball.speed * Math.sin(angle);
  }

  resetBall(directionSign = undefined) {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;

    this.ball.speed = this.initialBallSpeed;
    const dir = directionSign !== undefined ? directionSign : (Math.random() < 0.5 ? 1 : -1);
    this.setBallDirection(dir);
  }

  centerBall() {
    // Centrer la balle sans lui donner de vitesse (pour le countdown)
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.velocityX = 0;
    this.ball.velocityY = 0;
  }

  computeVelocities() {
    // Player 1
    if (this.player1.upPressed) {
      this.player1.velocityY = -this.player1.speed * 60;  // 480 px/s
    } else if (this.player1.downPressed) {
      this.player1.velocityY = this.player1.speed * 60;
    } else {
      this.player1.velocityY = 0;  // Arrêt instantané
    }

    // Player 2
    if (this.player2.upPressed) {
      this.player2.velocityY = -this.player2.speed * 60;
    } else if (this.player2.downPressed) {
      this.player2.velocityY = this.player2.speed * 60;
    } else {
      this.player2.velocityY = 0;
    }
  }

  handleInput(player, input) {
    const paddle = player === 'player1' ? this.player1 : this.player2;

    switch (input.key) {
        case 'arrowup':
            paddle.upPressed = input.state;  // ← true ou false, pas 'down'
            break;
        case 'arrowdown':
            paddle.downPressed = input.state;
            break;
    }
  }

  updatePaddle(player, dt) {
    player.y += player.velocityY * dt;

    // Clamp
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > VIRTUAL_HEIGHT) {
      player.y = VIRTUAL_HEIGHT - player.height;
    }
  }

  checkCollisionWithPlayer(b, player) {
    return (
      b.x - b.radius < player.x + player.width &&
      b.x + b.radius > player.x &&
      b.y + b.radius > player.y &&
      b.y - b.radius < player.y + player.height
    );
  }

  updateBall(dt) {
    const prevX = this.ball.x;
    const prevY = this.ball.y;
    const dx = this.ball.velocityX * dt;
    const dy = this.ball.velocityY * dt;
    const moveDist = Math.hypot(dx, dy);
    // Smaller step for more accurate collision detection
    const stepLen = Math.max(1, Math.floor(this.ball.radius * 0.3)); // Changed from 0.5
    const steps = Math.max(1, Math.ceil(moveDist / stepLen));

    let collided = false;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const nx = prevX + dx * t;
      const ny = prevY + dy * t;

      // top/bottom bounce
      if (ny + this.ball.radius > VIRTUAL_HEIGHT) {
        this.ball.y = VIRTUAL_HEIGHT - this.ball.radius;
        this.ball.velocityY = -this.ball.velocityY;
        collided = true;
        break;
      } else if (ny - this.ball.radius < 0) {
        this.ball.y = this.ball.radius;
        this.ball.velocityY = -this.ball.velocityY;
        collided = true;
        break;
      }

      // test collision against both paddles at this intermediate position
      const tempBall = { ...this.ball, x: nx, y: ny };
      const hitP1 = this.checkCollisionWithPlayer(tempBall, this.player1);
      const hitP2 = this.checkCollisionWithPlayer(tempBall, this.player2);
      if (hitP1 || hitP2) {
        const player = hitP1 ? this.player1 : this.player2;
        const collidePoint = ny - (player.y + player.height / 2);
        const normalizedCollidePoint = collidePoint / (player.height / 2);
        const angleRad = (Math.PI / 4) * normalizedCollidePoint;
        const direction = player.x < VIRTUAL_WIDTH / 2 ? 1 : -1;

        // increment speed
        if (this.ball.speed < this.maxBallSpeed / 4 * 3) {
          this.ball.speed = Math.min(this.maxBallSpeed, this.ball.speed + (this.speedIncrement * 1.5));
        }
        else if (this.ball.speed < this.maxBallSpeed) {
          this.ball.speed = Math.min(this.maxBallSpeed, this.ball.speed + this.speedIncrement);
        }
        else {
          this.ball.speed = this.maxBallSpeed;
        }

        // set reflected velocity from speed and impact angle
        this.ball.velocityX = direction * this.ball.speed * Math.cos(angleRad);
        this.ball.velocityY = this.ball.speed * Math.sin(angleRad);

        // push ball out of the paddle to avoid sticking
        if (player.x < VIRTUAL_WIDTH / 2) {
          this.ball.x = player.x + player.width + this.ball.radius + 0.1;
        } else {
          this.ball.x = player.x - this.ball.radius - 0.1;
        }

        collided = true;
        break;
      }
    }

    if (!collided) {
      this.ball.x = prevX + dx;
      this.ball.y = prevY + dy;
    }

    // Score
    if (this.ball.x - this.ball.radius < 0) {
      // Player 2 scores
      this.player2.score++;
      this.onScoreEvent('player2');
    }
    else if (this.ball.x + this.ball.radius > this.width) {
      // Player 1 scores
      this.player1.score++;
      this.onScoreEvent('player1');
    }
  }

  onScoreEvent(_scorer) {
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

  endGame(winner) {
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

  restart() {
    // Reset scores
    this.player1.score = 0;
    this.player2.score = 0;

    // Reset game state
    this.gameOver = false;
    this.winner = null;
    this.started = false;
    this.running = false;
    this.inCountdown = false;
    this.gameTime = 0;

    // Reset ball and paddles - centrer la balle sans vitesse
    this.centerBall();
    this.player1.y = this.height / 2 - this.player1.height / 2;
    this.player2.y = this.height / 2 - this.player2.height / 2;

    // Reset input states
    this.player1.upPressed = false;
    this.player1.downPressed = false;
    this.player1.velocityY = 0;
    this.player2.upPressed = false;
    this.player2.downPressed = false;
    this.player2.velocityY = 0;
  }

  update(dt) {
    if (this.gameOver) return;

    // Update game time only if running
    if (this.running) {
      this.gameTime += dt;
    }

    // Always update paddles (even during countdown)
    this.computeVelocities();
    this.updatePaddle(this.player1, dt);
    this.updatePaddle(this.player2, dt);

    // Only update ball if game has started
    if (this.running && this.started) {
      this.updateBall(dt);
    }
  }

  getState() {
    return {
      player1Score: this.player1.score,
      player2Score: this.player2.score,
      running: this.running,
      gameOver: this.gameOver,
      winner: this.winner,
    };
  }
}
