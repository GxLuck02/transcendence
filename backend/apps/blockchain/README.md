# Blockchain Module

This module implements blockchain integration for storing tournament scores on Ethereum using smart contracts.

## Features

- **TournamentScore Smart Contract**: Solidity smart contract for immutable tournament score storage
- **Web3 Integration**: Python service using web3.py for blockchain interaction
- **RESTful API**: Django REST Framework endpoints for blockchain operations
- **Ganache Support**: Local Ethereum blockchain for development

## Architecture

### Smart Contract (`contracts/TournamentScore.sol`)
- Stores tournament data (ID, name, winner, timestamp)
- Emits events for tournament storage
- Read-only functions to retrieve stored tournaments

### Web3 Service (`services/web3_service.py`)
- Singleton service for blockchain interactions
- Contract compilation using py-solc-x
- Contract deployment and interaction
- Transaction management

### API Endpoints (`views.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blockchain/status/` | GET | Check blockchain connection status |
| `/api/blockchain/transactions/` | GET | List all blockchain transactions |
| `/api/blockchain/transactions/<tx_hash>/` | GET | Get transaction details |
| `/api/blockchain/contracts/` | GET | List deployed smart contracts |
| `/api/blockchain/contracts/<address>/` | GET | Get contract details |
| `/api/blockchain/tournaments/<id>/store/` | POST | Store tournament on blockchain |
| `/api/blockchain/tournaments/<id>/blockchain/` | GET | Get tournament from blockchain |

### Database Models

#### `BlockchainTransaction`
- Stores blockchain transaction records
- Links to tournaments
- Tracks transaction status and gas usage

#### `SmartContract`
- Stores deployed contract information
- Contract ABI and bytecode
- Deployment metadata

## Setup

### 1. Start Ganache

Ganache is included in `docker-compose.yml`:

```bash
docker-compose up -d ganache
```

**Note for ARM users (M1/M2 Mac, ARM64 Linux)**: The official Ganache Docker image may not work on ARM architecture due to QEMU incompatibility. If Ganache crashes, you can:
- Use an alternative local blockchain (Hardhat Network, etc.)
- Deploy to a testnet (Sepolia, Goerli)
- Run on x86_64 architecture

### 2. Run Migrations

```bash
docker-compose exec web python manage.py migrate blockchain
```

### 3. Deploy Smart Contract

```bash
docker-compose exec web python manage.py deploy_tournament_contract
```

This will:
1. Connect to Ganache
2. Compile the TournamentScore smart contract
3. Deploy it to the blockchain
4. Save contract details to database
5. Run test functions

## Usage

### Check Blockchain Status

```bash
curl http://localhost:8000/api/blockchain/status/
```

### Store Tournament on Blockchain

```bash
curl -X POST http://localhost:8000/api/blockchain/tournaments/1/store/ \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json"
```

Requirements:
- Tournament must be completed
- Tournament must have a winner
- User must be authenticated

### Retrieve Tournament from Blockchain

```bash
curl http://localhost:8000/api/blockchain/tournaments/1/blockchain/
```

## Development

### Contract Compilation

The Web3 service automatically compiles Solidity contracts using `py-solc-x`:

```python
from backend.apps.blockchain.services.web3_service import get_web3_service

web3_service = get_web3_service()
abi, bytecode = web3_service.compile_contract('path/to/contract.sol')
```

### Contract Interaction

```python
# Get contract instance
contract = web3_service.get_contract(contract_address, contract_abi)

# Call read-only function
result = web3_service.call_contract_function(contract, 'getTournament', tournament_id)

# Send transaction
tx_hash, tx_receipt = web3_service.send_contract_transaction(
    contract,
    'storeTournament',
    tournament_id,
    tournament_name,
    winner_username
)
```

## Security Considerations

- Smart contracts are immutable after deployment
- All transactions are recorded on the blockchain
- Gas costs apply for write operations
- Contract addresses should be verified before use
- Use testnet for testing, mainnet for production

## Dependencies

- `web3==6.11.3`: Ethereum blockchain interaction
- `py-solc-x==2.0.2`: Solidity compiler
- `solc==0.8.0`: Solidity language version

## Troubleshooting

### Ganache Connection Failed

**Symptoms**: "Not connected to blockchain" error

**Solutions**:
1. Check Ganache container is running: `docker-compose ps ganache`
2. Check Ganache logs: `docker-compose logs ganache`
3. Restart Ganache: `docker-compose restart ganache`
4. Check `WEB3_PROVIDER_URI` environment variable

### Contract Compilation Failed

**Symptoms**: "Contract compilation failed" error

**Solutions**:
1. Check Solidity file syntax
2. Ensure py-solc-x is installed
3. Install solc compiler: `python -m solcx.install v0.8.0`

### Transaction Failed

**Symptoms**: Transaction reverts or fails

**Solutions**:
1. Check contract function requirements
2. Verify gas limit is sufficient
3. Check account has sufficient balance
4. Review contract error messages

## Future Enhancements

- [ ] Support for multiple blockchain networks
- [ ] Gas price optimization
- [ ] Event listening and notifications
- [ ] Batch transaction processing
- [ ] Contract upgradeability patterns
- [ ] Integration with external wallets (MetaMask)
