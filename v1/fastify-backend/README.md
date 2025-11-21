# Backend Fastify - ft_transcendence

Backend API implémenté avec **Fastify et Node.js** conformément au module "Use a framework to build the backend" du sujet ft_transcendence.

## Technologies utilisées

- **Framework**: Fastify 4.x (Node.js)
- **Base de données**: SQLite (via better-sqlite3)
- **Authentification**: JWT (@fastify/jwt)
- **WebSockets**: @fastify/websocket
- **Hachage de mots de passe**: secure-password (Argon2)
- **Blockchain**: Web3.js (Avalanche testnet)

## Structure du projet

```
fastify-backend/
├── src/
│   ├── db.js                 # Configuration SQLite + migrations
│   ├── server.js             # Serveur principal + routes users
│   ├── utils/
│   │   └── password.js       # Hachage/vérification mots de passe
│   └── routes/
│       ├── pong.js           # Endpoints Pong (matchmaking, matches, rooms)
│       ├── chat.js           # Endpoints Chat (messages, notifications)
│       ├── blockchain.js     # Endpoints Blockchain (Avalanche)
│       └── rps.js            # Endpoints Rock-Paper-Scissors
├── data/                     # Base de données SQLite (créé automatiquement)
├── package.json
├── Dockerfile
└── README.md
```

## Endpoints API

### Authentification & Utilisateurs

- `POST /api/users/register/` - Inscription
- `POST /api/users/login/` - Connexion
- `POST /api/users/logout/` - Déconnexion
- `GET /api/users/me/` - Utilisateur courant
- `GET /api/users/profile/` - Profil
- `PUT /api/users/profile/` - Mise à jour profil

### Amis & Blocages

- `GET /api/users/friends/` - Liste d'amis
- `POST /api/users/friends/:id/add/` - Ajouter un ami
- `DELETE /api/users/friends/:id/remove/` - Retirer un ami
- `GET /api/users/blocked/` - Utilisateurs bloqués
- `POST /api/users/block/:id/` - Bloquer
- `DELETE /api/users/unblock/:id/` - Débloquer

### Stats

- `GET /api/users/stats/` - Stats de l'utilisateur courant
- `GET /api/users/:id/stats/` - Stats d'un utilisateur

### Pong

- `POST /api/pong/matches/create/` - Créer un match
- `GET /api/pong/matches/:id/` - Détails d'un match
- `POST /api/pong/matches/:id/result/` - Enregistrer le résultat
- `GET /api/pong/matches/history/` - Historique des matchs
- `POST /api/pong/rooms/create/` - Créer une room
- `GET /api/pong/rooms/:code/` - Détails d'une room
- `POST /api/pong/matchmaking/join/` - Rejoindre la file de matchmaking
- `GET /api/pong/matchmaking/status/` - Statut du matchmaking
- `POST /api/pong/matchmaking/leave/` - Quitter la file

### Chat

- `GET /api/chat/conversations/` - Liste des conversations
- `GET /api/chat/messages/?user=:id` - Messages avec un utilisateur
- `POST /api/chat/messages/send/` - Envoyer un message
- `GET /api/chat/notifications/` - Notifications
- `POST /api/chat/notifications/:id/read/` - Marquer comme lu
- `POST /api/chat/notifications/read-all/` - Tout marquer comme lu
- `GET /api/chat/messages/unread/` - Résumé des non-lus

### Blockchain (Avalanche)

- `POST /api/blockchain/tournament/record/` - Enregistrer un score sur la blockchain
- `GET /api/blockchain/tournament/:id/` - Récupérer un score depuis la blockchain
- `GET /api/blockchain/history/` - Historique des transactions blockchain

### RPS (Rock-Paper-Scissors)

- `POST /api/rps/matches/create/` - Créer un match
- `POST /api/rps/matches/:id/choice/` - Faire un choix
- `GET /api/rps/matches/:id/` - Détails d'un match
- `GET /api/rps/matches/history/` - Historique des matchs

## Installation locale

```bash
cd fastify-backend
npm install
npm start
```

Le serveur démarre sur `http://localhost:8000`

## Avec Docker

```bash
# Depuis la racine du projet
docker-compose up --build
```

Le backend est accessible via nginx sur `https://localhost:8443/api/`

## Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
JWT_SECRET=votre-secret-jwt-tres-securise
WEB3_PROVIDER_URI=https://api.avax-test.network/ext/bc/C/rpc
BLOCKCHAIN_PRIVATE_KEY=votre-cle-privee-avalanche
CONTRACT_ADDRESS=adresse-du-smart-contract
```

## Conformité au sujet

✅ **Module majeur**: Use a framework to build the backend
✅ **Framework requis**: Fastify avec Node.js
✅ **Base de données**: SQLite (as per subject requirements)
✅ **Authentification**: JWT avec tokens access/refresh
✅ **Sécurité**: Hachage Argon2, HTTPS, CORS configuré

## Notes importantes

- La base de données SQLite est stockée dans `data/transcendence.db`
- Les migrations s'exécutent automatiquement au démarrage
- Le backend remplace entièrement l'ancien backend Django
- Tous les endpoints sont protégés par JWT (sauf register/login)
