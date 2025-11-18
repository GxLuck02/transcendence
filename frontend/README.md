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
│   └── services/
│       └── auth.service.ts  # Service d'authentification
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

