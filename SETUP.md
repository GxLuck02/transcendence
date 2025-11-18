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
- **Base de données** : SQLite (fichier local `db/db.sqlite3`)
- **Redis** : localhost:6379
- **Blockchain** : Avalanche Fuji testnet (via RPC distant)

## Compte admin par défaut

L'entrypoint crée automatiquement :
- Username : `admin`
- Password : `admin`

Pour créer un nouveau superuser :
```bash
make superuser
```

## 🔗 Configuration Blockchain Avalanche

### Étape 1 : Créer un wallet Avalanche

Vous avez deux options :

#### Option A : Utiliser Core Wallet (recommandé)
1. Téléchargez **Core Wallet** : https://core.app/
2. Créez un nouveau wallet
3. **Sauvegardez votre phrase de récupération** (12 mots) ⚠️
4. Basculez sur le réseau **Fuji Testnet** dans les paramètres

#### Option B : Utiliser MetaMask
1. Installez MetaMask : https://metamask.io/
2. Ajoutez le réseau Avalanche Fuji manuellement :
   - **Nom du réseau** : Avalanche Fuji C-Chain
   - **URL RPC** : `https://api.avax-test.network/ext/bc/C/rpc`
   - **Chain ID** : 43113
   - **Symbole** : AVAX
   - **Explorateur** : https://testnet.snowtrace.io

### Étape 2 : Obtenir des AVAX testnet

1. Allez sur le **Avalanche Fuji Faucet** : https://faucet.avax.network/
2. Connectez votre wallet (Core ou MetaMask)
3. Sélectionnez **C-Chain**
4. Cliquez sur **Request 2 AVAX**
5. Attendez quelques secondes, vous recevrez 2 AVAX testnet

⚠️ **Important** : Les AVAX testnet n'ont aucune valeur réelle, c'est uniquement pour le développement !

### Étape 3 : Exporter votre clé privée

#### Depuis Core Wallet :
1. Cliquez sur votre compte
2. Allez dans **Manage Keys** > **View C-Chain Private Key**
3. Entrez votre mot de passe
4. Copiez la clé privée (commence par `0x`)

#### Depuis MetaMask :
1. Cliquez sur les 3 points verticaux à côté de votre compte
2. Sélectionnez **Account details**
3. Cliquez sur **Export Private Key**
4. Entrez votre mot de passe
5. Copiez la clé privée (commence par `0x`)

### Étape 4 : Configurer le fichier .env

1. Ouvrez le fichier `.env` à la racine du projet
2. Modifiez les lignes suivantes :

```bash
# Blockchain Configuration - Avalanche C-Chain (Fuji Testnet)
WEB3_PROVIDER_URI=https://api.avax-test.network/ext/bc/C/rpc
BLOCKCHAIN_PRIVATE_KEY=votre_clé_privée_SANS_le_0x
CONTRACT_ADDRESS=will-be-set-after-deployment
```

⚠️ **ATTENTION** :
- Retirez le préfixe `0x` de votre clé privée
- Ne commitez JAMAIS ce fichier sur Git !
- Exemple : Si votre clé est `0xabcdef123...`, mettez `abcdef123...`

### Étape 5 : Déployer le smart contract

Une fois le projet lancé (`make up`), déployez le contrat :

```bash
# Déployer le contrat TournamentScore sur Avalanche Fuji
docker compose exec web python manage.py deploy_tournament_contract
```

Vous devriez voir :
```
============================================================
Deploying TournamentScore Smart Contract
============================================================

1. Connecting to blockchain...
Connected! Block number: 12345678
Default account: 0xYourAddress...

2. Compiling smart contract...
Contract compiled successfully!

3. Deploying contract to blockchain...
Contract deployed successfully!
Contract address: 0x...
Transaction hash: 0x...

4. Saving contract to database...
Contract saved to database with ID: 1

5. Testing contract functions...
getTournamentCount() = 0
getAllTournamentIds() = []

============================================================
DEPLOYMENT SUCCESSFUL
============================================================

Contract Address: 0x...
Transaction Hash: 0x...
Network: Avalanche Fuji Testnet

You can now store tournament scores on the blockchain!
API Endpoint: POST /api/blockchain/tournaments/<id>/store/
```

### Étape 6 : Vérifier votre déploiement

1. **Copiez l'adresse du contrat** affichée après le déploiement
2. Allez sur **Snowtrace Testnet** : https://testnet.snowtrace.io
3. Collez l'adresse du contrat dans la barre de recherche
4. Vous verrez votre contrat et toutes les transactions !

### Étape 7 : Tester la blockchain

```bash
# Ouvrir un shell Python Django
docker compose exec web python manage.py shell

# Vérifier la connexion
>>> from backend.apps.blockchain.services.web3_service import get_web3_service
>>> ws = get_web3_service()
>>> ws.is_connected()
True

>>> ws.w3.eth.chain_id
43113

>>> ws.default_account
'0xYourAddress...'

>>> ws.get_balance(ws.default_account)
2000000000000000000  # 2 AVAX en wei
```

## 🔍 Liens utiles Avalanche

- **Documentation officielle** : https://docs.avax.network/
- **Faucet Fuji** : https://faucet.avax.network/
- **Explorer Testnet** : https://testnet.snowtrace.io/
- **Core Wallet** : https://core.app/
- **Statut du réseau** : https://status.avax.network/

## ⚠️ Sécurité

### ✅ À FAIRE :
- Sauvegarder votre phrase de récupération (12 mots) dans un endroit sûr
- Garder votre clé privée secrète
- Utiliser un wallet différent pour le testnet et le mainnet

### ❌ À NE PAS FAIRE :
- Committer votre `.env` avec la clé privée sur Git
- Partager votre clé privée
- Utiliser la même clé privée pour le mainnet
- Envoyer de vrais AVAX sur le testnet

## 🐛 Troubleshooting Blockchain

### Erreur : "Not connected to blockchain"
```bash
# Vérifier votre connexion internet
ping api.avax-test.network

# Vérifier que la clé privée est bien configurée dans .env
cat .env | grep BLOCKCHAIN_PRIVATE_KEY

# Redémarrer le conteneur
docker compose restart web
```

### Erreur : "No private key available"
- Vérifiez que `BLOCKCHAIN_PRIVATE_KEY` est bien défini dans `.env`
- Assurez-vous d'avoir retiré le préfixe `0x`
- Redémarrez : `docker compose restart web`

### Erreur : "Insufficient funds"
- Allez sur https://faucet.avax.network/ pour obtenir plus d'AVAX testnet
- Vérifiez votre balance : `ws.get_balance(ws.default_account)`
- 1 AVAX = 1000000000000000000 wei

### Transaction échouée
- Vérifiez votre balance en AVAX testnet
- Augmentez la limite de gas (déjà configurée à 3M)
- Consultez l'erreur sur https://testnet.snowtrace.io avec votre tx hash

## En cas de problème

1. Vérifier que Docker est lancé
2. Vérifier les logs : `make logs`
3. Rebuild : `make re`
4. Consulter le README.md complet pour plus de détails
