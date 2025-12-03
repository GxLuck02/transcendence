import Database from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CHEMINS POSSIBLES DE LA DB
const DOCKER_DB = join(__dirname, 'transcendence.db');           // DB copiée depuis Docker
const LOCAL_DB  = join(__dirname, 'data', 'transcendence.db');   // DB locale Fastify

// CHOISIR AUTOMATIQUEMENT LA DB DISPONIBLE
let dbPath = null;

if (fs.existsSync(DOCKER_DB)) {
  console.log("🟦 Using DOCKER database:", DOCKER_DB);
  dbPath = DOCKER_DB;
} else if (fs.existsSync(LOCAL_DB)) {
  console.log("🟩 Using LOCAL database:", LOCAL_DB);
  dbPath = LOCAL_DB;
} else {
  console.error("❌ Aucune base de données trouvée.\n" +
                "Copie depuis Docker: transcendence.db\n" + 
                "Ou DB locale: data/transcendence.db");
  process.exit(1);
}

const db = new Database(dbPath);

// Fonction pour afficher un tableau propre
function printTable(name, rows) {
  console.log(`\n===== TABLE: ${name} =====`);
  if (rows.length === 0) {
    console.log("(empty)");
  } else {
    console.table(rows);
  }
}

// Récupérer la liste des tables SQLite
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).all();

// Afficher chaque table
for (const t of tables) {
  const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
  printTable(t.name, rows);
}

console.log("\n📦 Base de données affichée avec succès.\n");
