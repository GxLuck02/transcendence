"""
Blockchain models for tournament score storage
"""
from django.db import models
from django.conf import settings


class BlockchainTransaction(models.Model):
    """
    Record of blockchain transactions for tournament scores
    """
    TRANSACTION_TYPE_CHOICES = [
        ('tournament_score', 'Tournament Score'),
        ('contract_deploy', 'Contract Deployment'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
    ]

    # Transaction info
    tx_hash = models.CharField(
        max_length=200,
        unique=True,
        help_text="Ethereum transaction hash"
    )
    block_number = models.IntegerField(null=True, blank=True)
    transaction_type = models.CharField(
        max_length=30,
        choices=TRANSACTION_TYPE_CHOICES,
        default='tournament_score'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    # Related tournament (if applicable)
    tournament = models.ForeignKey(
        'pong.Tournament',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='blockchain_txs'
    )

    # Transaction data (JSON)
    data = models.JSONField(
        null=True,
        blank=True,
        help_text="Transaction metadata"
    )

    # Gas info
    gas_used = models.IntegerField(null=True, blank=True)
    gas_price = models.CharField(max_length=100, null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tx_hash']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"TX {self.tx_hash[:10]}... ({self.status})"


class SmartContract(models.Model):
    """
    Deployed smart contracts on the blockchain
    """
    CONTRACT_TYPE_CHOICES = [
        ('tournament_score', 'Tournament Score Storage'),
    ]

    name = models.CharField(max_length=100)
    contract_type = models.CharField(
        max_length=30,
        choices=CONTRACT_TYPE_CHOICES
    )
    address = models.CharField(
        max_length=200,
        unique=True,
        help_text="Contract address on blockchain"
    )
    abi = models.JSONField(
        help_text="Contract ABI (Application Binary Interface)"
    )
    bytecode = models.TextField(
        null=True,
        blank=True,
        help_text="Contract bytecode"
    )

    # Deployment info
    deployed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    deployment_tx = models.CharField(max_length=200)
    network = models.CharField(
        max_length=50,
        default='avalanche_fuji',
        help_text="Blockchain network (avalanche_fuji, avalanche_mainnet)"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} at {self.address[:10]}..."
