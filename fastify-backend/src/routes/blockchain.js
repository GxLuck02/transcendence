import { Web3 } from 'web3';
import db from '../db.js';

// Avalanche Testnet configuration
const WEB3_PROVIDER_URI = process.env.WEB3_PROVIDER_URI || 'https://api.avax-test.network/ext/bc/C/rpc';
const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

let web3;
let contract;
let account;

// ABI for tournament score storage contract
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tournamentId", "type": "uint256"},
      {"internalType": "string", "name": "_tournamentName", "type": "string"},
      {"internalType": "string", "name": "_winnerUsername", "type": "string"},
      {"internalType": "uint256", "name": "_winnerScore", "type": "uint256"}
    ],
    "name": "storeTournament",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_tournamentId", "type": "uint256"}],
    "name": "getTournamentWinner",
    "outputs": [
      {"internalType": "string", "name": "winnerUsername", "type": "string"},
      {"internalType": "uint256", "name": "winnerScore", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_tournamentId", "type": "uint256"}],
    "name": "getTournament",
    "outputs": [
      {"internalType": "uint256", "name": "tournamentId", "type": "uint256"},
      {"internalType": "string", "name": "tournamentName", "type": "string"},
      {"internalType": "address", "name": "winner", "type": "address"},
      {"internalType": "string", "name": "winnerUsername", "type": "string"},
      {"internalType": "uint256", "name": "winnerScore", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize Web3 connection
function initializeWeb3() {
  if (!BLOCKCHAIN_PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.warn('Blockchain not configured (missing BLOCKCHAIN_PRIVATE_KEY or CONTRACT_ADDRESS)');
    return false;
  }

  try {
    web3 = new Web3(WEB3_PROVIDER_URI);
    // Ajouter le préfixe 0x si nécessaire
    const privateKey = BLOCKCHAIN_PRIVATE_KEY.startsWith('0x') 
      ? BLOCKCHAIN_PRIVATE_KEY 
      : '0x' + BLOCKCHAIN_PRIVATE_KEY;
    account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    console.log('✅ Web3 initialisé avec succès');
    return true;
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    return false;
  }
}

export default async function blockchainRoutes(app) {
  const web3Initialized = initializeWeb3();

  // Record tournament winner on blockchain
  app.post('/api/blockchain/tournament/record/', { preValidation: [app.authenticate] }, async (request, reply) => {
    if (!web3Initialized) {
      return reply.code(503).send({ error: 'Blockchain service not configured' });
    }

    const { tournament_id, tournament_name, winner_username, winner_score } = request.body || {};

    if (!tournament_id || !winner_username || winner_score === undefined) {
      return reply.code(400).send({ error: 'tournament_id, winner_username, and winner_score are required' });
    }

    // Validate types
    if (typeof tournament_id !== 'number' || !Number.isInteger(tournament_id) || tournament_id <= 0) {
      return reply.code(400).send({ error: 'tournament_id must be a positive integer' });
    }

    if (typeof winner_username !== 'string' || winner_username.length < 1 || winner_username.length > 100) {
      return reply.code(400).send({ error: 'winner_username must be a string between 1-100 characters' });
    }

    if (typeof winner_score !== 'number' || !Number.isInteger(winner_score) || winner_score < 0) {
      return reply.code(400).send({ error: 'winner_score must be a non-negative integer' });
    }

    // Tournament name is optional, use default if not provided
    const tournamentName = tournament_name || `Tournament #${tournament_id}`;

    try {
      // Send transaction to blockchain
      const tx = await contract.methods.storeTournament(
        tournament_id,
        tournamentName,
        winner_username,
        winner_score
      ).send({
        from: account.address,
        gas: 300000
      });

      // Convertir BigInt en Number pour la sérialisation JSON
      const blockNumber = typeof tx.blockNumber === 'bigint' 
        ? Number(tx.blockNumber) 
        : tx.blockNumber;

      // Store in database
      const stmt = db.prepare(`
        INSERT INTO blockchain_scores (tournament_id, winner_username, winner_score, tx_hash, block_number)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(tournament_id, winner_username, winner_score, tx.transactionHash, blockNumber);

      reply.send({
        success: true,
        tx_hash: tx.transactionHash,
        block_number: blockNumber,
        tournament_id,
        winner_username,
        winner_score
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to record on blockchain', details: error.message });
    }
  });

  // Get tournament winner from blockchain
  app.get('/api/blockchain/tournament/:id/', { preValidation: [app.authenticate] }, async (request, reply) => {
    if (!web3Initialized) {
      return reply.code(503).send({ error: 'Blockchain service not configured' });
    }

    const tournamentId = Number(request.params.id);

    try {
      const result = await contract.methods.getTournamentWinner(tournamentId).call();

      reply.send({
        tournament_id: tournamentId,
        winner_username: result[0],
        winner_score: Number(result[1])
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch from blockchain', details: error.message });
    }
  });

  // Get blockchain records from database
  app.get('/api/blockchain/history/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const records = db.prepare(`
      SELECT * FROM blockchain_scores
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    reply.send(records);
  });
}
