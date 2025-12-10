# Theorie : Docker - Containerisation d'applications

## Table des matieres
1. [Qu'est-ce que Docker ?](#quest-ce-que-docker-)
2. [Pourquoi Docker dans ft_transcendence](#pourquoi-docker-dans-ft_transcendence)
3. [Les concepts cles de Docker](#les-concepts-cles-de-docker)
4. [Dockerfile : Construire une image](#dockerfile--construire-une-image)
5. [Docker Compose : Orchestration](#docker-compose--orchestration)
6. [Exemples pratiques de notre projet](#exemples-pratiques-de-notre-projet)
7. [Commandes essentielles](#commandes-essentielles)
8. [Exercices pratiques](#exercices-pratiques)

---

## Qu'est-ce que Docker ?

### Definition simple

**Docker** est une plateforme de **containerisation** qui permet d'empaqueter une application avec toutes ses dependances dans un conteneur isole. Ce conteneur peut ensuite etre execute sur n'importe quelle machine ayant Docker installe.

### L'analogie du conteneur maritime

Imaginez le transport maritime :
- **Avant les conteneurs** : Chaque produit etait emballe differemment, difficile a charger/decharger
- **Avec les conteneurs** : Tous les produits sont dans des boites standards, faciles a transporter

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALOGIE DOCKER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONTENEUR MARITIME          =       CONTENEUR DOCKER            │
│  ┌─────────────────┐                ┌─────────────────┐         │
│  │   Marchandises  │                │   Application   │         │
│  │   + Emballage   │                │   + Dependances │         │
│  │   standardise   │                │   + Config      │         │
│  └─────────────────┘                └─────────────────┘         │
│                                                                  │
│  Peut etre charge sur    =    Peut etre execute sur             │
│  n'importe quel navire        n'importe quelle machine          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Le probleme que Docker resout

**Sans Docker :**
```
Developpeur : "Ca marche sur ma machine!"
Operations : "Ca ne marche pas en production..."

Cause : Differences d'environnement
- Versions de Node.js differentes
- Librairies manquantes
- Configuration differente
```

**Avec Docker :**
```
Developpeur : Cree un conteneur qui fonctionne
Operations : Lance le meme conteneur

Resultat : L'environnement est identique partout
```

---

## Pourquoi Docker dans ft_transcendence

### Exigences du sujet

Le sujet ft_transcendence impose :
1. **L'application doit se lancer avec une seule commande** (`make`)
2. **Utilisation de Docker Compose**
3. **Architecture multi-services**

### Notre architecture Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE DOCKER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │    NGINX     │   │     API      │   │    REDIS     │         │
│  │   (proxy)    │   │  (Fastify)   │   │   (cache)    │         │
│  │   Port 443   │   │   Port 8000  │   │  Port 6379   │         │
│  └───────┬──────┘   └───────┬──────┘   └───────┬──────┘         │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                 │
│                             │                                    │
│               transcendence_network (bridge)                     │
│                                                                  │
│  Volumes:                                                        │
│  - sqlite_data:/app/data    (persistance base de donnees)        │
│  - ./frontend/dist:/html    (fichiers frontend)                  │
│  - ./nginx/ssl:/ssl         (certificats SSL)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Avantages pour notre projet

| Avantage | Description |
|----------|-------------|
| **Reproductibilite** | Meme environnement sur toutes les machines |
| **Isolation** | Chaque service dans son conteneur |
| **Simplicite** | Une commande pour tout lancer |
| **Securite** | Services isoles les uns des autres |
| **Portabilite** | Fonctionne sur Linux, Mac, Windows |

---

## Les concepts cles de Docker

### 1. Image vs Conteneur

```
┌─────────────────────────────────────────────────────────────────┐
│                IMAGE vs CONTENEUR                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IMAGE (Classe)                  CONTENEUR (Instance)            │
│  ─────────────                   ───────────────────             │
│  - Template en lecture seule     - Instance en cours d'execution │
│  - Contient le code et deps      - Processus isole               │
│  - Peut creer plusieurs          - Peut etre demarre/arrete      │
│    conteneurs                    - Etat modifiable               │
│                                                                  │
│  Analogie :                                                      │
│  - Moule a gateau               - Gateau cuit                    │
│  - Plan de maison               - Maison construite              │
│  - Classe en POO                - Objet instancie                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Dockerfile

Un fichier texte contenant les instructions pour construire une image.

```dockerfile
# Base image
FROM node:20-alpine

# Repertoire de travail
WORKDIR /app

# Copier les fichiers
COPY package*.json ./
RUN npm install

COPY . .

# Port expose
EXPOSE 8000

# Commande de demarrage
CMD ["node", "server.js"]
```

### 3. Docker Compose

Un outil pour definir et gerer des applications multi-conteneurs.

```yaml
# docker-compose.yml
services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 4. Volumes

Permettent de persister les donnees en dehors du conteneur.

```yaml
volumes:
  - sqlite_data:/app/data    # Volume nomme
  - ./config:/app/config     # Bind mount (dossier local)
```

### 5. Networks

Permettent aux conteneurs de communiquer entre eux.

```yaml
networks:
  transcendence_network:
    driver: bridge
```

---

## Dockerfile : Construire une image

### Structure d'un Dockerfile

```dockerfile
# Commentaire
INSTRUCTION arguments
```

### Instructions principales

| Instruction | Description | Exemple |
|-------------|-------------|---------|
| `FROM` | Image de base | `FROM node:20-alpine` |
| `WORKDIR` | Repertoire de travail | `WORKDIR /app` |
| `COPY` | Copier des fichiers | `COPY package*.json ./` |
| `RUN` | Executer une commande | `RUN npm install` |
| `ENV` | Variable d'environnement | `ENV NODE_ENV=production` |
| `EXPOSE` | Port a exposer | `EXPOSE 8000` |
| `CMD` | Commande par defaut | `CMD ["node", "app.js"]` |
| `USER` | Changer d'utilisateur | `USER nodejs` |

### Bonnes pratiques

```dockerfile
# 1. Utiliser des images legeres (alpine)
FROM node:20-alpine

# 2. Installer les dependances systeme necessaires
RUN apk add --no-cache python3 make g++

# 3. Definir le repertoire de travail
WORKDIR /app

# 4. Copier d'abord les fichiers de dependances (meilleur cache)
COPY package*.json ./

# 5. Installer les dependances
RUN npm ci

# 6. Copier le reste du code source
COPY src ./src

# 7. Creer un utilisateur non-root pour la securite
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 8. Changer les permissions
RUN chown -R nodejs:nodejs /app

# 9. Utiliser l'utilisateur non-root
USER nodejs

# 10. Exposer le port
EXPOSE 8000

# 11. Definir la commande de demarrage
CMD ["node", "src/server.js"]
```

---

## Docker Compose : Orchestration

### Structure d'un docker-compose.yml

```yaml
# Version (optionnel avec Docker Compose V2)
version: '3.8'

# Definition des services
services:
  service_name:
    # Configuration du service

# Reseaux (optionnel)
networks:
  network_name:
    driver: bridge

# Volumes (optionnel)
volumes:
  volume_name:
```

### Options de configuration des services

```yaml
services:
  api:
    # Construire depuis un Dockerfile
    build: ./fastify-backend
    # Ou utiliser une image existante
    # image: node:20-alpine

    # Nom du conteneur
    container_name: transcendence_api

    # Ports exposes (host:container)
    ports:
      - "8000:8000"

    # Variables d'environnement
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}

    # Volumes
    volumes:
      - sqlite_data:/app/data

    # Dependances
    depends_on:
      redis:
        condition: service_healthy

    # Reseaux
    networks:
      - transcendence_network

    # Politique de redemarrage
    restart: unless-stopped

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Exemples pratiques de notre projet

### 1. Dockerfile du backend

**Fichier** : `fastify-backend/Dockerfile`

```dockerfile
FROM node:20-alpine

# Installer les dependances de compilation pour better-sqlite3
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    musl-dev \
    linux-headers \
    libc-dev

WORKDIR /app

# Copier les fichiers de dependances
COPY package*.json ./

# Installer les dependances
RUN npm ci

# Copier le code source
COPY src ./src

# Creer le repertoire de donnees pour SQLite
RUN mkdir -p /app/data

# SECURITE: Creer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Utiliser l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 8000

# Demarrer le serveur
CMD ["node", "src/server.js"]
```

**Explications :**

1. **`FROM node:20-alpine`** : Image legere de Node.js
2. **`apk add`** : Installe les outils de compilation pour SQLite
3. **`npm ci`** : Installation propre des dependances
4. **Utilisateur non-root** : Securite - le conteneur ne tourne pas en root

### 2. Docker Compose principal

**Fichier** : `docker-compose.yml`

```yaml
services:
  # Redis pour les WebSockets
  redis:
    image: redis:7-alpine
    container_name: transcendence_redis
    # SECURITE: Pas de port expose - acces interne uniquement
    networks:
      - transcendence_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # API Fastify (Node.js)
  api:
    build: ./fastify-backend
    container_name: transcendence_api
    volumes:
      - sqlite_data:/app/data
    # SECURITE: Pas de port expose - acces via Nginx uniquement
    environment:
      - NODE_ENV=production
      - PORT=8000
      # Le JWT_SECRET doit etre defini dans .env
      - JWT_SECRET=${JWT_SECRET:?JWT_SECRET must be set}
      - WEB3_PROVIDER_URI=${WEB3_PROVIDER_URI:-https://api.avax-test.network/ext/bc/C/rpc}
      - BLOCKCHAIN_PRIVATE_KEY=${BLOCKCHAIN_PRIVATE_KEY:-}
      - CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-}
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - transcendence_network
    restart: unless-stopped

  # Nginx (Reverse Proxy avec SSL)
  nginx:
    image: nginx:alpine
    container_name: transcendence_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:z
      - ./nginx/ssl:/etc/nginx/ssl:z
      - ./frontend/dist:/usr/share/nginx/html:z
    ports:
      - "80:80"
      - "443:443"
      - "8443:8443"
    depends_on:
      - api
    networks:
      - transcendence_network
    restart: unless-stopped

networks:
  transcendence_network:
    driver: bridge

volumes:
  sqlite_data:
```

**Points importants :**

1. **Securite des ports** :
   - Redis : Pas de port expose (interne uniquement)
   - API : Pas de port expose (acces via Nginx)
   - Nginx : Seul service avec des ports exposes

2. **Health checks** :
   - Redis verifie sa disponibilite avec `redis-cli ping`

3. **Dependances** :
   - API attend que Redis soit healthy
   - Nginx attend que API soit demarree

4. **Variables d'environnement** :
   - `${JWT_SECRET:?message}` : Erreur si non defini
   - `${VAR:-default}` : Valeur par defaut si non defini

### 3. Architecture reseau

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESEAU DOCKER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Internet                                                        │
│      │                                                           │
│      │  Ports 80, 443, 8443                                      │
│      ▼                                                           │
│  ┌───────────────────────────────────────────────┐              │
│  │              NGINX (proxy)                     │              │
│  │  - SSL termination                             │              │
│  │  - Sert les fichiers frontend                  │              │
│  │  - Proxy vers l'API                            │              │
│  └───────────────────┬───────────────────────────┘              │
│                      │                                           │
│                      │  http://api:8000 (reseau interne)         │
│                      ▼                                           │
│  ┌───────────────────────────────────────────────┐              │
│  │               API (Fastify)                    │              │
│  │  - REST endpoints                              │              │
│  │  - WebSocket                                   │              │
│  │  - JWT authentication                          │              │
│  └───────────────────┬───────────────────────────┘              │
│                      │                                           │
│                      │  redis://redis:6379 (reseau interne)      │
│                      ▼                                           │
│  ┌───────────────────────────────────────────────┐              │
│  │               REDIS                            │              │
│  │  - Pub/Sub pour WebSocket                      │              │
│  │  - Cache                                       │              │
│  └───────────────────────────────────────────────┘              │
│                                                                  │
│  transcendence_network (bridge - isole du host)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Commandes essentielles

### Docker de base

```bash
# Construire une image
docker build -t mon-image .

# Lancer un conteneur
docker run -d -p 8000:8000 mon-image

# Lister les conteneurs en cours
docker ps

# Lister tous les conteneurs
docker ps -a

# Voir les logs d'un conteneur
docker logs container_name

# Entrer dans un conteneur
docker exec -it container_name /bin/sh

# Arreter un conteneur
docker stop container_name

# Supprimer un conteneur
docker rm container_name

# Supprimer une image
docker rmi image_name
```

### Docker Compose

```bash
# Construire et demarrer tous les services
docker compose up -d --build

# Demarrer les services existants
docker compose up -d

# Arreter tous les services
docker compose down

# Voir les logs de tous les services
docker compose logs

# Voir les logs d'un service specifique
docker compose logs api

# Suivre les logs en temps reel
docker compose logs -f

# Voir l'etat des services
docker compose ps

# Reconstruire un service specifique
docker compose build api

# Redemarrer un service
docker compose restart api

# Executer une commande dans un service
docker compose exec api /bin/sh

# Supprimer tout (conteneurs, reseaux, volumes)
docker compose down -v
```

### Notre Makefile

```makefile
# Construire et lancer
make

# Construire et lancer (equivalent)
make up

# Arreter
make down

# Voir les logs
make logs

# Reconstruire
make rebuild

# Nettoyer tout
make clean
```

---

## Securite Docker

### 1. Utilisateur non-root

```dockerfile
# Creer un utilisateur
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Changer les permissions
RUN chown -R appuser:appgroup /app

# Utiliser cet utilisateur
USER appuser
```

### 2. Images minimales

```dockerfile
# Preferer alpine (5 MB) a debian (120 MB)
FROM node:20-alpine    # Bien
FROM node:20           # A eviter si possible
```

### 3. Ne pas exposer les ports inutilement

```yaml
# MAUVAIS - Redis accessible depuis l'exterieur
redis:
  ports:
    - "6379:6379"

# BON - Redis accessible uniquement en interne
redis:
  # Pas de ports: - acces via le reseau Docker uniquement
```

### 4. Secrets via variables d'environnement

```yaml
environment:
  # Obligatoire - erreur si non defini
  - JWT_SECRET=${JWT_SECRET:?JWT_SECRET must be set}

  # Optionnel avec valeur par defaut
  - LOG_LEVEL=${LOG_LEVEL:-info}
```

```bash
# Fichier .env (NE PAS COMMITER!)
JWT_SECRET=votre_secret_tres_long_et_securise_de_32_caracteres_minimum
```

---

## Exercices pratiques

### Exercice 1 : Analyser un Dockerfile

**Question** : Quels problemes voyez-vous dans ce Dockerfile ?

```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8000
CMD node server.js
```

<details>
<summary>Solution</summary>

Problemes :
1. **Image trop lourde** : Utiliser `node:20-alpine` au lieu de `node:20`
2. **Mauvais ordre de COPY** : Copier d'abord `package*.json` puis le reste (meilleur cache)
3. **npm install au lieu de npm ci** : `npm ci` est plus fiable pour la production
4. **Pas d'utilisateur non-root** : Risque de securite
5. **CMD sans crochets** : Meilleur d'utiliser le format JSON `["node", "server.js"]`

**Version corrigee :**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN adduser -S appuser && chown -R appuser /app
USER appuser
EXPOSE 8000
CMD ["node", "server.js"]
```
</details>

---

### Exercice 2 : Ecrire un docker-compose.yml

**Objectif** : Creer un docker-compose pour une app avec PostgreSQL.

```yaml
# A completer
# - Service "web" : Node.js sur port 3000
# - Service "db" : PostgreSQL sur port 5432
# - Volume pour persister les donnees PostgreSQL
# - Reseau partage
```

<details>
<summary>Solution</summary>

```yaml
services:
  web:
    build: .
    container_name: web_app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app_network

  db:
    image: postgres:15-alpine
    container_name: postgres_db
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app_network

networks:
  app_network:
    driver: bridge

volumes:
  postgres_data:
```
</details>

---

### Exercice 3 : Debug un conteneur

**Objectif** : Trouver pourquoi un conteneur ne demarre pas.

```bash
# Le conteneur crash immediatement
docker compose up api
# "exited with code 1"
```

<details>
<summary>Solution</summary>

Etapes de debug :

```bash
# 1. Voir les logs
docker compose logs api

# 2. Voir les details du conteneur
docker inspect transcendence_api

# 3. Lancer un shell dans le conteneur
docker compose run --rm api /bin/sh

# 4. Verifier les variables d'environnement
docker compose config

# 5. Verifier que le Dockerfile est correct
docker build -t test ./fastify-backend

# Causes communes :
# - Variable d'environnement manquante (JWT_SECRET)
# - Port deja utilise
# - Fichier de config manquant
# - Permissions incorrectes
```
</details>

---

## Resume

| Concept | Description |
|---------|-------------|
| **Docker** | Plateforme de containerisation |
| **Image** | Template pour creer des conteneurs |
| **Conteneur** | Instance d'une image en execution |
| **Dockerfile** | Instructions pour construire une image |
| **Docker Compose** | Orchestration multi-conteneurs |
| **Volume** | Persistance des donnees |
| **Network** | Communication entre conteneurs |

---

## Ressources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Hub](https://hub.docker.com/) - Images officielles

---

**Derniere mise a jour** : 2025-12-08
**Projet** : ft_transcendence (Ecole 42)
