"""
Management command to deploy TournamentScore smart contract
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from backend.apps.blockchain.services.web3_service import get_web3_service
from backend.apps.blockchain.models import SmartContract

User = get_user_model()


class Command(BaseCommand):
    help = 'Deploy TournamentScore smart contract to blockchain'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-username',
            type=str,
            default='admin',
            help='Username of admin user to set as deployer'
        )

    def handle(self, *args, **options):
        admin_username = options['admin_username']

        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("Deploying TournamentScore Smart Contract"))
        self.stdout.write("=" * 60)

        # Get Web3 service
        self.stdout.write("\n1. Connecting to blockchain...")
        try:
            web3_service = get_web3_service()

            if not web3_service.is_connected():
                self.stdout.write(self.style.ERROR("Failed to connect to blockchain"))
                self.stdout.write(self.style.WARNING("Make sure Ganache is running on http://ganache:8545"))
                return

            self.stdout.write(self.style.SUCCESS(f"Connected! Block number: {web3_service.get_block_number()}"))
            self.stdout.write(f"Default account: {web3_service.default_account}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Connection error: {str(e)}"))
            return

        # Compile contract
        self.stdout.write("\n2. Compiling smart contract...")
        try:
            contract_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                'contracts',
                'TournamentScore.sol'
            )

            if not os.path.exists(contract_path):
                self.stdout.write(self.style.ERROR(f"Contract file not found at: {contract_path}"))
                return

            abi, bytecode = web3_service.compile_contract(contract_path)
            self.stdout.write(self.style.SUCCESS("Contract compiled successfully!"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Compilation error: {str(e)}"))
            return

        # Deploy contract
        self.stdout.write("\n3. Deploying contract to blockchain...")
        try:
            contract_address, tx_hash, contract_instance = web3_service.deploy_contract(
                abi,
                bytecode
            )

            self.stdout.write(self.style.SUCCESS("Contract deployed successfully!"))
            self.stdout.write(f"Contract address: {contract_address}")
            self.stdout.write(f"Transaction hash: {tx_hash}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Deployment error: {str(e)}"))
            return

        # Save to database
        self.stdout.write("\n4. Saving contract to database...")
        try:
            # Get admin user
            try:
                admin_user = User.objects.get(username=admin_username)
            except User.DoesNotExist:
                admin_user = None
                self.stdout.write(self.style.WARNING(f"Admin user '{admin_username}' not found, deploying without user"))

            # Deactivate old contracts
            SmartContract.objects.filter(
                contract_type='tournament_score',
                is_active=True
            ).update(is_active=False)

            # Create new contract record
            smart_contract = SmartContract.objects.create(
                name='TournamentScore',
                contract_type='tournament_score',
                address=contract_address,
                abi=abi,
                bytecode=bytecode,
                deployed_by=admin_user,
                deployment_tx=tx_hash,
                network='ganache',
                is_active=True
            )

            self.stdout.write(self.style.SUCCESS(f"Contract saved to database with ID: {smart_contract.id}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Database error: {str(e)}"))
            return

        # Test contract
        self.stdout.write("\n5. Testing contract functions...")
        try:
            # Test getTournamentCount
            count = web3_service.call_contract_function(
                contract_instance,
                'getTournamentCount'
            )
            self.stdout.write(self.style.SUCCESS(f"getTournamentCount() = {count}"))

            # Test getAllTournamentIds
            ids = web3_service.call_contract_function(
                contract_instance,
                'getAllTournamentIds'
            )
            self.stdout.write(self.style.SUCCESS(f"getAllTournamentIds() = {ids}"))

        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Test error: {str(e)}"))

        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("DEPLOYMENT SUCCESSFUL"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"\nContract Address: {contract_address}")
        self.stdout.write(f"Transaction Hash: {tx_hash}")
        self.stdout.write(f"Network: ganache")
        self.stdout.write(f"\nYou can now store tournament scores on the blockchain!")
        self.stdout.write(f"API Endpoint: POST /api/blockchain/tournaments/<id>/store/\n")
