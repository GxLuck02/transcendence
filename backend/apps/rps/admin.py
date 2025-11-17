"""
Admin interface for RPS app
"""
from django.contrib import admin
from .models import RPSMatch, RPSMatchmakingQueue


@admin.register(RPSMatch)
class RPSMatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'player1', 'player2', 'result', 'winner', 'created_at')
    list_filter = ('result', 'is_matchmaking', 'created_at')
    search_fields = ('player1__username', 'player2__username', 'room_code')
    readonly_fields = ('created_at', 'completed_at')


@admin.register(RPSMatchmakingQueue)
class RPSMatchmakingQueueAdmin(admin.ModelAdmin):
    list_display = ('user', 'joined_at')
    search_fields = ('user__username',)
