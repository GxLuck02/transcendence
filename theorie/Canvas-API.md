# Theorie : Canvas API - Dessiner le jeu Pong

## Table des matieres
1. [Qu'est-ce que Canvas API ?](#quest-ce-que-canvas-api-)
2. [Pourquoi Canvas dans ft_transcendence](#pourquoi-canvas-dans-ft_transcendence)
3. [Les concepts cles de Canvas](#les-concepts-cles-de-canvas)
4. [Dessiner des formes](#dessiner-des-formes)
5. [Exemples pratiques de notre projet](#exemples-pratiques-de-notre-projet)
6. [La boucle de jeu (Game Loop)](#la-boucle-de-jeu-game-loop)
7. [Exercices pratiques](#exercices-pratiques)

---

## Qu'est-ce que Canvas API ?

### Definition simple

**Canvas API** est une interface JavaScript qui permet de dessiner des graphiques 2D (et 3D avec WebGL) directement dans le navigateur. C'est comme une toile de peinture numerique ou vous pouvez dessiner pixel par pixel.

### L'analogie du tableau blanc

Imaginez un tableau blanc :
- **Le Canvas** = Le tableau blanc lui-meme
- **Le Contexte 2D** = Vos marqueurs et outils pour dessiner
- **Les methodes** = Les actions (dessiner un cercle, une ligne, du texte...)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CANVAS                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │     ┌──────┐                              ┌──────┐      │   │
│   │     │      │                              │      │      │   │
│   │     │ P1   │          O                   │  P2  │      │   │
│   │     │      │         Balle                │      │      │   │
│   │     └──────┘                              └──────┘      │   │
│   │                                                         │   │
│   │           Score: 3 - 2      Time: 2:45                  │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Dimensions: 800 x 600 pixels                                   │
│   Contexte: CanvasRenderingContext2D                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Systeme de coordonnees

Le Canvas utilise un systeme de coordonnees ou :
- **L'origine (0,0)** est en haut a gauche
- **X** augmente vers la droite
- **Y** augmente vers le bas

```
(0,0) ─────────────────────────────► X (800)
  │
  │
  │
  │
  │
  │
  ▼
  Y (600)
```

---

## Pourquoi Canvas dans ft_transcendence

### Le besoin : Un jeu Pong

Le projet ft_transcendence demande d'implementer un jeu **Pong** jouable en temps reel. Pour cela, nous avons besoin :

1. **Dessiner des elements** : Raquettes, balle, scores
2. **Animer** : Mettre a jour l'affichage 60 fois par seconde
3. **Performance** : Rendu rapide et fluide
4. **Interactivite** : Reagir aux entrees clavier

### Pourquoi Canvas et pas HTML/CSS ?

| Aspect | HTML/CSS | Canvas |
|--------|----------|--------|
| Animations complexes | Difficile | Facile |
| Performance | Moyenne | Excellente |
| Pixel-perfect | Non | Oui |
| Jeux 2D | Pas adapte | Parfait |
| Manipulation DOM | Beaucoup | Aucune |

### Architecture du jeu Pong

```
┌─────────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE PONG                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  pong-engine.ts │    │ pong-render.ts  │    │   pong.ts    │ │
│  │  ───────────────│    │  ──────────────  │    │  ──────────  │ │
│  │                 │    │                 │    │              │ │
│  │  - Logique jeu  │───►│  - Dessin       │◄───│  - Game Loop │ │
│  │  - Physique     │    │  - Canvas API   │    │  - Events    │ │
│  │  - Collisions   │    │  - Affichage    │    │  - Init      │ │
│  │                 │    │                 │    │              │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Les concepts cles de Canvas

### 1. Creer un Canvas

**HTML :**
```html
<canvas id="pong-canvas" width="800" height="600"></canvas>
```

**JavaScript/TypeScript :**
```typescript
// Recuperer l'element canvas
const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;

// Obtenir le contexte de dessin 2D
const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Failed to get canvas 2D context');
}
```

### 2. Le Contexte 2D (ctx)

Le contexte est l'objet qui contient toutes les methodes de dessin :

```typescript
const ctx = canvas.getContext('2d');

// Proprietes de style
ctx.fillStyle = '#FF0000';     // Couleur de remplissage
ctx.strokeStyle = '#00FF00';   // Couleur de contour
ctx.lineWidth = 2;             // Epaisseur de ligne
ctx.font = '24px Arial';       // Police pour le texte

// Methodes de dessin
ctx.fillRect(x, y, w, h);      // Rectangle plein
ctx.strokeRect(x, y, w, h);    // Rectangle contour
ctx.fillText('Hello', x, y);   // Texte
ctx.beginPath();               // Commencer un chemin
ctx.arc(x, y, r, 0, 2*PI);     // Arc/Cercle
ctx.fill();                    // Remplir le chemin
ctx.stroke();                  // Tracer le contour
```

### 3. Les formes de base

```
┌────────────────────────────────────────────────────────────────┐
│                    FORMES CANVAS                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Rectangle:                    Cercle:                          │
│  fillRect(x, y, w, h)          arc(x, y, radius, 0, 2*PI)       │
│  ┌─────────┐                        ●                           │
│  │         │                                                    │
│  └─────────┘                                                    │
│                                                                 │
│  Ligne:                        Texte:                           │
│  moveTo(x1, y1)                fillText("Score", x, y)          │
│  lineTo(x2, y2)                     Score                       │
│  ─────────────                                                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Dessiner des formes

### 1. Rectangles (Raquettes)

```typescript
// Rectangle plein
ctx.fillStyle = '#FFFFFF';  // Blanc
ctx.fillRect(30, 250, 12, 90);  // x, y, largeur, hauteur

// Rectangle avec contour
ctx.strokeStyle = '#00FF00';
ctx.lineWidth = 2;
ctx.strokeRect(30, 250, 12, 90);
```

### 2. Cercles (Balle)

```typescript
// Dessiner un cercle
ctx.beginPath();                    // Nouveau chemin
ctx.arc(400, 300, 10, 0, Math.PI * 2);  // x, y, rayon, debut, fin
ctx.fillStyle = '#FFFFFF';
ctx.fill();                         // Remplir
ctx.closePath();
```

### 3. Lignes (Ligne centrale)

```typescript
// Ligne pointillee au milieu
ctx.strokeStyle = '#FFFFFF';
ctx.setLineDash([10, 10]);  // 10px trait, 10px espace
ctx.beginPath();
ctx.moveTo(400, 0);         // Point de depart
ctx.lineTo(400, 600);       // Point d'arrivee
ctx.stroke();               // Tracer
ctx.setLineDash([]);        // Reset le style pointille
```

### 4. Texte (Scores)

```typescript
// Afficher le score
ctx.font = '48px monospace';
ctx.fillStyle = '#FFFFFF';
ctx.fillText('3', 200, 60);   // Score joueur 1
ctx.fillText('2', 600, 60);   // Score joueur 2

// Texte centre
const text = 'PAUSED';
const textWidth = ctx.measureText(text).width;
ctx.fillText(text, (800 - textWidth) / 2, 300);
```

### 5. Effacer le canvas

```typescript
// Effacer tout le canvas (fond noir)
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Ou avec clearRect (transparent)
ctx.clearRect(0, 0, canvas.width, canvas.height);
```

---

## Exemples pratiques de notre projet

### 1. Initialisation du Renderer

**Fichier** : `frontend/src/games/pong-render.ts:8-35`

```typescript
export class PongGameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: PongGameEngine;

  constructor(canvasId: string, engine: PongGameEngine) {
    // Recuperer le canvas par son ID
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    this.canvas = canvas;

    // Obtenir le contexte 2D
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;

    this.engine = engine;

    // Definir la taille du canvas selon le moteur de jeu
    this.canvas.width = engine.width;   // 800
    this.canvas.height = engine.height; // 600
  }
}
```

### 2. Methode principale de rendu

**Fichier** : `frontend/src/games/pong-render.ts:84-117`

```typescript
public render(): void {
  // 1. Effacer le canvas (fond noir)
  this.ctx.fillStyle = '#000';
  this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);

  // 2. Dessiner la ligne centrale
  this.drawCenterLine();

  // 3. Dessiner les raquettes
  this.drawPaddle(this.engine.player1);
  this.drawPaddle(this.engine.player2);

  // 4. Dessiner la balle
  this.drawBall(this.engine.ball);

  // 5. Dessiner les scores
  this.drawScores();

  // 6. Dessiner l'overlay de pause si necessaire
  if (this.engine.paused) {
    this.drawPauseOverlay();
  }

  // 7. Afficher les controles
  this.drawControlsHint();

  // 8. Afficher la vitesse de la balle
  this.drawBallSpeed();

  // 9. Afficher le temps de jeu
  this.drawGameTime();
}
```

### 3. Dessiner la ligne centrale pointillee

**Fichier** : `frontend/src/games/pong-render.ts:119-127`

```typescript
private drawCenterLine(): void {
  this.ctx.strokeStyle = '#FFF';
  this.ctx.setLineDash([10, 10]);  // Pointilles
  this.ctx.beginPath();
  this.ctx.moveTo(this.engine.width / 2, 0);
  this.ctx.lineTo(this.engine.width / 2, this.engine.height);
  this.ctx.stroke();
  this.ctx.setLineDash([]);  // Reset
}
```

### 4. Dessiner une raquette

**Fichier** : `frontend/src/games/pong-render.ts:129-132`

```typescript
private drawPaddle(paddle: Paddle): void {
  this.ctx.fillStyle = '#FFF';
  this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}
```

**Explication :**
- `paddle.x`, `paddle.y` : Position du coin superieur gauche
- `paddle.width` : 12 pixels
- `paddle.height` : 90 pixels

### 5. Dessiner la balle (cercle)

**Fichier** : `frontend/src/games/pong-render.ts:134-140`

```typescript
private drawBall(ball: Ball): void {
  this.ctx.beginPath();
  this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  this.ctx.fillStyle = '#FFF';
  this.ctx.fill();
  this.ctx.closePath();
}
```

**Explication :**
- `ball.x`, `ball.y` : Centre du cercle
- `ball.radius` : 10 pixels
- `0, Math.PI * 2` : Arc complet (0 a 360 degres)

### 6. Dessiner les scores

**Fichier** : `frontend/src/games/pong-render.ts:142-147`

```typescript
private drawScores(): void {
  this.ctx.font = '48px monospace';
  this.ctx.fillStyle = '#ffffff';
  // Score joueur 1 (quart gauche)
  this.ctx.fillText(this.engine.player1.score.toString(), this.engine.width / 4, 60);
  // Score joueur 2 (trois-quarts droite)
  this.ctx.fillText(this.engine.player2.score.toString(), (3 * this.engine.width) / 4, 60);
}
```

### 7. Overlay de pause avec effet de glow

**Fichier** : `frontend/src/games/pong-render.ts:149-170`

```typescript
private drawPauseOverlay(): void {
  // Fond semi-transparent
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);

  // Texte avec effet de glow (ombre)
  this.ctx.font = 'bold 48px monospace';
  this.ctx.fillStyle = '#00d4ff';  // Cyan
  this.ctx.shadowColor = '#00d4ff';
  this.ctx.shadowBlur = 20;  // Effet de lueur

  const text = this.engine.started ? 'PAUSED' : 'PRESS START';
  const textWidth = this.ctx.measureText(text).width;
  this.ctx.fillText(text, (this.engine.width - textWidth) / 2, this.engine.height / 2 - 20);

  this.ctx.shadowBlur = 0;  // Reset le glow

  // Instructions
  this.ctx.font = '20px monospace';
  this.ctx.fillStyle = '#fff';
  const resumeText = this.engine.started
    ? 'Appuyez sur ESPACE ou ESC pour continuer'
    : 'Appuyez sur ESPACE ou ESC pour commencer';
  const resumeWidth = this.ctx.measureText(resumeText).width;
  this.ctx.fillText(resumeText, (this.engine.width - resumeWidth) / 2, this.engine.height / 2 + 40);
}
```

### 8. Afficher le temps de jeu

**Fichier** : `frontend/src/games/pong-render.ts:184-194`

```typescript
private drawGameTime(): void {
  const totalSeconds = Math.floor(this.engine.gameTime);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;

  this.ctx.font = '17px monospace';
  this.ctx.fillStyle = '#888';
  const textWidth = this.ctx.measureText(`Time: ${timeString}`).width;
  this.ctx.fillText(`Time: ${timeString}`, (this.engine.width - textWidth) / 2, 30);
}
```

---

## La boucle de jeu (Game Loop)

### Principe

La boucle de jeu est le coeur de tout jeu video. Elle :
1. Met a jour la logique du jeu (physique, collisions)
2. Redessine l'ecran
3. Recommence ~60 fois par seconde

```
┌────────────────────────────────────────────────────────────────┐
│                       GAME LOOP                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────┐                                              │
│    │   START     │                                              │
│    └──────┬──────┘                                              │
│           │                                                     │
│           ▼                                                     │
│    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│    │   UPDATE    │────►│   RENDER    │────►│   REPEAT    │──┐  │
│    │  (logique)  │     │  (dessin)   │     │ (~60 FPS)   │  │  │
│    └─────────────┘     └─────────────┘     └─────────────┘  │  │
│           ▲                                                  │  │
│           └─────────────────────────────────────────────────┘  │
│                                                                 │
│    requestAnimationFrame() : ~16.67ms entre chaque frame        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### requestAnimationFrame

```typescript
let lastTime = 0;

function gameLoop(currentTime: number): void {
  // Calculer le delta time (temps ecoule depuis la derniere frame)
  const deltaTime = (currentTime - lastTime) / 1000;  // En secondes
  lastTime = currentTime;

  // 1. Mettre a jour la logique
  engine.update(deltaTime);

  // 2. Redessiner
  renderer.render();

  // 3. Planifier la prochaine frame
  if (engine.running) {
    requestAnimationFrame(gameLoop);
  }
}

// Demarrer la boucle
requestAnimationFrame(gameLoop);
```

### Delta Time : Pourquoi c'est important

Le **delta time** est le temps ecoule entre deux frames. Il permet :
- Un mouvement constant quelle que soit la performance
- La meme experience sur tous les appareils

```typescript
// SANS delta time (mauvais)
ball.x += ball.velocityX;  // Depend du FPS !

// AVEC delta time (bon)
ball.x += ball.velocityX * deltaTime;  // Constant !
```

**Exemple concret :**
```
Sur PC puissant (120 FPS) : deltaTime = 0.0083s
  → ball.x += 400 * 0.0083 = 3.33 pixels/frame

Sur PC lent (30 FPS) : deltaTime = 0.0333s
  → ball.x += 400 * 0.0333 = 13.33 pixels/frame

Dans les deux cas : 400 pixels/seconde !
```

---

## Techniques avancees

### 1. Couleurs avec transparence

```typescript
// Format RGBA (Red, Green, Blue, Alpha)
ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';  // Noir 70% opaque
ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Rouge 50% opaque
```

### 2. Effets de shadow/glow

```typescript
ctx.shadowColor = '#00d4ff';  // Couleur de l'ombre
ctx.shadowBlur = 20;          // Rayon du flou
ctx.shadowOffsetX = 5;        // Decalage horizontal
ctx.shadowOffsetY = 5;        // Decalage vertical

// Dessiner avec l'ombre
ctx.fillText('GLOW', 100, 100);

// Reset
ctx.shadowBlur = 0;
```

### 3. Sauvegarder/Restaurer l'etat

```typescript
ctx.save();  // Sauvegarde l'etat actuel (couleurs, transformations...)

// Modifications temporaires
ctx.fillStyle = 'red';
ctx.translate(100, 100);
ctx.rotate(Math.PI / 4);

ctx.restore();  // Restaure l'etat precedent
```

### 4. Transformations

```typescript
// Translation (deplacer l'origine)
ctx.translate(400, 300);

// Rotation (autour de l'origine)
ctx.rotate(Math.PI / 4);  // 45 degres

// Echelle
ctx.scale(2, 2);  // Double la taille

// Reset toutes les transformations
ctx.setTransform(1, 0, 0, 1, 0, 0);
```

---

## Exercices pratiques

### Exercice 1 : Dessiner un terrain de Pong

**Objectif** : Creer une fonction qui dessine le terrain de base.

```typescript
function drawField(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Votre code ici
  // - Fond noir
  // - Ligne centrale pointillee blanche
  // - Bordure du terrain
}
```

<details>
<summary>Solution</summary>

```typescript
function drawField(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Fond noir
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // Ligne centrale pointillee
  ctx.strokeStyle = '#FFF';
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Bordure
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);
}
```
</details>

---

### Exercice 2 : Animer une balle

**Objectif** : Faire rebondir une balle sur les bords.

```typescript
// A completer
const ball = { x: 400, y: 300, vx: 5, vy: 3, radius: 10 };

function updateBall(ball, width, height) {
  // Votre code ici
}

function drawBall(ctx, ball) {
  // Votre code ici
}
```

<details>
<summary>Solution</summary>

```typescript
function updateBall(ball, width, height) {
  // Deplacer
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Rebonds horizontaux
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
    ball.vx = -ball.vx;
  }

  // Rebonds verticaux
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > height) {
    ball.vy = -ball.vy;
  }
}

function drawBall(ctx, ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF';
  ctx.fill();
  ctx.closePath();
}
```
</details>

---

### Exercice 3 : Afficher un compteur anime

**Objectif** : Afficher un compte a rebours de 3 secondes.

```typescript
// A completer
let countdown = 3;

function drawCountdown(ctx: CanvasRenderingContext2D, count: number): void {
  // Votre code ici
  // - Afficher le nombre au centre
  // - Ajouter un effet de pulsation (scale)
}
```

<details>
<summary>Solution</summary>

```typescript
function drawCountdown(ctx: CanvasRenderingContext2D, count: number): void {
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  // Effet de pulsation base sur le temps
  const scale = 1 + 0.2 * Math.sin(Date.now() / 200);

  ctx.save();

  // Deplacer au centre
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);

  // Style du texte
  ctx.font = 'bold 120px monospace';
  ctx.fillStyle = '#00d4ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Effet de glow
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 30;

  // Dessiner
  ctx.fillText(count.toString(), 0, 0);

  ctx.restore();
}
```
</details>

---

## Resume

| Concept | Description |
|---------|-------------|
| **Canvas** | Element HTML pour dessiner des graphiques 2D |
| **Context 2D** | Objet pour acceder aux methodes de dessin |
| **fillRect** | Dessiner un rectangle plein |
| **arc** | Dessiner un cercle ou arc |
| **fillText** | Afficher du texte |
| **requestAnimationFrame** | Planifier la prochaine frame (~60 FPS) |
| **Delta Time** | Temps entre deux frames pour un mouvement fluide |

---

## Ressources

- [MDN - Canvas API](https://developer.mozilla.org/fr/docs/Web/API/Canvas_API)
- [MDN - Canvas Tutorial](https://developer.mozilla.org/fr/docs/Web/API/Canvas_API/Tutorial)
- [HTML5 Canvas Cheat Sheet](https://devhints.io/canvas)
- [Game Loop - Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)

---

**Derniere mise a jour** : 2025-12-08
**Projet** : ft_transcendence (Ecole 42)
