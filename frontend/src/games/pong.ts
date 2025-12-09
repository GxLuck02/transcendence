/**
 * Pong Game - Wrapper for Engine and Renderer
 * Part of ft_transcendence project
 */

import { PongGameEngine, type PongGameOptions, type GameState } from './pong-engine';
import { PongGameRenderer } from './pong-render';

export class PongGame {
  private engine: PongGameEngine;
  private renderer: PongGameRenderer;
  private lastTime: number = performance.now();
  private animationFrameId: number | null = null;

  constructor(canvasId: string, options: PongGameOptions = {}) {
    // Create engine with custom onGameOver callback
    const engineOptions = {
      ...options,
      onGameOver: (result: { winner: string; player1Score: number; player2Score: number }) => {
        // Call user's callback if provided
        if (options.onGameOver) {
          options.onGameOver(result);
        }
        // Show game over screen (unless disabled for tournament mode)
        if (!options.hideGameOverScreen) {
          this.renderer.showGameOverScreen();
        }
      }
    };

    this.engine = new PongGameEngine(engineOptions);
    this.renderer = new PongGameRenderer(canvasId, this.engine, options.hidePlayerNames);

    // Start game loop
    this.gameLoop();
  }

  public start(): void {
    this.engine.start();
  }

  public pause(): void {
    this.engine.pause();
  }

  public resume(): void {
    this.engine.resume();
  }

  public togglePause(): void {
    this.engine.togglePause();
  }

  public stop(): void {
    this.engine.stop();
    this.renderer.cleanup();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public restart(): void {
    this.renderer.removeGameOverScreen();
    this.engine.restart();
  }

  private gameLoop(): void {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;  // Delta en secondes
    this.lastTime = now;

    this.engine.update(dt);
    this.renderer.render();

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  public getState(): GameState {
    return this.engine.getState();
  }
}

console.log('✅ Pong game loaded (TypeScript)');
