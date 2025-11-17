"""
Rock-Paper-Scissors game models
"""
from django.db import models
from django.conf import settings


class RPSMatch(models.Model):
    """
    Rock-Paper-Scissors match
    """
    CHOICE_OPTIONS = [
        ('rock', 'Rock'),
        ('paper', 'Paper'),
        ('scissors', 'Scissors'),
    ]

    RESULT_OPTIONS = [
        ('pending', 'Pending'),
        ('player1_win', 'Player 1 Wins'),
        ('player2_win', 'Player 2 Wins'),
        ('draw', 'Draw'),
    ]

    # Players
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rps_matches_as_p1'
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rps_matches_as_p2',
        null=True,
        blank=True
    )

    # Choices
    choice_p1 = models.CharField(
        max_length=10,
        choices=CHOICE_OPTIONS,
        null=True,
        blank=True
    )
    choice_p2 = models.CharField(
        max_length=10,
        choices=CHOICE_OPTIONS,
        null=True,
        blank=True
    )

    # Result
    result = models.CharField(
        max_length=20,
        choices=RESULT_OPTIONS,
        default='pending'
    )
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rps_won_matches'
    )

    # Matchmaking
    is_matchmaking = models.BooleanField(default=True)
    room_code = models.CharField(max_length=20, null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'RPS Match'
        verbose_name_plural = 'RPS Matches'

    def __str__(self):
        p2_name = self.player2.display_name if self.player2 else 'Waiting...'
        return f"RPS: {self.player1.display_name} vs {p2_name}"

    def determine_winner(self):
        """
        Determine the winner based on choices
        """
        if not self.choice_p1 or not self.choice_p2:
            self.result = 'pending'
            return

        if self.choice_p1 == self.choice_p2:
            self.result = 'draw'
            self.winner = None
        elif (
            (self.choice_p1 == 'rock' and self.choice_p2 == 'scissors') or
            (self.choice_p1 == 'paper' and self.choice_p2 == 'rock') or
            (self.choice_p1 == 'scissors' and self.choice_p2 == 'paper')
        ):
            self.result = 'player1_win'
            self.winner = self.player1
        else:
            self.result = 'player2_win'
            self.winner = self.player2

        # Complete the match
        from django.utils import timezone
        self.completed_at = timezone.now()
        self.save()

        # Update player stats
        if self.winner:
            self.winner.update_stats('rps', True)
            loser = self.player2 if self.winner == self.player1 else self.player1
            loser.update_stats('rps', False)

        return self.result


class RPSMatchmakingQueue(models.Model):
    """
    Queue for RPS matchmaking
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rps_queue'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.display_name} in queue"
