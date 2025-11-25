# Théorie : Vite - Build Tool Moderne

## Table des matières
1. [Qu'est-ce que Vite ?](#quest-ce-que-vite-)
2. [Pourquoi Vite dans ft_transcendence ?](#pourquoi-vite-dans-ft_transcendence-)
3. [Vite vs autres build tools](#vite-vs-autres-build-tools)
4. [Comment fonctionne Vite](#comment-fonctionne-vite)
5. [Configuration dans notre projet](#configuration-dans-notre-projet)
6. [Les commandes Vite](#les-commandes-vite)
7. [Hot Module Replacement (HMR)](#hot-module-replacement-hmr)

---

## Qu'est-ce que Vite ?

### Définition simple

**Vite** (prononcé "vit", comme le mot français pour "rapide") est un **outil de build** (construction) pour les applications web modernes. Il remplace des outils plus anciens comme Webpack ou Parcel.

**En résumé :** Vite transforme votre code source (TypeScript, CSS, etc.) en fichiers optimisés que le navigateur peut comprendre.

### L'analogie du restaurant

Imaginez que vous construisez un site web :

**Sans Vite (approche manuelle) :**
```
Vous devez :
1. Compiler le TypeScript en JavaScript à la main
2. Concaténer tous les fichiers JS
3. Minifier le code
4. Gérer les imports/exports
5. Recharger le navigateur à chaque modification
→ C'est LONG et PÉNIBLE
```

**Avec Vite :**
```
Vite fait TOUT automatiquement :
1. ✅ Compile TypeScript instantanément
2. ✅ Gère les imports
3. ✅ Recharge le navigateur automatiquement (HMR)
4. ✅ Optimise pour la production
→ Vous vous concentrez sur le CODE, pas sur la config
```

### Les deux modes de Vite

Vite fonctionne en **deux modes** :

#### 1. Mode Développement (`npm run dev`)
- Serveur de développement ultra-rapide
- Hot Module Replacement (HMR)
- Pas de bundling complet (chargement à la demande)
- Erreurs affichées directement dans le navigateur

#### 2. Mode Production (`npm run build`)
- Compilation complète du projet
- Minification du code
- Tree-shaking (suppression du code inutilisé)
- Optimisation des assets (images, fonts, etc.)
- Génération des fichiers dans `dist/`

---

## Pourquoi Vite dans ft_transcendence ?

### Raisons du choix

#### 1. **Vitesse de développement**
Vite est **beaucoup plus rapide** que les alternatives :

```
Webpack (ancien outil) :
├─ Démarrage du serveur : 20-30 secondes ⏱️
├─ Rechargement après modification : 5-10 secondes ⏱️
└─ Build production : 2-3 minutes ⏱️

Vite (moderne) :
├─ Démarrage du serveur : 1-2 secondes ⚡
├─ Rechargement après modification : instantané ⚡
└─ Build production : 30-60 secondes ⚡
```

#### 2. **Support TypeScript natif**
Vite compile TypeScript **sans configuration** :

```typescript
// Pas besoin de configurer babel, ts-loader, etc.
// Vite comprend TypeScript nativement !
import { User } from './types';  // ✅ Fonctionne directement
```

#### 3. **ES Modules natifs**
Vite utilise les modules ES du navigateur en développement :

```javascript
// Vite sert les fichiers directement au navigateur
import { authService } from './services/auth.service.ts';
// Le navigateur charge uniquement ce dont il a besoin
```

#### 4. **Hot Module Replacement (HMR)**
Quand vous modifiez un fichier, **seul ce module** est rechargé :

```
Sans HMR (rechargement complet) :
Modifiez auth.service.ts → Toute la page recharge → Vous perdez l'état

Avec HMR :
Modifiez auth.service.ts → Seul auth.service est mis à jour → L'état est préservé
```

#### 5. **Configuration minimale**
Contrairement à Webpack qui nécessite des centaines de lignes de config, Vite fonctionne **out-of-the-box** :

```javascript
// vite.config.ts - C'est TOUT ce qu'il faut !
export default defineConfig({
  plugins: []
});
```

---

## Vite vs autres build tools

### Comparaison détaillée

| Aspect | Webpack | Parcel | Vite |
|--------|---------|--------|------|
| **Démarrage dev** | 20-30s | 10-15s | 1-2s ⚡ |
| **HMR** | Lent | Moyen | Instantané ⚡ |
| **Config TypeScript** | Complexe | Simple | Natif ⚡ |
| **Configuration** | Verbose | Auto | Minimale ⚡ |
| **Build production** | Lent | Moyen | Rapide ⚡ |
| **Taille bundle** | Bonne | Moyenne | Excellente ⚡ |
| **Courbe d'apprentissage** | Difficile | Facile | Facile ⚡ |

### Pourquoi Vite est plus rapide ?

**Webpack (approche traditionnelle) :**
```
1. Lit TOUS les fichiers du projet
2. Les analyse et les transforme
3. Les bundle en un gros fichier
4. Démarre le serveur
→ Lent, même si vous ne modifiez qu'un fichier
```

**Vite (approche moderne) :**
```
1. Démarre le serveur immédiatement
2. Compile uniquement les fichiers demandés (à la demande)
3. Utilise les ES Modules natifs du navigateur
4. Met en cache agressivement
→ Rapide, même sur de gros projets
```

### Exemple visuel

```
Application avec 100 fichiers TypeScript

Webpack (bundle-based) :
┌─────────────────────────────────────┐
│ Compile les 100 fichiers           │  ⏱️ 30 secondes
│ Bundle tout ensemble                │
│ Démarre le serveur                  │
└─────────────────────────────────────┘

Vite (unbundled) :
┌─────────────────────────────────────┐
│ Démarre le serveur                  │  ⚡ 2 secondes
│ Compile à la demande :              │
│   - index.html demandé → 1 fichier  │
│   - main.ts demandé → 1 fichier     │
│   - etc.                            │
└─────────────────────────────────────┘
```

---

## Comment fonctionne Vite

### Architecture de Vite

Vite repose sur deux outils principaux :

#### 1. **esbuild** (Développement)
- Écrit en Go (language compilé, donc ultra-rapide)
- Utilisé pour transformer TypeScript → JavaScript
- 10-100x plus rapide que les transpilers JavaScript traditionnels

#### 2. **Rollup** (Production)
- Bundler JavaScript mature et optimisé
- Utilisé pour créer le build de production
- Tree-shaking avancé
- Code-splitting intelligent

```
Mode DEV :                    Mode PROD :
┌──────────────┐             ┌──────────────┐
│   esbuild    │             │   Rollup     │
│ (ultra-fast) │             │  (optimized) │
└──────────────┘             └──────────────┘
       ↓                              ↓
  Serveur dev              Build production
  avec HMR                 dans dist/
```

### Le cycle de développement avec Vite

```
┌─────────────────────────────────────────────────────────┐
│ 1. Vous lancez : npm run dev                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Vite démarre un serveur HTTP                        │
│    → http://localhost:5173                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Vous ouvrez le navigateur                           │
│    → Le navigateur demande index.html                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. index.html contient :                               │
│    <script type="module" src="/src/main.ts"></script>  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Le navigateur demande /src/main.ts                  │
│    → Vite le compile en JavaScript à la volée          │
│    → Le navigateur reçoit du JavaScript valide         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. main.ts importe d'autres fichiers :                 │
│    import { Router } from './router'                   │
│    → Le navigateur demande chaque import               │
│    → Vite compile chacun à la demande                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Vous modifiez un fichier                            │
│    → Vite détecte le changement                        │
│    → Envoie une mise à jour via WebSocket (HMR)        │
│    → Le navigateur applique le changement sans reload  │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration dans notre projet

### Fichier `vite.config.ts`

**Notre configuration :**
```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Configuration minimale !
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**Explication ligne par ligne :**

#### 1. Import de `defineConfig`
```typescript
import { defineConfig } from 'vite';
```
Fonction helper qui fournit l'autocomplétion TypeScript pour la config Vite.

#### 2. Alias de chemins
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

**Permet d'écrire :**
```typescript
// Au lieu de :
import { User } from '../../../types/index';

// Vous pouvez écrire :
import { User } from '@/types/index';
```

**Avantages :**
- ✅ Chemins plus courts et lisibles
- ✅ Pas besoin de compter les `../`
- ✅ Facile de déplacer des fichiers (les imports restent valides)

### Fichier `package.json`

**Scripts Vite dans notre projet :**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

**Explication :**

#### 1. `npm run dev` → `vite`
Lance le serveur de développement :
```bash
npm run dev

# Démarre sur http://localhost:5173
# Hot Module Replacement activé
# Erreurs affichées dans le terminal et le navigateur
```

#### 2. `npm run build` → `tsc && vite build`
Build de production en deux étapes :
```bash
npm run build

# 1. tsc : Vérifie les types TypeScript (pas de compilation)
# 2. vite build : Compile et optimise pour production
# Résultat : fichiers dans dist/
```

**Pourquoi `tsc` d'abord ?**
- Vite compile TypeScript mais ne vérifie PAS les types
- `tsc --noEmit` vérifie les types sans générer de fichiers
- Si erreur de type → build échoue immédiatement

#### 3. `npm run preview` → `vite preview`
Teste le build de production localement :
```bash
npm run build    # 1. Build d'abord
npm run preview  # 2. Teste le build sur http://localhost:4173
```

#### 4. `npm run type-check` → `tsc --noEmit`
Vérifie les types sans compiler :
```bash
npm run type-check

# ✅ Pas d'erreur : Types corrects
# ❌ Erreurs : Affiche les problèmes de types
```

---

## Les commandes Vite

### Commandes de base

#### 1. Lancer le serveur de développement

```bash
npm run dev

# Sortie :
# VITE v5.0.8  ready in 523 ms
#
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
# ➜  press h + enter to show help
```

**Que se passe-t-il ?**
1. Vite démarre un serveur HTTP sur le port 5173
2. Analyse les dépendances (pre-bundling)
3. Écoute les changements de fichiers
4. Active le HMR

#### 2. Compiler pour la production

```bash
npm run build

# Sortie :
# vite v5.0.8 building for production...
# ✓ 45 modules transformed.
# dist/index.html                  0.45 kB │ gzip:  0.30 kB
# dist/assets/index-BwN3xK7d.css   5.23 kB │ gzip:  1.67 kB
# dist/assets/index-C9Z5pT1m.js  150.45 kB │ gzip: 48.23 kB
# ✓ built in 2.34s
```

**Résultat :**
```
dist/
├── index.html                     # HTML avec liens vers assets hashés
├── assets/
│   ├── index-[hash].css          # CSS minifié
│   ├── index-[hash].js           # JavaScript bundlé et minifié
│   └── [autres assets]
```

#### 3. Prévisualiser le build

```bash
npm run preview

# Sortie :
# ➜  Local:   http://localhost:4173/
# ➜  Network: use --host to expose
```

Sert les fichiers de `dist/` comme le ferait Nginx en production.

### Options avancées

#### Mode développement avec HTTPS

```bash
vite --https

# Génère un certificat auto-signé
# Serveur accessible sur https://localhost:5173
```

#### Changer le port

```bash
vite --port 3000

# Démarre sur http://localhost:3000
```

#### Exposer sur le réseau local

```bash
vite --host

# Accessible depuis d'autres machines sur le réseau
# Exemple : http://192.168.1.10:5173
```

---

## Hot Module Replacement (HMR)

### Qu'est-ce que le HMR ?

**HMR** (Hot Module Replacement) = Remplacement de modules à chaud

**Sans HMR :**
```
1. Vous modifiez auth.service.ts
2. Le serveur détecte le changement
3. TOUTE la page se recharge
4. Vous perdez l'état (formulaires, position, etc.)
```

**Avec HMR :**
```
1. Vous modifiez auth.service.ts
2. Vite détecte le changement
3. Seul auth.service.ts est rechargé
4. L'état de l'application est préservé !
```

### Comment ça marche ?

```
┌──────────────┐                        ┌──────────────┐
│   Vite       │   WebSocket            │  Navigateur  │
│   Serveur    │ ←――――――――――――――――――――→  │              │
└──────────────┘                        └──────────────┘
       │                                        │
       │ 1. Détecte changement                 │
       │    dans main.ts                       │
       │                                        │
       │ 2. Compile main.ts                    │
       │                                        │
       │ 3. Envoie via WebSocket ――――――――――――→ │
       │    { type: 'update',                  │
       │      path: '/src/main.ts' }           │
       │                                        │
       │                    4. Applique la ←――――┘
       │                       mise à jour
       │                       (sans reload)
```

### Exemple dans notre projet

**Scénario :** Vous êtes sur la page de chat, un utilisateur est connecté

```typescript
// 1. État initial
const user = { username: "alice", online: true };

// 2. Vous modifiez chat.service.ts :
//    Ajoutez une console.log("Debug message")

// Sans HMR :
// → Toute la page recharge
// → Vous êtes redirigé vers la page de connexion
// → Vous devez vous reconnecter

// Avec HMR :
// → Seul chat.service.ts est rechargé
// → user reste { username: "alice", online: true }
// → Vous restez sur la page de chat
// → La console affiche "Debug message"
```

### Limitations du HMR

Le HMR ne fonctionne pas toujours parfaitement :

#### 1. Changement de structure de données
```typescript
// Avant
interface User {
  id: number;
  name: string;
}

// Après (ajout d'un champ)
interface User {
  id: number;
  name: string;
  email: string;  // Nouveau champ
}

// → Rechargement complet nécessaire
```

#### 2. Modification du Router
```typescript
// Changement des routes dans main.ts
this.routes = {
  '/': this.homePage,
  '/new-page': this.newPage  // Nouvelle route
};

// → Souvent nécessite un rechargement complet
```

#### 3. Changement de configuration
```typescript
// Modification de vite.config.ts
// → TOUJOURS besoin de redémarrer le serveur
```

---

## Optimisations de Vite

### 1. Pre-bundling des dépendances

Vite **pré-bundle** automatiquement les dépendances npm :

```
node_modules/
├── lib1/ (100 fichiers)      ┐
├── lib2/ (200 fichiers)      │ Vite pre-bundle
└── lib3/ (50 fichiers)       ┘
         ↓
.vite/
└── deps/
    ├── lib1.js  (1 fichier)
    ├── lib2.js  (1 fichier)
    └── lib3.js  (1 fichier)
```

**Pourquoi ?**
- Les librairies npm ne changent pas souvent
- Bundler les dépendances une seule fois accélère les rechargements
- Réduit le nombre de requêtes HTTP

### 2. Tree-shaking

Vite supprime le code non utilisé en production :

```typescript
// Vous importez :
import { User } from './types';

// types.ts contient :
export interface User { ... }
export interface Admin { ... }   // ← Jamais utilisé
export interface Guest { ... }   // ← Jamais utilisé

// Build production :
// → Seul User est inclus dans le bundle
// → Admin et Guest sont supprimés
// → Bundle plus petit
```

### 3. Code-splitting

Vite découpe automatiquement le code en plusieurs fichiers :

```typescript
// Route avec import dynamique
const loadProfilePage = () => import('./pages/profile');

// Production :
// → profile.js est dans un fichier séparé
// → Chargé uniquement quand nécessaire
// → Page d'accueil charge plus vite
```

### 4. Compression

En production, Vite minifie et compresse :

```javascript
// Avant (développement) :
function calculateWinRate(wins, losses) {
  const total = wins + losses;
  if (total === 0) {
    return 0;
  }
  return (wins / total) * 100;
}

// Après (production) :
function calculateWinRate(w,l){const t=w+l;return 0===t?0:w/t*100}
```

**Techniques utilisées :**
- Suppression des espaces et commentaires
- Renommage des variables (shortening)
- Suppression du code mort (dead code elimination)

---

## Intégration avec Docker

### Mode développement

Dans `docker-compose.yml`, Vite tourne en mode dev :

```yaml
frontend:
  build: ./frontend
  command: npm run dev
  volumes:
    - ./frontend/src:/app/src  # Hot reload
  ports:
    - "5173:5173"
```

**Avantages :**
- HMR fonctionne même dans Docker
- Les modifications sont détectées grâce au volume

### Mode production

Pour la production, on build d'abord :

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Les fichiers sont dans dist/

# 3. Nginx sert les fichiers statiques
nginx:
  volumes:
    - ./frontend/dist:/usr/share/nginx/html
```

**Pourquoi pas Vite en production ?**
- Vite en mode dev est pour le développement
- En production, on sert des fichiers statiques avec Nginx
- Plus rapide et plus sécurisé

---

## Dépannage

### Problème 1 : Port déjà utilisé

```
Error: Port 5173 is already in use
```

**Solution :**
```bash
# Option 1 : Utiliser un autre port
vite --port 3000

# Option 2 : Tuer le processus qui utilise 5173
lsof -ti:5173 | xargs kill -9
```

### Problème 2 : Modifications non détectées

```
# Vous modifiez un fichier mais rien ne se passe
```

**Solutions :**
```bash
# 1. Vérifier que le fichier est dans src/
# Vite ne surveille que src/ par défaut

# 2. Redémarrer Vite
Ctrl+C
npm run dev

# 3. Vider le cache
rm -rf node_modules/.vite
npm run dev
```

### Problème 3 : Erreur de build

```
Error: TypeScript check failed
```

**Solution :**
```bash
# Vérifier les erreurs TypeScript
npm run type-check

# Corriger les erreurs
# Puis rebuild
npm run build
```

### Problème 4 : HMR ne fonctionne pas dans Docker

```yaml
# Ajouter --host dans le command
frontend:
  command: npm run dev -- --host
  environment:
    - CHOKIDAR_USEPOLLING=true  # Force polling pour Docker
```

---

## Ressources

### Documentation officielle
- **Vite** : https://vitejs.dev/
- **Guide de démarrage** : https://vitejs.dev/guide/
- **Configuration** : https://vitejs.dev/config/

### Plugins utiles
- **vite-plugin-pwa** : Progressive Web App
- **@vitejs/plugin-legacy** : Support navigateurs anciens
- **vite-plugin-compression** : Compression gzip/brotli

### Comparaisons
- **Vite vs Webpack** : https://vitejs.dev/guide/comparisons.html
- **Vite vs Create React App** : https://vitejs.dev/guide/comparisons.html#cra

---

## Résumé

### Points clés

1. **Vite = Build tool moderne** pour applications web
2. **Ultra-rapide** grâce à esbuild et ES Modules natifs
3. **Deux modes** : dev (serveur rapide) et build (production optimisée)
4. **HMR** : Rechargement instantané sans perdre l'état
5. **Configuration minimale** : Fonctionne out-of-the-box
6. **TypeScript natif** : Pas besoin de configuration

### Commandes essentielles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Tester le build
npm run type-check   # Vérifier les types
```

### Pourquoi Vite est parfait pour ft_transcendence

- ✅ **TypeScript natif** → Requis par le sujet
- ✅ **Rapide** → Développement productif
- ✅ **HMR** → Pas besoin de recharger constamment
- ✅ **Simple** → Pas de configuration complexe
- ✅ **Moderne** → Utilise les standards web actuels

---

**Documentation créée pour le projet ft_transcendence**
*Pour toute question, consultez le fichier `frontend/vite.config.ts` et `package.json`*
