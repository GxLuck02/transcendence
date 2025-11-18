#!/bin/bash

set -e

echo "🔨 Building frontend..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the frontend
echo "⚙️  Compiling TypeScript and building with Vite..."
npm run build

echo "✅ Frontend build complete!"
echo "📁 Output directory: $SCRIPT_DIR/dist"
