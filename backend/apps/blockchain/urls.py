"""
URL routing for Blockchain app
"""
from django.urls import path
from . import views

app_name = 'blockchain'

urlpatterns = [
    # Status
    path('status/', views.BlockchainStatusView.as_view(), name='status'),

    # Transactions
    path('transactions/', views.TransactionListView.as_view(), name='transaction_list'),
    path('transactions/<str:tx_hash>/', views.TransactionDetailView.as_view(), name='transaction_detail'),

    # Smart contracts
    path('contracts/', views.ContractListView.as_view(), name='contract_list'),
    path('contracts/<str:address>/', views.ContractDetailView.as_view(), name='contract_detail'),

    # Tournament score storage
    path('tournaments/<int:tournament_id>/store/', views.StoreTournamentScoreView.as_view(), name='store_tournament'),
    path('tournaments/<int:tournament_id>/blockchain/', views.GetTournamentFromBlockchainView.as_view(), name='get_tournament'),
]
