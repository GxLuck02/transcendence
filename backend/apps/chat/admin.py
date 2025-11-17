"""
Admin interface for Chat app
"""
from django.contrib import admin
from .models import Message, ChatRoom, Notification


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'message_type', 'is_read', 'timestamp')
    list_filter = ('message_type', 'is_read', 'timestamp')
    search_fields = ('sender__username', 'recipient__username', 'content')
    readonly_fields = ('timestamp', 'read_at')


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'creator__username')
    filter_horizontal = ('members',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'content')
