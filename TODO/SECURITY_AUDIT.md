# Audit de Securite - ft_transcendence

Date: 2024-12-04

## Resume

- Vulnerabilites CRITIQUES: 8
- Vulnerabilites ELEVEES: 10
- Vulnerabilites MODEREES: 12

---

## VULNERABILITES CRITIQUES

### 1. [CORRIGE] Ports Redis et API exposes
**Fichier:** `docker-compose.yml:6-7, 22-23`
- Redis accessible sur port 6379 (pas d'auth)
- API accessible sur port 8000 (bypass Nginx)

### 2. [CORRIGE] JWT_SECRET avec fallback visible
**Fichier:** `docker-compose.yml:27`
```yaml
JWT_SECRET=${JWT_SECRET:-change-this-secret-in-production}
```

### 3. [CORRIGE] Conteneurs executes en root
**Fichiers:** `fastify-backend/Dockerfile`, `frontend/Dockerfile.dev`
- Aucun USER specifie = UID 0

### 4. [CORRIGE] Manipulation resultats matchs (IDOR)
**Fichier:** `fastify-backend/src/routes/pong.js:42-76`
- Pas de verification que l'utilisateur est implique dans le match

### 5. [CORRIGE] XSS via innerHTML (game_room_code)
**Fichier:** `frontend/src/main.ts:1251`
- game_room_code injecte sans sanitisation

### 6. [CORRIGE] console.log avec tokens OAuth
**Fichier:** `frontend/src/main.ts:106, 130`
- Tokens visibles dans la console

### 7. Tokens JWT dans URL (OAuth callback)
**Fichiers:** `fastify-backend/src/routes/oauth.js:118-119, 233-234`
- Tokens passes en query params
- Note: Le nettoyage URL cote frontend attenueLE risque

### 8. Stockage tokens en localStorage
**Fichiers:** `frontend/src/services/auth.service.ts:25-26, 40-41`
- Vulnerable si XSS present (corriger XSS en priorite)

---

## VULNERABILITES ELEVEES

### 9. Pas de rate limiting WebSocket
**Fichiers:** `fastify-backend/src/websockets/chat.js`, `pong.js`
- Risque DoS via flood de messages

### 10. IDOR consultation matchs
**Fichier:** `fastify-backend/src/routes/pong.js:30-38`
- Tout utilisateur peut voir n'importe quel match

### 11. Validation insuffisante (chat limit)
**Fichier:** `fastify-backend/src/routes/chat.js:48-96`
- Pas de max sur le parametre limit

### 12. Erreurs detaillees exposees
**Fichier:** `fastify-backend/src/routes/blockchain.js:113, 135`
- error.message retourne au client

### 13. console.log donnees sensibles (chat)
**Fichier:** `frontend/src/services/chat.service.ts:59`

### 14. Pas de rotation refresh tokens
**Fichier:** `fastify-backend/src/server.js:158-164`
- Token compromis valide 7 jours

### 15. Permissions .env incorrectes
**Fichier:** `.env`
- Devrait etre chmod 600

### 16. Headers securite manquants (Nginx)
**Fichier:** `nginx/nginx.conf`
- Content-Security-Policy
- Referrer-Policy
- Permissions-Policy

### 17. Images Docker non-pinned
- `FROM node:20-alpine` sans version patch

### 18. npm install au lieu de npm ci
**Fichier:** `frontend/Dockerfile.dev:9`

---

## VULNERABILITES MODEREES

### 19. Pas de verification Origin WebSocket
### 20. Placeholder password OAuth ('oauth_42')
### 21. Pas de validation limites scores
### 22. sanitizeHTML() basique
### 23. Pas de validation runtime types (as User)
### 24. Outils build conserves dans image prod
### 25. Volumes avec :z flag
### 26. Gzip sans restriction
### 27. Pas de CSRF token
### 28. Base URL en dur
### 29. alert() avec donnees non validees
### 30. Copy . . sans .dockerignore

---

## BONNES PRATIQUES OBSERVEES

- bcrypt avec SALT_ROUNDS=12
- Prepared statements (protection SQL injection)
- JWT secret minimum 32 chars
- CORS bien configure (pas de wildcard)
- Rate limiting sur routes auth
- TLS 1.2/1.3 uniquement
- Headers HSTS, X-Frame-Options, X-Content-Type-Options

---

## CONFORMITE SUJET 42

- [x] Hash mots de passe (bcrypt)
- [x] HTTPS obligatoire
- [x] WSS au lieu de WS
- [x] Protection SQL injection
- [x] Protection XSS (apres correction)
- [x] .env ignore par git
- [ ] Validation inputs (partiel)
