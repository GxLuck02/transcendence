"""
Admin interface for Pong app
"""
from django.contrib import admin
from .models import Tournament, Match, GameRoom


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'status', 'winner', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'creator__username')
    readonly_fields = ('created_at', 'completed_at', 'blockchain_tx')


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'player1', 'player2', 'game_mode', 'winner', 'created_at')
    list_filter = ('game_mode', 'is_ai_opponent', 'created_at')
    search_fields = ('player1__username', 'player2__username')
    readonly_fields = ('created_at', 'completed_at')


@admin.register(GameRoom)
class GameRoomAdmin(admin.ModelAdmin):
    list_display = ('room_code', 'match', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('room_code',)
