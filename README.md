# ft_transcendence

> Projet final de l'école 42 : Site web de tournoi Pong multijoueur avec fonctionnalités avancées

## 🚨 AVERTISSEMENT - Non-Conformités Critiques

Ce projet contient actuellement **plusieurs non-conformités critiques** par rapport au sujet officiel :
- ❌ Backend : Django au lieu de PHP pur ou Fastify/Node.js
- ❌ Base de données : PostgreSQL au lieu de SQLite
- ❌ Blockchain : Ganache/Ethereum au lieu d'Avalanche
- ⚠️ Redis : Non mentionné dans le sujet (usage à justifier)

**Le projet doit être significativement refondu pour être conforme.** Voir détails ci-dessous.

## 📋 Description

Site web permettant de jouer au Pong avec système de tournois complet, chat en temps réel, adversaire IA, gestion complète des utilisateurs, et jeu Rock-Paper-Scissors avec matchmaking.

## ⚠️ Points Critiques à Corriger

### Backend Non-Conforme au Sujet
**ATTENTION:** Le backend actuel utilise **Django**, ce qui n'est **PAS conforme** au sujet officiel.

Selon le sujet (Section IV.2 - Page 8), les seules options autorisées sont :
1. **PHP pur sans framework** (option par défaut)
2. **Fastify avec Node.js** (si le module "Major: Use a framework to build the backend" est choisi)

**Action requise:** Le backend doit être entièrement réécrit en :
- Soit **PHP pur** (sans framework)
- Soit **Fastify + Node.js** (pour valider le module Framework Major)

### Base de Données Non-Conforme
**ATTENTION:** Le projet utilise actuellement **PostgreSQL 15**, ce qui n'est **PAS conforme** au sujet.

Selon le sujet (Section V.2 - Page 15), module "Use a database for the backend" :
> "The designated database for all DB instances in your project is **SQLite**"

**Action requise:**
- Remplacer PostgreSQL par **SQLite**
- Adapter tous les modèles et migrations Django (ou du futur backend)

### Redis - Non Mentionné dans le Sujet
**ATTENTION:** Le projet utilise **Redis 7** pour Django Channels.

