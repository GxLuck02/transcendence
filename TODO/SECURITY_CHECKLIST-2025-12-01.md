# Checklist de Sécurité - ft_transcendence (Revue 2025-12-01)

**IMPORTANT**: Vérifier tous ces points avant chaque push vers le repo de l'école.

## 1. AUTHENTIFICATION & JWT (CRITIQUE)

### 1.1 JWT_SECRET
- [x] **Fichier**: `fastify-backend/src/server.js` (lignes 16-23)
- [x] Le serveur refuse de démarrer si `JWT_SECRET` n'est pas défini ou < 32 chars
- [x] Le secret n'a pas de valeur par défaut type `|| 'default-secret'`

### 1.2 Fichier .env
- [ ] `JWT_SECRET` défini avec une valeur forte (actuellement placeholder, non aléatoire)
- [x] `.env` présent dans `.gitignore`
- [x] `.env.exemple` contient un placeholder, pas le vrai secret

## 2. RATE LIMITING (ÉLEVÉ)

### 2.1 Dépendance
- [x] **Fichier**: `fastify-backend/package.json` → `@fastify/rate-limit` présent

### 2.2 Configuration globale
- [x] **Fichier**: `fastify-backend/src/server.js`
- [x] Config globale appliquée (100 req/min)

### 2.3 Rate limit strict sur routes sensibles
- [x] `/api/users/login/` et `/api/users/register/` protégées par `authRateLimit` (5/min)

## 3. VALIDATION DES INPUTS (ÉLEVÉ)

### 3.1 Registration (`server.js`)
- [x] Validation username/email/display_name/password conforme (lignes ~118-175)
- [ ] Validation présente pour tous les autres endpoints (pas uniquement register/login) avec schémas ou équivalent

### 3.2 Chat messages (`routes/chat.js`)
- [x] `MAX_MESSAGE_LENGTH` et `MAX_ROOM_CODE_LENGTH` définis
- [x] Longueur/typage du contenu, `recipient_id` positif, `message_type` whitelisted

### 3.3 Blockchain (`routes/blockchain.js`)
- [x] `tournament_id` entier positif, `winner_username` 1-100 chars, `winner_score` entier >= 0

## 4. PROTECTION XSS (MODÉRÉ)

### 4.1 Fonction sanitizeHTML
- [x] Présente dans `frontend/src/main.ts`

### 4.2 Utilisation de sanitizeHTML
- [x] `homePage()` : données utilisateur échappées
- [x] `chatPage()` : nom affiché échappé
- [x] `profilePage()` : username/email/display_name échappés
- [x] Listes (conversations, amis, messages, notifications) utilisent sanitizeHTML
- [ ] Autres innerHTML avec données utilisateur à corriger : matchmaking Pong (`opponentName`) et tournoi (alias participants/bracket) insérés sans sanitization.

### 4.3 Patterns à rechercher (DANGER)
- [x] Pas d'`innerHTML` avec `user.*` / `display_name` / `username` non échappés trouvés via grep ciblé (hors cas notés ci-dessus)

## 5. TOKENS OAUTH (MODÉRÉ)

### 5.1 Nettoyage immédiat de l'URL
- [x] `frontend/src/main.ts` → `handleOAuthCallback()` nettoie l'URL avant tout appel async

## 6. CONFIGURATION HTTPS/TLS & CORS (CRITIQUE pour l'éval)

### 6.1 TLS/HTTPS obligatoire
- [ ] Certificats SSL présents dans `nginx/ssl/` (absents, README seulement)
- [ ] `curl -I https://localhost:8443` retourne 200 (non testé)
- [ ] `curl -I http://localhost:8080` redirige vers HTTPS ou refuse (non testé)
- [x] WebSocket en WSS côté frontend (`wss://...` si page en HTTPS) ; proxy `/ws/` configuré dans Nginx
- [ ] Pas de fallback `ws://` quand la page est servie en HTTPS (front)
- [ ] Aucune ressource chargée en HTTP (non vérifié/mixed content non testé)

