#!/bin/sh

CONTAINER="transcendence_api"
DB_PATH="/app/data/transcendence.db"
LOCAL_DB="./transcendence.db"

echo "📦 Copie de la base Docker → locale..."
docker cp "$CONTAINER:$DB_PATH" "$LOCAL_DB"

if [ $? -ne 0 ]; then
  echo "❌ Impossible de copier la DB. Vérifie le chemin ou le conteneur."
  exit 1
fi

echo "✔️ Base copiée : $LOCAL_DB"

echo "📊 Affichage de la base..."
node show-db.js
