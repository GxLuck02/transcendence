# ft_transcendence

> Projet final de l'école 42 : Site web de tournoi Pong multijoueur avec fonctionnalités avancées

## ✅ Conformité au Sujet

Ce projet est **100% conforme** au sujet ft_transcendence avec backend **Fastify + Node.js**.

### ✅ Technologies CONFORMES
- **Backend:** Fastify 4.x avec Node.js ✅ (Module majeur "Use a framework to build the backend")
- **Database:** SQLite via better-sqlite3 ✅ (Module mineur "Use a database for the backend")
- **Frontend:** TypeScript SPA avec Vite ✅
- **Blockchain:** Avalanche Fuji testnet (C-Chain) ✅
- **Smart Contracts:** Solidity 0.8.0 ✅
- **WebSockets:** @fastify/websocket pour Pong et Chat ✅
- **Auth:** JWT + OAuth 2.0 (42 + GitHub) ✅

## 📋 Description

Site web permettant de jouer au Pong avec système de tournois complet, chat en temps réel avec WebSocket, adversaire IA, gestion complète des utilisateurs, et jeu Rock-Paper-Scissors avec matchmaking.

## Modules Implémentés

### Partie Obligatoire (25%)
- ✅ Jeu Pong fonctionnel (2 joueurs locaux, vs IA)
- ✅ Système de tournoi avec brackets et élimination directe
- ✅ Inscription des joueurs avec alias
- ✅ Matchmaking pour tournois

### 🏆 Modules Majeurs (70 points)
1. **Backend Framework** - Fastify + Node.js (10 pts) ✅
2. **Standard User Management** - Inscription, profils, amis, historique (10 pts) ✅
3. **Remote Players** - Multiplayer Pong distant avec WebSocket (10 pts) ✅
4. **Live Chat** - Chat temps réel avec WebSockets (10 pts) ✅
5. **AI Opponent** - Adversaire IA avec 3 niveaux de difficulté (10 pts) ✅
6. **Additional Game** - Rock-Paper-Scissors avec matchmaking (10 pts) ✅
7. **Blockchain** - Avalanche Fuji testnet avec Solidity (10 pts) ✅

### 📦 Modules Mineurs (15 points)
8. **SQLite Database** (5 pts) ✅
9. **TypeScript Frontend** (5 pts) ✅
10. **Remote Authentication** - OAuth 2.0 avec 42 + GitHub (5 pts) ✅

## 🚀 Stack Technique

### Backend (Fastify)
- **Framework:** Fastify 4.x (Node.js)
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT (@fastify/jwt) + bcrypt
- **WebSockets:** @fastify/websocket
- **Blockchain:** Web3.js (Avalanche)
- **OAuth:** 42 API + GitHub

### Frontend
- **Language:** TypeScript
- **Build:** Vite
- **Routing:** SPA Router custom
- **WebSocket:** Native WebSocket API

### Infrastructure
- **Container:** Docker + Docker Compose
- **Proxy:** Nginx avec SSL/TLS
- **Cache:** Redis (pour WebSocket scaling)

## 📁 Structure du Projet

```
transcendence/
├── fastify-backend/              # Backend Fastify + Node.js ✅
│   ├── src/
│   │   ├── server.js            # Serveur principal + routes users
│   │   ├── db.js                # SQLite + migrations
│   │   ├── utils/
│   │   │   └── password.js      # bcrypt hashing
│   │   ├── routes/
│   │   │   ├── pong.js          # Matchmaking + matches
│   │   │   ├── chat.js          # Messages + notifications
│   │   │   ├── blockchain.js    # Avalanche Web3
│   │   │   ├── rps.js           # Rock-Paper-Scissors
│   │   │   └── oauth.js         # OAuth 2.0 (42 + GitHub)
│   │   └── websockets/
│   │       ├── pong.js          # WebSocket Pong remote
│   │       └── chat.js          # WebSocket chat global
│   ├── data/                    # SQLite database
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── frontend/                     # SPA TypeScript
│   ├── src/
│   │   ├── main.ts              # Router + App principale
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── chat.service.ts
│   │   │   └── tournament.service.ts
│   │   └── games/
│   │       ├── pong-remote.ts   # Pong avec WebSocket
│   │       └── pong-ai.ts       # Pong vs IA
│   ├── package.json
│   └── vite.config.ts
├── nginx/
│   ├── nginx.conf               # Proxy vers Fastify
│   └── ssl/                     # Certificats SSL
├── docker-compose.yml           # Redis + Fastify + Nginx
├── Makefile
└── README.md
```

