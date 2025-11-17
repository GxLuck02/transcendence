"""
URL routing for RPS app
"""
from django.urls import path
from . import views

app_name = 'rps'

urlpatterns = [
    # Matchmaking
    path('matchmaking/join/', views.JoinMatchmakingView.as_view(), name='join_matchmaking'),
    path('matchmaking/leave/', views.LeaveMatchmakingView.as_view(), name='leave_matchmaking'),
    path('matchmaking/status/', views.MatchmakingStatusView.as_view(), name='matchmaking_status'),

    # Matches
    path('matches/', views.RPSMatchListView.as_view(), name='match_list'),
    path('matches/create/', views.RPSMatchCreateView.as_view(), name='match_create'),
    path('matches/<int:pk>/', views.RPSMatchDetailView.as_view(), name='match_detail'),
    path('matches/<int:pk>/play/', views.PlayMoveView.as_view(), name='play_move'),
    path('matches/history/', views.MatchHistoryView.as_view(), name='match_history'),

    # History alias (for frontend compatibility)
    path('history/', views.MatchHistoryView.as_view(), name='history'),

    # Statistics & Leaderboard
    path('stats/', views.RPSStatsView.as_view(), name='my_stats'),
    path('stats/<int:pk>/', views.RPSStatsView.as_view(), name='user_stats'),
    path('leaderboard/', views.RPSLeaderboardView.as_view(), name='leaderboard'),
]
