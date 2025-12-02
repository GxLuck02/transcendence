# Validation Locale du Module Blockchain

## ✅ Résultats de la validation manuelle

### 1. Smart Contract (`contracts/TournamentScore.sol`)

✅ **Struct Tournament** :
- Contient `uint256 winnerScore` (ligne 15)
- Tous les champs requis présents

✅ **Fonction storeTournament** :
- Accepte 4 paramètres : `_tournamentId`, `_tournamentName`, `_winnerUsername`, `_winnerScore` (lignes 43-48)
- Stocke le score dans la struct (ligne 56)
- Émet l'événement avec le score (ligne 68)

✅ **Fonction getTournamentWinner** :
- Retourne `winnerUsername` et `winnerScore` (lignes 114-126)
- Compatible avec le backend

✅ **Événement TournamentStored** :
- Inclut `winnerScore` dans les paramètres (ligne 32)

### 2. Backend (`src/routes/blockchain.js`)

✅ **ABI** :
- Contient `storeTournament` avec 4 paramètres (lignes 16-25)
- Contient `getTournamentWinner` qui retourne username et score (lignes 27-35)

✅ **Route POST /api/blockchain/tournament/record/** :
- Appelle `contract.methods.storeTournament()` avec les 4 paramètres (ligne 105)
- Valide `tournament_id`, `winner_username`, `winner_score` (lignes 88-98)
- Utilise un nom par défaut si `tournament_name` n'est pas fourni (ligne 101)

✅ **Route GET /api/blockchain/tournament/:id/** :
- Appelle `contract.methods.getTournamentWinner()` (ligne 145)
- Retourne `winner_username` et `winner_score` (lignes 149-150)

### 3. Base de données (`src/db.js`)

✅ **Table blockchain_scores** :
- Existe (ligne 125)
- Colonnes : `tournament_id`, `winner_username`, `winner_score`, `tx_hash`, `block_number`

## Tests de validation des données

### Cas de test validés

| Test | tournament_id | winner_username | winner_score | Résultat attendu |
|------|---------------|-----------------|--------------|------------------|
| 1    | 1             | "Alice"         | 10           | ✅ Valide        |
| 2    | -1             | "Bob"           | 5            | ❌ Invalide (ID négatif) |
| 3    | 2              | ""              | 3            | ❌ Invalide (username vide) |
| 4    | 3              | "Charlie"       | -1           | ❌ Invalide (score négatif) |
| 5    | 4              | "Dave"          | 0            | ✅ Valide (score zéro OK) |

### Logique de validation (backend)

```javascript
// Validation tournament_id
typeof tournament_id === 'number' && 
Number.isInteger(tournament_id) && 
tournament_id > 0

// Validation winner_username
typeof winner_username === 'string' && 
winner_username.length >= 1 && 
winner_username.length <= 100

// Validation winner_score
typeof winner_score === 'number' && 
Number.isInteger(winner_score) && 
winner_score >= 0
```

## Comment tester manuellement

### Option 1 : Via le script de test (quand le container est lancé)

```bash
# Lancer le projet
make up

# Copier les fichiers nécessaires dans le container (première fois seulement)
docker compose cp fastify-backend/test-blockchain-local.js api:/app/test-blockchain-local.js
docker compose exec api mkdir -p /app/contracts
docker compose cp fastify-backend/contracts/TournamentScore.sol api:/app/contracts/TournamentScore.sol

# Exécuter le script de test dans le container
docker compose exec api node /app/test-blockchain-local.js
```

**Note** : Les fichiers doivent être copiés car ils ne sont pas inclus dans l'image Docker par défaut.

### Option 2 : Test des routes API (sans contrat déployé)

Même sans contrat déployé, vous pouvez tester la validation :

```bash
# 1. Lancer le projet
make up

# 2. Se connecter et obtenir un token JWT depuis l'interface
# https://localhost:8443

# 3. Tester la validation (retournera 503 si pas configuré, mais valide les données)
curl -X POST https://localhost:8443/api/blockchain/tournament/record/ \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -k \
  -d '{"tournament_id": 1, "winner_username": "Test", "winner_score": 10}'

# Test avec données invalides (doit retourner 400)
curl -X POST https://localhost:8443/api/blockchain/tournament/record/ \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -k \
  -d '{"tournament_id": -1, "winner_username": "Test", "winner_score": 10}'
# Attendu : {"error": "tournament_id must be a positive integer"}
```

### Option 3 : Vérification de la structure de la DB

```bash
# Lancer le projet
make up

# Ouvrir un shell dans le container
make shell

# Dans le shell Node.js :
const db = require('./src/db.js');
const columns = db.prepare('PRAGMA table_info(blockchain_scores)').all();
console.log(columns.map(c => c.name));
// Doit afficher : ['id', 'tournament_id', 'winner_username', 'winner_score', 'tx_hash', 'block_number', 'created_at']
```

## ✅ Conclusion

**Toutes les validations locales sont OK !**

- ✅ Smart contract aligné avec le backend
- ✅ ABI correct
- ✅ Routes backend correctes
- ✅ Base de données prête
- ✅ Validations de données fonctionnelles

**Prochaine étape** : Déployer le contrat sur Avalanche Fuji testnet pour tester avec de vraies transactions.