## 🛠️ Installation et Lancement

### Prérequis
- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)

### Setup Rapide

```bash
# 1. Cloner le repository
git clone <repo_url>
cd transcendence

# 2. Setup automatique (SSL + .env + build frontend)
make setup

# 3. Build et lancer
make build
make up
```

Le site sera accessible sur : **https://localhost:8443**

⚠️ **Important:** Acceptez le certificat SSL auto-signé dans votre navigateur

### Configuration OAuth (Optionnel)

Pour activer OAuth 2.0 (42 ou GitHub), éditez le fichier `.env` :

```bash
# OAuth 42
OAUTH42_CLIENT_ID=votre_client_id
OAUTH42_SECRET=votre_secret
OAUTH42_REDIRECT_URI=https://localhost:8443/api/auth/oauth/42/callback/

# OAuth GitHub (alternative)
GITHUB_CLIENT_ID=votre_client_id
GITHUB_CLIENT_SECRET=votre_secret
GITHUB_REDIRECT_URI=https://localhost:8443/api/auth/oauth/github/callback/
```

### Configuration Blockchain (Optionnel)

```bash
# Avalanche Fuji testnet
WEB3_PROVIDER_URI=https://api.avax-test.network/ext/bc/C/rpc
BLOCKCHAIN_PRIVATE_KEY=votre_cle_privee_sans_0x
CONTRACT_ADDRESS=adresse_du_smart_contract
```