### 6.2 Configuration Nginx
- [x] TLS 1.2+ uniquement (`ssl_protocols TLSv1.2 TLSv1.3`)
- [x] Ciphers sécurisés configurés (`HIGH:!aNULL:!MD5`)
- [x] Headers de sécurité présents (HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

### 6.3 CORS
- [x] `fastify-backend/src/server.js` → origins restreints à `https://localhost:8443` / `https://127.0.0.1:8443`

## 7. BASE DE DONNÉES

### 7.1 Requêtes préparées
- [x] Requêtes SQL faites via `db.prepare(...)` ; pas de concaténation de chaînes observée

### 7.2 Mots de passe
- [x] Hashés avec bcrypt (12 rounds)
- [x] Jamais retournés dans les réponses API (`serializeUser` retire `password_hash`)
- [ ] Coût de hashage aligné production (>= 12, ajusté selon perf)

## 8. VARIABLES D'ENVIRONNEMENT

### 8.1 Secrets requis (prod)
- [ ] `JWT_SECRET` fort (placeholder actuel à remplacer par valeur aléatoire 32+ chars)
- [ ] `BLOCKCHAIN_PRIVATE_KEY` (placeholder/absent)
- [ ] `OAUTH_42_CLIENT_SECRET` (placeholder/absent)
- [ ] `OAUTH_GITHUB_CLIENT_SECRET` (placeholder/absent)

### 8.2 Fichiers sensibles
- [x] `.env` dans `.gitignore`
- [x] Aucun secret réel trouvé hardcodé dans le code / logs (grep `secret`, `password`)
- [ ] Contrôle pré-push: git grep pour API keys/credentials accidentels

## 9. WEBSOCKETS & GESTION DES DÉCONNEXIONS

### 9.1 Authentification WebSocket
- [ ] Auth non imposée avant actions Pong (messages possibles avant `authenticate`), pas de timeout inactivité
- [ ] Validation des messages côté serveur minimale (chat global et pong sans contrôles de longueur/schema)
- [ ] Fermer/refuser connexion si pas d'auth après délai ; limiter taille/messages pour éviter abuse

### 9.2 Gestion des déconnexions (Pong remote)
- [x] Détection de déconnexion et notification adversaire + cleanup room dans `fastify-backend/src/websockets/pong.js` (non testé en manuel)

### 9.3 Gestion des déconnexions (Chat)
- [x] Statut en ligne mis à jour à la déconnexion
- [ ] Pas de reconnexion automatique côté client en cas de perte de connexion

### 9.4 Robustesse réseau
- [ ] Tests latence/coupure réseau non effectués

## 13. MODULE 2FA (si activé)
- [ ] Enrôlement 2FA (TOTP/SMS/email) avec verification du code à l’activation
- [ ] Stockage sécurisé du secret 2FA (pas en clair côté client)
- [ ] Vérification du code 2FA lors du login + rotation/expiration des JWT
- [ ] Flux de récupération (codes de secours ou reset sécurisé) sans exposer le secret

## 10. COMMANDES DE VÉRIFICATION

- [x] `grep -rn "secret" --include="*.js" --include="*.ts" | grep -v node_modules | grep -v ".env"`
- [x] `grep -rn "password" --include="*.js" --include="*.ts" | grep -v node_modules | grep -v hash`
- [x] `grep -rn "TODO.*secur" --include="*.js" --include="*.ts"`
- [x] `grep -rn "FIXME" --include="*.js" --include="*.ts"`
- [x] `git ls-files | grep -E "^\\.env$"`
- [x] `grep -rn "innerHTML" frontend/src/*.ts | grep -v sanitize` (résultats examinés ; points à corriger notés §4.2)

## 11. TESTS MANUELS POUR L'ÉVALUATION

- [ ] Inscription/Connexion/Déconnexion
- [ ] SPA & navigation (retour/forward)
- [ ] TLS-only, hash BDD, validations serveur (inputs malicieux)
- [ ] Pas de secrets/tokens exposés dans les URLs (DevTools)
- [ ] Pong local/IA/remote/tournoi
- [ ] Gestion des déconnexions réseau
- [ ] Modules additionnels ok

## 12. CHECKLIST RAPIDE PRÉ-ÉVALUATION

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

## HISTORIQUE DES CORRECTIONS / REVUES

| Date | Correction/Observation | Fichiers concernés |
|------|------------------------|--------------------|
| 2024-11-26 | JWT_SECRET obligatoire | server.js |
| 2024-11-26 | Rate limiting ajouté | server.js, package.json |
| 2024-11-26 | Validation inputs | server.js, chat.js, blockchain.js |
| 2024-11-26 | Fix OAuth URL exposure | main.ts |
| 2024-11-26 | Fix XSS innerHTML | main.ts |
| 2025-12-01 | Revue sécurité: JWT ok côté code, sanitization manquante pour matchmaking/tournoi, certifs SSL absents, secrets .env à durcir | main.ts, nginx/ssl, .env |

**Responsable sécurité**: Lubachma  
**Dernière revue**: 2025-12-01
