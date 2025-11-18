# 🚀 Setup Rapide - Transcendence

## Installation en 3 commandes

```bash
# 1. Setup (SSL + .env + frontend)
make setup

# 2. Build Docker
make build

# 3. Lancer
make up
```

Accès : **https://localhost:8443** (accepter le certificat SSL)

## Prérequis

- Docker (v20.10+)
- Docker Compose (v2.0+)

**Pas besoin de npm/node !** Tout se fait avec Docker.

## Commandes essentielles

```bash
make help      # Liste des commandes
make up        # Démarrer
make down      # Arrêter
make logs      # Voir les logs
make re        # Rebuild complet
```

## Problèmes fréquents

### Erreur 403 sur le site
```bash
make frontend
docker compose restart nginx
```

### Certificats SSL invalides
```bash
rm -f nginx/ssl/*.pem
make setup
docker compose restart nginx
```

### Rebuild complet propre
```bash
make re
```

## Structure des services

- **Backend Django** : http://localhost:8000
- **Frontend + Nginx** : https://localhost:8443 (principal)
- **PostgreSQL** : localhost:5432
- **Redis** : localhost:6379
- **Ganache** : localhost:8545

## Compte admin par défaut

L'entrypoint crée automatiquement :
- Username : `admin`
- Password : `admin`

Pour créer un nouveau superuser :
```bash
make superuser
```

## En cas de problème

1. Vérifier que Docker est lancé
2. Vérifier les logs : `make logs`
3. Rebuild : `make re`
4. Consulter le README.md complet pour plus de détails
