# Théorie : WebSocket - Communication Temps Réel

## Table des matières
1. [Qu'est-ce que WebSocket ?](#quest-ce-que-websocket-)
2. [WebSocket vs HTTP : La différence fondamentale](#websocket-vs-http--la-différence-fondamentale)
3. [Pourquoi WebSocket dans ft_transcendence ?](#pourquoi-websocket-dans-ft_transcendence-)
4. [Comment fonctionne WebSocket](#comment-fonctionne-websocket)
5. [Exemple 1 : Chat en temps réel](#exemple-1--chat-en-temps-réel)
6. [Exemple 2 : Pong Remote](#exemple-2--pong-remote)
7. [Gestion des erreurs et reconnexion](#gestion-des-erreurs-et-reconnexion)
8. [Sécurité WebSocket](#sécurité-websocket)

---

## Qu'est-ce que WebSocket ?

### Définition simple

**WebSocket** est un protocole de communication qui permet un **échange de données bidirectionnel** entre un client (navigateur) et un serveur en **temps réel**.

### L'analogie du téléphone

Imaginez deux façons de communiquer :

**HTTP (approche classique) :**
```
Vous ──┐
       │ Question → Serveur
       │ ← Réponse ──┘
       │
       │ Nouvelle question → Serveur
       │ ← Réponse ──────────┘
       │
       │ (À chaque fois, vous devez reposer la question)
```
→ C'est comme envoyer des **lettres postales** : un aller-retour à chaque fois

**WebSocket :**
```
Vous ←──────────────────────→ Serveur
     (connexion permanente)

     Vous → Message → Serveur
     Vous ← Message ← Serveur
     Vous → Message → Serveur
     ...
     (Les deux peuvent parler quand ils veulent)
```
→ C'est comme un **appel téléphonique** : connexion ouverte, communication instantanée

### Caractéristiques clés

| Aspect | HTTP | WebSocket |
|--------|------|-----------|
| **Type** | Requête-Réponse | Bidirectionnel |
| **Connexion** | Nouvelle à chaque fois | Persistante |
| **Latence** | Élevée (100-500ms) | Très faible (1-10ms) |
| **Surcharge** | Headers à chaque requête | Minimal après connexion |
| **Initiation** | Toujours par le client | Client OU serveur |
| **Cas d'usage** | Pages web, API REST | Chat, jeux, live updates |

---

## WebSocket vs HTTP : La différence fondamentale

### Scénario : Chat en temps réel

#### Avec HTTP (polling)

```typescript
// ❌ Mauvaise approche : Polling HTTP
setInterval(async () => {
  // Demander au serveur toutes les secondes : "Y a-t-il de nouveaux messages ?"
  const response = await fetch('/api/messages');
  const messages = await response.json();
  displayMessages(messages);
}, 1000);
```

**Problèmes :**
- 🔴 Requête toutes les secondes même s'il n'y a rien de nouveau
- 🔴 Surcharge réseau énorme (headers HTTP à chaque fois)
- 🔴 Latence : au pire, un message prend 1 seconde à arriver
- 🔴 Surcharge serveur : des milliers de requêtes inutiles

**Diagramme :**
```
Client                          Serveur
  │                                │
  ├─ GET /messages ──────────────→ │  (Requête 1)
  │ ←─────────────────── [] ───────┤  (Pas de nouveaux messages)
  │                                │
  ├─ GET /messages ──────────────→ │  (Requête 2, 1s plus tard)
  │ ←─────────────────── [] ───────┤  (Toujours rien)
  │                                │
  ├─ GET /messages ──────────────→ │  (Requête 3)
  │ ←───── [msg: "Hello"] ─────────┤  (Enfin un message !)
  │                                │
```

#### Avec WebSocket

```typescript
// ✅ Bonne approche : WebSocket
const socket = new WebSocket('wss://localhost/ws/chat');

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  displayMessage(message);  // Affichage instantané !
};

socket.send(JSON.stringify({ content: 'Hello!' }));
```

**Avantages :**
- ✅ Connexion permanente : pas de requêtes répétées
- ✅ Latence ultra-faible : < 10ms
- ✅ Le serveur envoie les données dès qu'elles arrivent
- ✅ Pas de surcharge réseau

**Diagramme :**
```
Client                          Serveur
  │                                │
  ├─ Connexion WebSocket ─────────→│  (Une seule fois)
  │ ←─────────────────────────────┤  (Connexion établie)
  │                                │
  │ ← Message: "Hello" ────────────┤  (Envoyé immédiatement)
  │                                │
  ├─ Message: "Hi!" ──────────────→│  (Envoyé immédiatament)
  │                                │
```

### Comparaison de bande passante

**Scénario :** 100 utilisateurs dans un chat pendant 1 minute

#### HTTP Polling (1 requête/seconde)
```
100 utilisateurs × 60 secondes × 1 requête = 6000 requêtes

Headers HTTP par requête ≈ 500 bytes
Total headers : 6000 × 500 = 3 MB
→ 3 MB de données inutiles !
```

#### WebSocket
```
100 utilisateurs × 1 connexion = 100 connexions

Headers initiaux : 100 × 500 bytes = 50 KB
Ensuite : seulement les messages utiles
→ 50 KB seulement pour établir les connexions !

Économie : 3 MB - 50 KB = 2.95 MB économisés (98% moins de données)
```

---

## Pourquoi WebSocket dans ft_transcendence ?

### Modules du projet utilisant WebSocket

Dans ft_transcendence, WebSocket est **indispensable** pour deux modules majeurs :

#### 1. **Live Chat** (Module majeur - 10 points)
```
Chat global en temps réel :
├─ Messages instantanés
├─ Liste des utilisateurs connectés
├─ Indicateurs de saisie ("Alice est en train d'écrire...")
└─ Notifications
```

**Sans WebSocket :** Impossible d'avoir un chat en "temps réel". Les messages auraient un délai énorme.

#### 2. **Remote Players** (Module majeur - 10 points)
```
Pong multijoueur distant :
├─ Synchronisation des positions des raquettes
├─ Synchronisation de la balle
├─ Mise à jour des scores
└─ Détection de déconnexion
```

**Sans WebSocket :** Le jeu serait injouable à cause de la latence. Imaginez jouer à Pong avec 500ms de délai !

### Cas d'usage dans le projet

| Fonctionnalité | Pourquoi WebSocket est nécessaire |
|----------------|-----------------------------------|
| **Chat global** | Messages doivent apparaître instantanément pour tous |
| **Messages privés** | Notifications en temps réel |
| **Pong remote** | Synchronisation à 60 FPS (16ms par frame) |
| **Utilisateurs en ligne** | Mise à jour live de la liste |
| **Indicateurs de saisie** | "Alice est en train d'écrire..." |
| **Matchmaking** | Notification instantanée quand un adversaire est trouvé |

---

## Comment fonctionne WebSocket

### Le protocole WebSocket

WebSocket utilise le protocole **ws://** (ou **wss://** pour sécurisé, équivalent HTTPS).

```
HTTP :  http://localhost:8443/api/users
HTTPS : https://localhost:8443/api/users

WebSocket :  ws://localhost:8443/ws/chat
WebSocket sécurisé : wss://localhost:8443/ws/chat
```

### Le Handshake (poignée de main)

Avant d'établir une connexion WebSocket, le client et le serveur font un **handshake HTTP** :

**1. Le client envoie une requête HTTP spéciale :**
```http
GET /ws/chat HTTP/1.1
Host: localhost:8443
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

**Points clés :**
- `Upgrade: websocket` : "Je veux passer en WebSocket"
- `Sec-WebSocket-Key` : Clé aléatoire pour la sécurité
- `Sec-WebSocket-Version: 13` : Version du protocole

**2. Le serveur répond :**
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

**Points clés :**
- `101 Switching Protocols` : "OK, passons en WebSocket"
- `Sec-WebSocket-Accept` : Clé dérivée pour valider le handshake

**3. Connexion établie :**
```
À partir de maintenant, le client et le serveur peuvent
s'envoyer des messages librement sans nouveau handshake.
```

### Cycle de vie d'une connexion WebSocket

```
┌─────────────────────────────────────────────────────────┐
│ 1. Client crée une WebSocket                           │
│    const socket = new WebSocket('wss://localhost/ws')  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Handshake HTTP (Upgrade vers WebSocket)             │
│    Client → Serveur : "Upgrade: websocket"             │
│    Serveur → Client : "101 Switching Protocols"        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. onopen déclenché                                     │
│    socket.onopen = () => { ... }                        │
│    → Connexion établie                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Échange de messages (bidirectionnel)                │
│    Client ←──────────────────────→ Serveur             │
│    socket.send(...)     socket.onmessage(...)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Fermeture de la connexion                           │
│    socket.close() OU déconnexion réseau                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. onclose déclenché                                    │
│    socket.onclose = () => { ... }                       │
│    → Connexion fermée                                   │
└─────────────────────────────────────────────────────────┘
```

### États d'une WebSocket

Une WebSocket a 4 états possibles (propriété `readyState`) :

```typescript
WebSocket.CONNECTING (0) : Connexion en cours
WebSocket.OPEN (1)       : Connexion établie, prêt à communiquer
WebSocket.CLOSING (2)    : Fermeture en cours
WebSocket.CLOSED (3)     : Connexion fermée
```

**Vérification avant d'envoyer un message :**
```typescript
if (socket.readyState === WebSocket.OPEN) {
  socket.send('Hello!');  // ✅ OK
} else {
  console.error('Socket not ready');  // ❌ Erreur
}
```

---

## Exemple 1 : Chat en temps réel

Voyons comment le chat utilise WebSocket dans notre projet.

### Architecture du chat

```
Frontend (Browser)          Backend (Fastify)         Database
       │                            │                      │
       ├─ WebSocket /ws/chat/ ────→│                      │
       │ ←───────────────────────── │ (Connexion établie) │
       │                            │                      │
       ├─ { type: 'authenticate',  │                      │
       │    token: 'JWT...' } ─────→│                      │
       │                            ├─ Vérifier JWT ──────→│
       │                            │ ←────────────────────┤
       │ ←─ { type: 'authenticated',│                      │
       │      user: {...} } ─────────┤                      │
       │                            │                      │
       ├─ { type: 'global_message',│                      │
       │    content: 'Hello!' } ───→│                      │
       │                            ├─ Broadcast à tous ──→│
       │                            │                      │
       │ ←─ { type: 'global_message',                     │
       │      sender: 'Alice',      │                      │
       │      content: 'Hi!' } ─────┤                      │
```

### Code Frontend : Connexion au chat

**Fichier : `frontend/src/services/chat.service.ts` (lignes 37-85)**

```typescript
export class ChatClient {
  private socket: WebSocket | null = null;
  private connected: boolean = false;

  public connect(): void {
    // 1. Déterminer le protocole (ws ou wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/`;

    console.log('Connecting to chat WebSocket:', wsUrl);

    try {
      // 2. Créer la WebSocket
      this.socket = new WebSocket(wsUrl);

      // 3. Événement : Connexion établie
      this.socket.onopen = () => {
        console.log('✅ Chat WebSocket connected');
        this.connected = true;

        // 4. Authentification avec JWT
        const token = authService.getAccessToken();
        if (token && this.socket) {
          this.socket.send(JSON.stringify({
            type: 'authenticate',
            token: token
          }));
          console.log('Sent authentication token');
        }
      };

      // 5. Événement : Réception de message
      this.socket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data) as ChatWSMessage;
        this.handleMessage(data);
      };

      // 6. Événement : Erreur
      this.socket.onerror = (error: Event) => {
        console.error('❌ Chat WebSocket error:', error);
        this.showSystemMessage('Erreur de connexion au chat', 'error');
      };

      // 7. Événement : Déconnexion
      this.socket.onclose = () => {
        console.log('Chat WebSocket closed');
        this.connected = false;
        this.showSystemMessage('Déconnecté du chat', 'warning');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }
}
```

**Explications étape par étape :**

#### 1. Déterminer le protocole
```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
```
- Si le site est en HTTPS → utiliser **wss://** (WebSocket sécurisé)
- Sinon → utiliser **ws://**
- **Important :** wss:// est obligatoire avec HTTPS (sécurité du navigateur)

#### 2. Créer la WebSocket
```typescript
this.socket = new WebSocket(wsUrl);
```
- Crée un objet WebSocket
- Lance automatiquement le handshake
- Ne bloque pas : le code continue pendant la connexion

#### 3-7. Les événements WebSocket

Il y a **4 événements principaux** :

| Événement | Quand | Usage |
|-----------|-------|-------|
| `onopen` | Connexion établie | Envoyer l'authentification, initialiser |
| `onmessage` | Message reçu | Traiter les données |
| `onerror` | Erreur réseau | Logger, afficher un message d'erreur |
| `onclose` | Connexion fermée | Cleanup, tentative de reconnexion |

### Envoi de message

**Fichier : `chat.service.ts` (lignes 166-188)**

```typescript
public sendMessage(message: string): boolean {
  // 1. Vérifier que la connexion est établie
  if (!this.connected || !this.socket) {
    this.showSystemMessage('Non connecté au chat', 'error');
    return false;
  }

  // 2. Vérifier que le message n'est pas vide
  if (!message || message.trim() === '') {
    return false;
  }

  try {
    // 3. Créer l'objet de message
    const outgoingMessage: ChatOutgoingMessage = {
      type: 'global_message',
      content: message.trim(),
    };

    // 4. Sérialiser en JSON et envoyer
    this.socket.send(JSON.stringify(outgoingMessage));
    return true;
  } catch (error) {
    console.error('Failed to send message:', error);
    this.showSystemMessage("Erreur lors de l'envoi du message", 'error');
    return false;
  }
}
```

**Points clés :**
- Toujours vérifier `this.connected` avant d'envoyer
- Les messages sont **toujours en JSON** (convention du projet)
- `socket.send()` envoie des strings (pas d'objets directs)

### Réception de messages

**Fichier : `chat.service.ts` (lignes 95-164)**

```typescript
private handleMessage(data: ChatWSMessage): void {
  switch (data.type) {
    case 'authenticated':
      // L'authentification a réussi
      console.log('✅ Authentication successful:', data.user);
      this.showSystemMessage('Authentifié au chat');
      break;

    case 'auth_error':
      // L'authentification a échoué
      console.error('❌ Authentication failed:', data.message);
      this.showSystemMessage(`Erreur d'authentification`, 'error');
      break;

    case 'global_message':
      // Nouveau message de chat
      if (data.sender && data.content) {
        this.displayMessage(data.sender.display_name, data.content);
      }
      break;

    case 'user_list':
      // Liste des utilisateurs en ligne
      if (data.users) {
        this.connectedUsers.clear();
        data.users.forEach(user => {
          this.connectedUsers.add(user.display_name);
        });
        this.updateUserList();
      }
      break;

    case 'user_joined':
      // Un utilisateur a rejoint
      if (data.username) {
        this.connectedUsers.add(data.username);
        this.updateUserList();
        this.showSystemMessage(`${data.username} a rejoint le chat`);
      }
      break;

    case 'user_left':
      // Un utilisateur a quitté
      if (data.username) {
        this.connectedUsers.delete(data.username);
        this.updateUserList();
        this.showSystemMessage(`${data.username} a quitté le chat`);
      }
      break;

    case 'error':
      this.showSystemMessage(`Erreur: ${data.message}`, 'error');
      break;

    default:
      console.log('Unknown message type:', data);
  }
}
```

**Pattern utilisé : Type-based routing**

Les messages WebSocket ont un champ `type` qui détermine le traitement :
```typescript
{ type: 'global_message', content: 'Hello' }  → Afficher le message
{ type: 'user_joined', username: 'Alice' }    → Mettre à jour la liste
{ type: 'error', message: 'Erreur...' }       → Afficher l'erreur
```

### Code Backend : Gestion du chat

**Fichier : `fastify-backend/src/websockets/chat.js` (lignes 6-104)**

```javascript
// Map pour stocker les connexions actives
const chatConnections = new Map(); // userId -> socket

export default async function chatWebSocket(app) {
  // Route WebSocket
  app.get('/ws/chat/', { websocket: true }, (connection, req) => {
    const { socket } = connection;
    let userId = null;

    // Réception de message
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'authenticate':
            // 1. Vérifier le JWT
            try {
              const decoded = app.jwt.verify(data.token);
              userId = decoded.userId;

              // 2. Stocker la connexion
              chatConnections.set(userId, socket);

              // 3. Marquer l'utilisateur comme en ligne
              db.prepare('UPDATE users SET is_online = 1 WHERE id = ?')
                .run(userId);

              // 4. Récupérer les infos utilisateur
              const user = db.prepare(
                'SELECT id, username, display_name FROM users WHERE id = ?'
              ).get(userId);

              // 5. Confirmer l'authentification
              socket.send(JSON.stringify({
                type: 'authenticated',
                user: user
              }));

              // 6. Envoyer la liste des utilisateurs à tous
              broadcastUserList();
            } catch (error) {
              socket.send(JSON.stringify({
                type: 'auth_error',
                message: 'Invalid token'
              }));
            }
            break;

          case 'global_message':
            // 1. Vérifier l'authentification
            if (!userId) {
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            // 2. Récupérer les infos de l'expéditeur
            const sender = db.prepare(
              'SELECT id, username, display_name FROM users WHERE id = ?'
            ).get(userId);

            // 3. Créer le message
            const messagePayload = {
              type: 'global_message',
              sender: sender,
              content: data.content,
              timestamp: new Date().toISOString()
            };

            // 4. Envoyer à tous les utilisateurs connectés
            broadcastToAll(messagePayload);
            break;
        }
      } catch (error) {
        console.error('Error handling chat message:', error);
      }
    });

    // Déconnexion
    socket.on('close', () => {
      if (userId) {
        // 1. Retirer de la map
        chatConnections.delete(userId);

        // 2. Marquer comme hors ligne
        db.prepare(
          'UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(userId);

        // 3. Mettre à jour la liste pour tous
        broadcastUserList();
      }
    });
  });
}

// Fonction helper : Broadcast à tous
function broadcastToAll(message, excludeUserId = null) {
  const data = JSON.stringify(message);
  chatConnections.forEach((socket, uid) => {
    if (uid !== excludeUserId && socket.readyState === 1) {
      socket.send(data);
    }
  });
}

// Fonction helper : Envoyer la liste des utilisateurs
function broadcastUserList() {
  const onlineUsers = db.prepare(`
    SELECT id, username, display_name
    FROM users
    WHERE is_online = 1
    ORDER BY display_name
  `).all();

  const message = {
    type: 'user_list',
    users: onlineUsers
  };

  broadcastToAll(message);
}
```

**Points clés du backend :**

#### 1. Stockage des connexions
```javascript
const chatConnections = new Map(); // userId -> socket
```
- **Map** JavaScript pour associer userId → socket
- Permet d'envoyer des messages à des utilisateurs spécifiques

#### 2. Vérification du readyState
```javascript
if (socket.readyState === 1) {  // 1 = OPEN
  socket.send(data);
}
```
- Vérifier que la socket est ouverte avant d'envoyer
- Évite les erreurs si l'utilisateur s'est déconnecté

#### 3. Broadcasting
```javascript
function broadcastToAll(message, excludeUserId = null) {
  chatConnections.forEach((socket, uid) => {
    if (uid !== excludeUserId) {
      socket.send(JSON.stringify(message));
    }
  });
}
```
- Envoyer un message à **tous** les utilisateurs connectés
- Possibilité d'exclure l'expéditeur

---

## Exemple 2 : Pong Remote

Le jeu Pong en ligne utilise WebSocket pour synchroniser les positions en temps réel.

### Architecture Pong Remote

```
Player 1 (Host)         Backend (Fastify)         Player 2 (Guest)
       │                        │                         │
       ├─ WS /ws/pong/ROOM123 ─→│                         │
       │ ←──────────────────────┤ (Assigné comme Player 1)│
       │                        │                         │
       │                        │ ←─ WS /ws/pong/ROOM123 ─┤
       │                        ├────────────────────────→│
       │                        │   (Assigné comme Player 2)
       │                        │                         │
       │ ←──── { type: 'game_start' } ──────────────────→│
       │                        │                         │
       │                        │  [Jeu démarre]         │
       │                        │                         │
       ├─ { type: 'paddle_move',│                         │
       │    paddleY: 250 } ────→│                         │
       │                        ├────────────────────────→│
       │                        │   (Synchronisation)     │
       │                        │                         │
       │                        │ ←─ { type: 'paddle_move',
       │                        │      paddleY: 300 } ────┤
       │ ←──────────────────────┤                         │
       │    (Synchronisation)   │                         │
```

### Code Frontend : Pong Remote

**Fichier : `frontend/src/games/pong-remote.ts` (lignes 71-94)**

```typescript
export class RemotePongGame extends PongGame {
  private ws: WebSocket | null = null;
  private playerNumber: number | null = null; // 1 ou 2
  private isHost: boolean = false; // Player 1 = host

  private connectWebSocket(): void {
    // 1. Construire l'URL WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}${wsHost}/ws/pong/${this.roomCode}/`;

    console.log('Connecting to:', wsUrl);

    // 2. Créer la WebSocket
    this.ws = new WebSocket(wsUrl);

    // 3. Événements
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
      this.pause(); // Mettre le jeu en pause
    };
  }
}
```

### Gestion des messages Pong

**Fichier : `pong-remote.ts` (lignes 96-161)**

```typescript
private handleWebSocketMessage(event: MessageEvent): void {
  const data = JSON.parse(event.data) as WSMessage;

  switch (data.type) {
    case 'player_assigned':
      // Assignation du numéro de joueur (1 ou 2)
      this.playerNumber = data.player_number || null;
      this.isHost = data.is_host || false;
      console.log(`Assigned as Player ${this.playerNumber}`);

      if (this.onConnectionEstablished && this.playerNumber) {
        this.onConnectionEstablished(this.playerNumber, this.isHost);
      }
      break;

    case 'player_joined':
      // Un autre joueur a rejoint
      console.log(`Player ${data.player_number} joined`);

      if (data.player_number !== this.playerNumber && data.display_name) {
        if (this.onPlayerJoined) {
          this.onPlayerJoined(data.display_name);
        }
      }
      break;

    case 'game_start':
      // Démarrer le jeu
      console.log('Game starting!');
      if (this.onMatchReady) {
        this.onMatchReady();
      }
      setTimeout(() => {
        this.start();
      }, 2000);
      break;

    case 'paddle_move':
      // L'adversaire a bougé sa raquette
      this.handleOpponentPaddleMove(data);
      break;

    case 'ball_state':
      // Mise à jour de la balle (seul le host envoie)
      if (!this.isHost) {
        this.handleBallStateUpdate(data);
      }
      break;

    case 'score_update':
      // Mise à jour du score
      console.log('Score update:', data.player1Score, data.player2Score);
      break;

    case 'game_over':
      // Fin de partie
      console.log('Game over:', data.winner);
      break;

    case 'opponent_disconnect':
      // L'adversaire s'est déconnecté
      console.log('Opponent disconnected');
      if (this.onOpponentDisconnect) {
        this.onOpponentDisconnect();
      }
      this.pause();
      break;
  }
}
```

### Synchronisation de la raquette

À chaque mouvement de raquette, on envoie la position :

```typescript
// Dans la boucle de jeu
protected updatePaddles(): void {
  // ... code de mouvement de la raquette ...

  // Envoyer la position au serveur
  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    const myPaddleY = this.playerNumber === 1
      ? this.player1.y
      : this.player2.y;

    this.ws.send(JSON.stringify({
      type: 'paddle_move',
      paddleY: myPaddleY
    }));
  }
}
```

**Pourquoi envoyer à chaque frame ?**
- Le jeu tourne à 60 FPS (16ms par frame)
- Les raquettes bougent rapidement
- Sans synchronisation constante, l'adversaire verrait une raquette saccadée

**Architecture Host/Guest :**
```
Host (Player 1) :
├─ Calcule la physique de la balle
├─ Envoie les positions de balle au serveur
└─ Détecte les scores

Guest (Player 2) :
├─ Reçoit les positions de balle
├─ Affiche la balle aux bonnes coordonnées
└─ Ne calcule PAS la physique (évite les désynchronisations)
```

---

## Gestion des erreurs et reconnexion

### Détection de déconnexion

```typescript
socket.onclose = (event: CloseEvent) => {
  console.log('WebSocket closed', event.code, event.reason);

  // Codes de fermeture standards
  switch (event.code) {
    case 1000: // Normal closure
      console.log('Connection closed normally');
      break;
    case 1001: // Going away
      console.log('Server shutting down or user navigating away');
      break;
    case 1006: // Abnormal closure
      console.log('Connection lost unexpectedly');
      this.attemptReconnect();
      break;
    default:
      console.log('Unknown close code:', event.code);
  }
};
```

### Stratégie de reconnexion

**Exponential backoff** : Augmenter le délai entre chaque tentative

```typescript
class ChatClient {
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // 1 seconde initialement

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.showSystemMessage('Impossible de reconnecter', 'error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}
```

**Délais de reconnexion :**
```
Tentative 1 : 1 seconde
Tentative 2 : 2 secondes
Tentative 3 : 4 secondes
Tentative 4 : 8 secondes
Tentative 5 : 16 secondes
→ Abandon après 5 tentatives
```

### Heartbeat (ping/pong)

Pour détecter les connexions mortes, on envoie des "pings" périodiques :

**Frontend :**
```typescript
private startHeartbeat(): void {
  this.heartbeatInterval = window.setInterval(() => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000); // Toutes les 30 secondes
}
```

**Backend :**
```javascript
socket.on('message', (message) => {
  const data = JSON.parse(message.toString());

  if (data.type === 'ping') {
    // Répondre immédiatement
    socket.send(JSON.stringify({ type: 'pong' }));
  }
});
```

**Si pas de réponse :**
```typescript
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'pong') {
    this.lastPongReceived = Date.now();
  }
};

// Vérifier périodiquement
setInterval(() => {
  const timeSinceLastPong = Date.now() - this.lastPongReceived;
  if (timeSinceLastPong > 60000) { // 60 secondes sans réponse
    console.error('Connection appears dead, reconnecting...');
    this.socket?.close();
    this.attemptReconnect();
  }
}, 10000);
```

---

## Sécurité WebSocket

### 1. Utiliser wss:// (WebSocket Secure)

**Toujours utiliser wss://** en production :

```typescript
// ❌ Mauvais : ws:// en production
const socket = new WebSocket('ws://example.com/chat');

// ✅ Bon : wss:// (équivalent HTTPS)
const socket = new WebSocket('wss://example.com/chat');
```

**Pourquoi ?**
- Les données sont **chiffrées** (comme HTTPS)
- Protection contre les attaques man-in-the-middle
- Obligatoire si votre site est en HTTPS (sinon erreur navigateur)

### 2. Authentification JWT

**Ne JAMAIS faire confiance à un client WebSocket non authentifié :**

```typescript
// Frontend : Envoyer le token JWT dès la connexion
socket.onopen = () => {
  const token = authService.getAccessToken();
  socket.send(JSON.stringify({
    type: 'authenticate',
    token: token
  }));
};
```

```javascript
// Backend : Vérifier le token AVANT d'accepter d'autres messages
socket.on('message', (message) => {
  const data = JSON.parse(message.toString());

  if (data.type === 'authenticate') {
    try {
      const decoded = app.jwt.verify(data.token);
      userId = decoded.userId;
      // ✅ Utilisateur authentifié
    } catch (error) {
      socket.send(JSON.stringify({ type: 'auth_error' }));
      socket.close();
      return;
    }
  } else {
    // ❌ Pas encore authentifié
    if (!userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
      return;
    }
    // Traiter le message...
  }
});
```

### 3. Validation des messages

**Toujours valider les messages entrants :**

```typescript
socket.on('message', (message) => {
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (error) {
    // ❌ JSON invalide
    return;
  }

  // Valider le type
  if (typeof data.type !== 'string') {
    return;
  }

  // Valider le contenu selon le type
  if (data.type === 'global_message') {
    if (typeof data.content !== 'string' || data.content.length > 1000) {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      return;
    }
  }

  // Traiter le message validé...
});
```

### 4. Rate limiting

**Limiter le nombre de messages par seconde :**

```javascript
const messageRateLimits = new Map(); // userId -> { count, resetTime }

function checkRateLimit(userId) {
  const now = Date.now();
  const limit = messageRateLimits.get(userId);

  if (!limit || now > limit.resetTime) {
    // Nouveau intervalle de 1 seconde
    messageRateLimits.set(userId, {
      count: 1,
      resetTime: now + 1000
    });
    return true;
  }

  if (limit.count >= 10) {
    // ❌ Plus de 10 messages par seconde
    return false;
  }

  limit.count++;
  return true;
}

socket.on('message', (message) => {
  if (!checkRateLimit(userId)) {
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Rate limit exceeded'
    }));
    return;
  }

  // Traiter le message...
});
```

### 5. Sanitisation du contenu

**Échapper le HTML dans les messages de chat :**

```typescript
function sanitizeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text; // textContent échappe automatiquement le HTML
  return div.innerHTML;
}

