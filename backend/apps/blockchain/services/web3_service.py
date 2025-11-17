"""
Web3 service for blockchain interactions
"""
import os
import json
from web3 import Web3
from web3.middleware import geth_poa_middleware
from solcx import compile_source, install_solc, set_solc_version
from django.conf import settings


class Web3Service:
    """
    Service to interact with Ethereum blockchain via Web3
    """

    def __init__(self):
        # Connect to Ganache
        self.w3 = Web3(Web3.HTTPProvider(os.environ.get('WEB3_PROVIDER_URI', 'http://ganache:8545')))

        # Add POA middleware for Ganache compatibility
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        # Default account (first account from Ganache)
        if self.w3.is_connected():
            accounts = self.w3.eth.accounts
            if accounts:
                self.default_account = accounts[0]
                self.w3.eth.default_account = self.default_account
            else:
                self.default_account = None
        else:
            self.default_account = None

    def is_connected(self):
        """Check if connected to blockchain"""
        return self.w3.is_connected()

    def get_block_number(self):
        """Get current block number"""
        return self.w3.eth.block_number

    def get_balance(self, address):
        """Get balance of an address in wei"""
        return self.w3.eth.get_balance(address)

    def compile_contract(self, contract_source_path):
        """
        Compile a Solidity contract

        Args:
            contract_source_path: Path to the .sol file

        Returns:
            tuple: (abi, bytecode)
        """
        try:
            # Install and set solc version
            try:
                install_solc('0.8.0')
                set_solc_version('0.8.0')
            except Exception:
                pass  # Already installed

            # Read contract source
            with open(contract_source_path, 'r') as file:
                contract_source = file.read()

            # Compile contract
            compiled_sol = compile_source(
                contract_source,
                output_values=['abi', 'bin']
            )

            # Get contract interface
            contract_id, contract_interface = compiled_sol.popitem()

            abi = contract_interface['abi']
            bytecode = contract_interface['bin']

            return abi, bytecode

        except Exception as e:
            raise Exception(f"Contract compilation failed: {str(e)}")

    def deploy_contract(self, abi, bytecode, *constructor_args):
        """
        Deploy a smart contract

        Args:
            abi: Contract ABI
            bytecode: Contract bytecode
            *constructor_args: Constructor arguments

        Returns:
            tuple: (contract_address, tx_hash, contract_instance)
        """
        if not self.is_connected():
            raise Exception("Not connected to blockchain")

        if not self.default_account:
            raise Exception("No default account available")

        # Create contract object
        Contract = self.w3.eth.contract(abi=abi, bytecode=bytecode)

        # Build deployment transaction
        tx = Contract.constructor(*constructor_args).build_transaction({
            'from': self.default_account,
            'nonce': self.w3.eth.get_transaction_count(self.default_account),
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price
        })

        # Send transaction
        tx_hash = self.w3.eth.send_transaction(tx)

        # Wait for transaction receipt
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        contract_address = tx_receipt.contractAddress

        # Create contract instance
        contract_instance = self.w3.eth.contract(
            address=contract_address,
            abi=abi
        )

        return contract_address, tx_hash.hex(), contract_instance

    def get_contract(self, address, abi):
        """
        Get a contract instance

        Args:
            address: Contract address
            abi: Contract ABI

        Returns:
            Contract instance
        """
        return self.w3.eth.contract(address=address, abi=abi)

    def call_contract_function(self, contract, function_name, *args):
        """
        Call a contract function (read-only)

        Args:
            contract: Contract instance
            function_name: Name of the function
            *args: Function arguments

        Returns:
            Function result
        """
        function = getattr(contract.functions, function_name)
        return function(*args).call()

    def send_contract_transaction(self, contract, function_name, *args):
        """
        Send a transaction to a contract function

        Args:
            contract: Contract instance
            function_name: Name of the function
            *args: Function arguments

        Returns:
            tuple: (tx_hash, tx_receipt)
        """
        if not self.default_account:
            raise Exception("No default account available")

        function = getattr(contract.functions, function_name)

        # Build transaction
        tx = function(*args).build_transaction({
            'from': self.default_account,
            'nonce': self.w3.eth.get_transaction_count(self.default_account),
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price
        })

        # Send transaction
        tx_hash = self.w3.eth.send_transaction(tx)

        # Wait for receipt
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return tx_hash.hex(), tx_receipt

    def get_transaction(self, tx_hash):
        """Get transaction details"""
        return self.w3.eth.get_transaction(tx_hash)

    def get_transaction_receipt(self, tx_hash):
        """Get transaction receipt"""
        return self.w3.eth.get_transaction_receipt(tx_hash)


# Singleton instance
_web3_service = None

def get_web3_service():
    """Get or create Web3Service singleton"""
    global _web3_service
    if _web3_service is None:
        _web3_service = Web3Service()
    return _web3_service
