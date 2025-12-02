# Checklist de Sécurité - ft_transcendence

**IMPORTANT**: Vérifier tous ces points avant chaque push vers le repo de l'école.
Cette checklist existe car plusieurs personnes travaillent sur le projet et des corrections
de sécurité peuvent être accidentellement supprimées lors de modifications.

---

## 1. AUTHENTIFICATION & JWT (CRITIQUE)

### 1.1 JWT_SECRET
- [ ] **Fichier**: `fastify-backend/src/server.js` (lignes 16-23)
- [ ] Le serveur DOIT refuser de démarrer si `JWT_SECRET` n'est pas défini
- [ ] Le secret DOIT faire au moins 32 caractères
- [ ] **Code attendu**:
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be defined...');
  process.exit(1);
}
```
- [ ] **INTERDIT**: `|| 'default-secret'` ou toute valeur par défaut

### 1.2 Fichier .env
- [ ] `JWT_SECRET` défini avec une valeur forte (32+ caractères aléatoires)
- [ ] `.env` présent dans `.gitignore`
- [ ] `.env.exemple` contient un placeholder, PAS le vrai secret

---

## 2. RATE LIMITING (ÉLEVÉ)

### 2.1 Dépendance
- [ ] **Fichier**: `fastify-backend/package.json`
- [ ] `@fastify/rate-limit` est dans les dépendances

### 2.2 Configuration globale
- [ ] **Fichier**: `fastify-backend/src/server.js`
- [ ] Import présent: `import fastifyRateLimit from '@fastify/rate-limit';`
- [ ] Configuration globale (100 req/min recommandé):
```javascript
app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
```

### 2.3 Rate limit strict sur routes sensibles
- [ ] **Routes concernées**:
  - `/api/users/login/` - max 5/min
  - `/api/users/register/` - max 5/min
- [ ] **Code attendu** (dans les options de route):
```javascript
app.post('/api/users/login/', authRateLimit, async (request, reply) => {
```

---

## 3. VALIDATION DES INPUTS (ÉLEVÉ)

### 3.1 Registration (`server.js`)
- [ ] **Lignes**: ~118-150
- [ ] Username: 3-30 caractères, alphanumériques + `_` `-`
- [ ] Email: format valide, max 254 caractères
- [ ] Display name: 1-50 caractères
- [ ] Password: 8-128 caractères
- [ ] **Fonctions de validation présentes**:
```javascript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
function validateEmail(email) { ... }
function validateUsername(username) { ... }
function validateDisplayName(displayName) { ... }
function validatePassword(password) { ... }
```
- [ ] Validation présente pour tous les autres endpoints (pas uniquement register/login) avec schémas ou équivalent

### 3.2 Chat messages (`routes/chat.js`)
- [ ] **Lignes**: ~98-124
- [ ] Constantes définies:
```javascript
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ROOM_CODE_LENGTH = 50;
```
- [ ] Validation du contenu (longueur, type string)
- [ ] Validation du recipient_id (integer positif)
- [ ] Validation du message_type (whitelist: 'text', 'game_invite')

### 3.3 Blockchain (`routes/blockchain.js`)
- [ ] **Lignes**: ~72-83
- [ ] `tournament_id`: integer positif
- [ ] `winner_username`: string 1-100 caractères
- [ ] `winner_score`: integer >= 0

---

## 4. PROTECTION XSS (MODÉRÉ)

### 4.1 Fonction sanitizeHTML
- [ ] **Fichier**: `frontend/src/main.ts`
- [ ] La fonction existe:
```typescript
private sanitizeHTML(text: string = ''): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 4.2 Utilisation obligatoire de sanitizeHTML
Vérifier que `sanitizeHTML()` est utilisé pour TOUTES les données utilisateur avant innerHTML:

- [ ] **homePage()** (~ligne 285):
```typescript
const safeDisplayName = user ? this.sanitizeHTML(user.display_name || user.username) : '';
```

- [ ] **chatPage()** (~ligne 1119):
```typescript
const safeChatName = this.sanitizeHTML(user?.display_name || user?.username || '');
```

- [ ] **profilePage()** (~lignes 1617-1619):
```typescript
const safeUsername = this.sanitizeHTML(user?.username || '');
const safeEmail = this.sanitizeHTML(user?.email || '');
const safeProfileDisplayName = this.sanitizeHTML(user?.display_name || '');
```

- [ ] **Toutes les listes** (conversations, amis, messages) utilisent déjà sanitizeHTML

### 4.3 Patterns à rechercher (DANGER)
Rechercher ces patterns qui pourraient introduire du XSS:
```bash
# Dans le frontend, chercher les innerHTML sans sanitization
grep -n "innerHTML.*user\." frontend/src/*.ts
grep -n "innerHTML.*display_name" frontend/src/*.ts
grep -n "innerHTML.*username" frontend/src/*.ts
```

---

## 5. TOKENS OAUTH (MODÉRÉ)

### 5.1 Nettoyage immédiat de l'URL
- [ ] **Fichier**: `frontend/src/main.ts`
- [ ] **Fonction**: `handleOAuthCallback()` (~lignes 93-148)
- [ ] L'URL DOIT être nettoyée AVANT tout traitement async:
```typescript
if (accessToken && refreshToken) {
  // SECURITY: Immediately clean URL
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
  // ... reste du code
}
```
- [ ] **INTERDIT**: Nettoyer l'URL après les appels API

---

## 6. CONFIGURATION HTTPS/TLS & CORS (CRITIQUE pour l'éval)

> **ATTENTION ÉVALUATEUR**: "Faites attention à TLS. S'il y a un backend ou toute autre
> fonctionnalité, il doit être disponible."

### 6.1 TLS/HTTPS obligatoire
- [ ] Certificats SSL présents dans `nginx/ssl/`
- [ ] **Tester**: `curl -I https://localhost:8443` retourne 200
- [ ] **Tester**: `curl -I http://localhost:8080` redirige vers HTTPS ou refuse
- [ ] WebSocket en WSS (pas WS): `wss://localhost:8443/ws/...`
- [ ] Pas de fallback `ws://` quand la page est servie en HTTPS (front)
- [ ] Aucune ressource chargée en HTTP (mixed content)

### 6.2 Configuration Nginx
- [ ] **Fichier**: `nginx/nginx.conf`
- [ ] TLS 1.2+ uniquement (pas SSLv3, TLS 1.0, TLS 1.1)
- [ ] Ciphers sécurisés configurés
- [ ] Headers de sécurité présents:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

### 6.3 CORS
- [ ] **Fichier**: `fastify-backend/src/server.js`
- [ ] Origins restreints (pas de `*`):
```javascript
app.register(fastifyCors, {
  origin: ['https://localhost:8443', 'https://127.0.0.1:8443'],
  credentials: true,
});
```

---

## 7. BASE DE DONNÉES

### 7.1 Requêtes préparées
- [ ] Toutes les requêtes SQL utilisent des prepared statements
- [ ] **INTERDIT**: Concaténation de strings dans les requêtes SQL
- [ ] Exemple correct:
```javascript
db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

### 7.2 Mots de passe
- [ ] Hashés avec bcrypt
- [ ] Jamais stockés en clair
- [ ] Jamais retournés dans les réponses API (vérifier `serializeUser`)
- [ ] Coût de hashage aligné production (>= 12, ajusté selon perf)

---

## 8. VARIABLES D'ENVIRONNEMENT

### 8.1 Secrets requis
Vérifier que ces variables sont définies en production:
- [ ] `JWT_SECRET` (32+ caractères)
- [ ] `BLOCKCHAIN_PRIVATE_KEY` (si blockchain activée)
- [ ] `OAUTH_42_CLIENT_SECRET` (si OAuth 42 activé)
- [ ] `OAUTH_GITHUB_CLIENT_SECRET` (si OAuth GitHub activé)

### 8.2 Fichiers sensibles
- [ ] `.env` dans `.gitignore`
- [ ] Aucun secret dans le code source
- [ ] Aucun secret dans les logs (vérifier les console.log)
- [ ] Contrôle pré-push: git grep pour API keys/credentials accidentels

---

## 9. WEBSOCKETS & GESTION DES DÉCONNEXIONS

> **CRITÈRE ÉVAL**: "Décalages & déconnexions" - Le jeu doit gérer proprement
> les déconnexions et les problèmes réseau.

### 9.1 Authentification WebSocket
- [ ] Les connexions WebSocket vérifient le token JWT
- [ ] Les messages sont validés côté serveur
- [ ] Timeout configuré pour les connexions inactives
- [ ] Fermer/refuser connexion si pas d'auth après délai ; limiter taille/messages pour éviter abuse

### 9.2 Gestion des déconnexions (Pong remote)
- [ ] **Fichier**: `fastify-backend/src/websockets/pong.js`
- [ ] Détection de déconnexion du joueur
- [ ] Notification à l'adversaire si un joueur se déconnecte
- [ ] Nettoyage des rooms/matchs abandonnés
- [ ] **Tester**: Fermer l'onglet pendant une partie → l'autre joueur est notifié

### 9.3 Gestion des déconnexions (Chat)
- [ ] **Fichier**: `fastify-backend/src/websockets/chat.js`
- [ ] Mise à jour du statut "en ligne" à la déconnexion
- [ ] Reconnexion automatique côté client si connexion perdue

### 9.4 Robustesse réseau
- [ ] **Tester**: Simuler latence élevée (throttle dans DevTools)
- [ ] **Tester**: Couper/rétablir la connexion réseau
- [ ] Le jeu ne crash pas, affiche un message d'erreur approprié

---

## 10. MODULE 2FA (si activé)
- [ ] Enrôlement 2FA (TOTP/SMS/email) avec verification du code à l’activation
- [ ] Stockage sécurisé du secret 2FA (pas en clair côté client)
- [ ] Vérification du code 2FA lors du login + rotation/expiration des JWT
- [ ] Flux de récupération (codes de secours ou reset sécurisé) sans exposer le secret

---

## 11. COMMANDES DE VÉRIFICATION

Exécuter ces commandes avant le push final:

```bash
# Chercher des secrets hardcodés
grep -rn "secret" --include="*.js" --include="*.ts" | grep -v node_modules | grep -v ".env"
grep -rn "password" --include="*.js" --include="*.ts" | grep -v node_modules | grep -v hash

# Chercher des TODO de sécurité oubliés
grep -rn "TODO.*secur" --include="*.js" --include="*.ts"
grep -rn "FIXME" --include="*.js" --include="*.ts"

# Vérifier que .env n'est pas commité
git ls-files | grep -E "^\.env$"

# Chercher les innerHTML potentiellement dangereux
grep -rn "innerHTML" frontend/src/*.ts | grep -v sanitize
```

---

## 12. TESTS MANUELS POUR L'ÉVALUATION

> Ces tests correspondent aux critères de l'évaluation officielle.
> À faire AVANT de présenter le projet.

### 11.1 Inscription & Connexion
- [ ] Un utilisateur peut s'inscrire sur le site
- [ ] Les utilisateurs enregistrés peuvent se connecter
- [ ] Déconnexion fonctionne correctement

### 11.2 SPA & Navigation
- [ ] Le site est une Single Page Application
- [ ] Boutons "Retour" et "Forward" du navigateur fonctionnent
- [ ] Navigation fluide sans rechargement de page

### 11.3 Préoccupations de sécurité (CRITIQUE)
> "S'il y a une erreur, l'évaluation se termine maintenant"

- [ ] **TLS**: Le site est accessible en HTTPS uniquement
- [ ] **Passwords**: Les mots de passe sont hashés en BDD (vérifier avec SQLite)
- [ ] **Validation serveur**: Tester avec des inputs malicieux:
  - [ ] `<script>alert('xss')</script>` dans username → rejeté ou échappé
  - [ ] Email invalide → rejeté
  - [ ] Password trop court → rejeté
- [ ] **Pas de secrets exposés**: Ouvrir DevTools → Network → aucun token/secret visible dans les URLs

### 11.4 Le Jeu - Local
- [ ] Pong jouable localement sur le même ordinateur
- [ ] Chaque joueur utilise une section différente du clavier
- [ ] Possibilité d'initier un tournoi
- [ ] Matchmaking connecte les joueurs locaux

### 11.5 Le Jeu - Gameplay
- [ ] Le jeu respecte le Pong original
- [ ] Commandes intuitives OU règles expliquées
- [ ] Écran de fin de partie affiché quand un jeu se termine
- [ ] Possibilité de quitter proprement

### 11.6 Le Jeu - Déconnexions
- [ ] Si un joueur ferme son navigateur → l'autre est notifié
- [ ] Pas de crash en cas de problème réseau
- [ ] Messages d'erreur appropriés

### 11.7 Modules additionnels
- [ ] Chaque module fonctionne sans erreur visible
- [ ] Pouvoir expliquer comment chaque module fonctionne
- [ ] Pouvoir expliquer pourquoi chaque module a été choisi

---

## 13. CHECKLIST RAPIDE PRÉ-ÉVALUATION

Cocher avant de commencer l'évaluation:

```
[ ] make up → tous les containers démarrent sans erreur
[ ] https://localhost:8443 → site accessible
[ ] Inscription d'un nouvel utilisateur → OK
[ ] Connexion → OK
[ ] Partie Pong locale 2 joueurs → OK
[ ] Partie Pong vs IA → OK
[ ] Tournoi → OK
[ ] Chat global → OK
[ ] Messages privés → OK
[ ] Profil utilisateur → OK
[ ] Tous les modules bonus fonctionnent → OK
[ ] DevTools ouvert: aucune erreur console rouge critique
```

---

## 14. HISTORIQUE DES CORRECTIONS

| Date | Correction | Fichiers modifiés |
|------|------------|-------------------|
| 2024-11-26 | JWT_SECRET obligatoire | server.js |
| 2024-11-26 | Rate limiting ajouté | server.js, package.json |
| 2024-11-26 | Validation inputs | server.js, chat.js, blockchain.js |
| 2024-11-26 | Fix OAuth URL exposure | main.ts |
| 2024-11-26 | Fix XSS innerHTML | main.ts |

---

**Responsable sécurité**: Lubachma
**Dernière revue**: 2024-11-26