// Utilisation
const safeContent = sanitizeHTML(message.content);
messageDiv.innerHTML = `<strong>${sender}:</strong> ${safeContent}`;
```

**Empêche les attaques XSS :**
```typescript
// Message malveillant
const malicious = '<img src=x onerror="alert(\'XSS\')">';

// Sans sanitisation
messageDiv.innerHTML = malicious; // ❌ Exécute le JavaScript !

// Avec sanitisation
const safe = sanitizeHTML(malicious);
messageDiv.innerHTML = safe; // ✅ Affiche littéralement le texte
```

---

## Résumé

### Points clés

1. **WebSocket = Communication bidirectionnelle** en temps réel
2. **Protocole :** ws:// (non sécurisé) ou wss:// (sécurisé, obligatoire en HTTPS)
3. **4 événements principaux :** onopen, onmessage, onerror, onclose
4. **Latence ultra-faible** : < 10ms (vs HTTP polling : 100-500ms)
5. **Utilisé dans ft_transcendence** pour le chat et le Pong remote

### Cycle de vie simplifié

```typescript
// 1. Créer la connexion
const socket = new WebSocket('wss://localhost/ws/chat');

// 2. Attendre l'ouverture
socket.onopen = () => {
  console.log('Connected');
  socket.send(JSON.stringify({ type: 'hello' }));
};

