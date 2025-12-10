# Blockchain Module

This module implements blockchain integration for storing tournament scores on Avalanche C-Chain using smart contracts.

## Features

- **TournamentScore Smart Contract**: Solidity smart contract for immutable tournament score storage
- **Web3 Integration**: Node.js service using web3.js for blockchain interaction
- **RESTful API**: Fastify endpoints for blockchain operations
- **Avalanche Support**: Integration with Avalanche Fuji testnet (C-Chain)

## Architecture

### Smart Contract (`contracts/TournamentScore.sol`)
- Stores tournament data (ID, name, winner, winner score, timestamp)
- Emits events for tournament storage
- Read-only functions to retrieve stored tournaments

### Web3 Integration (`src/routes/blockchain.js`)
- Web3.js for blockchain interactions
- Contract initialization and interaction
- Transaction management
- Automatic BigInt serialization handling

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blockchain/tournament/record/` | POST | Store tournament winner on blockchain |
| `/api/blockchain/tournament/:id/` | GET | Get tournament winner from blockchain |
| `/api/blockchain/history/` | GET | Get blockchain transaction history from database |

### Database

#### `blockchain_scores` table (SQLite)
- Stores blockchain transaction records
- Links tournament data with blockchain transactions
- Tracks transaction hash and block number

## Setup

### 1. Configure Avalanche Connection

Edit your `.env` file with Avalanche Fuji testnet configuration:

```bash
WEB3_PROVIDER_URI=https://api.avax-test.network/ext/bc/C/rpc
BLOCKCHAIN_PRIVATE_KEY=your_private_key_without_0x
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

**Important**:
- Get AVAX testnet tokens from the [Avalanche Fuji Faucet](https://faucet.avax.network/)
- Never commit your private key to version control
- The private key should be without the `0x` prefix (it will be added automatically)
- The contract address is the deployed TournamentScore contract address

**Network Details**:
- Network Name: Avalanche Fuji C-Chain
- RPC URL: https://api.avax-test.network/ext/bc/C/rpc
- Chain ID: 43113
- Currency Symbol: AVAX
- Block Explorer: https://testnet.snowtrace.io/

### 2. Deploy Smart Contract (One-time setup)

The contract should already be deployed. If you need to deploy a new version:

1. Ensure `solc` is installed:
   - Mac: `brew install solidity`
   - Linux: `apt-get install solc` or `yum install solidity`
2. Configure `BLOCKCHAIN_PRIVATE_KEY` in `.env`
3. Deploy the contract (manual process, see deployment documentation)
4. Add `CONTRACT_ADDRESS` to `.env`

## Usage

### Store Tournament on Blockchain

The tournament winner is automatically recorded on the blockchain when a tournament is completed. The frontend calls the API automatically.

**Manual API call**:
```bash
curl -X POST https://localhost:8443/api/blockchain/tournament/record/ \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tournament_id": 1234567890,
    "tournament_name": "Tournament #1234567890",
    "winner_username": "player1",
    "winner_score": 5
  }'
```

**Response**:
```json
{
  "success": true,
  "tx_hash": "0x...",
  "block_number": 12345678,
  "tournament_id": 1234567890,
  "winner_username": "player1",
  "winner_score": 5
}
```

### Retrieve Tournament from Blockchain

```bash
curl https://localhost:8443/api/blockchain/tournament/1234567890/ \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response**:
```json
{
  "tournament_id": 1234567890,
  "winner_username": "player1",
  "winner_score": 5
}
```

### Get Blockchain History

```bash
curl https://localhost:8443/api/blockchain/history/ \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response**:
```json
[
  {
    "id": 1,
    "tournament_id": 1234567890,
    "winner_username": "player1",
    "winner_score": 5,
    "tx_hash": "0x...",
    "block_number": 12345678,
    "created_at": "2025-12-10 17:00:00"
  }
]
```

## Development

### Contract Structure

The `TournamentScore.sol` contract includes:
- `storeTournament()`: Store tournament data on blockchain
- `getTournament()`: Retrieve full tournament data
- `getTournamentWinner()`: Get winner username and score
- `getTournamentCount()`: Get total number of tournaments
- `getAllTournamentIds()`: Get all tournament IDs

### Web3 Integration

The blockchain routes automatically:
- Initialize Web3 connection on server start
- Handle private key formatting (adds `0x` prefix if needed)
- Convert BigInt values to Numbers for JSON serialization
- Store transaction records in SQLite database

## Security Considerations

- Smart contracts are immutable after deployment
- All transactions are recorded on the blockchain
- Gas costs apply for write operations
- Contract address should be verified before use
- Use testnet for testing, mainnet for production
- Private keys are stored in `.env` file (never commit to version control)

## Troubleshooting

### Blockchain Service Not Configured

**Symptoms**: "503 Service Unavailable" or "Blockchain service not configured"

**Solutions**:
1. Verify `BLOCKCHAIN_PRIVATE_KEY` is set in `.env`
2. Verify `CONTRACT_ADDRESS` is set in `.env`
3. Check that the private key format is correct (without `0x` prefix)
4. Restart the server: `docker-compose restart api`

### Invalid Private Key Error

**Symptoms**: "InvalidPrivateKeyError: Invalid Private Key"

**Solutions**:
1. Ensure the private key doesn't have `0x` prefix in `.env` (it's added automatically)
2. Verify the private key is 64 hexadecimal characters
3. Check for any extra spaces or newlines in the `.env` file

### Transaction Failed

**Symptoms**: Transaction reverts or fails

**Solutions**:
1. Check contract function requirements
2. Verify gas limit is sufficient (currently set to 300,000)
3. Check account has sufficient AVAX balance for gas fees
4. Review contract error messages
5. Verify your private key is correctly configured
6. Check that the contract address is correct

### BigInt Serialization Error

**Symptoms**: "Do not know how to serialize a BigInt"

**Solutions**:
- This should be automatically handled by the code
- If you see this error, check that `block_number` is converted to Number before sending response

## Dependencies

- `web3@^4.16.0`: Ethereum blockchain interaction library
- `better-sqlite3@^11.0.0`: SQLite database for transaction history
- `solc`: Solidity compiler (for contract compilation, if needed)

## Future Enhancements

- [ ] Support for Avalanche Mainnet
- [ ] Gas price optimization for Avalanche
- [ ] Event listening and notifications
- [ ] Batch transaction processing
- [ ] Contract upgradeability patterns
- [ ] Integration with Core Wallet and MetaMask
- [ ] Support for Avalanche subnets
