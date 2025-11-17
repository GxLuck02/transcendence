"""
Serializers for Pong app
"""
from rest_framework import serializers
from .models import Tournament, Match, GameRoom
from backend.apps.users.serializers import UserSerializer


class TournamentSerializer(serializers.ModelSerializer):
    """
    Serializer for Tournament model
    """
    creator = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    participants_count = serializers.SerializerMethodField()
    matches_count = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'creator', 'status', 'winner',
            'blockchain_tx', 'created_at', 'completed_at',
            'participants_count', 'matches_count'
        ]
        read_only_fields = ['creator', 'status', 'winner', 'blockchain_tx', 'completed_at']

    def get_participants_count(self, obj):
        """Count unique participants in tournament"""
        matches = obj.matches.all()
        participants = set()
        for match in matches:
            if match.player1:
                participants.add(match.player1.id)
            if match.player2:
                participants.add(match.player2.id)
            if match.player3:
                participants.add(match.player3.id)
            if match.player4:
                participants.add(match.player4.id)
        return len(participants)

    def get_matches_count(self, obj):
        """Count matches in tournament"""
        return obj.matches.count()


class TournamentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a tournament
    """
    class Meta:
        model = Tournament
        fields = ['name']


class MatchSerializer(serializers.ModelSerializer):
    """
    Serializer for Match model
    """
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    player3 = UserSerializer(read_only=True)
    player4 = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    is_completed = serializers.ReadOnlyField()
    tournament_name = serializers.CharField(
        source='tournament.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Match
        fields = [
            'id', 'tournament', 'tournament_name',
            'player1', 'player2', 'player3', 'player4',
            'score_p1', 'score_p2', 'score_p3', 'score_p4',
            'winner', 'game_mode', 'is_ai_opponent', 'ai_difficulty',
            'duration_seconds', 'created_at', 'completed_at',
            'is_completed'
        ]
        read_only_fields = [
            'player1', 'player2', 'player3', 'player4',
            'winner', 'completed_at'
        ]


class MatchCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a match
    """
    player2_id = serializers.IntegerField(required=False, allow_null=True)
    player3_id = serializers.IntegerField(required=False, allow_null=True)
    player4_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Match
        fields = [
            'game_mode', 'is_ai_opponent', 'ai_difficulty',
            'player2_id', 'player3_id', 'player4_id'
        ]

    def validate(self, attrs):
        """Validate match creation data"""
        game_mode = attrs.get('game_mode')
        is_ai = attrs.get('is_ai_opponent', False)

        # Validate AI mode
        if game_mode == 'vs_ai':
            if not is_ai:
                raise serializers.ValidationError({
                    "is_ai_opponent": "Must be True for vs_ai mode"
                })
            if not attrs.get('ai_difficulty'):
                raise serializers.ValidationError({
                    "ai_difficulty": "AI difficulty is required for vs_ai mode"
                })

        # Validate multiplayer mode
        if game_mode == '4p':
            if not all([
                attrs.get('player2_id'),
                attrs.get('player3_id'),
                attrs.get('player4_id')
            ]):
                raise serializers.ValidationError({
                    "game_mode": "4 players mode requires player2_id, player3_id, and player4_id"
                })

        return attrs


class MatchUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating match scores
    """
    class Meta:
        model = Match
        fields = ['score_p1', 'score_p2', 'score_p3', 'score_p4']

    def validate(self, attrs):
        """Ensure scores are valid"""
        for score in attrs.values():
            if score and score < 0:
                raise serializers.ValidationError("Scores must be non-negative")
        return attrs


class GameRoomSerializer(serializers.ModelSerializer):
    """
    Serializer for GameRoom model
    """
    match = MatchSerializer(read_only=True)

    class Meta:
        model = GameRoom
        fields = ['id', 'room_code', 'match', 'is_active', 'created_at']
        read_only_fields = ['room_code', 'created_at']


class MatchHistorySerializer(serializers.ModelSerializer):
    """
    Simplified serializer for match history
    """
    opponent = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()
    player_score = serializers.SerializerMethodField()
    opponent_score = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            'id', 'game_mode', 'opponent', 'result',
            'player_score', 'opponent_score',
            'created_at', 'duration_seconds'
        ]

    def get_opponent(self, obj):
        """Get opponent display name"""
        user = self.context.get('user')
        if not user:
            return None

        if obj.is_ai_opponent:
            return f"AI ({obj.ai_difficulty})"

        # Find opponent
        if obj.player1 == user and obj.player2:
            return obj.player2.display_name
        elif obj.player2 == user and obj.player1:
            return obj.player1.display_name
        elif obj.player3 == user:
            return "Multiplayer"
        elif obj.player4 == user:
            return "Multiplayer"

        return "Unknown"

    def get_result(self, obj):
        """Get match result (win/loss/draw)"""
        user = self.context.get('user')
        if not user or not obj.winner:
            return 'draw'

        return 'win' if obj.winner == user else 'loss'

    def get_player_score(self, obj):
        """Get user's score"""
        user = self.context.get('user')
        if not user:
            return 0

        if obj.player1 == user:
            return obj.score_p1
        elif obj.player2 == user:
            return obj.score_p2
        elif obj.player3 == user:
            return obj.score_p3 or 0
        elif obj.player4 == user:
            return obj.score_p4 or 0

        return 0

    def get_opponent_score(self, obj):
        """Get opponent's score"""
        user = self.context.get('user')
        if not user:
            return 0

        if obj.player1 == user and obj.player2:
            return obj.score_p2
        elif obj.player2 == user and obj.player1:
            return obj.score_p1

        # For multiplayer, return max opponent score
        scores = [s for s in [obj.score_p1, obj.score_p2, obj.score_p3, obj.score_p4] if s is not None]
        return max(scores) if scores else 0
