"""
Views for Users app
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import User, Friendship, BlockedUser
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    PasswordChangeSerializer,
    FriendshipSerializer,
    BlockedUserSerializer,
    UserStatsSerializer
)


class RegisterView(APIView):
    """
    User registration endpoint
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    User login endpoint (username/password)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Update online status
        user.is_online = True
        user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class LogoutView(APIView):
    """
    User logout endpoint
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Update online status
            request.user.is_online = False
            request.user.save()

            # Blacklist the refresh token
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """
    Get current authenticated user info
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class OAuth42InitView(APIView):
    """
    Initialize OAuth 42 authentication flow
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from django.conf import settings
        import urllib.parse

        # Build OAuth URL
        params = {
            'client_id': settings.OAUTH42_CLIENT_ID,
            'redirect_uri': settings.OAUTH42_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'public',
        }

        oauth_url = f"https://api.intra.42.fr/oauth/authorize?{urllib.parse.urlencode(params)}"

        return Response({
            'oauth_url': oauth_url
        })


class OAuth42CallbackView(APIView):
    """
    Handle OAuth 42 callback
    """
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.GET.get('code')

        if not code:
            return Response({
                'error': 'No authorization code provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # TODO: Exchange code for access token with 42 API
        # TODO: Get user info from 42 API
        # TODO: Create or update user
        # TODO: Generate JWT tokens

        return Response({
            'message': 'OAuth 42 callback - Implementation requires valid 42 credentials'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)


class UserProfileView(APIView):
    """
    Get current user's profile
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """Update current user's profile"""
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    """
    Get specific user details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)


class UserStatsView(APIView):
    """
    Get user statistics
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            user = get_object_or_404(User, pk=pk)
        else:
            user = request.user

        serializer = UserStatsSerializer(user)
        return Response(serializer.data)


class PasswordChangeView(APIView):
    """
    Change user password
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({
                'message': 'Password successfully changed'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FriendListView(APIView):
    """
    Get list of friends
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = Friendship.objects.filter(user=request.user)
        serializer = FriendshipSerializer(friendships, many=True)
        return Response(serializer.data)


class AddFriendView(APIView):
    """
    Add a friend
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            friend = get_object_or_404(User, pk=user_id)

            # Check if trying to add self
            if friend == request.user:
                return Response({
                    'error': 'Cannot add yourself as friend'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if already friends
            if Friendship.objects.filter(user=request.user, friend=friend).exists():
                return Response({
                    'error': 'Already friends'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if user is blocked
            if BlockedUser.objects.filter(blocker=request.user, blocked=friend).exists():
                return Response({
                    'error': 'Cannot add blocked user as friend'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create friendship (bidirectional)
            Friendship.objects.create(user=request.user, friend=friend)
            Friendship.objects.create(user=friend, friend=request.user)

            return Response({
                'message': f'Successfully added {friend.display_name} as friend'
            }, status=status.HTTP_201_CREATED)

        except IntegrityError:
            return Response({
                'error': 'Friendship already exists'
            }, status=status.HTTP_400_BAD_REQUEST)


class RemoveFriendView(APIView):
    """
    Remove a friend
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        friend = get_object_or_404(User, pk=user_id)

        # Delete bidirectional friendship
        deleted_count = Friendship.objects.filter(
            user=request.user,
            friend=friend
        ).delete()[0]

        Friendship.objects.filter(
            user=friend,
            friend=request.user
        ).delete()

        if deleted_count == 0:
            return Response({
                'error': 'Friendship does not exist'
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'message': f'Successfully removed {friend.display_name} from friends'
        })


class BlockUserView(APIView):
    """
    Block a user
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            blocked = get_object_or_404(User, pk=user_id)

            # Check if trying to block self
            if blocked == request.user:
                return Response({
                    'error': 'Cannot block yourself'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if already blocked
            if BlockedUser.objects.filter(blocker=request.user, blocked=blocked).exists():
                return Response({
                    'error': 'User already blocked'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Remove friendship if exists
            Friendship.objects.filter(user=request.user, friend=blocked).delete()
            Friendship.objects.filter(user=blocked, friend=request.user).delete()

            # Create block
            BlockedUser.objects.create(blocker=request.user, blocked=blocked)

            return Response({
                'message': f'Successfully blocked {blocked.display_name}'
            }, status=status.HTTP_201_CREATED)

        except IntegrityError:
            return Response({
                'error': 'User already blocked'
            }, status=status.HTTP_400_BAD_REQUEST)


class UnblockUserView(APIView):
    """
    Unblock a user
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        blocked = get_object_or_404(User, pk=user_id)

        deleted_count = BlockedUser.objects.filter(
            blocker=request.user,
            blocked=blocked
        ).delete()[0]

        if deleted_count == 0:
            return Response({
                'error': 'User is not blocked'
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'message': f'Successfully unblocked {blocked.display_name}'
        })


class BlockedUsersListView(APIView):
    """
    Get list of blocked users
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        blocked_users = BlockedUser.objects.filter(blocker=request.user)
        serializer = BlockedUserSerializer(blocked_users, many=True)
        return Response(serializer.data)
