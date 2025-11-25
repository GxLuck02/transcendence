## Technologies

- **TypeScript** (obligatoire selon le sujet)
- **Vite** (build tool moderne pour dev et production)
- **Vanilla TypeScript** (pas de framework comme React/Vue)
- **ES Modules**

## Structure du projet

```
frontend/
├── src/
│   ├── main.ts              # Point d'entrée principal (Router SPA)
│   ├── types/
│   │   └── index.ts         # Types TypeScript globaux
│   ├── services/
│   │   ├── auth.service.ts  # Service d'authentification
│   │   ├── chat.service.ts  # Service de chat
│   │   ├── tournament.service.ts  # Service de tournoi
│   │   └── stats.service.ts # Service de statistiques (en construction)
│   └── games/
│       ├── pong.ts          # Jeu Pong local
│       ├── pong-remote.ts   # Jeu Pong en ligne
│       └── rps.ts           # Pierre-Feuille-Ciseaux
├── css/
│   └── main.css            # Styles CSS
├── index.html              # HTML principal
├── package.json            # Dépendances npm
├── tsconfig.json           # Configuration TypeScript
├── vite.config.ts          # Configuration Vite
└── Dockerfile.dev          # Dockerfile pour développement

```

## Installation

### Développement local

```bash
# Installer les dépendances
cd frontend
npm install

# Lancer le serveur de développement
npm run dev

# Le serveur sera accessible sur http://localhost:5173
```

### Avec Docker

```bash
# À la racine du projet
docker compose up

# Le frontend sera accessible via Nginx sur https://localhost:8443
```

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement Vite (hot reload)
- `npm run build` - Compile le projet pour la production (output: dist/)
- `npm run preview` - Preview du build de production
- `npm run type-check` - Vérifie les types TypeScript sans compiler

## Configuration Vite

Vite est configuré pour :
- ✅ Hot Module Replacement (HMR)
- ✅ Build optimisé pour production
- ✅ Support TypeScript natif
- ✅ Path aliases (`@/` → `src/`)
- ✅ Serveur dev avec CORS

## Déploiement

### Mode production

```bash
# Compiler le projet
npm run build

# Le résultat sera dans le dossier dist/
# Nginx servira les fichiers statiques compilés
```

### Configuration Nginx

Le fichier `nginx/nginx.conf` doit pointer vers:
- Development: Port 5173 (Vite dev server)
- Production: `frontend/dist/` (fichiers compilés)

## Routes disponibles

| Route | Description | Statut |
|-------|-------------|--------|
| `/` | Page d'accueil | ✅ Fonctionnel |
| `/login` | Connexion utilisateur | ✅ Fonctionnel |
| `/register` | Inscription utilisateur | ✅ Fonctionnel |
| `/game/pong` | Jeu Pong (local, IA, remote) | ✅ Fonctionnel |
| `/game/pong/matchmaking` | Matchmaking Pong | ✅ Fonctionnel |
| `/game/pong/remote` | Pong en ligne | ✅ Fonctionnel |
| `/game/rps` | Pierre-Feuille-Ciseaux | ✅ Fonctionnel |
| `/chat` | Chat global et messages privés | ✅ Fonctionnel |
| `/profile` | Profil utilisateur | ✅ Fonctionnel |
| `/tournament` | Organisation de tournois | ✅ Fonctionnel |
| `/stats` | **Dashboards statistiques** | 🚧 **En construction** |

### Module Stats (en construction)

La route `/stats` est visible dans la navigation mais sa fonctionnalité n'est pas encore implémentée.

**Fonctionnalités prévues** :
- Statistiques utilisateur détaillées
- Historique des matchs et tournois
- Graphiques de progression
- Classements et comparaisons
- Analyse temporelle des performances

**TODO** :
- [ ] Implémenter l'API backend pour les statistiques
- [ ] Connecter `stats.service.ts` à l'API
- [ ] Créer les composants de visualisation (graphiques, tableaux)
- [ ] Ajouter les dashboards utilisateur
- [ ] Intégrer le module "User and game stats dashboards"

