"""
Serializers for RPS (Rock-Paper-Scissors) app
"""
from rest_framework import serializers
from .models import RPSMatch, RPSMatchmakingQueue
from backend.apps.users.serializers import UserSerializer


class RPSMatchSerializer(serializers.ModelSerializer):
    """
    Serializer for RPSMatch model
    """
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)

    class Meta:
        model = RPSMatch
        fields = [
            'id', 'player1', 'player2', 'choice_p1', 'choice_p2',
            'result', 'winner', 'is_matchmaking', 'room_code',
            'created_at', 'completed_at'
        ]
        read_only_fields = [
            'player1', 'player2', 'result', 'winner',
            'created_at', 'completed_at'
        ]


class RPSMatchCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating RPS match
    """
    player2_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = RPSMatch
        fields = ['player2_id', 'is_matchmaking']

    def validate(self, attrs):
        """Validate match creation"""
        is_matchmaking = attrs.get('is_matchmaking', True)
        player2_id = attrs.get('player2_id')

        if not is_matchmaking and not player2_id:
            raise serializers.ValidationError({
                "player2_id": "Player 2 is required for direct matches"
            })

        if is_matchmaking and player2_id:
            raise serializers.ValidationError({
                "player2_id": "Cannot specify player2 for matchmaking matches"
            })

        return attrs


class RPSChoiceSerializer(serializers.Serializer):
    """
    Serializer for making a choice in RPS match
    """
    choice = serializers.ChoiceField(
        choices=['rock', 'paper', 'scissors'],
        required=True
    )

    def validate_choice(self, value):
        """Validate choice"""
        if value not in ['rock', 'paper', 'scissors']:
            raise serializers.ValidationError("Invalid choice. Must be rock, paper, or scissors.")
        return value


class RPSMatchResultSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for RPS match results
    """
    player1_name = serializers.CharField(source='player1.display_name', read_only=True)
    player2_name = serializers.CharField(source='player2.display_name', read_only=True)
    winner_name = serializers.CharField(source='winner.display_name', read_only=True, allow_null=True)

    class Meta:
        model = RPSMatch
        fields = [
            'id', 'player1_name', 'player2_name', 'choice_p1', 'choice_p2',
            'result', 'winner_name', 'created_at', 'completed_at'
        ]


class RPSMatchmakingQueueSerializer(serializers.ModelSerializer):
    """
    Serializer for RPSMatchmakingQueue model
    """
    user = UserSerializer(read_only=True)
    wait_time_seconds = serializers.SerializerMethodField()

    class Meta:
        model = RPSMatchmakingQueue
        fields = ['id', 'user', 'joined_at', 'wait_time_seconds']
        read_only_fields = ['joined_at']

    def get_wait_time_seconds(self, obj):
        """Calculate wait time in seconds"""
        from django.utils import timezone
        delta = timezone.now() - obj.joined_at
        return int(delta.total_seconds())


class RPSHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for RPS match history
    """
    opponent = serializers.SerializerMethodField()
    result_text = serializers.SerializerMethodField()
    my_choice = serializers.SerializerMethodField()
    opponent_choice = serializers.SerializerMethodField()

    class Meta:
        model = RPSMatch
        fields = [
            'id', 'opponent', 'my_choice', 'opponent_choice',
            'result_text', 'created_at'
        ]

    def get_opponent(self, obj):
        """Get opponent display name"""
        user = self.context.get('user')
        if not user:
            return None

        if obj.player1 == user and obj.player2:
            return obj.player2.display_name
        elif obj.player2 == user and obj.player1:
            return obj.player1.display_name

        return "Unknown"

    def get_result_text(self, obj):
        """Get result text for the user"""
        user = self.context.get('user')
        if not user:
            return 'unknown'

        if obj.result == 'draw':
            return 'draw'
        elif obj.winner == user:
            return 'win'
        else:
            return 'loss'

    def get_my_choice(self, obj):
        """Get user's choice"""
        user = self.context.get('user')
        if not user:
            return None

        if obj.player1 == user:
            return obj.choice_p1
        elif obj.player2 == user:
            return obj.choice_p2

        return None

    def get_opponent_choice(self, obj):
        """Get opponent's choice"""
        user = self.context.get('user')
        if not user:
            return None

        if obj.player1 == user:
            return obj.choice_p2
        elif obj.player2 == user:
            return obj.choice_p1

        return None


class RPSStatsSerializer(serializers.Serializer):
    """
    Serializer for RPS statistics
    """
    total_matches = serializers.IntegerField()
    wins = serializers.IntegerField()
    losses = serializers.IntegerField()
    draws = serializers.IntegerField()
    win_rate = serializers.FloatField()
    favorite_choice = serializers.CharField(allow_null=True)
    choice_distribution = serializers.DictField()
