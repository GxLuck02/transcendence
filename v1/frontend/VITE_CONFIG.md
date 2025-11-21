# Configuration Vite améliorée ✅

J'ai optimisé ta configuration Vite pour le développement ! Voici ce qui a été ajouté :

## 📁 Fichiers créés/modifiés :

### 1. **vite.config.ts** (amélioré)
- ✅ **Alias de chemins** : `@games`, `@services`, `@types`, `@css`
- ✅ **Proxy API** : `/api` → backend:3000
- ✅ **Proxy WebSocket** : `/ws` → backend:3000
- ✅ **HMR optimisé** avec overlay d'erreurs
- ✅ **Sourcemaps** pour debug
- ✅ **Code splitting** automatique

### 2. **package.json** (nouveaux scripts)
```bash
npm run dev        # Démarre dev server (port 5173)
npm run build      # Build production
npm run preview    # Preview du build
npm run clean      # Nettoie cache
npm run lint       # Vérifie types
```

### 3. **tsconfig.json** (alias ajoutés)
Tu peux maintenant importer avec :
```typescript
import { PongGame } from '@games/pong'
import { AuthService } from '@services/auth.service'
import type { User } from '@types/index'
```

### 4. **.env.development** et **.env.production**
Variables d'environnement accessibles via :
```typescript
const API_URL = import.meta.env.VITE_API_URL
const DEBUG = import.meta.env.VITE_DEBUG === 'true'
```

### 5. **src/vite-env.d.ts**
Typage TypeScript pour les variables d'environnement

### 6. **.gitignore** (mis à jour)
Ignore `.env.local` et cache Vite

---

## 🚀 Utilisation :

### Développement local :
```bash
cd /home/GxLuck/Documents/my_pong/v1/frontend
npm install  # Si besoin
npm run dev
```

### Avec Docker :
```bash
cd /home/GxLuck/Documents/my_pong/v1
make dev-start
```

### Accès :
- Frontend : http://localhost:5173
- Backend API (via proxy) : http://localhost:5173/api
- Hot reload : Automatique ✨

---

## 💡 Fonctionnalités clés :

| Feature | Description |
|---------|-------------|
| **Hot Module Replacement** | Modifications instantanées sans reload |
| **Proxy API** | Pas de CORS en dev |
| **Path Aliases** | Imports propres (`@games/pong`) |
| **TypeScript strict** | Erreurs détectées tôt |
| **Env variables** | Configuration par environnement |
| **Source maps** | Debug facilité |

---

## 🔧 Exemples d'utilisation :

### Importer avec alias :
```typescript
// Avant
import { PongGame } from './games/pong'
import { AuthService } from '../services/auth.service'

// Après
import { PongGame } from '@games/pong'
import { AuthService } from '@services/auth.service'
```

### Utiliser les variables d'env :
```typescript
// main.ts
const API_URL = import.meta.env.VITE_API_URL
console.log('API URL:', API_URL)  // http://localhost:3000 en dev
```

### Appeler l'API via proxy :
```typescript
// Pas besoin de CORS !
fetch('/api/users')  // → http://localhost:3000/users
```

Tout est prêt pour le développement ! 🎉
