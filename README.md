# Pong Game - TypeScript + React + Canvas2D

Projet de jeu Pong développé avec TypeScript, React et Canvas2D, conteneurisé avec Docker et Nginx.

## 🚀 Démarrage rapide

### Mode Production
```bash
# Lancer l'application en production
make run

# L'application sera disponible sur http://localhost:8080
```

### Mode Développement (Hot Reload)
```bash
# Lancer le serveur de développement avec hot reload
make dev-start

# L'application sera disponible sur http://localhost:5173
# Vos modifications seront visibles instantanément
```

## 📋 Commandes disponibles

### Production
```bash
make help        # Affiche toutes les commandes
make install     # Installe les dépendances npm localement
make build       # Construit l'image Docker
make run         # Lance le conteneur de production
make stop        # Arrête les conteneurs
make restart     # Redémarre les conteneurs
make logs        # Affiche les logs
make clean       # Nettoie tout (conteneurs, images)
make re          # Reconstruit tout depuis zéro
make status      # Affiche le statut des conteneurs
```

### Développement
```bash
make dev-start   # Lance le serveur de développement (port 5173)
make dev-stop    # Arrête le serveur de développement
make dev-logs    # Affiche les logs du serveur de dev
make dev-restart # Redémarre le serveur de dev
make dev-shell   # Ouvre un shell dans le conteneur de dev
```

## 📁 Structure du projet

```
pong_game/
├── Dockerfile              # Multi-stage build (Node + Nginx)
├── docker-compose.yml      # Services prod + dev
├── Makefile               # Commandes pour gérer l'application
├── nginx/
│   └── nginx.conf         # Configuration Nginx
└── frontend/
    ├── package.json       # Dépendances npm
    ├── tsconfig.json      # Configuration TypeScript
    ├── vite.config.ts     # Configuration Vite
    ├── index.html         # Point d'entrée HTML
    └── src/
        ├── main.tsx       # Point d'entrée React
        ├── App.tsx        # Composant principal
        ├── App.css        # Styles de l'application
        ├── index.css      # Styles globaux
        └── components/
            └── PongGame.tsx  # Composant du jeu avec Canvas2D
```

## 🎮 Développer votre jeu

### Workflow recommandé

1. **Démarrez le serveur de dev avec hot reload:**
   ```bash
   make dev-start
   ```

2. **Ouvrez votre navigateur:** http://localhost:5173

3. **Développez votre jeu** dans `frontend/src/components/PongGame.tsx`
   - Le canvas est déjà configuré (800x600)
   - TypeScript pour la logique du jeu
   - React pour l'UI (scores, menus, boutons)

4. **Vos modifications sont automatiquement rechargées** ✨

### Structure du code de jeu

```typescript
// Dans PongGame.tsx, vous pouvez définir:
interface Ball {
  x: number
  y: number
  radius: number
  velocityX: number
  velocityY: number
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
}

// Logique de jeu dans useEffect
const gameLoop = () => {
  // Update
  // Render
  requestAnimationFrame(gameLoop)
}
```

## 🔄 Workflow de développement

```bash
# Développement avec hot reload
make dev-start

# Modifier vos fichiers dans frontend/src/
# Les changements sont automatiquement visibles

# Voir les logs en temps réel
make dev-logs

# Tester en production
make run
```

## 🛠️ Technologies utilisées

- **TypeScript** - Langage typé
- **React** - UI framework
- **Vite** - Build tool ultra rapide
- **Canvas2D** - Rendu du jeu
- **Docker** - Conteneurisation
- **Nginx** - Serveur web (production)

## 📝 Notes

- **Port dev:** 5173 (avec hot reload)
- **Port prod:** 8080 (build optimisé)
- Les erreurs TypeScript sont normales avant `npm install`
- Le Dockerfile utilise un multi-stage build pour optimiser la taille
