# Théorie : TypeScript - Le JavaScript amélioré

## Table des matières
1. [Qu'est-ce que TypeScript ?](#quest-ce-que-typescript-)
2. [JavaScript vs TypeScript : La différence fondamentale](#javascript-vs-typescript--la-différence-fondamentale)
3. [Pourquoi le sujet impose TypeScript](#pourquoi-le-sujet-impose-typescript)
4. [Les concepts clés de TypeScript](#les-concepts-clés-de-typescript)
5. [Exemples pratiques de notre projet](#exemples-pratiques-de-notre-projet)
6. [Configuration TypeScript](#configuration-typescript)
7. [Les avantages en pratique](#les-avantages-en-pratique)

---

## Qu'est-ce que TypeScript ?

### Définition simple

**TypeScript** est un langage de programmation créé par Microsoft qui est essentiellement **JavaScript avec des types**. C'est un "superset" de JavaScript, ce qui signifie que :

- ✅ Tout code JavaScript valide est aussi du code TypeScript valide
- ✅ TypeScript ajoute des fonctionnalités supplémentaires à JavaScript
- ✅ Le code TypeScript est compilé en JavaScript avant d'être exécuté dans le navigateur

### L'analogie de la ceinture de sécurité

Imaginez :
- **JavaScript** = Conduire une voiture sans ceinture de sécurité
- **TypeScript** = Conduire la même voiture **avec** ceinture de sécurité

La voiture (le langage) est fondamentalement la même, mais TypeScript ajoute une **couche de sécurité** qui vous protège des erreurs.

### Le processus de compilation

```
┌─────────────────────────┐
│  Vous écrivez           │
│  du code TypeScript     │
│  (fichiers .ts)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Compilateur TypeScript │
│  (tsc)                  │
│  → Vérifie les types    │
│  → Détecte les erreurs  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Code JavaScript        │
│  (fichiers .js)         │
│  → Exécuté dans le      │
│     navigateur          │
└─────────────────────────┘
```

---

## JavaScript vs TypeScript : La différence fondamentale

### Le problème avec JavaScript

JavaScript est un langage à **typage dynamique**, ce qui signifie que les types des variables sont déterminés à **l'exécution** (quand le code tourne).

**Exemple de problème en JavaScript :**

```javascript
// JavaScript (fichier .js)
function addNumbers(a, b) {
  return a + b;
}

console.log(addNumbers(5, 10));        // ✅ Résultat : 15 (correct)
console.log(addNumbers(5, "10"));      // ❌ Résultat : "510" (concaténation de strings!)
console.log(addNumbers("Hello", 5));   // ❌ Résultat : "Hello5" (bug!)
```

**Problème :** JavaScript ne vous empêche pas de passer des strings à une fonction qui devrait recevoir des nombres. **L'erreur n'apparaît que quand le code s'exécute !**

### La solution avec TypeScript

TypeScript utilise le **typage statique** : les types sont vérifiés **avant** l'exécution, pendant la compilation.

**Le même code en TypeScript :**

```typescript
// TypeScript (fichier .ts)
function addNumbers(a: number, b: number): number {
  return a + b;
}

console.log(addNumbers(5, 10));        // ✅ Résultat : 15 (correct)
console.log(addNumbers(5, "10"));      // ❌ ERREUR DE COMPILATION : "10" n'est pas un nombre
console.log(addNumbers("Hello", 5));   // ❌ ERREUR DE COMPILATION : "Hello" n'est pas un nombre
```

**Avantage :** TypeScript **refuse de compiler** si vous faites une erreur de type. **L'erreur est détectée avant même d'exécuter le code !**

### Comparaison visuelle

| Aspect | JavaScript | TypeScript |
|--------|-----------|------------|
| **Extension de fichier** | `.js` | `.ts` |
| **Vérification des types** | ❌ À l'exécution | ✅ À la compilation |
| **Détection des erreurs** | Tard (en production) | Tôt (pendant le développement) |
| **Autocomplétion IDE** | Limitée | Excellente |
| **Documentation** | Manuelle | Automatique (via les types) |
| **Sécurité** | Faible | Élevée |
| **Courbe d'apprentissage** | Facile | Moyenne |

---

## Pourquoi le sujet impose TypeScript

### Ce que dit le sujet du projet ft_transcendence

Dans la section **V.2 Web - Minor module: Use a framework or toolkit to build the front-end**, le sujet stipule :

> **"Your frontend development must use the Tailwind CSS in addition of the TypeScript, and nothing else."**

**TypeScript est donc OBLIGATOIRE** pour valider ce module.

### Les raisons pédagogiques

Le sujet de ft_transcendence est conçu pour vous confronter à des **technologies que vous ne maîtrisez peut-être pas encore**. Voici pourquoi TypeScript est imposé :

#### 1. **Apprentissage d'une technologie professionnelle**
   - TypeScript est utilisé par des entreprises majeures : Google, Microsoft, Slack, Airbnb, etc.
   - C'est une compétence très recherchée sur le marché du travail
   - Selon Stack Overflow 2024, TypeScript est dans le top 5 des langages les plus aimés

#### 2. **Gestion de la complexité**
   - Un projet comme ft_transcendence est **complexe** :
     - Router SPA
     - Gestion d'authentification
     - WebSocket pour le chat et le jeu en temps réel
     - API REST
     - Gestion d'état
   - Sans TypeScript, maintenir la cohérence du code serait **très difficile**

#### 3. **Travail en équipe**
   - TypeScript facilite la collaboration :
     - Les types servent de **documentation** automatique
     - Les interfaces définissent des **contrats** clairs entre les modules
     - L'autocomplétion aide à comprendre le code des autres

#### 4. **Prévention des bugs**
   - Dans un gros projet, les bugs de typage sont **très fréquents** en JavaScript pur
   - TypeScript détecte ces erreurs **avant** qu'elles n'arrivent en production

### Exemple concret : Pourquoi c'est important pour notre projet

Imaginez que vous développez le système de chat et un autre membre de l'équipe développe l'API.

**Sans TypeScript (JavaScript) :**
```javascript
// Développeur A pense que l'API renvoie ça :
const user = {
  id: 1,
  name: "Alice"  // ← "name"
};

// Développeur B a en fait codé ça :
const apiResponse = {
  id: 1,
  username: "Alice"  // ← "username" (pas "name"!)
};

// Le bug n'apparaît qu'à l'exécution :
console.log(user.name);  // ❌ undefined (au lieu de "Alice")
```

**Avec TypeScript :**
```typescript
// On définit un contrat (interface) que tout le monde respecte :
interface User {
  id: number;
  username: string;  // Tout le monde sait que c'est "username"
}

// Si quelqu'un essaie d'utiliser "name" :
const user: User = {
  id: 1,
  name: "Alice"  // ❌ ERREUR DE COMPILATION : "name" n'existe pas dans User
};

// Tout le monde utilise la même structure :
console.log(user.username);  // ✅ Fonctionne correctement
```

---

## Les concepts clés de TypeScript

### 1. Les types primitifs

TypeScript ajoute des annotations de type aux variables JavaScript :

```typescript
// JavaScript (sans types)
let username = "Alice";
let age = 25;
let isOnline = true;

// TypeScript (avec types explicites)
let username: string = "Alice";
let age: number = 25;
let isOnline: boolean = true;
```

**Types primitifs disponibles :**
- `string` : Chaînes de caractères ("hello")
- `number` : Nombres (42, 3.14)
- `boolean` : Booléens (true, false)
- `null` : Null
- `undefined` : Undefined
- `any` : N'importe quel type (à éviter !)
- `void` : Pas de retour (pour les fonctions)
- `never` : Jamais de retour (pour les fonctions qui lancent toujours une erreur)

### 2. Les interfaces

Une **interface** définit la structure d'un objet. C'est comme un contrat que l'objet doit respecter.

**Exemple simple :**
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;  // Le ? signifie "optionnel"
}

// ✅ Valide : respecte l'interface
const user: User = {
  id: 1,
  username: "alice",
  email: "alice@example.com"
};

// ❌ Erreur : manque "email"
const invalidUser: User = {
  id: 2,
  username: "bob"
};
```

### 3. Les types personnalisés (Type Aliases)

Un **type** permet de créer des alias pour des types complexes :

```typescript
// Type avec plusieurs valeurs possibles (union type)
type GameMode = 'vs_local' | '2p_local' | 'vs_ai' | '2p_remote';

let mode: GameMode = 'vs_ai';      // ✅ Valide
let mode2: GameMode = 'invalid';   // ❌ Erreur : 'invalid' n'est pas dans les options

// Type pour une fonction
type OnScoreUpdate = (scores: { player1: number; player2: number }) => void;
```

### 4. Les classes avec types

TypeScript améliore les classes JavaScript avec des modificateurs d'accès :

```typescript
class User {
  private id: number;           // Privé : accessible uniquement dans la classe
  public username: string;      // Public : accessible partout
  protected email: string;      // Protégé : accessible dans la classe et ses enfants

  constructor(id: number, username: string, email: string) {
    this.id = id;
    this.username = username;
    this.email = email;
  }

  public getEmail(): string {   // Méthode publique
    return this.email;
  }
}

const user = new User(1, "alice", "alice@example.com");
console.log(user.username);   // ✅ OK : public
console.log(user.email);      // ❌ Erreur : protected
console.log(user.id);         // ❌ Erreur : private
```

### 5. Les génériques (Generics)

Les génériques permettent de créer des fonctions et classes **réutilisables** avec différents types :

```typescript
// Fonction générique : fonctionne avec n'importe quel type
function identity<T>(value: T): T {
  return value;
}

const result1 = identity<string>("hello");   // T = string
const result2 = identity<number>(42);        // T = number

// Interface générique
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Utilisation avec différents types
const userResponse: ApiResponse<User> = {
  data: { id: 1, username: "alice", email: "alice@example.com" }
};

const numbersResponse: ApiResponse<number[]> = {
  data: [1, 2, 3, 4, 5]
};
```

---

## Exemples pratiques de notre projet

Voyons maintenant comment TypeScript est utilisé concrètement dans le projet ft_transcendence.

### Exemple 1 : Définition des types utilisateur

**Fichier : `frontend/src/types/index.ts` (lignes 8-16)**

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;           // Optionnel
  display_name?: string;     // Optionnel
  online?: boolean;          // Optionnel
}
```

**Pourquoi c'est utile ?**
- Garantit que tous les objets `User` ont au minimum `id`, `username` et `email`
- Empêche les fautes de frappe : si vous écrivez `user.usrname`, TypeScript détectera l'erreur
- L'autocomplétion de votre IDE vous suggérera automatiquement les propriétés disponibles

**Utilisation dans le code :**

```typescript
// Dans auth.service.ts (ligne 16)
public currentUser: User | null = null;

// TypeScript sait que currentUser peut être soit un User, soit null
if (this.currentUser) {
  console.log(this.currentUser.username);  // ✅ OK
  console.log(this.currentUser.password);  // ❌ Erreur : "password" n'existe pas dans User
}
```

### Exemple 2 : Interface pour les options du jeu Pong

**Fichier : `frontend/src/games/pong.ts` (lignes 26-35)**

```typescript
interface PongGameOptions {
  width?: number;
  height?: number;
  gameMode?: 'vs_local' | '2p_local' | 'vs_ai' | '2p_remote';
  matchId?: number | null;
  maxScore?: number;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  onScoreUpdate?: (scores: { player1: number; player2: number }) => void;
  onGameOver?: (result: { winner: string; player1Score: number; player2Score: number }) => void;
}
```

**Analyse détaillée :**

1. **Toutes les propriétés sont optionnelles** (`?`) car le constructeur fournit des valeurs par défaut
2. **Types stricts pour `gameMode`** : Seules 4 valeurs sont acceptées
3. **Types stricts pour `aiDifficulty`** : Seulement 'easy', 'medium' ou 'hard'
4. **Fonctions callbacks typées** : TypeScript vérifie que les callbacks reçoivent les bons paramètres

**Utilisation dans le constructeur :**

```typescript
// Fichier : pong.ts (ligne 69)
constructor(canvasId: string, options: PongGameOptions = {}) {
  // TypeScript vérifie que les options respectent l'interface
  this.width = options.width || 800;           // number
  this.gameMode = options.gameMode || '2p_local';  // 'vs_local' | '2p_local' | etc.
  this.aiDifficulty = options.aiDifficulty || 'medium';  // 'easy' | 'medium' | 'hard'
}
```

**Exemple d'utilisation correcte :**

```typescript
// ✅ Correct
const game = new PongGame('pongCanvas', {
  width: 1000,
  gameMode: 'vs_ai',
  aiDifficulty: 'hard'
});

// ❌ TypeScript détecte l'erreur
const game2 = new PongGame('pongCanvas', {
  gameMode: 'invalid_mode',  // Erreur : 'invalid_mode' n'est pas un gameMode valide
  aiDifficulty: 'super_hard' // Erreur : 'super_hard' n'existe pas
});
```

### Exemple 3 : Interface pour les données de match

**Fichier : `frontend/src/types/index.ts` (lignes 48-57)**

```typescript
export interface Match {
  id: number;
  player1: User;           // Pas juste un ID, mais un objet User complet
  player2: User;
  score1: number;
  score2: number;
  winner?: User;           // Optionnel car peut ne pas être déterminé
  created_at: string;
  game_type: 'pong' | 'pong_remote' | 'rps';  // Seulement ces 3 valeurs
}
```

**Ce que ça garantit :**
- `player1` et `player2` sont des objets `User`, pas juste des nombres
- `game_type` ne peut être que 'pong', 'pong_remote' ou 'rps'
- Impossible d'oublier une propriété requise

**Exemple dans le code :**

```typescript
async function fetchMatches(): Promise<Match[]> {
  const response = await fetch('/api/matches');
  const matches: Match[] = await response.json();

  // TypeScript garantit que matches est un tableau de Match
  matches.forEach(match => {
    console.log(`${match.player1.username} vs ${match.player2.username}`);
    // ✅ TypeScript sait que player1 a une propriété username
  });

  return matches;
}
```

### Exemple 4 : Classe AuthService avec types stricts

**Fichier : `frontend/src/services/auth.service.ts` (lignes 14-22)**

```typescript
export class AuthService {
  private readonly baseURL: string = 'https://localhost:8443/api';
  public currentUser: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokens();
  }
}
```

**Explications :**

1. **`private readonly baseURL`** :
   - `private` : Accessible uniquement dans la classe
   - `readonly` : Ne peut pas être modifié après l'initialisation
   - `string` : Type explicite

2. **`public currentUser: User | null`** :
   - `public` : Accessible depuis l'extérieur
   - `User | null` : Peut être soit un User, soit null (union type)

3. **`private accessToken: string | null`** :
   - Peut être une string ou null
   - TypeScript vérifie qu'on gère les deux cas

**Utilisation avec vérification de type :**

```typescript
// Dans auth.service.ts (ligne 58)
public isAuthenticated(): boolean {
  return !!this.accessToken && !!this.currentUser;
}

// Utilisation :
if (authService.isAuthenticated()) {
  // TypeScript sait que currentUser n'est pas null ici
  console.log(authService.currentUser.username);  // ✅ OK
}
```

### Exemple 5 : Méthode de connexion avec types

**Fichier : `frontend/src/services/auth.service.ts` (lignes 95-100)**

```typescript
public async login(username: string, password: string): Promise<User> {
  const response = await fetch(`${this.baseURL}/users/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // ...
```

**Analyse :**

1. **Paramètres typés** : `username: string, password: string`
   - TypeScript refuse si vous passez autre chose qu'une string

2. **Type de retour** : `Promise<User>`
   - La fonction retourne une Promise qui résout en un User
   - TypeScript vérifie qu'on retourne bien un User à la fin

**Exemple d'utilisation :**

```typescript
// ✅ Correct
const user = await authService.login("alice", "password123");
console.log(user.username);  // TypeScript sait que user est un User

// ❌ Erreurs détectées
await authService.login(123, "password");      // Erreur : 123 n'est pas une string
await authService.login("alice");              // Erreur : manque le password
const result = await authService.login("alice", "pass");
console.log(result.invalidProperty);           // Erreur : invalidProperty n'existe pas dans User
```

### Exemple 6 : Interface générique pour les réponses API

**Fichier : `frontend/src/types/index.ts` (lignes 1-6)**

```typescript
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}
```

**Explication :**

- `<T = any>` : C'est un **générique** avec une valeur par défaut
- `T` peut être remplacé par n'importe quel type
- Par défaut, `T = any` (si on ne spécifie pas)

**Utilisation pratique :**

```typescript
// Réponse contenant un User
const userResponse: ApiResponse<User> = {
  data: {
    id: 1,
    username: "alice",
    email: "alice@example.com"
  }
};

// Réponse contenant un tableau de Match
const matchesResponse: ApiResponse<Match[]> = {
  data: [
    { id: 1, player1: {...}, player2: {...}, score1: 10, score2: 5, ... }
  ]
};

// Réponse d'erreur (pas de data)
const errorResponse: ApiResponse = {
  error: "Utilisateur non trouvé"
};
```

### Exemple 7 : Types pour les messages WebSocket

**Fichier : `frontend/src/types/index.ts` (lignes 80-84)**

```typescript
export interface WSMessage {
  type: string;
  data: any;
  timestamp?: string;
}
```

**Utilisation dans le chat :**

```typescript
function handleWebSocketMessage(message: WSMessage): void {
  switch (message.type) {
    case 'chat_message':
      // TypeScript sait que message a un champ 'data'
      displayMessage(message.data);
      break;
    case 'user_joined':
      updateUserList(message.data);
      break;
    default:
      console.error('Unknown message type:', message.type);
  }
}

// ❌ TypeScript détecte l'erreur
const invalidMessage: WSMessage = {
  msg_type: 'chat'  // Erreur : devrait être 'type', pas 'msg_type'
};
```

### Exemple 8 : Extension des types avec `extends`

**Fichier : `frontend/src/types/index.ts` (lignes 25-29)**

```typescript
export interface UserProfile extends User {
  stats?: UserStats;
  friends?: User[];
  match_history?: Match[];
}
```

**Explication :**

- `UserProfile` **hérite** de toutes les propriétés de `User`
- Ajoute des propriétés supplémentaires spécifiques au profil

**Équivalent sans `extends` :**

```typescript
// Sans extends (répétitif)
interface UserProfile {
  id: number;           // Copié de User
  username: string;     // Copié de User
  email: string;        // Copié de User
  avatar?: string;      // Copié de User
  display_name?: string;// Copié de User
  online?: boolean;     // Copié de User
  stats?: UserStats;    // Nouveau
  friends?: User[];     // Nouveau
  match_history?: Match[]; // Nouveau
}

// Avec extends (DRY - Don't Repeat Yourself)
interface UserProfile extends User {
  stats?: UserStats;
  friends?: User[];
  match_history?: Match[];
}
```

---

## Configuration TypeScript

### Le fichier `tsconfig.json`

Le fichier `tsconfig.json` configure le compilateur TypeScript.

**Fichier : `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",                    // Version JavaScript cible
    "module": "ESNext",                    // Système de modules
    "lib": ["ES2020", "DOM", "DOM.Iterable"], // Bibliothèques disponibles

    /* Mode strict - Options de sécurité */
    "strict": true,                        // Active TOUS les checks stricts
    "noImplicitAny": true,                 // Interdit 'any' implicite
    "strictNullChecks": true,              // null et undefined sont des types distincts
    "strictFunctionTypes": true,           // Vérification stricte des fonctions
    "noUnusedLocals": true,                // Erreur si variable non utilisée
    "noUnusedParameters": true,            // Erreur si paramètre non utilisé

    /* Alias de chemins */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]                     // Permet d'écrire @/services/auth au lieu de ../../../services/auth
    }
  },
  "include": ["src/**/*.ts"]               // Fichiers à compiler
}
```

**Explications des options importantes :**

#### 1. `"strict": true`
Active toutes les vérifications strictes. C'est **fortement recommandé** mais rend le code plus verbeux.

**Exemple :**
```typescript
// Sans strict
function greet(name) {  // ✅ OK
  return "Hello " + name;
}

// Avec strict
function greet(name) {  // ❌ Erreur : Parameter 'name' implicitly has an 'any' type
  return "Hello " + name;
}

// Solution
function greet(name: string): string {  // ✅ OK
  return "Hello " + name;
}
```

#### 2. `"strictNullChecks": true`
Force à gérer explicitement `null` et `undefined`.

**Exemple :**
```typescript
interface User {
  id: number;
  username: string;
  email: string | null;  // Peut être null
}

const user: User = getUser();

// Sans strictNullChecks
console.log(user.email.toLowerCase());  // ✅ Compile (mais peut crasher si email est null!)

// Avec strictNullChecks
console.log(user.email.toLowerCase());  // ❌ Erreur : Object is possibly 'null'

// Solution : vérifier null
if (user.email !== null) {
  console.log(user.email.toLowerCase());  // ✅ OK
}
```

#### 3. `"noUnusedLocals": true`
Empêche les variables inutilisées (code propre).

**Exemple :**
```typescript
function calculate() {
  const result = 42;
  const unused = 100;  // ❌ Erreur : 'unused' is declared but its value is never read
  return result;
}
```

### Le fichier `package.json`

**Fichier : `frontend/package.json`**

```json
{
  "name": "ft-transcendence-frontend",
  "scripts": {
    "build": "tsc && vite build",    // 1. Compile TS → JS, 2. Build avec Vite
    "type-check": "tsc --noEmit"     // Vérifie les types sans générer de fichiers
  },
  "devDependencies": {
    "typescript": "^5.3.3",          // Le compilateur TypeScript
    "@types/node": "^20.10.0"        // Types pour Node.js
  }
}
```

**Commandes disponibles :**

```bash
# Vérifier les erreurs TypeScript (sans compiler)
npm run type-check

# Compiler TypeScript et builder le projet
npm run build
```

---

## Les avantages en pratique

### 1. Détection précoce des erreurs

**Scénario :** Vous modifiez l'interface `User` en renommant `username` en `userName`.

**Avec JavaScript :**
```javascript
// ❌ Le code compile
// ❌ Aucune erreur visible
// ❌ Le bug apparaît en production quand un utilisateur se connecte
console.log(user.username);  // undefined (bug silencieux)
```

**Avec TypeScript :**
```typescript
// ❌ Le code NE COMPILE PAS
// ✅ TypeScript affiche 50 erreurs pointant tous les endroits où 'username' est utilisé
// ✅ Vous corrigez TOUS les endroits avant même de tester
console.log(user.username);  // Erreur : Property 'username' does not exist on type 'User'
```

### 2. Refactoring en toute sécurité

**Scénario :** Vous changez la signature d'une fonction.

**Avant :**
```typescript
function sendMessage(userId: number, message: string): void { ... }
```

**Après :**
```typescript
function sendMessage(recipientId: number, content: string, priority: 'high' | 'normal'): void { ... }
```

**Avec JavaScript :**
- Vous devez chercher manuellement tous les appels à `sendMessage()`
- Risque d'en oublier
- Bugs en production

**Avec TypeScript :**
- TypeScript affiche automatiquement **tous** les appels qui ne correspondent plus
- Vous les corrigez un par un
- Impossible d'en oublier un

### 3. Documentation automatique

**TypeScript comme documentation :**

```typescript
// Pas besoin de commentaires, les types sont auto-documentés
interface CreateMatchRequest {
  player1Id: number;
  player2Id: number;
  gameType: 'pong' | 'pong_remote' | 'rps';
  maxScore?: number;  // Optionnel, défaut : 11
}

// Quiconque lit cette signature comprend immédiatement :
// - Quels paramètres sont requis
// - Quels types sont attendus
// - Ce qui est optionnel
async function createMatch(request: CreateMatchRequest): Promise<Match> { ... }
```

### 4. Autocomplétion intelligente

**Dans votre IDE (VS Code) :**

Quand vous tapez `user.`, l'IDE vous propose automatiquement :
- `id`
- `username`
- `email`
- `avatar`
- `display_name`
- `online`

**Sans TypeScript**, l'IDE ne peut pas deviner ce qui est disponible.

### 5. Prévention des bugs courants

#### Erreur 1 : Faute de frappe
```typescript
const user: User = getUser();
console.log(user.usrename);  // ❌ Erreur : Property 'usrename' does not exist
```

#### Erreur 2 : Mauvais type
```typescript
function setScore(score: number): void { ... }
setScore("10");  // ❌ Erreur : Argument of type 'string' is not assignable to parameter of type 'number'
```

#### Erreur 3 : Oubli de gérer null
```typescript
const email: string | null = user.email;
console.log(email.toLowerCase());  // ❌ Erreur : Object is possibly 'null'
```

#### Erreur 4 : Mauvaise utilisation d'un enum
```typescript
type GameType = 'pong' | 'pong_remote' | 'rps';
const game: GameType = 'chess';  // ❌ Erreur : Type '"chess"' is not assignable to type 'GameType'
```

---

## Comparaison finale : JavaScript vs TypeScript

### Le même code en JavaScript et TypeScript

#### JavaScript (sans types)

```javascript
// user.js
export class UserService {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
  }

  findUser(id) {
    return this.users.find(u => u.id === id);
  }

  updateUser(id, updates) {
    const user = this.findUser(id);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  }
}