// 3. Recevoir des messages
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// 4. Gérer les erreurs
socket.onerror = (error) => {
  console.error('Error:', error);
};

// 5. Gérer la fermeture
socket.onclose = () => {
  console.log('Disconnected');
};
```

### Quand utiliser WebSocket ?

**✅ Utilisez WebSocket si :**
- Communication en temps réel (chat, notifications)
- Latence critique (jeux, trading)
- Le serveur doit pousser des données (push notifications)
- Beaucoup d'échanges fréquents

**❌ N'utilisez PAS WebSocket si :**
- Requêtes ponctuelles (login, chargement de page)
- Pas besoin de temps réel
- Communication unidirectionnelle client → serveur
- → Utilisez plutôt HTTP/REST API

### Commandes de débogage

**Chrome DevTools :**
```
1. F12 → Network
2. Filtre : WS (WebSocket)
3. Cliquez sur une connexion
4. Onglet "Messages" : voir tous les messages échangés
```

**Console JavaScript :**
```javascript
// Voir les WebSockets actives
window.performance.getEntriesByType('resource')
  .filter(r => r.name.includes('ws://') || r.name.includes('wss://'));
```

---

## Ressources

### Documentation officielle
- **WebSocket API (MDN)** : https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **WebSocket Protocol (RFC 6455)** : https://datatracker.ietf.org/doc/html/rfc6455

### Outils de test
- **WebSocket Test Client** : https://www.piesocket.com/websocket-tester
- **wscat** (CLI) : `npm install -g wscat`

### Debugging
```bash
# Tester une connexion WebSocket en ligne de commande
wscat -c wss://localhost:8443/ws/chat

# Envoyer un message
> {"type":"authenticate","token":"..."}
```

---

**Documentation créée pour le projet ft_transcendence**
*Pour voir le code complet, consultez `frontend/src/services/chat.service.ts` et `fastify-backend/src/websockets/chat.js`*