Redis n'est **pas mentionné** dans le sujet officiel. Son usage doit être :
- Soit **supprimé** si un backend conforme peut gérer les WebSockets sans Redis
- Soit **justifié** comme outil auxiliaire (non comme solution complète d'une fonctionnalité)

**Action requise:**
- Évaluer si Redis est indispensable
- Trouver une alternative conforme si nécessaire
- Documenter la justification de son utilisation

### Blockchain Non-Conforme
**ATTENTION:** Le projet utilise **Ganache (Ethereum)**, ce qui n'est **PAS conforme** au sujet.

Selon le sujet (Section V.2 - Page 15), module Blockchain :
> "The chosen blockchain for this implementation is **Avalanche**, and **Solidity** will be the programming language"

**Action requise:**
- Remplacer Ganache par une **blockchain de test Avalanche**
- Adapter les smart contracts Solidity pour Avalanche
- Mettre à jour l'intégration Web3

## Modules Implémentés

### Partie Obligatoire (25%)
- Jeu Pong fonctionnel (2 joueurs locaux, vs IA)
- Système de tournoi avec brackets et élimination directe
- Inscription des joueurs avec alias

###  Modules Majeurs (70 points)
1. ~~**Backend Framework** - Django 4.2.7~~ ❌ NON-CONFORME (doit être PHP pur ou Fastify/Node.js)
2. **Standard User Management** - Inscription, profils, amis, historique (10 pts) ✅
3. **AI Opponent** - Adversaire IA avec 3 niveaux de difficulté (10 pts) ✅
4. **Live Chat** - Chat temps réel avec WebSockets (10 pts) ✅
5. **Additional Game** - Rock-Paper-Scissors avec matchmaking (10 pts) ✅
6. **Remote Players** - Multiplayer Pong distant avec WebSocket (10 pts) ✅
7. ~~**Blockchain** - Ganache/Ethereum~~ ❌ NON-CONFORME (doit être Avalanche)

###  Modules Mineurs (20 points)
8. ~~**PostgreSQL Database**~~ ❌ NON-CONFORME (doit être SQLite)
9. ~~**Django framework backend**~~ ❌ NON-CONFORME
10. **TypeScript Frontend** (5 pts) ✅ (migration complétée)
11. **Multiple Languages Support** (5 pts) 🔜 PRÉVU

### ⏳ Modules Prévus
- **Remote Authentication** - OAuth 2.0 avec 42 API (Major - 10 pts)
- **Multiple Languages** - Support multilingue (Minor - 5 pts) 🔜

##  Stack Technique

### ❌ Technologies Actuelles (NON-CONFORMES)
- **Backend:** Django 4.2.7 → ❌ Doit être **PHP pur** ou **Fastify/Node.js**
- **Database:** PostgreSQL 15 → ❌ Doit être **SQLite**
- **WebSockets:** Django Channels + Redis 7 → ❌ Redis non autorisé
- **Blockchain:** Ganache (Ethereum) → ❌ Doit être **Avalanche**

### ✅ Technologies Conformes
- **Frontend:** TypeScript (SPA avec Router et Vite)
- **Container:** Docker + Docker Compose
- **Proxy:** Nginx avec SSL/TLS
- **Auth:** JWT + OAuth 2.0 (à réimplémenter dans nouveau backend)

### 📋 Actions Requises
1. Réécrire backend en **PHP pur** ou **Fastify/Node.js**
2. Migrer de PostgreSQL vers **SQLite**
3. Remplacer Redis ou justifier son usage
4. Migrer de Ganache vers **Avalanche** (blockchain de test)

##  Installation et Lancement

### Prérequis
- Docker
- Docker Compose
- Credentials OAuth 42 (optionnel - pour OAuth 42 seulement)

### Configuration

1. **Cloner le repository**
```bash
git clone <repo_url>
cd Transcendence
```

2. **Le fichier .env existe déjà** (vérifier les paramètres si besoin)

**Note:** Le fichier .env est déjà configuré avec des valeurs par défaut fonctionnelles. Les credentials OAuth 42 sont optionnels et nécessaires uniquement pour l'authentification 42.

### Lancement

```bash
# Lancer tous les services (première fois)
make up

# Ou avec docker-compose directement
docker-compose up --build

# En mode détaché
docker-compose up -d --build
```

Le site sera accessible sur : **https://localhost:8443**

**⚠️ Important:** Acceptez le certificat SSL auto-signé dans votre navigateur (certificat de développement)

### Commandes Utiles

```bash
# Makefile (recommandé)
make up          # Démarrer tous les services
make down        # Arrêter tous les services
make clean       # Nettoyer complètement
make logs        # Voir les logs
make rebuild     # Rebuild complet

# Docker Compose
docker-compose logs -f              # Voir les logs en temps réel
docker-compose down                 # Arrêter les services
docker-compose down -v              # Arrêter et supprimer volumes
docker-compose restart nginx        # Redémarrer nginx

# Django
docker-compose exec web python manage.py shell
docker-compose exec web python manage.py createsuperuser
docker-compose exec web python manage.py migrate
```

## 📁 Structure du Projet

```
Transcendence/
├── backend/                         # Django Backend
│   ├── config/                      # Configuration Django
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py                  # ASGI pour WebSocket
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/                   # Gestion utilisateurs + auth
│   │   │   ├── models.py           # User, Friendship, BlockedUser
│   │   │   ├── views.py            # API endpoints
│   │   │   └── serializers.py
│   │   ├── pong/                    # Jeu Pong + Tournois
│   │   │   ├── models.py           # Tournament, Match, GameRoom
│   │   │   ├── views.py
│   │   │   └── serializers.py
│   │   ├── chat/                    # Live chat WebSocket
│   │   │   ├── consumers.py        # WebSocket consumer
│   │   │   └── routing.py
│   │   ├── rps/                     # Rock-Paper-Scissors
│   │   │   ├── models.py           # RPSMatch, RPSMatchmakingQueue
│   │   │   ├── views.py
│   │   │   └── serializers.py
│   │   └── blockchain/              # Interface Ethereum (prêt)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                        # SPA Vanilla JS
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js                  # Router + Pages principales
│       ├── auth/
│       │   └── auth.js              # Service d'authentification
│       ├── game/
│       │   ├── pong.js              # Logique jeu Pong
│       │   └── rps.js               # Client RPS
│       ├── chat/
│       │   └── chat.js              # Client WebSocket chat
│       └── tournament/
│           └── tournament.js        # Manager de tournois
├── nginx/
│   ├── nginx.conf                   # Configuration Nginx
│   └── ssl/                         # Certificats SSL auto-signés
│       ├── cert.pem
│       └── key.pem
├── docker-compose.yml               # Orchestration services
├── Dockerfile                       # Image Django
├── entrypoint.sh                    # Script de démarrage
├── Makefile                         # Commandes utiles
├── .env                             # Variables d'environnement
├── .gitignore
└── README.md
```

## 🎯 Algorithme IA (Pong)

L'IA utilise une approche de **prédiction de trajectoire** :

1. **Limitation:** Rafraîchit sa vue du jeu 1x par seconde (contrainte du sujet)
2. **Prédiction:** Calcule où la balle va arriver en simulant les rebonds
3. **Mouvement:** Se déplace vers la position prédite
4. **Difficulté:** Ajustable (vitesse de réaction et précision)

**Pas d'algorithme A*** (interdit par le sujet)

## 🔗 Blockchain

### ❌ Configuration Actuelle (NON-CONFORME)
- **Réseau:** Ganache (blockchain Ethereum de test) → ❌ **NON-CONFORME**
- **Smart Contract:** TournamentScore.sol (Solidity 0.8.0)
- **Fonction:** Stockage immuable des scores de tournoi
- **Interaction:** Web3.py depuis Django
- **Déploiement:** Command `deploy_tournament_contract`
- **API Endpoints:** 7 endpoints REST pour interaction blockchain
- **Documentation:** Voir `backend/apps/blockchain/README.md`

### ⚠️ Non-Conformité Blockchain
Selon le sujet (Section V.2 - Page 15), le module Blockchain impose :
> "The chosen blockchain for this implementation is **Avalanche**, and **Solidity** will be the programming language"

**Action requise:**
- Remplacer Ganache par un réseau de test **Avalanche**
- Adapter les smart contracts Solidity pour Avalanche
- Mettre à jour l'intégration Web3 pour Avalanche
- Conserver Solidity (conforme au sujet)

### Note Technique
Le code blockchain actuel fonctionne avec Ganache mais nécessite :
- Architecture x86_64 (incompatibilité QEMU sur ARM M1/M2 Mac)
- Migration vers Avalanche pour conformité au sujet


#### ⏳ Nécessite Configuration Supplémentaire
- [ ] OAuth 42 (credentials 42 API requis)
- [ ] Blockchain contract deployment (nécessite architecture x86_64 pour Ganache)

## 📄 Licence

Ce projet est réalisé dans le cadre du cursus de l'école 42.

## 🐛 Troubleshooting

### Le site ne démarre pas
```bash
# Vérifier les logs
docker-compose logs

# Rebuild complet
docker-compose down -v
docker-compose up --build
```

### Erreurs de migration
```bash
docker-compose exec web python manage.py migrate --run-syncdb
```

### WebSocket ne se connecte pas
- Vérifier que Redis est démarré : `docker-compose ps`
- Vérifier les logs : `docker-compose logs redis`

### Blockchain - Contract non déployé
```bash
# Déployer le smart contract
docker-compose exec web python manage.py deploy_contract
```

---

## 🚀 Quick Start

```bash
# Cloner et lancer
git clone <repo_url>
cd Transcendence
make up

# Créer un compte admin (optionnel)
docker-compose exec web python manage.py createsuperuser

# Accéder au site
# https://localhost:8443
```
