# Theorie : SQLite - Base de donnees embarquee

## Table des matieres
1. [Qu'est-ce que SQLite ?](#quest-ce-que-sqlite-)
2. [Pourquoi SQLite dans ft_transcendence](#pourquoi-sqlite-dans-ft_transcendence)
3. [Les concepts cles de SQL](#les-concepts-cles-de-sql)
4. [Operations CRUD](#operations-crud)
5. [Exemples pratiques de notre projet](#exemples-pratiques-de-notre-projet)
6. [Better-sqlite3 en Node.js](#better-sqlite3-en-nodejs)
7. [Exercices pratiques](#exercices-pratiques)

---

## Qu'est-ce que SQLite ?

### Definition simple

**SQLite** est un systeme de gestion de base de donnees relationnelle **embarque**. Contrairement a MySQL ou PostgreSQL qui fonctionnent comme des serveurs separes, SQLite stocke toute la base de donnees dans **un seul fichier**.

### L'analogie du carnet vs le serveur

Imaginez deux facons de stocker des informations :
- **Serveur de base de donnees (MySQL, PostgreSQL)** : Un employe dedie qui gere les archives de l'entreprise. Vous devez lui envoyer des requetes et attendre ses reponses.
- **SQLite** : Un carnet personnel sur votre bureau. Vous y accedez directement, sans intermediaire.

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPARAISON DES ARCHITECTURES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MySQL/PostgreSQL:                     SQLite:                   │
│                                                                  │
│  ┌─────────┐     ┌─────────┐          ┌─────────┐               │
│  │  App 1  │────►│         │          │   App   │               │
│  └─────────┘     │  DB     │          │   ┌─────┴─────┐         │
│  ┌─────────┐     │ Server  │          │   │ SQLite    │         │
│  │  App 2  │────►│         │          │   │ (fichier) │         │
│  └─────────┘     └─────────┘          │   └───────────┘         │
│                                        └─────────────┘           │
│  Connexion reseau                      Acces direct fichier      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Caracteristiques de SQLite

| Caracteristique | Description |
|-----------------|-------------|
| **Embarque** | Pas de serveur, bibliotheque integree |
| **Un seul fichier** | Toute la DB dans `database.db` |
| **Zero configuration** | Pas d'installation ou setup |
| **Leger** | ~500 KB de code |
| **ACID** | Transactions fiables |
| **Cross-platform** | Fonctionne partout |

---

## Pourquoi SQLite dans ft_transcendence

### Exigence du sujet

Le sujet ft_transcendence specifie :
> "The database must be SQLite"

### Avantages pour notre projet

1. **Simplicite** : Pas de conteneur Docker supplementaire pour la DB
2. **Portabilite** : Un seul fichier a sauvegarder/restaurer
3. **Performance** : Tres rapide pour les operations de lecture
4. **Fiabilite** : Transactions ACID pour l'integrite des donnees

### Notre schema de base de donnees

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEMA BASE DE DONNEES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users                          friendships                      │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │ id (PK)              │       │ id (PK)              │        │
│  │ username (UNIQUE)    │◄──────│ user_id (FK)         │        │
│  │ email (UNIQUE)       │◄──────│ friend_id (FK)       │        │
│  │ display_name         │       │ created_at           │        │
│  │ password_hash        │       └──────────────────────┘        │
│  │ avatar               │                                        │
│  │ wins, losses         │       blocked_users                    │
│  │ pong_wins, pong_losses│      ┌──────────────────────┐        │
│  │ is_online            │◄──────│ blocker_id (FK)      │        │
│  │ last_seen            │◄──────│ blocked_id (FK)      │        │
│  │ created_at           │       │ created_at           │        │
│  └──────────────────────┘       └──────────────────────┘        │
│           │                                                      │
│           │                     pong_matches                     │
│           │                     ┌──────────────────────┐        │
│           └────────────────────►│ player1_id (FK)      │        │
│           └────────────────────►│ player2_id (FK)      │        │
│           └────────────────────►│ winner_id (FK)       │        │
│                                 │ game_mode            │        │
│                                 │ player1_score        │        │
│                                 │ player2_score        │        │
│                                 │ status               │        │
│                                 │ blockchain_tx_hash   │        │
│                                 └──────────────────────┘        │
│                                                                  │
│  chat_messages                  pong_rooms                       │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │ sender_id (FK)       │       │ room_code            │        │
│  │ recipient_id (FK)    │       │ match_id (FK)        │        │
│  │ content              │       │ host_id (FK)         │        │
│  │ message_type         │       │ guest_id (FK)        │        │
│  │ is_read              │       │ status               │        │
│  │ timestamp            │       └──────────────────────┘        │
│  └──────────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Les concepts cles de SQL

### 1. Tables et colonnes

Une **table** est comme un tableur Excel :
- **Colonnes** : Les differents champs (nom, email, etc.)
- **Lignes** : Les enregistrements (chaque utilisateur)

```sql
-- Creer une table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Types de donnees SQLite

| Type | Description | Exemple |
|------|-------------|---------|
| `INTEGER` | Nombre entier | `id`, `score`, `wins` |
| `TEXT` | Chaine de caracteres | `username`, `email` |
| `REAL` | Nombre decimal | `price`, `rating` |
| `BLOB` | Donnees binaires | Images, fichiers |
| `NULL` | Valeur nulle | Absence de valeur |

### 3. Contraintes

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Cle primaire auto-incrementee
  username TEXT UNIQUE NOT NULL,          -- Unique et obligatoire
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  wins INTEGER DEFAULT 0,                 -- Valeur par defaut
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

| Contrainte | Description |
|------------|-------------|
| `PRIMARY KEY` | Identifiant unique de la ligne |
| `UNIQUE` | Valeur unique dans la table |
| `NOT NULL` | Valeur obligatoire |
| `DEFAULT` | Valeur par defaut |
| `FOREIGN KEY` | Reference a une autre table |

### 4. Relations entre tables

```sql
-- Table des amities (relation many-to-many)
CREATE TABLE friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)  -- Pas de doublons
);
```

**Types de relations :**
- **1:1** (One-to-One) : Un utilisateur → Un profil
- **1:N** (One-to-Many) : Un utilisateur → Plusieurs messages
- **N:N** (Many-to-Many) : Utilisateurs ↔ Amis (via table de jointure)

---

## Operations CRUD

CRUD = **C**reate, **R**ead, **U**pdate, **D**elete

### 1. CREATE (INSERT)

```sql
-- Inserer un utilisateur
INSERT INTO users (username, email, display_name, password_hash)
VALUES ('john_doe', 'john@example.com', 'John Doe', 'hashed_password');

-- Inserer avec valeurs par defaut
INSERT INTO users (username, email, display_name, password_hash)
VALUES ('jane', 'jane@example.com', 'Jane', 'hash123');
-- wins, losses, etc. seront a 0 par defaut
```

### 2. READ (SELECT)

```sql
-- Lire tous les utilisateurs
SELECT * FROM users;

-- Lire des colonnes specifiques
SELECT username, email, wins FROM users;

-- Filtrer avec WHERE
SELECT * FROM users WHERE username = 'john_doe';

-- Trier les resultats
SELECT * FROM users ORDER BY wins DESC;

-- Limiter le nombre de resultats
SELECT * FROM users ORDER BY wins DESC LIMIT 10;

-- Compter les lignes
SELECT COUNT(*) FROM users WHERE is_online = 1;

-- Jointures entre tables
SELECT u.username, COUNT(f.id) as friend_count
FROM users u
LEFT JOIN friendships f ON u.id = f.user_id
GROUP BY u.id;
```

### 3. UPDATE

```sql
-- Mettre a jour un champ
UPDATE users SET wins = wins + 1 WHERE id = 1;

-- Mettre a jour plusieurs champs
UPDATE users
SET display_name = 'New Name', email = 'new@email.com'
WHERE id = 1;

-- Mettre a jour avec une condition
UPDATE users SET is_online = 0
WHERE last_seen < datetime('now', '-30 minutes');
```

### 4. DELETE

```sql
-- Supprimer une ligne
DELETE FROM users WHERE id = 1;

-- Supprimer avec une condition
DELETE FROM chat_messages WHERE timestamp < date('now', '-30 days');

-- Supprimer toutes les lignes (attention!)
DELETE FROM chat_messages;
```

---

## Exemples pratiques de notre projet

### 1. Configuration de la base de donnees

**Fichier** : `fastify-backend/src/db.js`

```javascript
import Database from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Obtenir le chemin du repertoire courant (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Repertoire pour stocker la base de donnees
const DATA_DIR = join(__dirname, '..', 'data');

// Creer le repertoire s'il n'existe pas
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Connexion a la base de donnees
const db = new Database(join(DATA_DIR, 'transcendence.db'));

// Activer les cles etrangeres (desactive par defaut dans SQLite)
db.pragma('foreign_keys = ON');

export default db;
```

### 2. Creation des tables (migrations)

**Fichier** : `fastify-backend/src/db.js` (suite)

```javascript
const runMigrations = () => {
  db.exec(`
    -- Table des utilisateurs
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      pong_wins INTEGER DEFAULT 0,
      pong_losses INTEGER DEFAULT 0,
      is_online INTEGER DEFAULT 0,
      last_seen TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Trigger pour mettre a jour updated_at automatiquement
    CREATE TRIGGER IF NOT EXISTS trigger_users_updated
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- Table des amities
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id)
    );

    -- Table des utilisateurs bloques
    CREATE TABLE IF NOT EXISTS blocked_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(blocker_id, blocked_id)
    );

    -- Table des matchs Pong
    CREATE TABLE IF NOT EXISTS pong_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game_mode TEXT NOT NULL,
      winner_id INTEGER REFERENCES users(id),
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      blockchain_tx_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des messages de chat
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      game_invite_type TEXT,
      game_room_code TEXT,
      is_read INTEGER DEFAULT 0,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

runMigrations();
```

### 3. Requetes preparees (Prepared Statements)

**Fichier** : `fastify-backend/src/server.js`

```javascript
// Colonnes utilisateur (sans le mot de passe)
const userColumns = `
  id, username, email, display_name, avatar,
  wins, losses, pong_wins, pong_losses,
  is_online, last_seen,
  created_at, updated_at
`;

// Requetes preparees (plus securisees et performantes)
const findUserByUsername = db.prepare(`SELECT ${userColumns} FROM users WHERE username = ?`);
const findUserById = db.prepare(`SELECT ${userColumns} FROM users WHERE id = ?`);

// Utilisation
const user = findUserByUsername.get('john_doe');
const userById = findUserById.get(42);
```

**Avantages des requetes preparees :**
1. **Securite** : Protection contre les injections SQL
2. **Performance** : La requete est compilee une seule fois
3. **Lisibilite** : Code plus propre

### 4. Insertion d'un utilisateur

**Fichier** : `fastify-backend/src/server.js:150-170`

```javascript
app.post('/api/users/register/', async (request, reply) => {
  const { username, email, display_name, password } = request.body;

  // Hasher le mot de passe
  const passwordHash = await hashPassword(password);

  try {
    // Preparer et executer l'insertion
    const stmt = db.prepare(`
      INSERT INTO users (username, email, display_name, password_hash, last_seen, is_online)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `);

    // run() pour les INSERT/UPDATE/DELETE
    const result = stmt.run(
      username.trim().toLowerCase(),
      email.trim().toLowerCase(),
      display_name.trim(),
      passwordHash
    );

    // Recuperer l'utilisateur cree
    const user = findUserById.get(result.lastInsertRowid);

    // Generer les tokens JWT...
    return reply.code(201).send({ user, tokens });
  } catch (error) {
    // Erreur si username/email deja utilise (contrainte UNIQUE)
    return reply.code(400).send({ error: 'Username or email already exists' });
  }
});
```

### 5. Recuperer la liste des amis (JOIN)

**Fichier** : `fastify-backend/src/server.js:220-231`

```javascript
app.get('/api/users/friends/', {
  preValidation: [app.authenticate]
}, async (request, reply) => {
  // Jointure pour recuperer les infos des amis
  const stmt = db.prepare(`
    SELECT ${userColumns}
    FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `);

  // all() retourne un tableau de resultats
  const friends = stmt.all(request.user.userId);

  // Formater la reponse
  const result = friends.map(friend => ({ friend: serializeUser(friend) }));
  return reply.send(result);
});
```

### 6. Transactions

```javascript
// Transaction pour ajouter une amitie bidirectionnelle
const addFriendTransaction = db.transaction((userId, friendId) => {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)'
  );

  // Les deux insertions sont atomiques
  insert.run(userId, friendId);
  insert.run(friendId, userId);
});

// Utilisation
addFriendTransaction(1, 2);  // Tout ou rien
```

---

## Better-sqlite3 en Node.js

### Installation

```bash
npm install better-sqlite3
```

### Methodes principales

```javascript
import Database from 'better-sqlite3';

// Connexion
const db = new Database('mydb.db');

// Requete preparee
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');

// get() - Une seule ligne
const user = stmt.get(1);

// all() - Toutes les lignes
const allUsers = db.prepare('SELECT * FROM users').all();

// run() - INSERT, UPDATE, DELETE
const result = db.prepare('INSERT INTO users (name) VALUES (?)').run('John');
console.log(result.lastInsertRowid);  // ID de la ligne inseree
console.log(result.changes);          // Nombre de lignes affectees

// exec() - Executer plusieurs requetes
db.exec(`
  CREATE TABLE foo (...);
  CREATE TABLE bar (...);
`);

// Transactions
const insertMany = db.transaction((items) => {
  for (const item of items) {
    db.prepare('INSERT INTO items (name) VALUES (?)').run(item);
  }
});
insertMany(['a', 'b', 'c']);

// Fermer la connexion
db.close();
```

### Pourquoi better-sqlite3 ?

| Aspect | better-sqlite3 | sqlite3 (node-sqlite3) |
|--------|----------------|------------------------|
| API | Synchrone | Asynchrone (callbacks) |
| Performance | Tres rapide | Plus lent |
| TypeScript | Bon support | Moyen |
| Transactions | Faciles | Complexes |

---

## Bonnes pratiques

### 1. Toujours utiliser des requetes preparees

```javascript
// MAUVAIS - Injection SQL possible!
const username = "'; DROP TABLE users; --";
db.exec(`SELECT * FROM users WHERE username = '${username}'`);

// BON - Securise
const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
stmt.get(username);
```

### 2. Indexer les colonnes frequemment recherchees

```sql
-- Index sur username (recherches frequentes)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index sur email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index compose
CREATE INDEX IF NOT EXISTS idx_friendships ON friendships(user_id, friend_id);
```

### 3. Utiliser ON DELETE CASCADE

```sql
-- Quand un utilisateur est supprime, ses messages le sont aussi
CREATE TABLE chat_messages (
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ...
);
```

### 4. Valider les donnees avant insertion

```javascript
// Validation cote serveur
if (!validateEmail(email)) {
  return reply.code(400).send({ error: 'Invalid email' });
}

// Contraintes cote base de donnees (securite supplementaire)
// UNIQUE, NOT NULL, CHECK, etc.
```

---

## Exercices pratiques

### Exercice 1 : Ecrire une requete SELECT

**Objectif** : Trouver les 5 utilisateurs avec le plus de victoires.

```sql
-- A completer
```

<details>
<summary>Solution</summary>

```sql
SELECT username, display_name, wins, losses,
       ROUND(CAST(wins AS REAL) / (wins + losses) * 100, 2) as win_rate
FROM users
WHERE wins + losses > 0
ORDER BY wins DESC
LIMIT 5;
```
</details>

---

### Exercice 2 : Ecrire une requete avec JOIN

**Objectif** : Lister tous les messages entre deux utilisateurs.

```sql
-- A completer
-- Afficher : sender_name, recipient_name, content, timestamp
```

<details>
<summary>Solution</summary>

```sql
SELECT
  s.display_name as sender_name,
  r.display_name as recipient_name,
  m.content,
  m.timestamp
FROM chat_messages m
JOIN users s ON m.sender_id = s.id
JOIN users r ON m.recipient_id = r.id
WHERE (m.sender_id = 1 AND m.recipient_id = 2)
   OR (m.sender_id = 2 AND m.recipient_id = 1)
ORDER BY m.timestamp ASC;
```
</details>

---

### Exercice 3 : Creer une transaction

**Objectif** : Enregistrer un resultat de match et mettre a jour les stats.

```javascript
// A completer
// 1. Inserer le match dans pong_matches
// 2. Incrementer wins du gagnant
// 3. Incrementer losses du perdant
```

<details>
<summary>Solution</summary>

```javascript
const recordMatch = db.transaction((winnerId, loserId, winnerScore, loserScore) => {
  // 1. Inserer le match
  const insertMatch = db.prepare(`
    INSERT INTO pong_matches (player1_id, player2_id, winner_id, player1_score, player2_score, status)
    VALUES (?, ?, ?, ?, ?, 'completed')
  `);
  insertMatch.run(winnerId, loserId, winnerId, winnerScore, loserScore);

  // 2. Mettre a jour les stats du gagnant
  const updateWinner = db.prepare(`
    UPDATE users SET wins = wins + 1, pong_wins = pong_wins + 1 WHERE id = ?
  `);
  updateWinner.run(winnerId);

  // 3. Mettre a jour les stats du perdant
  const updateLoser = db.prepare(`
    UPDATE users SET losses = losses + 1, pong_losses = pong_losses + 1 WHERE id = ?
  `);
  updateLoser.run(loserId);
});

// Utilisation
recordMatch(1, 2, 11, 5);  // Joueur 1 gagne 11-5
```
</details>

---

## Resume

| Concept | Description |
|---------|-------------|
| **SQLite** | Base de donnees embarquee dans un fichier |
| **Table** | Structure qui stocke les donnees |
| **PRIMARY KEY** | Identifiant unique d'une ligne |
| **FOREIGN KEY** | Reference a une autre table |
| **SELECT** | Lire des donnees |
| **INSERT** | Creer des donnees |
| **UPDATE** | Modifier des donnees |
| **DELETE** | Supprimer des donnees |
| **JOIN** | Combiner des tables |
| **Transaction** | Operations atomiques |

---

## Ressources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQL Tutorial](https://www.w3schools.com/sql/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Browser](https://sqlitebrowser.org/) - GUI pour explorer les bases SQLite

---

**Derniere mise a jour** : 2025-12-08
**Projet** : ft_transcendence (Ecole 42)