// Utilisation
const service = new UserService();
service.addUser({ id: 1, name: "Alice" });
const user = service.findUser("1");  // ❌ Bug : "1" au lieu de 1
console.log(user.username);          // ❌ Bug : 'name' pas 'username'
```

**Problèmes :**
- Pas de vérification : le bug n'apparaît qu'à l'exécution
- Pas d'autocomplétion
- Pas de documentation

#### TypeScript (avec types)

```typescript
// user.ts
interface User {
  id: number;
  username: string;
  email: string;
}

export class UserService {
  private users: User[] = [];

  public addUser(user: User): void {
    this.users.push(user);
  }

  public findUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public updateUser(id: number, updates: Partial<User>): User | undefined {
    const user = this.findUser(id);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  }
}

// Utilisation
const service = new UserService();
service.addUser({ id: 1, username: "Alice", email: "alice@example.com" });  // ✅ Type vérifié
const user = service.findUser("1");   // ❌ ERREUR DE COMPILATION : "1" n'est pas un number
console.log(user.username);           // ✅ Autocomplétion + vérification
```

**Avantages :**
- ✅ Erreurs détectées à la compilation
- ✅ Autocomplétion complète
- ✅ Documentation intégrée
- ✅ Refactoring sécurisé

---

## Exercices pratiques

### Exercice 1 : Créer une interface

Créez une interface pour un message de chat :

```typescript
// TODO : Compléter l'interface
interface ChatMessage {
  // Un ID (nombre)
  // Un expéditeur (User)
  // Un contenu (string)
  // Un timestamp (string)
  // Un statut "lu" optionnel (boolean)
}

