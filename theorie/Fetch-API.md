# Theorie : Fetch API - Communication avec le serveur

## Table des matieres
1. [Qu'est-ce que Fetch API ?](#quest-ce-que-fetch-api-)
2. [Pourquoi Fetch API dans ft_transcendence](#pourquoi-fetch-api-dans-ft_transcendence)
3. [Les concepts cles de Fetch API](#les-concepts-cles-de-fetch-api)
4. [Exemples pratiques de notre projet](#exemples-pratiques-de-notre-projet)
5. [Gestion des erreurs](#gestion-des-erreurs)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Exercices pratiques](#exercices-pratiques)

---

## Qu'est-ce que Fetch API ?

### Definition simple

**Fetch API** est une interface JavaScript moderne permettant de faire des **requetes HTTP** depuis le navigateur vers un serveur. C'est l'outil principal pour communiquer avec un backend (API REST).

### L'analogie du serveur de restaurant

Imaginez un restaurant :
- **Le client (navigateur)** = Vous, assis a votre table
- **Le serveur (Fetch)** = Le serveur du restaurant qui prend vos commandes
- **La cuisine (Backend)** = L'API qui prepare les donnees
- **Le plat (Reponse)** = Les donnees retournees par l'API

```
┌─────────────────┐        Requete HTTP         ┌─────────────────┐
│                 │  ─────────────────────────► │                 │
│   NAVIGATEUR    │       (fetch POST)          │     BACKEND     │
│   (Frontend)    │                             │     (API)       │
│                 │  ◄───────────────────────── │                 │
└─────────────────┘        Reponse JSON         └─────────────────┘
```

### Pourquoi "Fetch" ?

Le mot "fetch" signifie "aller chercher" en anglais. C'est exactement ce que fait cette API : elle **va chercher** des donnees sur un serveur distant.

---

## Pourquoi Fetch API dans ft_transcendence

### Le besoin du projet

Dans ft_transcendence, nous avons besoin de :

1. **Authentification** : Envoyer les identifiants de connexion
2. **Profil utilisateur** : Recuperer et mettre a jour les informations
3. **Statistiques** : Charger les scores et historique des matchs
4. **Amis** : Gerer la liste d'amis
5. **Chat** : Envoyer et recevoir des messages

### L'architecture client-serveur

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  auth.service.ts                                        │   │
│   │  ├── login()      → POST /api/users/login/              │   │
│   │  ├── register()   → POST /api/users/register/           │   │
│   │  ├── logout()     → POST /api/users/logout/             │   │
│   │  └── getFriends() → GET /api/users/friends/             │   │
│   └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                         HTTPS (port 8443)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (Fastify)                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Routes API                                              │   │
│   │  ├── /api/users/login/    → Verifie credentials         │   │
│   │  ├── /api/users/register/ → Cree un utilisateur         │   │
│   │  ├── /api/users/logout/   → Deconnecte                  │   │
│   │  └── /api/users/friends/  → Liste les amis              │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Les concepts cles de Fetch API

### 1. Syntaxe de base

```javascript
// Syntaxe la plus simple - GET request
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

### 2. Les methodes HTTP

| Methode | Description | Exemple d'utilisation |
|---------|-------------|----------------------|
| `GET` | Recuperer des donnees | Lire la liste des amis |
| `POST` | Creer une ressource | Inscription, connexion |
| `PUT` | Mettre a jour une ressource | Modifier le profil |
| `DELETE` | Supprimer une ressource | Retirer un ami |

### 3. L'objet Request

```javascript
fetch(url, {
  method: 'POST',                    // Methode HTTP
  headers: {                         // En-tetes de la requete
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ data })     // Corps de la requete (pour POST/PUT)
});
```

### 4. L'objet Response

```javascript
const response = await fetch(url);

response.ok          // true si status 200-299
response.status      // Code HTTP (200, 404, 500...)
response.statusText  // Message du status ("OK", "Not Found"...)
response.headers     // En-tetes de la reponse

// Methodes pour lire le corps
await response.json()   // Parse JSON → objet JavaScript
await response.text()   // Texte brut
await response.blob()   // Donnees binaires (images, fichiers)
```

### 5. Async/Await vs Promises

**Avec Promises (ancienne methode) :**
```javascript
fetch('/api/users/me/')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

**Avec async/await (methode moderne) :**
```javascript
async function getUser() {
  try {
    const response = await fetch('/api/users/me/');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
```

> **Note** : `async/await` est plus lisible et est utilise dans notre projet.

---

## Exemples pratiques de notre projet

### 1. Connexion (Login)

**Fichier** : `frontend/src/services/auth.service.ts:95-114`

```typescript
public async login(username: string, password: string): Promise<User> {
  // 1. Envoyer les identifiants au serveur
  const response = await fetch(`${this.baseURL}/users/login/`, {
    method: 'POST',                           // Methode POST pour envoyer des donnees
    headers: {
      'Content-Type': 'application/json',     // Indique qu'on envoie du JSON
    },
    body: JSON.stringify({ username, password }),  // Corps de la requete
  });

  // 2. Verifier si la requete a reussi
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  // 3. Extraire les donnees de la reponse
  const data = await response.json() as {
    tokens: { access: string; refresh: string };
    user: User
  };

  // 4. Sauvegarder les tokens et l'utilisateur
  this.saveTokens(data.tokens.access, data.tokens.refresh);
  this.saveUser(data.user);

  return data.user;
}
```

**Explication pas a pas :**

1. **`fetch(url, options)`** : Lance la requete HTTP
2. **`method: 'POST'`** : On envoie des donnees (pas une simple lecture)
3. **`headers`** : Indique au serveur le format des donnees
4. **`body`** : Les donnees a envoyer (username + password)
5. **`response.ok`** : Verifie si le serveur a repondu avec succes
6. **`response.json()`** : Convertit la reponse JSON en objet JavaScript

### 2. Inscription (Register)

**Fichier** : `frontend/src/services/auth.service.ts:62-93`

```typescript
public async register(
  username: string,
  email: string,
  displayName: string,
  password: string,
  passwordConfirm: string
): Promise<User> {
  const response = await fetch(`${this.baseURL}/users/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      display_name: displayName,
      password,
      password_confirm: passwordConfirm,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error((Object.values(error)[0] as string) || 'Registration failed');
  }

  const data = await response.json() as {
    tokens: { access: string; refresh: string };
    user: User
  };

  this.saveTokens(data.tokens.access, data.tokens.refresh);
  this.saveUser(data.user);

  return data.user;
}
```

### 3. Requete authentifiee (avec Token)

**Fichier** : `frontend/src/services/auth.service.ts:139-160`

```typescript
public async getCurrentUser(): Promise<User | null> {
  if (!this.isAuthenticated()) {
    return null;
  }

  // Requete avec le header Authorization
  const response = await fetch(`${this.baseURL}/users/me/`, {
    headers: {
      Authorization: `Bearer ${this.accessToken}`,  // Token JWT
    },
  });

  if (!response.ok) {
    if (response.status === 401) {  // Non autorise
      this.clearAuth();             // Deconnexion
    }
    throw new Error('Failed to get user info');
  }

  const user = await response.json() as User;
  this.saveUser(user);
  return user;
}
```

**Point important :** Le header `Authorization: Bearer <token>` est utilise pour prouver que l'utilisateur est connecte.

### 4. Recuperer la liste des amis (GET)

**Fichier** : `frontend/src/services/auth.service.ts:201-214`

```typescript
public async getFriends(): Promise<User[]> {
  const response = await fetch(`${this.baseURL}/users/friends/`, {
    headers: {
      Authorization: `Bearer ${this.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get friends list');
  }

  // La reponse est un tableau d'objets { friend: User }
  const friendships = await response.json() as Array<{ friend: User }>;

  // Extraire uniquement les utilisateurs
  return friendships.map((entry) => entry.friend);
}
```

### 5. Supprimer un ami (DELETE)

**Fichier** : `frontend/src/services/auth.service.ts:233-247`

```typescript
public async removeFriend(userId: number): Promise<{ message: string }> {
  const response = await fetch(`${this.baseURL}/users/friends/${userId}/remove/`, {
    method: 'DELETE',  // Methode pour supprimer
    headers: {
      Authorization: `Bearer ${this.accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove friend');
  }

  return await response.json();
}
```

### 6. Mise a jour du profil avec FormData

**Fichier** : `frontend/src/services/auth.service.ts:162-185`

```typescript
public async updateProfile(data: UpdateProfileData): Promise<User> {
  // FormData permet d'envoyer des fichiers (comme l'avatar)
  const formData = new FormData();

  if (data.display_name) formData.append('display_name', data.display_name);
  if (data.email) formData.append('email', data.email);
  if (data.avatar) formData.append('avatar', data.avatar);  // Fichier image

  const response = await fetch(`${this.baseURL}/users/profile/`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${this.accessToken}`,
      // Note : Pas de 'Content-Type' - le navigateur le definit automatiquement pour FormData
    },
    body: formData,  // FormData au lieu de JSON
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error((Object.values(error)[0] as string) || 'Profile update failed');
  }

  const user = await response.json() as User;
  this.saveUser(user);
  return user;
}
```

**Note importante :** Pour envoyer des fichiers, on utilise `FormData` au lieu de `JSON.stringify()`.

---

## Gestion des erreurs

### Les codes HTTP courants

| Code | Signification | Action typique |
|------|---------------|----------------|
| `200` | OK - Succes | Traiter les donnees |
| `201` | Created - Ressource creee | Confirmer la creation |
| `400` | Bad Request - Requete invalide | Afficher erreur de validation |
| `401` | Unauthorized - Non authentifie | Rediriger vers login |
| `403` | Forbidden - Acces refuse | Afficher message d'erreur |
| `404` | Not Found - Ressource inexistante | Afficher page 404 |
| `500` | Server Error - Erreur serveur | Afficher erreur generique |

### Pattern de gestion des erreurs

```typescript
async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);

    // Gerer les erreurs HTTP
    if (!response.ok) {
      // Essayer de lire le message d'erreur du serveur
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Si le corps n'est pas du JSON, utiliser le statusText
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    return await response.json() as T;
  } catch (error) {
    // Gerer les erreurs reseau (pas de connexion, timeout, etc.)
    if (error instanceof TypeError) {
      throw new Error('Erreur reseau - Verifiez votre connexion');
    }
    throw error;
  }
}
```

### Erreurs reseau vs erreurs HTTP

```
┌────────────────────────────────────────────────────────────────────┐
│                      ERREURS POSSIBLES                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ERREUR RESEAU (TypeError)                                       │
│     └── Pas de connexion Internet                                   │
│     └── Serveur injoignable                                         │
│     └── CORS bloque la requete                                      │
│     └── Timeout                                                     │
│                                                                     │
│  2. ERREUR HTTP (response.ok === false)                             │
│     └── 4xx : Erreur client (mauvaise requete)                      │
│     └── 5xx : Erreur serveur (bug backend)                          │
│                                                                     │
│  3. ERREUR DE PARSING                                               │
│     └── response.json() echoue si le corps n'est pas du JSON        │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Bonnes pratiques

### 1. Centraliser les appels API

```typescript
// services/api.service.ts
class ApiService {
  private readonly baseURL = 'https://localhost:8443/api';

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
```

### 2. Utiliser des types TypeScript

```typescript
// types/api.ts
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// Utilisation avec typage
const response = await fetch('/api/login', {
  method: 'POST',
  body: JSON.stringify(loginData satisfies LoginRequest),
});
const data = await response.json() as LoginResponse;
```

### 3. Ne jamais faire confiance aux donnees du serveur

```typescript
// Toujours valider les donnees recues
function validateUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'username' in data
  );
}

const response = await fetch('/api/users/me/');
const data = await response.json();

if (!validateUser(data)) {
  throw new Error('Donnees utilisateur invalides');
}
```

### 4. Gerer le timeout

```typescript
async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La requete a expire (timeout)');
    }
    throw error;
  }
}
```

---

## Comparaison : Fetch vs alternatives

### Fetch vs XMLHttpRequest (XHR)

| Aspect | Fetch | XMLHttpRequest |
|--------|-------|----------------|
| Syntaxe | Moderne (Promises) | Ancienne (callbacks) |
| Support JSON | Natif avec `.json()` | Manuel avec `JSON.parse()` |
| Gestion erreurs | Basee sur Promises | Evenements `onerror` |
| Lisibilite | Excellente | Verbeux |
| Support navigateurs | Moderne (IE non supporte) | Tous les navigateurs |

### Fetch vs Axios (librairie externe)

| Aspect | Fetch | Axios |
|--------|-------|-------|
| Installation | Natif (aucune) | npm install axios |
| Transformation JSON | Manuelle (`.json()`) | Automatique |
| Intercepteurs | Non (a implementer) | Oui (natif) |
| Timeout | Manuel (AbortController) | Option native |
| Taille bundle | 0 KB | ~13 KB |

> **Choix du projet** : ft_transcendence utilise Fetch car c'est natif et le sujet demande de minimiser les dependances.

---

## Exercices pratiques

### Exercice 1 : Comprendre les requetes

**Question** : Quel est le probleme avec ce code ?

```typescript
const response = await fetch('/api/users/me/');
const user = await response.json();
console.log(user.username);
```

<details>
<summary>Solution</summary>

**Probleme** : On ne verifie pas si la requete a reussi avant de lire le corps.

**Code corrige** :
```typescript
const response = await fetch('/api/users/me/');
if (!response.ok) {
  throw new Error(`Erreur: ${response.status}`);
}
const user = await response.json();
console.log(user.username);
```
</details>

---

### Exercice 2 : Creer une fonction POST

**Objectif** : Creer une fonction qui ajoute un ami.

```typescript
// A completer
async function addFriend(userId: number, token: string): Promise<void> {
  // Votre code ici
}
```

<details>
<summary>Solution</summary>

```typescript
async function addFriend(userId: number, token: string): Promise<void> {
  const response = await fetch(`https://localhost:8443/api/users/friends/${userId}/add/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add friend');
  }
}
```
</details>

---

### Exercice 3 : Gerer plusieurs requetes

**Objectif** : Charger les amis et les utilisateurs bloques en parallele.

```typescript
// A completer - utiliser Promise.all
async function loadUserRelations(token: string) {
  // Votre code ici
}
```

<details>
<summary>Solution</summary>

```typescript
async function loadUserRelations(token: string) {
  const headers = { Authorization: `Bearer ${token}` };

  const [friendsResponse, blockedResponse] = await Promise.all([
    fetch('https://localhost:8443/api/users/friends/', { headers }),
    fetch('https://localhost:8443/api/users/blocked/', { headers }),
  ]);

  if (!friendsResponse.ok || !blockedResponse.ok) {
    throw new Error('Failed to load user relations');
  }

  const friends = await friendsResponse.json();
  const blocked = await blockedResponse.json();

  return { friends, blocked };
}
```

**Avantage de `Promise.all`** : Les deux requetes sont lancees en parallele, ce qui reduit le temps d'attente total.
</details>

---

## Resume

| Concept | Description |
|---------|-------------|
| **Fetch** | API native pour les requetes HTTP |
| **Methodes HTTP** | GET (lire), POST (creer), PUT (modifier), DELETE (supprimer) |
| **response.ok** | Verifie si le status est 200-299 |
| **response.json()** | Parse le corps JSON de la reponse |
| **Headers** | Metadata de la requete (Authorization, Content-Type) |
| **Body** | Donnees envoyees (POST/PUT) |

---

## Ressources

- [MDN - Fetch API](https://developer.mozilla.org/fr/docs/Web/API/Fetch_API)
- [MDN - Using Fetch](https://developer.mozilla.org/fr/docs/Web/API/Fetch_API/Using_Fetch)
- [JavaScript.info - Fetch](https://javascript.info/fetch)
- [HTTP Status Codes](https://httpstatuses.com/)

---

**Derniere mise a jour** : 2025-12-08
**Projet** : ft_transcendence (Ecole 42)
