/**
 * Pong Game Renderer - Display and UI
 * Part of ft_transcendence project
 */

import { PongGameEngine, type Ball, type Paddle } from './pong-engine';

export class PongGameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: PongGameEngine;
  private playerNamesContainer: HTMLElement | null = null;

  constructor(canvasId: string, engine: PongGameEngine) {
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

    this.engine = engine;

    // Setup canvas size
    this.canvas.width = engine.width;
    this.canvas.height = engine.height;

    // Create player names display
    this.createPlayerNamesDisplay();
  }

  private createPlayerNamesDisplay(): void {
    // Remove existing if any
    const existing = document.getElementById('player-names-display');
    if (existing) existing.remove();

    // Create container
    const container = document.createElement('div');
    container.id = 'player-names-display';
    container.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: ${this.canvas.width}px;
      margin: 0 auto 10px auto;
      padding: 10px 20px;
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid #00d4ff;
      border-radius: 8px 8px 0 0;
      font-family: monospace;
      font-size: 18px;
      font-weight: bold;
    `;

    // Player 1 name (left)
    const player1Div = document.createElement('div');
    player1Div.style.cssText = 'color: #00d4ff; text-align: left;';
    player1Div.textContent = this.engine.player1Name;

    // VS text (center)
    const vsDiv = document.createElement('div');
    vsDiv.style.cssText = 'color: #fff; font-size: 14px;';
    vsDiv.textContent = 'VS';

    // Player 2 name (right)
    const player2Div = document.createElement('div');
    player2Div.style.cssText = 'color: #00d4ff; text-align: right;';
    player2Div.textContent = this.engine.player2Name;

    container.appendChild(player1Div);
    container.appendChild(vsDiv);
    container.appendChild(player2Div);

    // Insert before canvas
    this.canvas.parentElement?.insertBefore(container, this.canvas);
    this.playerNamesContainer = container;
  }

  public render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    // Draw center line
    this.drawCenterLine();

    // Draw paddles
    this.drawPaddle(this.engine.player1);
    this.drawPaddle(this.engine.player2);

    // Draw ball
    this.drawBall(this.engine.ball);

    // Draw scores
    this.drawScores();

    // Draw pause overlay
    if (this.engine.paused) {
      this.drawPauseOverlay();
    }

    // Draw controls hint
    this.drawControlsHint();

    // Draw ball speed
    this.drawBallSpeed();

    // Draw game time
    this.drawGameTime();

    this.drawUiElements();
  }

  private drawCenterLine(): void {
    this.ctx.strokeStyle = '#FFF';
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.engine.width / 2, 0);
    this.ctx.lineTo(this.engine.width / 2, this.engine.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawPaddle(paddle: Paddle): void {
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  }

  private drawBall(ball: Ball): void {
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFF';
    this.ctx.fill();
    this.ctx.closePath();
  }

  private drawScores(): void {
    this.ctx.font = '48px monospace';
    this.ctx.fillStyle = '#ffffffff';
    this.ctx.fillText(this.engine.player1.score.toString(), this.engine.width / 4, 60);
    this.ctx.fillText(this.engine.player2.score.toString(), (3 * this.engine.width) / 4, 60);
  }

  private drawPauseOverlay(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);
    
    // Text with glow
    this.ctx.font = 'bold 48px monospace';
    this.ctx.fillStyle = '#00d4ff';
    this.ctx.shadowColor = '#00d4ff';
    this.ctx.shadowBlur = 20;
    const text = this.engine.started ? 'PAUSED' : 'PRESS START';
    const textWidth = this.ctx.measureText(text).width;
    this.ctx.fillText(text, (this.engine.width - textWidth) / 2, this.engine.height / 2 - 20);
    this.ctx.shadowBlur = 0;
    
    // Instructions
    this.ctx.font = '20px monospace';
    this.ctx.fillStyle = '#fff';
    const resumeText = this.engine.started ? 'Appuyez sur ESPACE ou ESC pour continuer' : 'Appuyez sur ESPACE ou ESC pour commencer';
    const resumeWidth = this.ctx.measureText(resumeText).width;
    this.ctx.fillText(resumeText, (this.engine.width - resumeWidth) / 2, this.engine.height / 2 + 40);
  }

  private drawControlsHint(): void {
    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#888';
    this.ctx.fillText('P1: W/S | P2: ↑/↓ | SPACE/ESC: Pause', 10, this.engine.height - 10);
  }

  private drawBallSpeed(): void {
    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#888';
    this.ctx.fillText(`Ball Speed: ${(this.engine.ball.speed / 100).toFixed(2)}`, this.engine.width - 130, this.engine.height - 10);
  }

  private drawGameTime(): void {
    const totalSeconds = Math.floor(this.engine.gameTime);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeString = `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.ctx.font = '17px monospace';
    this.ctx.fillStyle = '#888';
    const textWidth = this.ctx.measureText(`Time: ${timeString}`).width;
    this.ctx.fillText(`Time: ${timeString}`, (this.engine.width - textWidth) / 2, 0 + 30);
  }

  private drawUiElements(): void {
    const playerInfoDiv = document.getElementById('player-info');
    if (playerInfoDiv) {
      playerInfoDiv.textContent = `Joueur 1: ${this.engine.player1.score} - Joueur 2: ${this.engine.player2.score}`;
    }
  }

  public showGameOverScreen(): void {
    // Créer overlay
    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-in;
    `;

    // Créer contenu
    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 40px 60px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border: 2px solid #00d4ffff;
      animation: slideIn 0.4s ease-out;
    `;

    const winnerName = this.engine.winner === 'player1' ? this.engine.player1Name : this.engine.player2Name;
    
    content.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #restart-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px #00d4ffff;
        }
        #accueil-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px #00d4ffff;
        }
      </style>
      <h1 style="color: #00d4ffff; font-size: 48px; margin: 0 0 20px 0; text-shadow: 0 0 10px #46e0ffe6;">🏆 VICTOIRE!</h1>
      <p style="color: #fff; font-size: 32px; margin: 10px 0;">${winnerName} gagne!</p>
      <div style="margin: 30px 0; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px;">
        <p style="color: #00d4ffff; font-size: 24px; margin: 5px 0;">Score Final</p>
        <p style="color: #888; font-size: 18px; margin: 10px 0;">${this.engine.player1Name} vs ${this.engine.player2Name}</p>
        <p style="color: #888; font-size: 18px; margin: 10px 0;">Durée: ${Math.floor(this.engine.gameTime / 60)}:${Math.floor(this.engine.gameTime % 60).toString().padStart(2, '0')}</p>
        <p style="color: #fff; font-size: 36px; margin: 10px 0; font-weight: bold;">
          ${this.engine.player1.score} - ${this.engine.player2.score}
        </p>
      </div>
      <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
        <button id="restart-btn" style="
          background: linear-gradient(135deg, #00d4ffff 0%, #08c7edff 100%);
          color: #000;
          border: none;
          padding: 15px 40px;
          font-size: 20px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Rejouer</button>
        <button id="accueil-btn" style="
          background: linear-gradient(135deg, #00d4ffff 0%, #08c7edff 100%);
          color: #000;
          border: none;
          padding: 15px 40px;
          font-size: 20px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Menu</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Bouton restart
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        overlay.remove();
        this.engine.restart();
      });
    }

    const accueilBtn = document.getElementById('accueil-btn');
    if (accueilBtn) {
      accueilBtn.addEventListener('click', () => {
        overlay.remove();
        this.engine.stop();
        // Redirect to main menu or perform desired action
        window.location.href = '/';  // Exemple de redirection vers la page d'accueil
      });
    }
  }

  public removeGameOverScreen(): void {
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.remove();
  }

  public cleanup(): void {
    if (this.playerNamesContainer) {
      this.playerNamesContainer.remove();
      this.playerNamesContainer = null;
    }
  }
}
