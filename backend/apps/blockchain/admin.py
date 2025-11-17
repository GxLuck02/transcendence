"""
Admin interface for Blockchain app
"""
from django.contrib import admin
from .models import BlockchainTransaction, SmartContract


@admin.register(BlockchainTransaction)
class BlockchainTransactionAdmin(admin.ModelAdmin):
    list_display = ('tx_hash_short', 'transaction_type', 'status', 'tournament', 'created_at')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('tx_hash', 'tournament__name')
    readonly_fields = ('created_at', 'confirmed_at')

    def tx_hash_short(self, obj):
        return f"{obj.tx_hash[:10]}...{obj.tx_hash[-8:]}"
    tx_hash_short.short_description = 'TX Hash'


@admin.register(SmartContract)
class SmartContractAdmin(admin.ModelAdmin):
    list_display = ('name', 'contract_type', 'address_short', 'network', 'is_active', 'created_at')
    list_filter = ('contract_type', 'network', 'is_active', 'created_at')
    search_fields = ('name', 'address')
    readonly_fields = ('created_at',)

    def address_short(self, obj):
        return f"{obj.address[:10]}...{obj.address[-8:]}"
    address_short.short_description = 'Contract Address'