// Test
const message: ChatMessage = {
  id: 1,
  sender: { id: 5, username: "bob", email: "bob@example.com" },
  content: "Hello!",
  timestamp: "2024-01-15T10:30:00Z"
};
```

<details>
<summary>Solution</summary>

```typescript
interface ChatMessage {
  id: number;
  sender: User;
  content: string;
  timestamp: string;
  read?: boolean;
}
```
</details>

### Exercice 2 : Typer une fonction

Ajoutez les types à cette fonction JavaScript :

```typescript
// JavaScript (sans types)
function calculateWinRate(wins, losses) {
  const total = wins + losses;
  if (total === 0) return 0;
  return (wins / total) * 100;
}

// TODO : Ajouter les types
function calculateWinRate(...) {
  ...
}
```

<details>
<summary>Solution</summary>

```typescript
function calculateWinRate(wins: number, losses: number): number {
  const total: number = wins + losses;
  if (total === 0) return 0;
  return (wins / total) * 100;
}
```
</details>

### Exercice 3 : Créer un type union

Créez un type pour le statut d'un match :

```typescript
// TODO : Créer un type MatchStatus qui peut être :
// - 'pending' (en attente)
// - 'in_progress' (en cours)
// - 'completed' (terminé)
// - 'cancelled' (annulé)

