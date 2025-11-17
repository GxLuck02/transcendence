"""
User models for ft_transcendence
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    """
    # Display name for tournaments (can be different from username)
    display_name = models.CharField(
        max_length=50,
        unique=True,
        validators=[MinLengthValidator(3)],
        help_text="Unique display name for tournaments"
    )

    # Avatar
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text="User profile picture"
    )

    # OAuth 42 fields
    oauth_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        unique=True,
        help_text="42 OAuth user ID"
    )
    oauth_access_token = models.CharField(
        max_length=500,
        null=True,
        blank=True
    )

    # Stats
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    pong_wins = models.IntegerField(default=0)
    pong_losses = models.IntegerField(default=0)
    rps_wins = models.IntegerField(default=0)
    rps_losses = models.IntegerField(default=0)

    # Online status
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.display_name} ({self.username})"

    @property
    def win_rate(self):
        """Calculate win rate percentage"""
        total_games = self.wins + self.losses
        if total_games == 0:
            return 0
        return round((self.wins / total_games) * 100, 2)

    def update_stats(self, game_type, won):
        """Update user statistics after a game"""
        if won:
            self.wins += 1
            if game_type == 'pong':
                self.pong_wins += 1
            elif game_type == 'rps':
                self.rps_wins += 1
        else:
            self.losses += 1
            if game_type == 'pong':
                self.pong_losses += 1
            elif game_type == 'rps':
                self.rps_losses += 1
        self.save()


class Friendship(models.Model):
    """
    Friendship relationship between users
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friendships'
    )
    friend = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friend_of'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.display_name} -> {self.friend.display_name}"


class BlockedUser(models.Model):
    """
    Users that have been blocked by another user
    """
    blocker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocking'
    )
    blocked = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.blocker.display_name} blocked {self.blocked.display_name}"
