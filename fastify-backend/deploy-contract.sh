#!/bin/bash
# Script wrapper pour deploy-contract.js
# Installe web3 automatiquement si nécessaire et charge le .env depuis la racine

set -e

# Trouver le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Dossier pour les dépendances de déploiement
DEPLOY_DIR="$SCRIPT_DIR/.deploy"

# Installer web3 si nécessaire
if [ ! -d "$DEPLOY_DIR/node_modules/web3" ]; then
  echo "📦 Installation de web3 pour le déploiement..."
  mkdir -p "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
  npm init -y --silent > /dev/null 2>&1
  npm install web3@^4.8.0 --silent
  echo "✅ web3 installé"
fi

# Exécuter le script Node.js avec le bon NODE_PATH
cd "$PROJECT_ROOT"
NODE_PATH="$DEPLOY_DIR/node_modules:$NODE_PATH" node "$SCRIPT_DIR/deploy-contract.js" "$@"

