"""
Pong game models
"""
from django.db import models
from django.conf import settings


class Tournament(models.Model):
    """
    Pong tournament
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    name = models.CharField(max_length=100)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tournaments'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='won_tournaments'
    )

    # Blockchain
    blockchain_tx = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Blockchain transaction hash for tournament scores"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Tournament: {self.name} ({self.status})"


class Match(models.Model):
    """
    Individual Pong match (can be part of a tournament or standalone)
    """
    GAME_MODE_CHOICES = [
        ('2p_local', '2 Players Local'),
        ('2p_remote', '2 Players Remote'),
        ('4p', '4 Players'),
        ('vs_ai', 'Vs AI'),
    ]

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='matches'
    )

    # Players (up to 4 for multiplayer mode)
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_as_p1'
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_as_p2',
        null=True,
        blank=True
    )
    player3 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_as_p3',
        null=True,
        blank=True
    )
    player4 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_as_p4',
        null=True,
        blank=True
    )

    # Scores
    score_p1 = models.IntegerField(default=0)
    score_p2 = models.IntegerField(default=0)
    score_p3 = models.IntegerField(default=0, null=True, blank=True)
    score_p4 = models.IntegerField(default=0, null=True, blank=True)

    # Winner
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='won_matches'
    )

    # Game settings
    game_mode = models.CharField(
        max_length=20,
        choices=GAME_MODE_CHOICES,
        default='2p_local'
    )
    is_ai_opponent = models.BooleanField(default=False)
    ai_difficulty = models.CharField(
        max_length=20,
        choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')],
        null=True,
        blank=True
    )

    # Game duration
    duration_seconds = models.IntegerField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        players = f"{self.player1.display_name} vs {self.player2.display_name if self.player2 else 'AI'}"
        return f"Match: {players} ({self.game_mode})"

    @property
    def is_completed(self):
        return self.completed_at is not None


class GameRoom(models.Model):
    """
    Active game room for multiplayer matches
    """
    room_code = models.CharField(max_length=20, unique=True)
    match = models.OneToOneField(
        Match,
        on_delete=models.CASCADE,
        related_name='room'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room {self.room_code}"


class PongMatchmakingQueue(models.Model):
    """
    Matchmaking queue for remote Pong games
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pong_queue_entries'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    match = models.ForeignKey(
        Match,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queue_entries'
    )

    class Meta:
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} in Pong queue"
