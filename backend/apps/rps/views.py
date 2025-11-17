"""
Views for RPS (Rock-Paper-Scissors) app
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count

from .models import RPSMatch, RPSMatchmakingQueue
from .serializers import (
    RPSMatchSerializer,
    RPSMatchCreateSerializer,
    RPSChoiceSerializer,
    RPSMatchResultSerializer,
    RPSMatchmakingQueueSerializer,
    RPSHistorySerializer,
    RPSStatsSerializer
)
from backend.apps.users.models import User


class JoinMatchmakingView(APIView):
    """
    Join RPS matchmaking queue
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if user is already in queue
        if RPSMatchmakingQueue.objects.filter(user=request.user).exists():
            return Response({
                'error': 'Already in matchmaking queue'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user has an active match
        active_match = RPSMatch.objects.filter(
            Q(player1=request.user) | Q(player2=request.user),
            result='pending'
        ).first()

        if active_match:
            return Response({
                'error': 'You already have an active match',
                'match_id': active_match.id
            }, status=status.HTTP_400_BAD_REQUEST)

        # Try to match with someone already in queue
        waiting_user = RPSMatchmakingQueue.objects.exclude(
            user=request.user
        ).first()

        if waiting_user:
            # Create match
            match = RPSMatch.objects.create(
                player1=waiting_user.user,
                player2=request.user,
                is_matchmaking=True
            )

            # Remove both users from queue
            waiting_user.delete()

            return Response({
                'message': 'Match found!',
                'match': RPSMatchSerializer(match).data
            }, status=status.HTTP_201_CREATED)
        else:
            # Add to queue
            queue_entry = RPSMatchmakingQueue.objects.create(user=request.user)

            return Response({
                'message': 'Waiting for opponent...',
                'queue': RPSMatchmakingQueueSerializer(queue_entry).data
            })


class LeaveMatchmakingView(APIView):
    """
    Leave RPS matchmaking queue
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        deleted_count = RPSMatchmakingQueue.objects.filter(
            user=request.user
        ).delete()[0]

        if deleted_count == 0:
            return Response({
                'error': 'Not in matchmaking queue'
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'message': 'Left matchmaking queue'
        })


class MatchmakingStatusView(APIView):
    """
    Get matchmaking status for current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queue_entry = RPSMatchmakingQueue.objects.filter(
            user=request.user
        ).first()

        if queue_entry:
            return Response({
                'in_queue': True,
                'queue': RPSMatchmakingQueueSerializer(queue_entry).data,
                'players_in_queue': RPSMatchmakingQueue.objects.count()
            })

        return Response({
            'in_queue': False,
            'players_in_queue': RPSMatchmakingQueue.objects.count()
        })


class RPSMatchListView(APIView):
    """
    List RPS matches
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all user's matches
        matches = RPSMatch.objects.filter(
            Q(player1=request.user) | Q(player2=request.user)
        ).order_by('-created_at')

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter == 'pending':
            matches = matches.filter(result='pending')
        elif status_filter == 'completed':
            matches = matches.exclude(result='pending')

        serializer = RPSMatchSerializer(matches, many=True)
        return Response(serializer.data)


class RPSMatchCreateView(APIView):
    """
    Create a direct RPS match (non-matchmaking)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RPSMatchCreateSerializer(data=request.data)
        if serializer.is_valid():
            player2_id = serializer.validated_data.get('player2_id')

            if player2_id:
                player2 = get_object_or_404(User, pk=player2_id)

                # Check if trying to play against self
                if player2 == request.user:
                    return Response({
                        'error': 'Cannot play against yourself'
                    }, status=status.HTTP_400_BAD_REQUEST)

                match = RPSMatch.objects.create(
                    player1=request.user,
                    player2=player2,
                    is_matchmaking=False
                )
            else:
                # Create match without player 2 (waiting)
                match = RPSMatch.objects.create(
                    player1=request.user,
                    is_matchmaking=serializer.validated_data.get('is_matchmaking', True)
                )

            return Response(
                RPSMatchSerializer(match).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RPSMatchDetailView(APIView):
    """
    Get RPS match details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        match = get_object_or_404(RPSMatch, pk=pk)

        # Check if user is participant
        if match.player1 != request.user and match.player2 != request.user:
            return Response({
                'error': 'Not a participant in this match'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = RPSMatchSerializer(match)
        return Response(serializer.data)


class PlayMoveView(APIView):
    """
    Play a move (rock/paper/scissors) in an RPS match
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        match = get_object_or_404(RPSMatch, pk=pk)

        # Check if user is participant
        if match.player1 != request.user and match.player2 != request.user:
            return Response({
                'error': 'Not a participant in this match'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if match is already completed
        if match.result != 'pending':
            return Response({
                'error': 'Match already completed',
                'result': RPSMatchResultSerializer(match).data
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate choice
        serializer = RPSChoiceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        choice = serializer.validated_data['choice']

        # Record choice
        if match.player1 == request.user:
            if match.choice_p1:
                return Response({
                    'error': 'You have already made your choice'
                }, status=status.HTTP_400_BAD_REQUEST)
            match.choice_p1 = choice
        else:
            if match.choice_p2:
                return Response({
                    'error': 'You have already made your choice'
                }, status=status.HTTP_400_BAD_REQUEST)
            match.choice_p2 = choice

        match.save()

        # Check if both players have chosen
        if match.choice_p1 and match.choice_p2:
            # Determine winner
            match.determine_winner()

            return Response({
                'message': 'Match completed!',
                'result': RPSMatchResultSerializer(match).data
            })

        return Response({
            'message': 'Choice recorded. Waiting for opponent...',
            'match': RPSMatchSerializer(match).data
        })


class MatchHistoryView(APIView):
    """
    Get RPS match history for current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get completed matches
        matches = RPSMatch.objects.filter(
            Q(player1=request.user) | Q(player2=request.user)
        ).exclude(result='pending').order_by('-completed_at')

        # Limit results
        limit = request.query_params.get('limit', 20)
        matches = matches[:int(limit)]

        serializer = RPSHistorySerializer(
            matches,
            many=True,
            context={'user': request.user}
        )
        return Response(serializer.data)


class RPSStatsView(APIView):
    """
    Get RPS statistics for a user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            user = get_object_or_404(User, pk=pk)
        else:
            user = request.user

        # Get match statistics
        matches = RPSMatch.objects.filter(
            Q(player1=user) | Q(player2=user)
        ).exclude(result='pending')

        total_matches = matches.count()
        wins = matches.filter(winner=user).count()
        draws = matches.filter(result='draw').count()
        losses = total_matches - wins - draws

        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0

        # Get choice distribution
        p1_choices = RPSMatch.objects.filter(player1=user).values('choice_p1')
        p2_choices = RPSMatch.objects.filter(player2=user).values('choice_p2')

        choice_counts = {'rock': 0, 'paper': 0, 'scissors': 0}

        for choice in p1_choices:
            if choice['choice_p1']:
                choice_counts[choice['choice_p1']] = choice_counts.get(choice['choice_p1'], 0) + 1

        for choice in p2_choices:
            if choice['choice_p2']:
                choice_counts[choice['choice_p2']] = choice_counts.get(choice['choice_p2'], 0) + 1

        # Find favorite choice
        favorite_choice = max(choice_counts, key=choice_counts.get) if sum(choice_counts.values()) > 0 else None

        stats_data = {
            'total_matches': total_matches,
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'win_rate': round(win_rate, 2),
            'favorite_choice': favorite_choice,
            'choice_distribution': choice_counts
        }

        serializer = RPSStatsSerializer(stats_data)
        return Response(serializer.data)


class RPSLeaderboardView(APIView):
    """
    Get RPS leaderboard
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get top players by RPS wins
        top_players = User.objects.filter(
            rps_wins__gt=0
        ).order_by('-rps_wins')[:10]

        from backend.apps.users.serializers import UserStatsSerializer
        serializer = UserStatsSerializer(top_players, many=True)
        return Response(serializer.data)
