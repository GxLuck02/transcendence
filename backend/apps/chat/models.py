"""
Chat models for live messaging
"""
from django.db import models
from django.conf import settings


class Message(models.Model):
    """
    Chat message (direct or group)
    """
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text Message'),
        ('game_invite', 'Game Invitation'),
        ('tournament_notify', 'Tournament Notification'),
        ('system', 'System Message'),
    ]

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
        null=True,
        blank=True,
        help_text="Null = group/global message"
    )

    content = models.TextField()
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        default='text'
    )

    # Game invitation metadata
    game_invite_type = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[('pong', 'Pong'), ('rps', 'RPS')]
    )
    game_room_code = models.CharField(
        max_length=20,
        null=True,
        blank=True
    )

    # Message status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['sender', 'recipient']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        if self.recipient:
            return f"{self.sender.display_name} -> {self.recipient.display_name}: {self.content[:50]}"
        return f"{self.sender.display_name} (broadcast): {self.content[:50]}"

    def mark_as_read(self):
        """Mark message as read"""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()


class ChatRoom(models.Model):
    """
    Chat room for group conversations
    """
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_rooms'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_rooms'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room: {self.name}"


class Notification(models.Model):
    """
    In-app notifications for users
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('friend_request', 'Friend Request'),
        ('game_invite', 'Game Invitation'),
        ('tournament_start', 'Tournament Starting'),
        ('tournament_next', 'Next Match'),
        ('achievement', 'Achievement Unlocked'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPE_CHOICES
    )
    title = models.CharField(max_length=100)
    content = models.TextField()

    # Action link (optional)
    action_url = models.CharField(max_length=200, null=True, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.display_name}: {self.title}"