1. Obtenez des AVAX testnet depuis le [Avalanche Fuji Faucet](https://faucet.avax.network/)
2. Déployez le smart contract (voir `fastify-backend/contracts/`)
3. Ajoutez l'adresse du contrat dans `.env`

## 🎮 Commandes Makefile

```bash
# Setup et déploiement
make help        # Afficher toutes les commandes
make setup       # Setup initial (SSL + .env + frontend)
make frontend    # Build le frontend uniquement
make build       # Build les conteneurs Docker
make up          # Démarrer tous les services
make down        # Arrêter tous les services

# Développement
make logs        # Voir les logs en temps réel
make clean       # Arrêter et supprimer les conteneurs
make fclean      # Nettoyage complet
make re          # Rebuild complet (fclean + setup + build + up)
```

## 🎯 API Endpoints

### Authentification
- `POST /api/users/register/` - Inscription
- `POST /api/users/login/` - Connexion
- `POST /api/users/logout/` - Déconnexion
- `GET /api/auth/oauth/42/` - OAuth 42 (redirection)
- `GET /api/auth/oauth/github/` - OAuth GitHub (redirection)

### Utilisateurs
- `GET /api/users/me/` - Utilisateur courant
- `GET /api/users/profile/` - Profil
- `PUT /api/users/profile/` - Mise à jour profil
- `GET /api/users/stats/` - Statistiques
- `GET /api/users/friends/` - Liste d'amis
- `POST /api/users/friends/:id/add/` - Ajouter un ami
- `DELETE /api/users/friends/:id/remove/` - Retirer un ami
- `GET /api/users/blocked/` - Utilisateurs bloqués
- `POST /api/users/block/:id/` - Bloquer
- `DELETE /api/users/unblock/:id/` - Débloquer

### Pong
- `POST /api/pong/matches/create/` - Créer un match
- `POST /api/pong/matches/:id/result/` - Enregistrer résultat
- `GET /api/pong/matches/history/` - Historique
- `POST /api/pong/rooms/create/` - Créer une room
- `POST /api/pong/matchmaking/join/` - Rejoindre matchmaking
- `GET /api/pong/matchmaking/status/` - Statut matchmaking
- `POST /api/pong/matchmaking/leave/` - Quitter matchmaking

### Chat
- `GET /api/chat/conversations/` - Conversations
- `GET /api/chat/messages/?user=:id` - Messages avec un user
- `POST /api/chat/messages/send/` - Envoyer un message
- `GET /api/chat/notifications/` - Notifications
- `POST /api/chat/notifications/:id/read/` - Marquer comme lu

### Blockchain
- `POST /api/blockchain/tournament/record/` - Enregistrer score
- `GET /api/blockchain/tournament/:id/` - Récupérer score
- `GET /api/blockchain/history/` - Historique blockchain

### WebSockets
- `WS /ws/pong/:room` - WebSocket Pong remote
- `WS /ws/chat/` - WebSocket chat global

## 🤖 Algorithme IA (Pong)

L'IA utilise une approche de **prédiction de trajectoire** :

1. **Limitation:** Rafraîchit sa vue du jeu 1x par seconde (contrainte du sujet)
2. **Prédiction:** Calcule où la balle va arriver en simulant les rebonds
3. **Mouvement:** Se déplace vers la position prédite avec contrôle clavier simulé
4. **Difficulté:** 3 niveaux (Easy, Medium, Hard)

**Pas d'algorithme A*** (interdit par le sujet)

## 🔗 Blockchain

### Configuration Avalanche Fuji
- **Réseau:** Avalanche Fuji testnet (C-Chain)
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Chain ID:** 43113
- **Smart Contract:** TournamentScore.sol (Solidity 0.8.0)
- **Explorer:** [https://testnet.snowtrace.io/](https://testnet.snowtrace.io/)

### Utilisation
```bash
# Enregistrer un score de tournoi sur la blockchain
curl -X POST https://localhost:8443/api/blockchain/tournament/record/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tournament_id": 1,
    "winner_username": "player1",
    "winner_score": 15
  }'
```

## 🐛 Troubleshooting

### Le site ne démarre pas
```bash
# Vérifier les logs
docker-compose logs

# Rebuild complet
make re
```

### WebSocket ne se connecte pas
```bash
# Vérifier les services
docker-compose ps

# Vérifier les logs Fastify
docker-compose logs api
```

### Erreur 403 Forbidden
```bash
# Rebuild le frontend
make frontend
docker-compose restart nginx
```

### Blockchain - Erreur Web3
```bash
# Vérifier la configuration
docker-compose logs api | grep -i blockchain

# Vérifier les variables d'environnement
docker-compose exec api env | grep WEB3
```

## 📚 Documentation

- **Backend:** `fastify-backend/README.md`
- **Migration Django→Fastify:** `MIGRATION_FASTIFY.md`
- **Sujet:** `docs/en.subject.txt`

## 🎓 Modules Validés

✅ **7 modules majeurs** (70 points) :
- Backend Framework (Fastify)
- Standard User Management
- Remote Players (WebSocket)
- Live Chat (WebSocket)
- AI Opponent
- Additional Game (RPS)
- Blockchain (Avalanche)

✅ **3 modules mineurs** (15 points) :
- SQLite Database
- TypeScript Frontend
- Remote Authentication (OAuth 2.0)

**Total: 85 points / 100 possible**

## 📄 Licence

Ce projet est réalisé dans le cadre du cursus de l'école 42.

---

## 🚀 Quick Start

```bash
git clone <repo_url>
cd transcendence
make up

# Créer un compte via l'interface web
# ou via OAuth 42/GitHub
# https://localhost:8443
```
