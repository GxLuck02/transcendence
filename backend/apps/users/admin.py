"""
Admin interface for Users app
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Friendship, BlockedUser


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'display_name', 'email', 'is_online', 'wins', 'losses', 'win_rate')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'is_online')
    search_fields = ('username', 'display_name', 'email', 'oauth_id')
    ordering = ('-created_at',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('display_name', 'avatar', 'is_online')}),
        ('OAuth', {'fields': ('oauth_id', 'oauth_access_token')}),
        ('Statistics', {'fields': ('wins', 'losses', 'pong_wins', 'pong_losses', 'rps_wins', 'rps_losses')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'last_seen')}),
    )

    readonly_fields = ('created_at', 'updated_at', 'last_seen')


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ('user', 'friend', 'created_at')
    search_fields = ('user__username', 'friend__username')
    list_filter = ('created_at',)


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked', 'created_at')
    search_fields = ('blocker__username', 'blocked__username')
    list_filter = ('created_at',)
