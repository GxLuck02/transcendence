# Théorie : Le Routeur SPA (Single Page Application)

## Table des matières
1. [Qu'est-ce qu'une SPA ?](#quest-ce-quune-spa-)
2. [Le concept de routing](#le-concept-de-routing)
3. [Architecture du Router dans notre projet](#architecture-du-router-dans-notre-projet)
4. [Comment fonctionne notre Router](#comment-fonctionne-notre-router)
5. [Exemples pratiques](#exemples-pratiques)
6. [Le cycle de vie d'une navigation](#le-cycle-de-vie-dune-navigation)

---

## Qu'est-ce qu'une SPA ?

### Définition simple
Une **SPA** (Single Page Application) est une application web qui fonctionne avec **une seule page HTML**. Au lieu de charger une nouvelle page complète à chaque fois que l'utilisateur clique sur un lien, la SPA met à jour dynamiquement le contenu de la page actuelle.

### Différence avec un site web classique

**Site web classique (multi-pages):**
```
Utilisateur clique sur "Accueil"  → Le serveur envoie accueil.html
Utilisateur clique sur "Profil"   → Le serveur envoie profil.html
Utilisateur clique sur "Chat"     → Le serveur envoie chat.html
```
→ **Résultat :** À chaque clic, toute la page se recharge (écran blanc, rechargement complet)

**Site web SPA:**
```
Utilisateur clique sur "Accueil"  → JavaScript change le contenu de la page
Utilisateur clique sur "Profil"   → JavaScript change le contenu de la page
Utilisateur clique sur "Chat"     → JavaScript change le contenu de la page
```
→ **Résultat :** La page ne se recharge jamais, seul le contenu change (navigation fluide)

### Avantages d'une SPA
- ✅ **Navigation ultra-rapide** : Pas de rechargement complet de la page
- ✅ **Expérience fluide** : Ressemble à une application native (comme une app mobile)
- ✅ **Moins de bande passante** : Seules les données nécessaires sont chargées
- ✅ **Meilleure expérience utilisateur** : Pas d'écran blanc entre les pages

---

## Le concept de routing

### Qu'est-ce qu'un routeur ?

Un **routeur** est comme un **GPS pour votre application**. Il:
1. Écoute les changements d'URL
2. Détermine quelle "page" afficher
3. Met à jour le contenu de la page en conséquence

### URL et routes dans une SPA

Dans notre projet, chaque "page" a une URL unique:
```
https://localhost/              → Page d'accueil
https://localhost/login         → Page de connexion
https://localhost/game/pong     → Page du jeu Pong
https://localhost/chat          → Page de chat
https://localhost/profile       → Page de profil
```

**Important:** Même si l'URL change, **on reste toujours sur la même page HTML** (`index.html`). C'est le JavaScript qui détecte le changement d'URL et change le contenu !

---

## Architecture du Router dans notre projet

### Structure de base

Notre routeur est défini dans le fichier `frontend/src/main.ts` et prend la forme d'une **classe TypeScript**:

```typescript
class Router {
  private routes: Record<string, () => void>;

  constructor() {
    this.routes = {
      '/': this.homePage.bind(this),
      '/login': this.loginPage.bind(this),
      '/register': this.registerPage.bind(this),
      '/game/pong': this.pongPage.bind(this),
      '/chat': this.chatPage.bind(this),
      '/profile': this.profilePage.bind(this),
      '/tournament': this.tournamentPage.bind(this),
      '/stats': this.statsPage.bind(this),
    };

    this.init();
  }
}
```

### Explication ligne par ligne

#### 1. La déclaration de la classe
```typescript
class Router {
```
On crée une classe appelée `Router` qui va contenir toute la logique de navigation.

#### 2. Les routes (l'annuaire des pages)
```typescript
private routes: Record<string, () => void>;
```
C'est comme un **annuaire téléphonique** pour nos pages:
- La **clé** est le chemin (ex: `/login`)
- La **valeur** est une fonction qui affiche la page

#### 3. Le constructeur (l'initialisation)
```typescript
constructor() {
  this.routes = {
    '/': this.homePage.bind(this),      // Quand on va sur "/", on appelle homePage()
    '/login': this.loginPage.bind(this), // Quand on va sur "/login", on appelle loginPage()
    // ...etc
  };

  this.init(); // On démarre le routeur
}
```

Le `.bind(this)` est important : il permet à la fonction d'accéder aux propriétés de la classe `Router`.

---

## Comment fonctionne notre Router

### 1. L'initialisation (`init()`)

Quand l'application démarre, la méthode `init()` est appelée:

```typescript
private init(): void {
  // 1. Gérer les clics sur les liens
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.matches('[data-route]')) {
      e.preventDefault();
      const route = target.getAttribute('data-route') || '/';
      this.navigateTo(route);
    }
  });

  // 2. Gérer les boutons Précédent/Suivant du navigateur
  window.addEventListener('popstate', () => {
    this.loadRoute();
  });

  // 3. Charger la première page
  this.loadRoute();
}
```

#### Explication détaillée:

##### A. Interception des clics
```typescript
document.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.matches('[data-route]')) {
    e.preventDefault(); // Empêche le rechargement de la page
    const route = target.getAttribute('data-route') || '/';
    this.navigateTo(route); // Navigue vers la nouvelle route
  }
});
```

**Que se passe-t-il ?**
1. On écoute **tous les clics** sur la page
2. Si l'élément cliqué a l'attribut `data-route` (par exemple: `<a data-route="/login">`)
3. On empêche le comportement par défaut du lien (qui rechargerait la page)
4. On appelle `navigateTo()` pour changer de page sans rechargement

**Exemple dans le code HTML:**
```html
<a href="/login" data-route="/login">Se connecter</a>
```
Quand on clique dessus, au lieu de recharger la page, le routeur intercepte le clic et change juste le contenu.

##### B. Boutons Précédent/Suivant
```typescript
window.addEventListener('popstate', () => {
  this.loadRoute();
});
```

**Que se passe-t-il ?**
- Quand l'utilisateur clique sur "Précédent" ou "Suivant" dans son navigateur
- L'événement `popstate` est déclenché
- On appelle `loadRoute()` pour charger la page correspondante

##### C. Chargement initial
```typescript
this.loadRoute();
```
Charge la page correspondant à l'URL actuelle au démarrage de l'application.

---

### 2. La navigation (`navigateTo()`)

```typescript
public navigateTo(route: string): void {
  history.pushState(null, '', route); // Change l'URL dans la barre d'adresse
  this.loadRoute();                    // Charge la nouvelle page
}
```

**Exemple concret:**
```typescript
// L'utilisateur clique sur le lien "Profil"
router.navigateTo('/profile');

// 1. L'URL dans la barre d'adresse devient: https://localhost/profile
// 2. La fonction loadRoute() est appelée
// 3. Le contenu de la page est remplacé par le profil
```

**`history.pushState()`** : Cette fonction magique du navigateur permet de changer l'URL **sans recharger la page**. C'est le cœur de la SPA !

---

### 3. Le chargement d'une route (`loadRoute()`)

```typescript
private loadRoute(): void {
  const path = window.location.pathname;           // Récupère l'URL actuelle
  const handler = this.routes[path] || this.notFound.bind(this); // Trouve la fonction correspondante

  this.cleanup();                                  // Nettoie les ressources de la page précédente

  // Met à jour le menu de navigation
  document.querySelectorAll('#main-nav a').forEach((link) => {
    link.classList.remove('active');
    const linkRoute = link.getAttribute('data-route');
    if (linkRoute === path) {
      link.classList.add('active');                // Surligne le lien actif
    }
  });

  handler();                                       // Affiche la nouvelle page
}
```

**Étape par étape:**

1. **Récupérer le chemin actuel**
   ```typescript
   const path = window.location.pathname; // Ex: "/profile"
   ```

2. **Trouver la fonction à appeler**
   ```typescript
   const handler = this.routes[path] || this.notFound.bind(this);
   // Si le chemin existe → on prend la fonction associée
   // Sinon → on affiche la page 404
   ```

3. **Nettoyer la page précédente**
   ```typescript
   this.cleanup(); // Arrête les jeux, ferme les connexions WebSocket, etc.
   ```

4. **Mettre à jour le menu**
   - Retire la classe `active` de tous les liens
   - Ajoute la classe `active` au lien de la page actuelle

5. **Afficher la nouvelle page**
   ```typescript
   handler(); // Appelle la fonction (ex: profilePage())
   ```

---

### 4. Le nettoyage (`cleanup()`)

Avant d'afficher une nouvelle page, il faut **nettoyer** les ressources de l'ancienne page:

```typescript
private cleanup(): void {
  // Nettoyer le chat
  if (this.currentChatClient) {
    this.currentChatClient.cleanup();
    this.currentChatClient = null;
  }

  // Arrêter le jeu Pong
  if (this.currentPongGame) {
    if (this.currentPongGame.destroy) {
      this.currentPongGame.destroy();
    }
    this.currentPongGame = null;
  }

  // Arrêter les intervalles de matchmaking
  if (this.matchmakingInterval !== null) {
    clearInterval(this.matchmakingInterval);
    this.matchmakingInterval = null;
  }

  // Réinitialiser le jeu Pierre-Feuille-Ciseaux
  rpsGame.reset();
}
```

**Pourquoi c'est important ?**
- Si on ne nettoie pas, les ressources s'accumulent
- Les connexions WebSocket restent ouvertes
- Les intervalles continuent de tourner
- Les jeux continuent de s'exécuter en arrière-plan
- → **Fuites mémoire** et bugs !

---

## Exemples pratiques

### Exemple 1: Page d'accueil simple

```typescript
private homePage(): void {
  const content = document.getElementById('content');
  if (!content) return;

  const user = authService.currentUser;
  const greeting = user
    ? `Bienvenue, ${user.display_name} !`
    : 'Bienvenue sur ft_transcendence';

  content.innerHTML = `
    <div class="home">
      <h2>${greeting}</h2>
      <p>Le meilleur site de tournoi Pong en ligne !</p>
      <div class="home-actions">
        ${!authService.isAuthenticated() ? `
          <a href="/login" data-route="/login" class="btn btn-primary">
            Se connecter
          </a>
        ` : `
          <a href="/game/pong" data-route="/game/pong" class="btn btn-primary">
            Jouer au Pong
          </a>
        `}
      </div>
    </div>
  `;
}
```

**Étapes:**
1. On récupère le conteneur `#content` (la zone où on affiche le contenu)
2. On vérifie si l'utilisateur est connecté
3. On génère le HTML en fonction de l'état de connexion
4. On injecte le HTML dans le conteneur

### Exemple 2: Page de connexion avec formulaire

```typescript
private loginPage(): void {
  const content = document.getElementById('content');
  if (!content) return;

  // 1. Afficher le formulaire
  content.innerHTML = `
    <div class="auth-container">
      <h2>Connexion</h2>
      <form id="login-form">
        <input type="text" id="username" name="username" placeholder="Nom d'utilisateur" required>
        <input type="password" id="password" name="password" placeholder="Mot de passe" required>
        <button type="submit" class="btn btn-primary">Se connecter</button>
      </form>
      <div id="error-message" class="error-message"></div>
    </div>
  `;

  // 2. Ajouter l'événement de soumission
  const form = document.getElementById('login-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const errorDiv = document.getElementById('error-message');

    try {
      await authService.login(username, password);
      this.navigateTo('/'); // Redirection vers l'accueil en cas de succès
    } catch (error) {
      if (errorDiv) {
        errorDiv.textContent = (error as Error).message;
      }
    }
  });
}
```

**Étapes:**
1. On affiche le formulaire HTML
2. On récupère le formulaire avec `getElementById`
3. On ajoute un écouteur d'événement sur la soumission
4. Quand le formulaire est soumis:
   - On empêche le rechargement de la page (`e.preventDefault()`)
   - On récupère les valeurs du formulaire
   - On appelle le service d'authentification
   - En cas de succès, on redirige vers l'accueil
   - En cas d'erreur, on affiche le message d'erreur

### Exemple 3: Page avec gestion d'état complexe (Chat)

```typescript
private chatPage(): void {
  if (!authService.isAuthenticated()) {
    this.navigateTo('/login'); // Redirection si pas connecté
    return;
  }

  const content = document.getElementById('content');
  if (!content) return;

  // 1. Afficher l'interface
  content.innerHTML = `
    <div class="chat-page">
      <h2>Chat</h2>
      <div class="chat-messages" id="chat-global-messages"></div>
      <form id="chat-global-form">
        <input type="text" id="chat-global-input" placeholder="Votre message..." />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  `;

  // 2. Initialiser le client de chat
  this.initGlobalChat();

  // 3. Configurer les événements
  this.setupChatEvents();

  // 4. Charger les données
  void this.loadChatSidebarData();
}
```

**Particularités:**
- Vérification d'authentification au début
- Initialisation d'un client WebSocket pour le chat
- Chargement asynchrone des données
- Configuration d'événements complexes

---

## Le cycle de vie d'une navigation

Voici ce qui se passe quand un utilisateur clique sur un lien:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Utilisateur clique sur <a data-route="/profile">Profil</a>  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. L'événement 'click' est capturé par le router               │
│    → document.addEventListener('click', ...)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. e.preventDefault() empêche le rechargement                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. navigateTo('/profile') est appelé                            │
│    → history.pushState(null, '', '/profile')                    │
│    → L'URL devient: https://localhost/profile                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. loadRoute() est appelé                                       │
│    → const path = window.location.pathname  // "/profile"       │
│    → const handler = this.routes['/profile'] // profilePage()   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. cleanup() nettoie la page précédente                         │
│    → Arrête les jeux, ferme les connexions, etc.               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Mise à jour du menu de navigation                            │
│    → Retire 'active' des autres liens                           │
│    → Ajoute 'active' au lien "/profile"                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. handler() affiche la nouvelle page                           │
│    → profilePage() est exécuté                                  │
│    → Le HTML du profil est injecté dans #content                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Concepts avancés utilisés

### 1. History API

L'API History du navigateur permet de manipuler l'historique de navigation:

```typescript
// Ajouter une nouvelle entrée dans l'historique
history.pushState(null, '', '/profile');

// Écouter les changements d'historique (boutons Précédent/Suivant)
window.addEventListener('popstate', () => {
  // Charger la page correspondante
});
```

**Fonctionnement:**
- `pushState()` change l'URL **sans recharger la page**
- L'historique du navigateur est mis à jour (les boutons Précédent/Suivant fonctionnent)
- `popstate` se déclenche quand l'utilisateur utilise ces boutons

### 2. Event Delegation (Délégation d'événements)

Au lieu d'ajouter un écouteur sur chaque lien, on écoute **tous les clics** sur le document:

```typescript
document.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.matches('[data-route]')) {
    // C'est un lien de navigation
  }
});
```

**Avantages:**
- ✅ Un seul écouteur au lieu de dizaines
- ✅ Fonctionne même pour les liens ajoutés dynamiquement
- ✅ Meilleures performances

### 3. Gestion d'état

Le routeur garde en mémoire certaines informations:

```typescript
private currentChatClient: any = null;        // Client de chat actif
private currentPongGame: any = null;          // Jeu en cours
private matchmakingInterval: number | null = null; // Intervalle de polling
private activeConversationUserId: number | null = null; // Conversation active
```

Ces variables permettent de:
- Savoir ce qui est actif
- Nettoyer correctement lors du changement de page
- Restaurer l'état si nécessaire

---

## Résumé

### Ce qu'il faut retenir

1. **SPA = Une seule page HTML** qui change dynamiquement son contenu
2. **Le Router est le GPS** de l'application
3. **Les routes sont comme un annuaire** : chemin → fonction
4. **La navigation se fait en 3 étapes:**
   - Changer l'URL avec `history.pushState()`
   - Trouver la fonction correspondante
   - Afficher le contenu
5. **Le nettoyage est crucial** pour éviter les fuites mémoire
6. **L'interception des clics** permet d'éviter les rechargements de page

### Schéma mental simple

```
Utilisateur clique
    ↓
Router intercepte
    ↓
Change l'URL (sans recharger)
    ↓
Nettoie l'ancienne page
    ↓
Trouve la bonne fonction
    ↓
Affiche la nouvelle page
    ↓
Application toujours fluide !
```

---

## Pour aller plus loin

### Questions à se poser

1. **Que se passe-t-il si on désactive JavaScript ?**
   → La SPA ne fonctionne plus ! C'est pour ça qu'on a besoin d'un serveur qui gère aussi les routes.

2. **Comment gérer le SEO (référencement) ?**
   → Les SPA ont des défis de SEO car le contenu est généré dynamiquement. Solutions : Server-Side Rendering (SSR) ou pré-rendering.

3. **Peut-on avoir des routes imbriquées ?**
   → Oui ! On peut avoir `/game/pong/matchmaking` comme dans notre projet.

4. **Comment gérer l'authentification ?**
   → Vérifier au début de chaque page si l'utilisateur est connecté (comme dans `chatPage()`)

### Exercices pratiques

1. **Ajouter une nouvelle route**
   ```typescript
   // 1. Dans le constructor, ajouter:
   '/about': this.aboutPage.bind(this),

   // 2. Créer la méthode:
   private aboutPage(): void {
     const content = document.getElementById('content');
     if (!content) return;
     content.innerHTML = `<h2>À propos</h2>`;
   }
   ```

2. **Passer des paramètres dans l'URL**
   ```typescript
   // URL: /user/123
   // Extraire l'ID:
   const parts = path.split('/');
   const userId = parts[2]; // "123"
   ```

3. **Rediriger automatiquement**
   ```typescript
   if (!authService.isAuthenticated()) {
     this.navigateTo('/login');
     return;
   }
   ```

---

**Documentation créée pour le projet ft_transcendence**
*Pour toute question, consultez le code source dans `frontend/src/main.ts`*
