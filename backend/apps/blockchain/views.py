"""
Views for Blockchain app
"""
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import BlockchainTransaction, SmartContract
from .services.web3_service import get_web3_service
from backend.apps.pong.models import Tournament


class BlockchainStatusView(APIView):
    """
    Get blockchain connection status
    """
    def get(self, request):
        try:
            web3_service = get_web3_service()

            if not web3_service.is_connected():
                return Response({
                    'connected': False,
                    'message': 'Not connected to blockchain'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            block_number = web3_service.get_block_number()
            default_account = web3_service.default_account

            return Response({
                'connected': True,
                'block_number': block_number,
                'default_account': default_account,
                'network': 'ganache'
            })

        except Exception as e:
            return Response({
                'connected': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TransactionListView(APIView):
    """
    List all blockchain transactions
    """
    def get(self, request):
        transactions = BlockchainTransaction.objects.all()[:50]  # Limit to 50

        data = [{
            'tx_hash': tx.tx_hash,
            'transaction_type': tx.transaction_type,
            'status': tx.status,
            'block_number': tx.block_number,
            'tournament_id': tx.tournament.id if tx.tournament else None,
            'tournament_name': tx.tournament.name if tx.tournament else None,
            'created_at': tx.created_at,
            'confirmed_at': tx.confirmed_at
        } for tx in transactions]

        return Response(data)


class TransactionDetailView(APIView):
    """
    Get transaction details
    """
    def get(self, request, tx_hash):
        try:
            transaction = BlockchainTransaction.objects.get(tx_hash=tx_hash)

            data = {
                'tx_hash': transaction.tx_hash,
                'transaction_type': transaction.transaction_type,
                'status': transaction.status,
                'block_number': transaction.block_number,
                'tournament_id': transaction.tournament.id if transaction.tournament else None,
                'tournament_name': transaction.tournament.name if transaction.tournament else None,
                'data': transaction.data,
                'gas_used': transaction.gas_used,
                'gas_price': transaction.gas_price,
                'created_at': transaction.created_at,
                'confirmed_at': transaction.confirmed_at
            }

            # Try to get blockchain data
            try:
                web3_service = get_web3_service()
                if web3_service.is_connected():
                    tx_receipt = web3_service.get_transaction_receipt(tx_hash)
                    data['blockchain_data'] = {
                        'block_hash': tx_receipt.blockHash.hex(),
                        'block_number': tx_receipt.blockNumber,
                        'gas_used': tx_receipt.gasUsed,
                        'status': tx_receipt.status
                    }
            except Exception:
                pass

            return Response(data)

        except BlockchainTransaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ContractListView(APIView):
    """
    List all deployed smart contracts
    """
    def get(self, request):
        contracts = SmartContract.objects.filter(is_active=True)

        data = [{
            'id': contract.id,
            'name': contract.name,
            'contract_type': contract.contract_type,
            'address': contract.address,
            'network': contract.network,
            'deployment_tx': contract.deployment_tx,
            'deployed_by': contract.deployed_by.username if contract.deployed_by else None,
            'created_at': contract.created_at
        } for contract in contracts]

        return Response(data)


class ContractDetailView(APIView):
    """
    Get contract details
    """
    def get(self, request, address):
        try:
            contract = SmartContract.objects.get(address=address)

            data = {
                'id': contract.id,
                'name': contract.name,
                'contract_type': contract.contract_type,
                'address': contract.address,
                'abi': contract.abi,
                'network': contract.network,
                'deployment_tx': contract.deployment_tx,
                'deployed_by': contract.deployed_by.username if contract.deployed_by else None,
                'is_active': contract.is_active,
                'created_at': contract.created_at
            }

            return Response(data)

        except SmartContract.DoesNotExist:
            return Response(
                {'error': 'Contract not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class StoreTournamentScoreView(APIView):
    """
    Store tournament score on blockchain
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, tournament_id):
        try:
            # Get tournament
            tournament = Tournament.objects.get(id=tournament_id)

            # Check if tournament is completed
            if tournament.status != 'completed':
                return Response(
                    {'error': 'Tournament must be completed before storing on blockchain'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if already stored
            if tournament.blockchain_tx:
                return Response(
                    {
                        'error': 'Tournament already stored on blockchain',
                        'tx_hash': tournament.blockchain_tx
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if winner exists
            if not tournament.winner:
                return Response(
                    {'error': 'Tournament must have a winner'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get Web3 service
            web3_service = get_web3_service()

            if not web3_service.is_connected():
                return Response(
                    {'error': 'Blockchain service unavailable'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Get the active TournamentScore contract
            try:
                smart_contract = SmartContract.objects.filter(
                    contract_type='tournament_score',
                    is_active=True
                ).latest('created_at')
            except SmartContract.DoesNotExist:
                return Response(
                    {'error': 'No TournamentScore contract deployed. Please deploy contract first.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Get contract instance
            contract = web3_service.get_contract(
                smart_contract.address,
                smart_contract.abi
            )

            # Send transaction to store tournament
            tx_hash, tx_receipt = web3_service.send_contract_transaction(
                contract,
                'storeTournament',
                tournament.id,
                tournament.name,
                tournament.winner.username
            )

            # Create blockchain transaction record
            blockchain_tx = BlockchainTransaction.objects.create(
                tx_hash=tx_hash,
                block_number=tx_receipt.blockNumber,
                transaction_type='tournament_score',
                status='confirmed',
                tournament=tournament,
                data={
                    'tournament_id': tournament.id,
                    'tournament_name': tournament.name,
                    'winner_username': tournament.winner.username,
                    'winner_id': tournament.winner.id
                },
                gas_used=tx_receipt.gasUsed,
                confirmed_at=timezone.now()
            )

            # Update tournament with blockchain tx hash
            tournament.blockchain_tx = tx_hash
            tournament.save()

            return Response({
                'success': True,
                'tx_hash': tx_hash,
                'block_number': tx_receipt.blockNumber,
                'gas_used': tx_receipt.gasUsed,
                'tournament_id': tournament.id,
                'message': 'Tournament score stored on blockchain successfully'
            }, status=status.HTTP_201_CREATED)

        except Tournament.DoesNotExist:
            return Response(
                {'error': 'Tournament not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to store on blockchain: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetTournamentFromBlockchainView(APIView):
    """
    Get tournament data from blockchain
    """
    def get(self, request, tournament_id):
        try:
            # Get Web3 service
            web3_service = get_web3_service()

            if not web3_service.is_connected():
                return Response(
                    {'error': 'Blockchain service unavailable'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Get the active TournamentScore contract
            try:
                smart_contract = SmartContract.objects.filter(
                    contract_type='tournament_score',
                    is_active=True
                ).latest('created_at')
            except SmartContract.DoesNotExist:
                return Response(
                    {'error': 'No TournamentScore contract deployed'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Get contract instance
            contract = web3_service.get_contract(
                smart_contract.address,
                smart_contract.abi
            )

            # Call contract function
            result = web3_service.call_contract_function(
                contract,
                'getTournament',
                int(tournament_id)
            )

            # Parse result
            data = {
                'tournament_id': result[0],
                'tournament_name': result[1],
                'winner_address': result[2],
                'winner_username': result[3],
                'timestamp': result[4],
                'contract_address': smart_contract.address
            }

            return Response(data)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve from blockchain: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
