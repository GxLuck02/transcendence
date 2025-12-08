# Theorie : Fastify - Framework Backend Node.js

## Table des matieres
1. [Qu'est-ce que Fastify ?](#quest-ce-que-fastify-)
2. [Pourquoi Fastify dans ft_transcendence](#pourquoi-fastify-dans-ft_transcendence)
3. [Architecture et concepts cles](#architecture-et-concepts-cles)
4. [Creer des routes](#creer-des-routes)
5. [Plugins et Decorators](#plugins-et-decorators)
6. [Exemples pratiques de notre projet](#exemples-pratiques-de-notre-projet)
7. [Exercices pratiques](#exercices-pratiques)

---

## Qu'est-ce que Fastify ?

### Definition simple

**Fastify** est un framework web pour Node.js concu pour etre **rapide** et avoir une **faible overhead**. Il est souvent compare a Express.js mais offre de meilleures performances et un systeme de plugins plus robuste.

### L'analogie du restaurant

Imaginez un restaurant :
- **Fastify** = La cuisine bien organisee
- **Routes** = Les differents plats du menu
- **Plugins** = Les equipements de cuisine (four, frigo...)
- **Handlers** = Les chefs qui preparent les commandes
- **Request/Reply** = La commande et le plat servi

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE FASTIFY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client HTTP                                                     │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    FASTIFY SERVER                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │   PLUGIN    │  │   PLUGIN    │  │   PLUGIN    │      │    │
│  │  │   (JWT)     │  │   (CORS)    │  │ (WebSocket) │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  │                                                          │    │
│  │  ┌───────────────────────────────────────────────┐      │    │
│  │  │              ROUTE HANDLER                    │      │    │
│  │  │  /api/users/login → login()                   │      │    │
│  │  │  /api/users/me    → getUser()                 │      │    │
│  │  │  /api/pong/match  → createMatch()             │      │    │
│  │  └───────────────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       ▼                                                          │
│  Response JSON                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pourquoi "Fastify" ?

Le nom vient de "Fast" (rapide) + "ify" (rendre). L'objectif est de rendre le developpement backend rapide, tant en performance qu'en productivite.

---

## Pourquoi Fastify dans ft_transcendence

### Comparaison avec Express.js

| Aspect | Express.js | Fastify |
|--------|------------|---------|
| Performance | ~15,000 req/s | ~30,000 req/s |
| Validation | Manuelle | Schema JSON integre |
| TypeScript | Support moyen | Excellent support |
| Plugins | Middleware | Systeme encapsule |
| Async/Await | Support basique | Natif et optimise |
| Logging | Non integre | Pino integre |

### Les avantages pour notre projet

1. **Performance** : Le jeu Pong necessite des communications rapides
2. **WebSockets** : Plugin officiel `@fastify/websocket`
3. **JWT** : Plugin officiel `@fastify/jwt` pour l'authentification
4. **Validation** : Schemas JSON pour valider les requetes
5. **Modern** : Syntaxe async/await native

### Architecture de notre backend

```
┌─────────────────────────────────────────────────────────────────┐
│                    fastify-backend/                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  src/                                                            │
│  ├── server.js          # Point d'entree, configuration          │
│  ├── db.js              # Connexion SQLite                       │
│  ├── routes/                                                     │
│  │   ├── pong.js        # Routes du jeu Pong                     │
│  │   ├── chat.js        # Routes du chat                         │
│  │   ├── blockchain.js  # Routes blockchain                      │
│  │   └── oauth.js       # Routes OAuth (42, GitHub)              │
│  ├── websockets/                                                 │
│  │   ├── pong.js        # WebSocket jeu Pong                     │
│  │   └── chat.js        # WebSocket chat temps reel              │
│  └── utils/                                                      │
│      └── password.js    # Hashage des mots de passe              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture et concepts cles

### 1. Creer une instance Fastify

```javascript
import Fastify from 'fastify';

const app = Fastify({
  logger: true,  // Active le logging (Pino)
});

// Demarrer le serveur
app.listen({ port: 8000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
```

### 2. Le cycle de vie d'une requete

```
┌────────────────────────────────────────────────────────────────┐
│                 CYCLE DE VIE D'UNE REQUETE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. onRequest    → Premiere etape, avant tout                   │
│       │                                                         │
│  2. preParsing   → Avant de parser le body                      │
│       │                                                         │
│  3. preValidation → Avant la validation du schema               │
│       │                                                         │
│  4. preHandler   → Avant le handler (authentification ici)      │
│       │                                                         │
│  5. HANDLER      → Votre code (la logique metier)               │
│       │                                                         │
│  6. preSerialization → Avant de serialiser la reponse           │
│       │                                                         │
│  7. onSend       → Juste avant d'envoyer                        │
│       │                                                         │
│  8. onResponse   → Apres l'envoi de la reponse                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 3. Request et Reply

**Request** contient :
```javascript
request.body       // Corps de la requete (POST data)
request.params     // Parametres d'URL (/users/:id → request.params.id)
request.query      // Query string (?page=1 → request.query.page)
request.headers    // En-tetes HTTP
request.user       // Donnees utilisateur (apres authentification JWT)
```

**Reply** permet de :
```javascript
reply.send({ data: 'value' })  // Envoyer une reponse JSON
reply.code(404)                // Definir le code HTTP
reply.header('X-Custom', 'v')  // Ajouter un header
reply.redirect('/other')       // Rediriger
```

---

## Creer des routes

### 1. Route GET simple

```javascript
// Route: GET /api/hello
app.get('/api/hello', async (request, reply) => {
  return { message: 'Hello World!' };
});
```

### 2. Route POST avec body

```javascript
// Route: POST /api/users/register
app.post('/api/users/register/', async (request, reply) => {
  const { username, email, password } = request.body;

  // Logique d'inscription...

  return reply.code(201).send({
    user: { id: 1, username, email },
    message: 'User created successfully'
  });
});
```

### 3. Route avec parametres

```javascript
// Route: GET /api/users/:id
app.get('/api/users/:id', async (request, reply) => {
  const userId = request.params.id;  // Extrait :id de l'URL

  const user = findUserById(userId);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return user;
});
```

### 4. Route avec query string

```javascript
// Route: GET /api/matches?limit=10&status=completed
app.get('/api/matches', async (request, reply) => {
  const { limit = 20, status } = request.query;

  const matches = getMatches({ limit, status });
  return matches;
});
```

### 5. Route protegee (authentification)

```javascript
// Route protegee necessitant un JWT valide
app.get('/api/users/me/', {
  preValidation: [app.authenticate]  // Hook qui verifie le JWT
}, async (request, reply) => {
  // request.user est rempli par le plugin JWT
  const user = findUserById(request.user.userId);
  return user;
});
```

---

## Plugins et Decorators

### 1. Plugins

Les plugins sont le coeur de Fastify. Ils encapsulent des fonctionnalites.

```javascript
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';

// CORS - Autoriser les requetes cross-origin
app.register(fastifyCors, {
  origin: ['https://localhost:8443'],
  credentials: true,
});

// JWT - Gestion des tokens d'authentification
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
});

// WebSocket - Communication temps reel
app.register(fastifyWebsocket);
```

### 2. Decorators

Les decorators ajoutent des proprietes/methodes a l'instance Fastify.

```javascript
// Ajouter une methode 'authenticate' a l'application
app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();  // Verifie le token JWT
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or missing token' });
  }
});

// Utilisation dans une route
app.get('/api/protected', {
  preValidation: [app.authenticate]
}, handler);
```

### 3. Hooks

Les hooks permettent d'executer du code a differentes etapes.

```javascript
// Hook global - Execute avant chaque requete
app.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

// Hook global - Execute apres chaque reponse
app.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime;
  request.log.info(`Request took ${duration}ms`);
});
```

### 4. Enregistrer des routes modulaires

```javascript
// routes/pong.js
export default async function pongRoutes(fastify, options) {
  fastify.get('/api/pong/matches', async (request, reply) => {
    // ...
  });

  fastify.post('/api/pong/match', async (request, reply) => {
    // ...
  });
}

// server.js
import pongRoutes from './routes/pong.js';
app.register(pongRoutes);
```

---

## Exemples pratiques de notre projet

### 1. Configuration du serveur

**Fichier** : `fastify-backend/src/server.js:1-60`

```javascript
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 8000;

// Verification de securite
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

const app = Fastify({
  logger: true,  // Logging avec Pino
});

// Configuration CORS
app.register(fastifyCors, {
  origin: ['https://localhost:8443', 'https://127.0.0.1:8443'],
  credentials: true,
});

// Rate limiting (protection contre les abus)
app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// JWT pour l'authentification
app.register(fastifyJwt, {
  secret: JWT_SECRET,
});

// Decorator d'authentification
app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or missing token' });
  }
});

// Support des cookies (OAuth)
app.register(fastifyCookie);

// Support WebSocket
app.register(fastifyWebsocket);
```

### 2. Route d'inscription avec validation

**Fichier** : `fastify-backend/src/server.js:118-171`

```javascript
// Rate limit specifique pour les routes d'auth
const authRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 minute',
    },
  },
};

// Route d'inscription
app.post('/api/users/register/', authRateLimit, async (request, reply) => {
  const { username, email, display_name, password, password_confirm } = request.body || {};

  // Validation des champs requis
  if (!username || !email || !display_name || !password || !password_confirm) {
    return reply.code(400).send({ error: 'Missing required fields' });
  }

  // Validation du format username
  if (!validateUsername(username)) {
    return reply.code(400).send({
      error: 'Username must be 3-30 characters, alphanumeric, underscore or hyphen only'
    });
  }

  // Validation du format email
  if (!validateEmail(email)) {
    return reply.code(400).send({ error: 'Invalid email format' });
  }

  // Validation du mot de passe
  if (!validatePassword(password)) {
    return reply.code(400).send({ error: 'Password must be 8-128 characters' });
  }

  if (password !== password_confirm) {
    return reply.code(400).send({ error: 'Passwords do not match' });
  }

  // Hashage du mot de passe
  const passwordHash = await hashPassword(password);

  try {
    // Insertion en base
    const stmt = db.prepare(`
      INSERT INTO users (username, email, display_name, password_hash)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username.toLowerCase(), email.toLowerCase(), display_name, passwordHash);

    // Generation des tokens JWT
    const accessToken = app.jwt.sign({ userId: result.lastInsertRowid }, { expiresIn: '1h' });
    const refreshToken = app.jwt.sign({ userId: result.lastInsertRowid }, { expiresIn: '7d' });

    return reply.code(201).send({
      user: serializeUser(findUserById.get(result.lastInsertRowid)),
      tokens: { access: accessToken, refresh: refreshToken },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(400).send({ error: 'Username or email already exists' });
  }
});
```

### 3. Route protegee - Profil utilisateur

**Fichier** : `fastify-backend/src/server.js:211-217`

```javascript
// GET /api/users/me/ - Obtenir le profil de l'utilisateur connecte
app.get('/api/users/me/', {
  preValidation: [app.authenticate]  // Verifie le JWT avant
}, async (request, reply) => {
  // request.user.userId est extrait du token JWT
  const user = findUserById.get(request.user.userId);

  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return serializeUser(user);  // Exclut le password_hash
});
```

### 4. Route avec parametres - Ajouter un ami

**Fichier** : `fastify-backend/src/server.js:234-247`

```javascript
// POST /api/users/friends/:id/add/ - Ajouter un ami
app.post('/api/users/friends/:id/add/', {
  preValidation: [app.authenticate]
}, async (request, reply) => {
  const friendId = Number(request.params.id);  // :id de l'URL

  // Verifier qu'on n'ajoute pas soi-meme
  if (friendId === request.user.userId) {
    return reply.code(400).send({ error: 'Cannot add yourself' });
  }

  // Verifier que l'ami existe
  const friend = findUserById.get(friendId);
  if (!friend) {
    return reply.code(404).send({ error: 'User not found' });
  }

  // Ajouter la relation d'amitie (bidirectionnelle)
  const insert = db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)');
  insert.run(request.user.userId, friendId);
  insert.run(friendId, request.user.userId);

  return reply.code(201).send({ message: 'Friend added' });
});
```

### 5. Enregistrement de routes modulaires

**Fichier** : `fastify-backend/src/server.js:375-386`

```javascript
// Importer les modules de routes
import pongRoutes from './routes/pong.js';
import chatRoutes from './routes/chat.js';
import blockchainRoutes from './routes/blockchain.js';
import oauthRoutes from './routes/oauth.js';

// Importer les WebSockets
import pongWebSocket from './websockets/pong.js';
import chatWebSocket from './websockets/chat.js';

// Enregistrer les routes
app.register(pongRoutes);
app.register(chatRoutes);
app.register(blockchainRoutes);
app.register(oauthRoutes);

// Enregistrer les WebSockets
app.register(pongWebSocket);
app.register(chatWebSocket);
```

### 6. Demarrage du serveur

**Fichier** : `fastify-backend/src/server.js:389-401`

```javascript
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Server running on port ${PORT}`);
    app.log.info(`Database: SQLite`);
    app.log.info(`JWT secret configured`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

---

## Validation avec JSON Schema

### Schema de validation

Fastify permet de valider automatiquement les requetes avec des schemas JSON :

```javascript
const registerSchema = {
  body: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      email: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        user: { type: 'object' },
        tokens: { type: 'object' }
      }
    }
  }
};

app.post('/api/users/register/', { schema: registerSchema }, handler);
```

---

## Comparaison : Fastify vs Express

### Code Express

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});
```

### Code Fastify equivalent

```javascript
import Fastify from 'fastify';
const app = Fastify();

app.get('/users/:id', async (request, reply) => {
  const user = await getUser(request.params.id);
  if (!user) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return user;  // Serialisation automatique
});
```

### Differences principales

| Aspect | Express | Fastify |
|--------|---------|---------|
| JSON parsing | `app.use(express.json())` | Automatique |
| Async errors | `try/catch` + `next(err)` | Gere automatiquement |
| Return value | `res.json(data)` | `return data` |
| Logging | Non inclus | Pino integre |
| Validation | Middleware externe | Schema JSON natif |

---

## Exercices pratiques

### Exercice 1 : Creer une route CRUD

**Objectif** : Creer les routes pour gerer des "items".

```javascript
// A completer
// GET /api/items      - Liste tous les items
// GET /api/items/:id  - Un item specifique
// POST /api/items     - Creer un item
// DELETE /api/items/:id - Supprimer un item
```

<details>
<summary>Solution</summary>

```javascript
const items = [];
let nextId = 1;

// Liste tous les items
app.get('/api/items', async () => {
  return items;
});

// Un item specifique
app.get('/api/items/:id', async (request, reply) => {
  const item = items.find(i => i.id === Number(request.params.id));
  if (!item) {
    return reply.code(404).send({ error: 'Item not found' });
  }
  return item;
});

// Creer un item
app.post('/api/items', async (request, reply) => {
  const { name, description } = request.body;
  if (!name) {
    return reply.code(400).send({ error: 'Name is required' });
  }

  const item = { id: nextId++, name, description };
  items.push(item);
  return reply.code(201).send(item);
});

// Supprimer un item
app.delete('/api/items/:id', async (request, reply) => {
  const index = items.findIndex(i => i.id === Number(request.params.id));
  if (index === -1) {
    return reply.code(404).send({ error: 'Item not found' });
  }

  items.splice(index, 1);
  return { message: 'Item deleted' };
});
```
</details>

---

### Exercice 2 : Ajouter un decorator

**Objectif** : Creer un decorator qui ajoute un timestamp a chaque requete.

```javascript
// A completer
// Le decorator doit ajouter request.timestamp avec la date actuelle
```

<details>
<summary>Solution</summary>

```javascript
// Decorator pour ajouter un timestamp
app.decorateRequest('timestamp', null);

app.addHook('onRequest', async (request) => {
  request.timestamp = new Date().toISOString();
});

// Utilisation dans une route
app.get('/api/time', async (request) => {
  return {
    serverTime: request.timestamp,
    message: 'Current server time'
  };
});
```
</details>

---

### Exercice 3 : Plugin personnalise

**Objectif** : Creer un plugin qui ajoute des routes de health check.

```javascript
// A completer
// GET /health      - Retourne { status: 'ok' }
// GET /health/db   - Verifie la connexion base de donnees
```

<details>
<summary>Solution</summary>

```javascript
// plugins/health.js
export default async function healthPlugin(fastify, options) {
  fastify.get('/health', async () => {
    return { status: 'ok', uptime: process.uptime() };
  });

  fastify.get('/health/db', async (request, reply) => {
    try {
      // Test simple de la base
      const result = fastify.db.prepare('SELECT 1').get();
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      return reply.code(500).send({
        status: 'error',
        database: 'disconnected',
        error: err.message
      });
    }
  });
}

// server.js
import healthPlugin from './plugins/health.js';
app.register(healthPlugin);
```
</details>

---

## Resume

| Concept | Description |
|---------|-------------|
| **Fastify** | Framework web Node.js performant |
| **Route** | Point d'entree HTTP (GET, POST, etc.) |
| **Plugin** | Module encapsule de fonctionnalites |
| **Decorator** | Ajoute des proprietes/methodes a Fastify |
| **Hook** | Code execute a une etape du cycle de vie |
| **Request** | Objet contenant les donnees de la requete |
| **Reply** | Objet pour construire la reponse |

---

## Ressources

- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Fastify Ecosystem](https://www.fastify.io/ecosystem/)
- [@fastify/jwt](https://github.com/fastify/fastify-jwt)
- [@fastify/websocket](https://github.com/fastify/fastify-websocket)
- [Pino Logger](https://getpino.io/)

---

**Derniere mise a jour** : 2025-12-08
**Projet** : ft_transcendence (Ecole 42)
