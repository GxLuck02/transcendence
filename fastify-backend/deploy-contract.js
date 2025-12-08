/**
 * Script de déploiement du contrat TournamentScore sur Avalanche Fuji testnet
 * 
 * Usage:
 *   node deploy-contract.js
 * 
 * Prérequis:
 *   - Avoir des AVAX de test dans votre compte
 *   - Avoir configuré BLOCKCHAIN_PRIVATE_KEY dans .env
 *   - Avoir compilé le contrat (via Remix IDE ou solc)
 */

import { Web3 } from 'web3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WEB3_PROVIDER_URI = process.env.WEB3_PROVIDER_URI || 'https://api.avax-test.network/ext/bc/C/rpc';
const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';

// ABI du contrat (identique à celui dans blockchain.js)
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
  },
  {
    "inputs": [],
    "name": "getTournamentCount",
    "outputs": [{"internalType": "uint256", "name": "count", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTournamentIds",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Bytecode du contrat (doit être compilé via Remix IDE ou solc)
// Option 1: Lire depuis un fichier si vous avez compilé le contrat
// Option 2: Utiliser le bytecode directement (voir instructions ci-dessous)
let CONTRACT_BYTECODE = process.env.CONTRACT_BYTECODE || '';

async function deployContract() {
  console.log('='.repeat(60));
  console.log('🚀 Déploiement du contrat TournamentScore');
  console.log('   Réseau: Avalanche Fuji Testnet');
  console.log('='.repeat(60));
  console.log('');

  // Vérification de la clé privée
  if (!BLOCKCHAIN_PRIVATE_KEY) {
    console.error('❌ ERREUR: BLOCKCHAIN_PRIVATE_KEY non configurée');
    console.log('');
    console.log('📝 Instructions:');
    console.log('   1. Créez un wallet (MetaMask, Core Wallet, etc.)');
    console.log('   2. Obtenez des AVAX de test: https://faucet.avax.network/');
    console.log('   3. Exportez votre clé privée (sans le préfixe 0x)');
    console.log('   4. Ajoutez dans .env: BLOCKCHAIN_PRIVATE_KEY=votre_cle');
    console.log('');
    process.exit(1);
  }

  // Vérification du bytecode
  if (!CONTRACT_BYTECODE) {
    console.error('❌ ERREUR: CONTRACT_BYTECODE non fourni');
    console.log('');
    console.log('📝 Instructions pour obtenir le bytecode:');
    console.log('');
    console.log('   Option 1: Via Remix IDE (recommandé)');
    console.log('   1. Allez sur https://remix.ethereum.org/');
    console.log('   2. Créez un nouveau fichier TournamentScore.sol');
    console.log('   3. Copiez le contenu de contracts/TournamentScore.sol');
    console.log('   4. Compilez avec Solidity 0.8.0+');
    console.log('   5. Dans l\'onglet "Compilation", cliquez sur "Bytecode"');
    console.log('   6. Copiez le "object" (sans les guillemets)');
    console.log('   7. Ajoutez dans .env: CONTRACT_BYTECODE=0x...');
    console.log('');
    console.log('   Option 2: Via solc en ligne de commande');
    console.log('   npm install -g solc');
    console.log('   solc --bin contracts/TournamentScore.sol');
    console.log('');
    process.exit(1);
  }

  try {
    // Initialisation Web3
    console.log('1️⃣  Connexion à Avalanche Fuji testnet...');
    const web3 = new Web3(WEB3_PROVIDER_URI);
    
    // Vérifier la connexion
    const isListening = await web3.eth.net.isListening();
    if (!isListening) {
      throw new Error('Impossible de se connecter au réseau');
    }
    
    const chainId = await web3.eth.getChainId();
    if (chainId !== 43113n) {
      console.warn(`⚠️  Chain ID: ${chainId} (attendu: 43113 pour Avalanche Fuji)`);
    }
    
    const blockNumber = await web3.eth.getBlockNumber();
    console.log(`   ✅ Connecté! Block number: ${blockNumber}`);
    
    // Configuration du compte
    const privateKey = BLOCKCHAIN_PRIVATE_KEY.startsWith('0x') 
      ? BLOCKCHAIN_PRIVATE_KEY 
      : '0x' + BLOCKCHAIN_PRIVATE_KEY;
    
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    const address = account.address;
    console.log(`   📍 Compte: ${address}`);
    
    // Vérifier le solde
    const balance = await web3.eth.getBalance(address);
    const balanceInAvax = web3.utils.fromWei(balance, 'ether');
    console.log(`   💰 Solde: ${balanceInAvax} AVAX`);
    
    if (parseFloat(balanceInAvax) < 0.01) {
      console.warn('   ⚠️  Solde faible! Vous pourriez ne pas avoir assez pour le déploiement.');
      console.log('   💡 Obtenez des AVAX: https://faucet.avax.network/');
    }
    
    console.log('');
    
    // Déploiement du contrat
    console.log('2️⃣  Déploiement du contrat...');
    
    const contract = new web3.eth.Contract(CONTRACT_ABI);
    
    // Estimer le gas
    const deploy = contract.deploy({
      data: CONTRACT_BYTECODE.startsWith('0x') ? CONTRACT_BYTECODE : '0x' + CONTRACT_BYTECODE,
      arguments: []
    });
    
    const gasEstimate = await deploy.estimateGas({
      from: address
    });
    
    console.log(`   ⛽ Gas estimé: ${gasEstimate.toString()}`);
    
    // Déployer
    const deployedContract = await deploy.send({
      from: address,
      gas: gasEstimate + 50000n, // Ajouter un buffer
      gasPrice: await web3.eth.getGasPrice()
    });
    
    const contractAddress = deployedContract.options.address;
    console.log(`   ✅ Contrat déployé!`);
    console.log(`   📍 Adresse: ${contractAddress}`);
    
    // Obtenir les détails de la transaction
    // Dans Web3.js v4, le hash est dans deployedContract._deployData.transactionHash
    // ou on peut l'obtenir depuis les events
    let txHash = null;
    let receipt = null;
    
    try {
      // Essayer de récupérer depuis l'objet deployedContract
      if (deployedContract._deployData && deployedContract._deployData.transactionHash) {
        txHash = deployedContract._deployData.transactionHash;
      } else if (deployedContract.transactionHash) {
        txHash = deployedContract.transactionHash;
      }
      
      if (txHash) {
        receipt = await web3.eth.getTransactionReceipt(txHash);
      }
    } catch (err) {
      // Si on ne peut pas récupérer le receipt, ce n'est pas bloquant
      console.warn('   ⚠️  Impossible de récupérer les détails de la transaction');
    }
    
    if (receipt && txHash) {
      console.log(`   🔗 Transaction: ${txHash}`);
      console.log(`   📦 Block: ${receipt.blockNumber}`);
      console.log(`   ⛽ Gas utilisé: ${receipt.gasUsed.toString()}`);
    } else if (txHash) {
      console.log(`   🔗 Transaction: ${txHash}`);
      console.log(`   ⚠️  Détails de la transaction en cours de traitement...`);
    }
    
    console.log('');
    
    // Test du contrat
    console.log('3️⃣  Test du contrat...');
    const contractInstance = new web3.eth.Contract(CONTRACT_ABI, contractAddress);
    
    const count = await contractInstance.methods.getTournamentCount().call();
    console.log(`   ✅ getTournamentCount() = ${count}`);
    
    const ids = await contractInstance.methods.getAllTournamentIds().call();
    console.log(`   ✅ getAllTournamentIds() = [${ids.join(', ')}]`);
    
    console.log('');
    
    // Résumé
    console.log('='.repeat(60));
    console.log('✨ DÉPLOIEMENT RÉUSSI');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Informations importantes:');
    console.log(`   Adresse du contrat: ${contractAddress}`);
    if (receipt) {
      console.log(`   Transaction hash: ${receipt.transactionHash}`);
    }
    console.log(`   Réseau: Avalanche Fuji Testnet (Chain ID: 43113)`);
    console.log(`   Explorer: https://testnet.snowtrace.io/address/${contractAddress}`);
    console.log('');
    console.log('📝 Prochaines étapes:');
    console.log(`   1. Ajoutez dans .env: CONTRACT_ADDRESS=${contractAddress}`);
    console.log('   2. Redémarrez le serveur: make down && make up');
    console.log('   3. Testez l\'enregistrement d\'un tournoi');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR lors du déploiement:');
    console.error(error.message);
    console.error('');
    
    if (error.message.includes('insufficient funds')) {
      console.log('💡 Solution: Obtenez des AVAX de test: https://faucet.avax.network/');
    } else if (error.message.includes('bytecode')) {
      console.log('💡 Solution: Vérifiez que CONTRACT_BYTECODE est correct');
    } else if (error.message.includes('private key')) {
      console.log('💡 Solution: Vérifiez que BLOCKCHAIN_PRIVATE_KEY est correcte');
    }
    
    console.log('');
    process.exit(1);
  }
}

// Exécuter le déploiement
deployContract();

