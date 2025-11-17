"""
Views for Pong app
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
import secrets
import string

from .models import Tournament, Match, GameRoom
from .serializers import (
    TournamentSerializer,
    TournamentCreateSerializer,
    MatchSerializer,
    MatchCreateSerializer,
    MatchUpdateSerializer,
    MatchHistorySerializer,
    GameRoomSerializer
)
from backend.apps.users.models import User


class TournamentListView(APIView):
    """
    List all tournaments
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tournaments = Tournament.objects.all()

        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            tournaments = tournaments.filter(status=status_filter)

        serializer = TournamentSerializer(tournaments, many=True)
        return Response(serializer.data)


class TournamentCreateView(APIView):
    """
    Create a new tournament
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TournamentCreateSerializer(data=request.data)
        if serializer.is_valid():
            tournament = serializer.save(creator=request.user)
            return Response(
                TournamentSerializer(tournament).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TournamentDetailView(APIView):
    """
    Get tournament details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        serializer = TournamentSerializer(tournament)
        return Response(serializer.data)

    def patch(self, request, pk):
        """Update tournament status"""
        tournament = get_object_or_404(Tournament, pk=pk)

        # Only creator can update tournament
        if tournament.creator != request.user:
            return Response({
                'error': 'Only tournament creator can update it'
            }, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status in ['active', 'completed']:
            tournament.status = new_status
            if new_status == 'completed':
                tournament.completed_at = timezone.now()
            tournament.save()

            return Response(TournamentSerializer(tournament).data)

        return Response({
            'error': 'Invalid status'
        }, status=status.HTTP_400_BAD_REQUEST)


class MatchListView(APIView):
    """
    List all matches
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        matches = Match.objects.all()

        # Filter by tournament if provided
        tournament_id = request.query_params.get('tournament')
        if tournament_id:
            matches = matches.filter(tournament_id=tournament_id)

        # Filter by user if provided
        user_id = request.query_params.get('user')
        if user_id:
            matches = matches.filter(
                Q(player1_id=user_id) |
                Q(player2_id=user_id) |
                Q(player3_id=user_id) |
                Q(player4_id=user_id)
            )

        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)


class MatchCreateView(APIView):
    """
    Create a new match
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MatchCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Create match
            match_data = {
                'player1': request.user,
                'game_mode': serializer.validated_data['game_mode'],
                'is_ai_opponent': serializer.validated_data.get('is_ai_opponent', False),
            }

            # Add AI difficulty if needed
            if match_data['is_ai_opponent']:
                match_data['ai_difficulty'] = serializer.validated_data.get('ai_difficulty')

            # Add other players if provided
            if serializer.validated_data.get('player2_id'):
                match_data['player2'] = get_object_or_404(
                    User,
                    pk=serializer.validated_data['player2_id']
                )

            if serializer.validated_data.get('player3_id'):
                match_data['player3'] = get_object_or_404(
                    User,
                    pk=serializer.validated_data['player3_id']
                )

            if serializer.validated_data.get('player4_id'):
                match_data['player4'] = get_object_or_404(
                    User,
                    pk=serializer.validated_data['player4_id']
                )

            match = Match.objects.create(**match_data)

            # Create game room
            room_code = _generate_room_code()
            GameRoom.objects.create(room_code=room_code, match=match)

            return Response(
                MatchSerializer(match).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MatchDetailView(APIView):
    """
    Get match details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        serializer = MatchSerializer(match)
        return Response(serializer.data)

    def patch(self, request, pk):
        """Update match scores"""
        match = get_object_or_404(Match, pk=pk)

        # Check if match is already completed
        if match.is_completed:
            return Response({
                'error': 'Cannot update completed match'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = MatchUpdateSerializer(match, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(MatchSerializer(match).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MatchCompleteView(APIView):
    """
    Complete a match and determine winner
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        match = get_object_or_404(Match, pk=pk)

        if match.is_completed:
            return Response({
                'error': 'Match already completed'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Determine winner based on scores
        scores = [
            (match.player1, match.score_p1),
            (match.player2, match.score_p2) if match.player2 else (None, 0),
            (match.player3, match.score_p3) if match.player3 else (None, 0),
            (match.player4, match.score_p4) if match.player4 else (None, 0),
        ]

        # Get player with highest score
        winner_player, max_score = max(
            [(p, s) for p, s in scores if p is not None],
            key=lambda x: x[1]
        )

        match.winner = winner_player
        match.completed_at = timezone.now()
        match.save()

        # Update player stats
        for player, score in scores:
            if player and not match.is_ai_opponent:
                won = (player == winner_player)
                player.update_stats('pong', won)

        # Close game room
        try:
            room = match.room
            room.is_active = False
            room.save()
        except GameRoom.DoesNotExist:
            pass

        return Response(MatchSerializer(match).data)


class MatchHistoryView(APIView):
    """
    Get match history for current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all matches where user participated
        matches = Match.objects.filter(
            Q(player1=request.user) |
            Q(player2=request.user) |
            Q(player3=request.user) |
            Q(player4=request.user)
        ).filter(completed_at__isnull=False).order_by('-completed_at')

        # Limit to recent matches
        limit = request.query_params.get('limit', 20)
        matches = matches[:int(limit)]

        serializer = MatchHistorySerializer(
            matches,
            many=True,
            context={'user': request.user}
        )
        return Response(serializer.data)


class GameRoomCreateView(APIView):
    """
    Create a game room for a match
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        match_id = request.data.get('match_id')
        if not match_id:
            return Response({
                'error': 'match_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        match = get_object_or_404(Match, pk=match_id)

        # Check if room already exists
        try:
            room = match.room
            return Response(GameRoomSerializer(room).data)
        except GameRoom.DoesNotExist:
            pass

        # Create new room
        room_code = _generate_room_code()
        room = GameRoom.objects.create(room_code=room_code, match=match)

        return Response(
            GameRoomSerializer(room).data,
            status=status.HTTP_201_CREATED
        )


class GameRoomDetailView(APIView):
    """
    Get game room details by room code
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        room = get_object_or_404(GameRoom, room_code=room_code)
        serializer = GameRoomSerializer(room)
        return Response(serializer.data)


class LeaderboardView(APIView):
    """
    Get Pong leaderboard
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get top players by pong wins
        top_players = User.objects.filter(
            pong_wins__gt=0
        ).order_by('-pong_wins')[:10]

        from backend.apps.users.serializers import UserStatsSerializer
        serializer = UserStatsSerializer(top_players, many=True)
        return Response(serializer.data)


def _generate_room_code(length=8):
    """Generate a random room code"""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class PongMatchmakingJoinView(APIView):
    """
    Join Pong matchmaking queue
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import PongMatchmakingQueue

        # Check if user is already in queue
        existing_queue = PongMatchmakingQueue.objects.filter(
            user=request.user,
            is_active=True,
            match__isnull=True
        ).first()

        if existing_queue:
            # Already in queue, check for match
            if existing_queue.match:
                # Match found
                match = existing_queue.match
                room = match.room
                return Response({
                    'status': 'matched',
                    'match_id': match.id,
                    'room_code': room.room_code
                }, status=status.HTTP_200_OK)
            else:
                # Still waiting
                return Response({
                    'status': 'waiting',
                    'queue_id': existing_queue.id,
                    'position': self._get_queue_position(existing_queue)
                }, status=status.HTTP_200_OK)

        # Try to find a match with another waiting player
        waiting_player = PongMatchmakingQueue.objects.filter(
            is_active=True,
            match__isnull=True
        ).exclude(user=request.user).first()

        if waiting_player:
            # Match found! Create a match
            match = Match.objects.create(
                player1=waiting_player.user,
                player2=request.user,
                game_mode='2p_remote'
            )

            # Create game room
            room_code = _generate_room_code()
            room = GameRoom.objects.create(room_code=room_code, match=match)

            # Update queue entries
            waiting_player.match = match
            waiting_player.is_active = False
            waiting_player.save()

            # Create queue entry for current user
            queue_entry = PongMatchmakingQueue.objects.create(
                user=request.user,
                match=match,
                is_active=False
            )

            return Response({
                'status': 'matched',
                'match_id': match.id,
                'room_code': room.room_code,
                'opponent': {
                    'username': waiting_player.user.username,
                    'display_name': waiting_player.user.display_name
                }
            }, status=status.HTTP_201_CREATED)

        else:
            # No match found, join queue
            queue_entry = PongMatchmakingQueue.objects.create(
                user=request.user
            )

            return Response({
                'status': 'waiting',
                'queue_id': queue_entry.id,
                'position': self._get_queue_position(queue_entry)
            }, status=status.HTTP_201_CREATED)

    def _get_queue_position(self, queue_entry):
        """Get position in queue"""
        earlier_entries = PongMatchmakingQueue.objects.filter(
            is_active=True,
            match__isnull=True,
            joined_at__lt=queue_entry.joined_at
        ).count()
        return earlier_entries + 1


class PongMatchmakingLeaveView(APIView):
    """
    Leave Pong matchmaking queue
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import PongMatchmakingQueue

        # Find active queue entry
        queue_entry = PongMatchmakingQueue.objects.filter(
            user=request.user,
            is_active=True,
            match__isnull=True
        ).first()

        if not queue_entry:
            return Response({
                'error': 'Not in queue'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Remove from queue
        queue_entry.delete()

        return Response({
            'message': 'Left matchmaking queue'
        }, status=status.HTTP_200_OK)


class PongMatchmakingStatusView(APIView):
    """
    Check matchmaking status
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import PongMatchmakingQueue

        # Find queue entry
        queue_entry = PongMatchmakingQueue.objects.filter(
            user=request.user,
            is_active=True
        ).first()

        if not queue_entry:
            return Response({
                'status': 'not_in_queue'
            }, status=status.HTTP_200_OK)

        if queue_entry.match:
            # Match found
            match = queue_entry.match
            room = match.room
            opponent = match.player1 if match.player2 == request.user else match.player2

            return Response({
                'status': 'matched',
                'match_id': match.id,
                'room_code': room.room_code,
                'opponent': {
                    'username': opponent.username,
                    'display_name': opponent.display_name
                }
            }, status=status.HTTP_200_OK)
        else:
            # Still waiting
            position = PongMatchmakingQueue.objects.filter(
                is_active=True,
                match__isnull=True,
                joined_at__lt=queue_entry.joined_at
            ).count() + 1

            return Response({
                'status': 'waiting',
                'queue_id': queue_entry.id,
                'position': position
            }, status=status.HTTP_200_OK)