type MatchStatus = ...;

// Test
const status1: MatchStatus = 'pending';      // ✅ OK
const status2: MatchStatus = 'in_progress';  // ✅ OK
const status3: MatchStatus = 'invalid';      // ❌ Erreur
```

<details>
<summary>Solution</summary>

```typescript
type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
```
</details>

---

## Ressources et conclusion

### Ressources pour aller plus loin

1. **Documentation officielle** : https://www.typescriptlang.org/docs/
2. **TypeScript Playground** : https://www.typescriptlang.org/play (pour tester du code)
3. **TypeScript Deep Dive** : https://basarat.gitbook.io/typescript/ (guide complet gratuit)

### Points clés à retenir

1. **TypeScript = JavaScript + Types** : Tout code JS valide est du code TS valide
2. **Compilation** : TypeScript se compile en JavaScript avant l'exécution
3. **Sécurité** : Les erreurs de type sont détectées à la compilation, pas à l'exécution
4. **Productivité** : Autocomplétion, refactoring sécurisé, documentation automatique
5. **Obligatoire pour ft_transcendence** : Le sujet l'impose pour les modules frontend

### Pourquoi c'est important pour vous

En apprenant TypeScript sur ce projet, vous :
- ✅ Maîtrisez une technologie très demandée en entreprise
- ✅ Développez des compétences de programmation plus rigoureuses
- ✅ Apprenez à gérer la complexité dans de gros projets
- ✅ Réduisez drastiquement les bugs en production
- ✅ Facilitez le travail en équipe

**Le sujet de ft_transcendence vous force à utiliser TypeScript pour une bonne raison : c'est une compétence essentielle pour devenir un développeur professionnel !**

---

**Documentation créée pour le projet ft_transcendence**
*Pour toute question, consultez le code source TypeScript dans `frontend/src/`*
