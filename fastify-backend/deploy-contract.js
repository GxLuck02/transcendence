/**
 * Script de déploiement du contrat TournamentScore sur Avalanche Fuji testnet
 * 
 * Usage:
 *   node deploy-contract.js
 * 
 * Prérequis:
 *   - Avoir des AVAX de test dans votre compte
 *   - Avoir configuré BLOCKCHAIN_PRIVATE_KEY dans .env
 *   - Avoir solc installé (brew install solidity sur Mac, ou npm install -g solc)
 *   - Optionnel: CONTRACT_BYTECODE dans .env (sinon compilé automatiquement)
 */

import { Web3 } from 'web3';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WEB3_PROVIDER_URI = process.env.WEB3_PROVIDER_URI || 'https://api.avax-test.network/ext/bc/C/rpc';
const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const CONTRACT_PATH = join(__dirname, 'contracts', 'TournamentScore.sol');

/**
 * Compile l'ABI du contrat Solidity
 * @returns {Array} ABI du contrat
 */
function compileABI() {
  try {
    console.log('📦 Compilation de l\'ABI...');
    const output = execSync(`solc --abi "${CONTRACT_PATH}"`, { encoding: 'utf-8' });
    
    // Parser la sortie de solc pour extraire l'ABI JSON
    // L'ABI est généralement sur une seule ligne après "Contract JSON ABI"
    const lines = output.split('\n');
    
    // Chercher la ligne qui commence par [ (ABI JSON)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        try {
          const abi = JSON.parse(line);
          console.log(`   ✅ ABI compilé (${abi.length} éléments)`);
          return abi;
        } catch (e) {
          // Ce n'est pas du JSON valide, continuer
        }
      }
    }
    
    // Utiliser une regex pour trouver le JSON dans toute la sortie
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const abi = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ ABI compilé (${abi.length} éléments)`);
        return abi;
      } catch (e) {
        // JSON invalide
      }
    }
    
    throw new Error('Impossible de trouver l\'ABI dans la sortie de solc');
  } catch (error) {
    if (error.message.includes('solc: command not found') || error.message.includes('solc: No such file')) {
      console.error('❌ ERREUR: solc n\'est pas installé');
      console.log('');
      console.log('📝 Installation de solc:');
      console.log('   Sur Mac: brew install solidity');
      console.log('   Sur Linux: sudo apt-get install solc');
      console.log('   Ou via npm: npm install -g solc');
      console.log('');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Compile le bytecode du contrat Solidity
 * @returns {string} Bytecode du contrat (sans le préfixe 0x)
 */
function compileBytecode() {
  try {
    console.log('📦 Compilation du bytecode...');
    const output = execSync(`solc --bin "${CONTRACT_PATH}"`, { encoding: 'utf-8' });
    
    // Parser la sortie de solc pour extraire le bytecode
    // Le bytecode est sur la ligne après "Binary:"
    const lines = output.split('\n');
    let foundBinary = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Chercher la ligne "Binary:" qui précède le bytecode
      if (line === 'Binary:') {
        foundBinary = true;
        continue;
      }
      
      // Après "Binary:", la ligne suivante contient le bytecode
      if (foundBinary && line.length > 0) {
        // Le bytecode peut commencer par 0x ou directement par des hexadécimaux
        let bytecode = line;
        if (line.startsWith('0x')) {
          bytecode = line.substring(2); // Retirer le préfixe 0x
        }
        
        // Vérifier que c'est bien du bytecode (au moins 100 caractères hex)
        if (/^[0-9a-fA-F]+$/.test(bytecode) && bytecode.length >= 100) {
          console.log(`   ✅ Bytecode compilé (${bytecode.length} caractères)`);
          return bytecode;
        }
      }
    }
    
    throw new Error('Impossible de trouver le bytecode dans la sortie de solc');
  } catch (error) {
    if (error.message.includes('solc: command not found') || error.message.includes('solc: No such file')) {
      console.error('❌ ERREUR: solc n\'est pas installé');
      console.log('');
      console.log('📝 Installation de solc:');
      console.log('   Sur Mac: brew install solidity');
      console.log('   Sur Linux: sudo apt-get install solc');
      console.log('   Ou via npm: npm install -g solc');
      console.log('');
      process.exit(1);
    }
    throw error;
  }
}

// Variables pour l'ABI et le bytecode (seront compilés au démarrage)
let CONTRACT_ABI;
let CONTRACT_BYTECODE;

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

  // Compiler l'ABI et le bytecode automatiquement
  try {
    CONTRACT_ABI = compileABI();
    
    // Utiliser le bytecode depuis .env si fourni, sinon le compiler
    const bytecodeFromEnv = process.env.CONTRACT_BYTECODE || '';
    if (bytecodeFromEnv) {
      console.log('📦 Utilisation du bytecode depuis .env...');
      CONTRACT_BYTECODE = bytecodeFromEnv.startsWith('0x') 
        ? bytecodeFromEnv.substring(2) 
        : bytecodeFromEnv;
      console.log(`   ✅ Bytecode chargé (${CONTRACT_BYTECODE.length} caractères)`);
    } else {
      CONTRACT_BYTECODE = compileBytecode();
    }
    console.log('');
  } catch (error) {
    console.error('❌ ERREUR lors de la compilation:');
    console.error(error.message);
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
    } else if (error.message.includes('bytecode') || error.message.includes('compilation')) {
      console.log('💡 Solution: Vérifiez que solc est installé et que le contrat compile correctement');
    } else if (error.message.includes('private key')) {
      console.log('💡 Solution: Vérifiez que BLOCKCHAIN_PRIVATE_KEY est correcte');
    }
    
    console.log('');
    process.exit(1);
  }
}

// Exécuter le déploiement
deployContract();

