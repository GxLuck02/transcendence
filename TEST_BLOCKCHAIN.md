# Guide de test du module Blockchain

## État actuel de la configuration

### Provider blockchain
**❌ Aucun provider local configuré actuellement**

Le projet est configuré pour utiliser **Avalanche Fuji testnet** par défaut (voir `docker-compose.yml` ligne 28) :
- `WEB3_PROVIDER_URI`: `https://api.avax-test.network/ext/bc/C/rpc` (Avalanche testnet)
- `BLOCKCHAIN_PRIVATE_KEY`: Non configuré (vide par défaut)
- `CONTRACT_ADDRESS`: Non configuré (vide par défaut)

**Pour tester localement**, vous avez deux options :
1. **Utiliser Avalanche Fuji testnet** (recommandé pour tester avec un vrai réseau)
2. **Configurer un provider local** (Ganache ou Hardhat) - nécessite une configuration supplémentaire

## Procédure complète de test

### Étape 1 : Préparation de l'environnement

```bash
# 1. Vérifier que le projet est prêt
cd /Users/cedric/Desktop/transcendence

# 2. Tester la syntaxe et la structure (sans lancer le serveur)
cd fastify-backend
npm run test:blockchain
```

Cette commande vérifie :
- ✅ La syntaxe du contrat Solidity
- ✅ L'ABI dans le backend
- ✅ La structure de la base de données
- ✅ Les validations de données

### Étape 2 : Configuration pour test réel (Avalanche Fuji)

**Option A : Test avec Avalanche Fuji testnet (recommandé)**

1. **Obtenir des AVAX de test** :
   - Aller sur https://faucet.avax.network/
   - Entrer votre adresse Ethereum (créée avec MetaMask ou autre wallet)
   - Recevoir des AVAX de test

2. **Créer un compte et obtenir une clé privée** :
   ```bash
   # Utiliser MetaMask ou créer un compte avec Web3
   # La clé privée doit être sans le préfixe 0x
   ```

3. **Déployer le contrat sur Avalanche Fuji** :
   - Utiliser Remix IDE (https://remix.ethereum.org/)
   - Ou créer un script de déploiement (à faire - Phase 2)

4. **Configurer le fichier `.env`** :
   ```bash
   WEB3_PROVIDER_URI=https://api.avax-test.network/ext/bc/C/rpc
   BLOCKCHAIN_PRIVATE_KEY=votre_cle_privee_sans_0x
   CONTRACT_ADDRESS=0x... (adresse du contrat déployé)
   ```

### Étape 3 : Lancer le projet

```bash
# Depuis la racine du projet
make up

# Ou si c'est la première fois
make setup  # Génère SSL, .env, build frontend
make build  # Build les containers Docker
make up     # Lance tous les services
```

Le site sera accessible sur : **https://localhost:8443**

### Étape 4 : Tester l'enregistrement blockchain

**Actuellement, l'enregistrement blockchain n'est PAS automatique**. Il faut appeler l'endpoint manuellement.

#### Méthode 1 : Via l'interface (à implémenter)
- Créer un tournoi
- Jouer et terminer le tournoi
- Cliquer sur un bouton "Enregistrer sur blockchain" (à ajouter)

#### Méthode 2 : Via l'API directement (pour tester maintenant)

1. **Se connecter et obtenir un token JWT** :
   ```bash
   # Via l'interface web : https://localhost:8443
   # Se connecter et récupérer le token depuis les DevTools (Application > Local Storage)
   ```

2. **Enregistrer un tournoi sur la blockchain** :
   ```bash
   curl -X POST https://localhost:8443/api/blockchain/tournament/record/ \
     -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
     -H "Content-Type: application/json" \
     -k \
     -d '{
       "tournament_id": 1,
       "tournament_name": "Tournoi Test",
       "winner_username": "Alice",
       "winner_score": 10
     }'
   ```

3. **Vérifier l'enregistrement** :
   ```bash
   # Récupérer depuis la blockchain
   curl -X GET https://localhost:8443/api/blockchain/tournament/1/ \
     -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
     -k

   # Voir l'historique dans la DB
   curl -X GET https://localhost:8443/api/blockchain/history/ \
     -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
     -k
   ```

### Étape 5 : Vérifier les résultats

1. **Dans la base de données** :
   ```bash
   make shell  # Ouvre un shell Node.js dans le container
   # Puis dans le shell :
   const db = require('./src/db.js');
   db.prepare('SELECT * FROM blockchain_scores').all();
   ```

2. **Sur Avalanche Explorer** :
   - Aller sur https://testnet.snowtrace.io/
   - Chercher la transaction avec le `tx_hash` retourné

## Prochaines étapes à implémenter

### Phase 2 : Script de déploiement
- [ ] Créer un script pour compiler le contrat Solidity
- [ ] Créer un script pour déployer sur Avalanche Fuji
- [ ] Automatiser la configuration du CONTRACT_ADDRESS

### Phase 3 : Intégration automatique
- [ ] Détecter automatiquement la fin d'un tournoi
- [ ] Appeler automatiquement l'endpoint blockchain
- [ ] Afficher le statut blockchain dans l'interface

### Phase 4 : Interface utilisateur
- [ ] Bouton "Enregistrer sur blockchain" dans l'interface tournoi
- [ ] Affichage du statut blockchain (enregistré/non enregistré)
- [ ] Lien vers l'explorer Avalanche pour voir la transaction

## Dépannage

### Erreur : "Blockchain service not configured"
- Vérifier que `BLOCKCHAIN_PRIVATE_KEY` et `CONTRACT_ADDRESS` sont définis dans `.env`
- Redémarrer les containers : `make down && make up`

### Erreur : "Failed to record on blockchain"
- Vérifier que vous avez des AVAX de test dans votre compte
- Vérifier que le contrat est bien déployé à l'adresse configurée
- Vérifier les logs : `make logs`

### Erreur de connexion Web3
- Vérifier votre connexion internet
- Vérifier que l'URL du provider est correcte
- Tester la connexion : `curl https://api.avax-test.network/ext/bc/C/rpc`

