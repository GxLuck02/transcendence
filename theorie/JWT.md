# Theorie : JWT (JSON Web Tokens) - Authentification moderne

## Table des matieres
1. [Qu'est-ce qu'un JWT ?](#quest-ce-quun-jwt-)
2. [Pourquoi JWT dans ft_transcendence](#pourquoi-jwt-dans-ft_transcendence)
3. [Structure d'un JWT](#structure-dun-jwt)
4. [Le flux d'authentification](#le-flux-dauthentification)
5. [Exemples pratiques de notre projet](#exemples-pratiques-de-notre-projet)
6. [Securite et bonnes pratiques](#securite-et-bonnes-pratiques)
7. [Exercices pratiques](#exercices-pratiques)

---

## Qu'est-ce qu'un JWT ?

### Definition simple

**JWT (JSON Web Token)** est un standard ouvert (RFC 7519) qui definit un moyen compact et securise de transmettre des informations entre deux parties sous forme d'objet JSON. Ces informations peuvent etre verifiees et approuvees car elles sont **signees numeriquement**.

### L'analogie du badge d'acces

Imaginez un badge d'employe :
- **Votre identite** = Votre nom, photo, service (les donnees)
- **Le hologramme** = La signature cryptographique (preuve d'authenticite)
- **La date d'expiration** = La duree de validite du token

```
┌─────────────────────────────────────────────────────────────────┐
│                        BADGE JWT                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Nom: Jean Dupont                                                │
│  ID: 12345                                                       │
│  Service: Developpeur                                            │
│                                                                  │
│  Expire: 2025-12-09 15:30:00                                     │
│                                                                  │
│  ═══════════════════════════════════════                         │
│  SIGNATURE: hk2j3h4k5jh3k2j5h3k2j5h3                             │
│  (Prouve que ce badge vient de l'entreprise)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pourquoi "Token" ?

Un **token** est comme un "jeton" qui represente quelque chose. Dans notre cas, le JWT represente l'identite d'un utilisateur authentifie.

---

## Pourquoi JWT dans ft_transcendence

### Le probleme : Comment savoir qui est l'utilisateur ?

Sans JWT, le serveur devrait :
1. Stocker toutes les sessions en memoire (ou base de donnees)
2. Verifier a chaque requete si la session existe
3. Gerer la synchronisation entre plusieurs serveurs

### La solution JWT : Authentification "stateless"

Avec JWT :
1. Le serveur genere un token signe a la connexion
2. Le client envoie ce token a chaque requete
3. Le serveur verifie simplement la signature (sans base de donnees)

```
┌────────────────────────────────────────────────────────────────────┐
│                   FLUX D'AUTHENTIFICATION JWT                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. CONNEXION                                                       │
│     Client ───► POST /api/users/login/ ───► Serveur                 │
│                 { username, password }                              │
│                                                                     │
│  2. GENERATION DU TOKEN                                             │
│     Serveur : Verifie credentials → Cree JWT → Signe avec secret    │
│                                                                     │
│  3. ENVOI DU TOKEN                                                  │
│     Serveur ───► { tokens: { access, refresh }, user } ───► Client  │
│                                                                     │
│  4. STOCKAGE COTE CLIENT                                            │
│     Client : localStorage.setItem('access_token', token)            │
│                                                                     │
│  5. REQUETES AUTHENTIFIEES                                          │
│     Client ───► GET /api/users/me/  ───► Serveur                    │
│                 Headers: { Authorization: "Bearer <token>" }        │
│                                                                     │
│  6. VERIFICATION                                                    │
│     Serveur : Decode token → Verifie signature → Extrait userId     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Avantages du JWT dans notre projet

| Avantage | Description |
|----------|-------------|
| **Stateless** | Pas besoin de stocker les sessions cote serveur |
| **Scalable** | Fonctionne avec plusieurs serveurs sans partage d'etat |
| **Securise** | Signature cryptographique = impossible a falsifier |
| **Portable** | Fonctionne sur web, mobile, API |
| **Standard** | Compatible avec tous les langages/frameworks |

---

## Structure d'un JWT

### Les 3 parties d'un JWT

Un JWT est compose de 3 parties separees par des points (`.`) :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwMTk1MjAwMCwiZXhwIjoxNzAxOTU1NjAwfQ.K7gNU3sdo-OL0wNhqoVWhr3g6s1xYv72ol_pe_Uu_ow
└─────────────── HEADER ───────────────┘.└─────────────────────────── PAYLOAD ────────────────────────────┘.└─────────────── SIGNATURE ──────────────┘
```

### 1. Header (En-tete)

Contient le type de token et l'algorithme de signature.

```json
{
  "alg": "HS256",    // Algorithme de signature (HMAC SHA-256)
  "typ": "JWT"       // Type de token
}
```

Encode en Base64URL → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### 2. Payload (Donnees)

Contient les "claims" (affirmations) sur l'utilisateur.

```json
{
  "userId": 1,                   // Donnee personnalisee
  "iat": 1701952000,             // Issued At (date de creation)
  "exp": 1701955600              // Expiration (date d'expiration)
}
```

Encode en Base64URL → `eyJ1c2VySWQiOjEsImlhdCI6MTcwMTk1MjAwMCwiZXhwIjoxNzAxOTU1NjAwfQ`

**Claims standards :**
| Claim | Nom complet | Description |
|-------|-------------|-------------|
| `iat` | Issued At | Timestamp de creation |
| `exp` | Expiration | Timestamp d'expiration |
| `sub` | Subject | Identifiant du sujet (utilisateur) |
| `iss` | Issuer | Emetteur du token |
| `aud` | Audience | Destinataire du token |

### 3. Signature

Garantit l'integrite du token. Creee avec :

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

> **IMPORTANT** : Le `secret` est connu uniquement du serveur. Sans lui, impossible de creer une signature valide.

### Schema visuel

```
┌─────────────────────────────────────────────────────────────────┐
│                       JSON WEB TOKEN                             │
├───────────────────┬───────────────────┬─────────────────────────┤
│      HEADER       │      PAYLOAD      │       SIGNATURE          │
├───────────────────┼───────────────────┼─────────────────────────┤
│                   │                   │                          │
│  {                │  {                │  HMACSHA256(             │
│    "alg": "HS256" │    "userId": 1,   │    header.payload,       │
│    "typ": "JWT"   │    "iat": ...,    │    secret                │
│  }                │    "exp": ...     │  )                       │
│                   │  }                │                          │
│                   │                   │                          │
│  ─────────────►   │  ─────────────►   │  Verifie que le token    │
│  Base64URL        │  Base64URL        │  n'a pas ete modifie     │
│                   │                   │                          │
└───────────────────┴───────────────────┴─────────────────────────┘
                              │
                              ▼
        eyJhbGci...  .  eyJ1c2VySWQi...  .  K7gNU3sdo...
```

---

## Le flux d'authentification

### 1. Inscription / Connexion

```
┌─────────┐                                              ┌─────────┐
│ CLIENT  │                                              │ SERVEUR │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │  POST /api/users/login/                                │
     │  { username: "john", password: "secret123" }           │
     │ ──────────────────────────────────────────────────────►│
     │                                                        │
     │                         Verifie le mot de passe        │
     │                         Genere Access Token (1h)       │
     │                         Genere Refresh Token (7j)      │
     │                                                        │
     │  { tokens: { access, refresh }, user }                 │
     │ ◄──────────────────────────────────────────────────────│
     │                                                        │
     │  Stocke les tokens dans localStorage                   │
     │                                                        │
```

### 2. Requete authentifiee

```
┌─────────┐                                              ┌─────────┐
│ CLIENT  │                                              │ SERVEUR │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │  GET /api/users/me/                                    │
     │  Headers: { Authorization: "Bearer <access_token>" }   │
     │ ──────────────────────────────────────────────────────►│
     │                                                        │
     │                         Decode le token                │
     │                         Verifie la signature           │
     │                         Verifie l'expiration           │
     │                         Extrait userId                 │
     │                                                        │
     │  { id: 1, username: "john", ... }                      │
     │ ◄──────────────────────────────────────────────────────│
     │                                                        │
```

### 3. Refresh Token (Renouvellement)

```
┌─────────┐                                              ┌─────────┐
│ CLIENT  │                                              │ SERVEUR │
└────┬────┘                                              └────┬────┘
     │                                                        │
     │  L'access token expire (apres 1h)                      │
     │                                                        │
     │  POST /api/users/refresh/                              │
     │  { refresh_token: "<refresh_token>" }                  │
     │ ──────────────────────────────────────────────────────►│
     │                                                        │
     │                         Verifie le refresh token       │
     │                         Genere un nouvel access token  │
     │                                                        │
     │  { access: "<new_access_token>" }                      │
     │ ◄──────────────────────────────────────────────────────│
     │                                                        │
```

### Pourquoi deux tokens ?

| Token | Duree | Utilisation |
|-------|-------|-------------|
| **Access Token** | Court (1h) | Chaque requete API |
| **Refresh Token** | Long (7j) | Renouveler l'access token |

**Raison de securite** : Si l'access token est vole, il expire vite. Le refresh token est utilise rarement et peut etre revoque.

---

## Exemples pratiques de notre projet

### 1. Configuration JWT cote serveur

**Fichier** : `fastify-backend/src/server.js:16-44`

```javascript
import fastifyJwt from '@fastify/jwt';

const JWT_SECRET = process.env.JWT_SECRET;

// Verification de securite : le secret doit etre defini et fort
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be defined and at least 32 characters');
  process.exit(1);
}

// Configuration du plugin JWT
app.register(fastifyJwt, {
  secret: JWT_SECRET,  // Cle secrete pour signer les tokens
});

// Decorator pour proteger les routes
app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();  // Verifie et decode le token
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or missing token' });
  }
});
```

### 2. Generation des tokens a la connexion

**Fichier** : `fastify-backend/src/server.js:174-201`

```javascript
// Login
app.post('/api/users/login/', async (request, reply) => {
  const { username, password } = request.body || {};

  // ... validation ...

  // Verifier le mot de passe
  const isValid = await verifyPassword(rows?.password_hash, password);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Mettre a jour le statut en ligne
  db.prepare('UPDATE users SET is_online = 1 WHERE id = ?').run(user.id);

  // GENERATION DES TOKENS
  const accessToken = app.jwt.sign(
    { userId: user.id },      // Payload (donnees)
    { expiresIn: '1h' }       // Expire dans 1 heure
  );

  const refreshToken = app.jwt.sign(
    { userId: user.id },
    { expiresIn: '7d' }       // Expire dans 7 jours
  );

  reply.send({
    user: serializeUser(findUserById.get(user.id)),
    tokens: {
      access: accessToken,
      refresh: refreshToken,
    },
  });
});
```

### 3. Protection des routes avec le decorator

**Fichier** : `fastify-backend/src/server.js:211-217`

```javascript
// Route protegee - necessite un token valide
app.get('/api/users/me/', {
  preValidation: [app.authenticate]  // Verifie le token AVANT d'executer la route
}, async (request, reply) => {
  // request.user contient les donnees du token decode
  const user = findUserById.get(request.user.userId);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  reply.send(serializeUser(user));
});
```

### 4. Stockage et envoi des tokens cote client

**Fichier** : `frontend/src/services/auth.service.ts:37-60`

```typescript
// Sauvegarde des tokens
private saveTokens(accessToken: string, refreshToken: string): void {
  this.accessToken = accessToken;
  this.refreshToken = refreshToken;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

// Chargement des tokens au demarrage
private loadTokens(): void {
  this.accessToken = localStorage.getItem('access_token');
  this.refreshToken = localStorage.getItem('refresh_token');
  // ...
}

// Suppression des tokens (deconnexion)
public clearAuth(): void {
  this.accessToken = null;
  this.refreshToken = null;
  this.currentUser = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('current_user');
}
```

### 5. Envoi du token dans les requetes

**Fichier** : `frontend/src/services/auth.service.ts:267-272`

```typescript
// Helper pour obtenir les headers d'authentification
public getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${this.accessToken}`,  // Format: "Bearer <token>"
    'Content-Type': 'application/json',
  };
}
```

**Utilisation dans une requete :**

```typescript
const response = await fetch(`${this.baseURL}/users/friends/`, {
  headers: {
    Authorization: `Bearer ${this.accessToken}`,
  },
});
```

---

## Securite et bonnes pratiques

### 1. Secrets forts

```javascript
// server.js
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}
```

**Generer un secret securise :**
```bash
# Linux/Mac
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 2. Duree d'expiration appropriee

| Type de token | Duree recommandee | Raison |
|---------------|-------------------|--------|
| Access Token | 15min - 1h | Limite les degats en cas de vol |
| Refresh Token | 7j - 30j | Evite de se reconnecter trop souvent |

### 3. Ne JAMAIS stocker de donnees sensibles dans le payload

```javascript
// MAUVAIS - Le mot de passe est visible !
const token = jwt.sign({
  userId: 1,
  password: 'secret123'  // DANGER !
}, secret);

// BON - Seul l'ID est stocke
const token = jwt.sign({
  userId: 1
}, secret);
```

**Pourquoi ?** Le payload est encode en Base64, pas chiffre. N'importe qui peut le decoder :

```javascript
// Decoder un JWT (sans verifier la signature)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);  // { userId: 1, password: 'secret123' } <- VISIBLE !
```

### 4. Stockage securise cote client

| Methode | Securite | XSS | CSRF |
|---------|----------|-----|------|
| `localStorage` | Moyenne | Vulnerable | Protege |
| `sessionStorage` | Moyenne | Vulnerable | Protege |
| Cookie HttpOnly | Haute | Protege | Vulnerable |
| Cookie HttpOnly + SameSite | Tres haute | Protege | Protege |

> **Notre projet** utilise `localStorage` pour la simplicite, mais dans un environnement de production critique, les cookies HttpOnly sont preferables.

### 5. Validation cote serveur

```javascript
app.decorate('authenticate', async function (request, reply) {
  try {
    // jwtVerify fait automatiquement :
    // 1. Decode le token
    // 2. Verifie la signature
    // 3. Verifie l'expiration
    await request.jwtVerify();
  } catch (err) {
    // Si une de ces verifications echoue → 401
    reply.code(401).send({ error: 'Invalid or missing token' });
  }
});
```

---

## Comparaison : JWT vs Sessions

### Sessions (methode traditionnelle)

```
┌─────────┐                                    ┌─────────┐
│ CLIENT  │                                    │ SERVEUR │
└────┬────┘                                    └────┬────┘
     │  Login (username, password)                  │
     │ ────────────────────────────────────────────►│
     │                                              │
     │                    Cree session en memoire   │
     │                    session_id → user data    │
     │                                              │
     │  Cookie: session_id=abc123                   │
     │ ◄────────────────────────────────────────────│
     │                                              │
     │  Requete + Cookie                            │
     │ ────────────────────────────────────────────►│
     │                                              │
     │                    Cherche session_id        │
     │                    dans la base/memoire      │
     │                                              │
```

### JWT (methode moderne)

```
┌─────────┐                                    ┌─────────┐
│ CLIENT  │                                    │ SERVEUR │
└────┬────┘                                    └────┬────┘
     │  Login (username, password)                  │
     │ ────────────────────────────────────────────►│
     │                                              │
     │                    Cree JWT (signe)          │
     │                    Pas de stockage !         │
     │                                              │
     │  { token: "eyJhbG..." }                      │
     │ ◄────────────────────────────────────────────│
     │                                              │
     │  Requete + Authorization: Bearer <token>     │
     │ ────────────────────────────────────────────►│
     │                                              │
     │                    Verifie signature         │
     │                    Decode le payload         │
     │                    Pas de base de donnees !  │
     │                                              │
```

### Tableau comparatif

| Aspect | Sessions | JWT |
|--------|----------|-----|
| Stockage serveur | Oui (memoire/DB) | Non |
| Scalabilite | Difficile | Facile |
| Revocation | Facile | Difficile |
| Taille | Petite (ID) | Plus grande (payload) |
| Performance | Requete DB | Calcul CPU |
| Stateless | Non | Oui |

---

## Exercices pratiques

### Exercice 1 : Decoder un JWT

**Objectif** : Decoder le payload d'un JWT sans librairie.

```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MDE5NTIwMDAsImV4cCI6MTcwMTk1NTYwMH0.K7gNU3sdo';

// A completer
function decodePayload(token) {
  // Votre code ici
}
```

<details>
<summary>Solution</summary>

```javascript
function decodePayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payload = parts[1];
  // Base64URL → Base64
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  // Decoder
  const jsonString = atob(base64);
  return JSON.parse(jsonString);
}

console.log(decodePayload(token));
// { userId: 42, iat: 1701952000, exp: 1701955600 }
```
</details>

---

### Exercice 2 : Verifier l'expiration

**Objectif** : Creer une fonction qui verifie si un token est expire.

```typescript
function isTokenExpired(token: string): boolean {
  // Votre code ici
}
```

<details>
<summary>Solution</summary>

```typescript
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    if (!payload.exp) return false;  // Pas d'expiration definie

    const expirationDate = new Date(payload.exp * 1000);  // exp est en secondes
    return expirationDate < new Date();
  } catch {
    return true;  // En cas d'erreur, considerer comme expire
  }
}
```
</details>

---

### Exercice 3 : Creer une route protegee

**Objectif** : Proteger une route Fastify avec JWT.

```javascript
// Creer une route GET /api/protected qui retourne "Secret data"
// uniquement si l'utilisateur est authentifie

// Votre code ici
```

<details>
<summary>Solution</summary>

```javascript
app.get('/api/protected', {
  preValidation: [app.authenticate]  // Decorator defini plus haut
}, async (request, reply) => {
  // request.user contient les donnees du token
  const userId = request.user.userId;

  reply.send({
    message: 'Secret data',
    userId: userId,
  });
});
```
</details>

---

## Resume

| Concept | Description |
|---------|-------------|
| **JWT** | Token signe contenant des donnees utilisateur |
| **Header** | Algorithme et type de token |
| **Payload** | Donnees (claims) de l'utilisateur |
| **Signature** | Preuve cryptographique d'integrite |
| **Access Token** | Token court pour les requetes API |
| **Refresh Token** | Token long pour renouveler l'access |
| **Bearer** | Schema d'autorisation HTTP pour JWT |

---

## Ressources

- [JWT.io](https://jwt.io/) - Debugger et documentation
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [MDN - HTTP Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)
- [@fastify/jwt Documentation](https://github.com/fastify/fastify-jwt)

---

**Derniere mise a jour** : 2025-12-08
**Projet** : ft_transcendence (Ecole 42)
