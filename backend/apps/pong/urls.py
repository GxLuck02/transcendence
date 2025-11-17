"""
URL routing for Pong app
"""
from django.urls import path
from . import views

app_name = 'pong'

urlpatterns = [
    # Tournaments
    path('tournaments/', views.TournamentListView.as_view(), name='tournament_list'),
    path('tournaments/create/', views.TournamentCreateView.as_view(), name='tournament_create'),
    path('tournaments/<int:pk>/', views.TournamentDetailView.as_view(), name='tournament_detail'),

    # Matches
    path('matches/', views.MatchListView.as_view(), name='match_list'),
    path('matches/create/', views.MatchCreateView.as_view(), name='match_create'),
    path('matches/<int:pk>/', views.MatchDetailView.as_view(), name='match_detail'),
    path('matches/<int:pk>/complete/', views.MatchCompleteView.as_view(), name='match_complete'),
    path('matches/history/', views.MatchHistoryView.as_view(), name='match_history'),

    # Game rooms
    path('rooms/create/', views.GameRoomCreateView.as_view(), name='room_create'),
    path('rooms/<str:room_code>/', views.GameRoomDetailView.as_view(), name='room_detail'),

    # Leaderboard
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),

    # Matchmaking
    path('matchmaking/join/', views.PongMatchmakingJoinView.as_view(), name='matchmaking_join'),
    path('matchmaking/leave/', views.PongMatchmakingLeaveView.as_view(), name='matchmaking_leave'),
    path('matchmaking/status/', views.PongMatchmakingStatusView.as_view(), name='matchmaking_status'),
]
