"""
Views for Chat app
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Message, ChatRoom, Notification
from .serializers import (
    MessageSerializer,
    MessageCreateSerializer,
    ChatRoomSerializer,
    ChatRoomCreateSerializer,
    NotificationSerializer,
    NotificationCreateSerializer
)
from backend.apps.users.models import User, BlockedUser


class MessageListView(APIView):
    """
    Get list of messages for current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get conversation with specific user
        other_user_id = request.query_params.get('user')

        if other_user_id:
            # Get direct messages between users
            messages = Message.objects.filter(
                Q(sender=request.user, recipient_id=other_user_id) |
                Q(sender_id=other_user_id, recipient=request.user)
            ).order_by('timestamp')
        else:
            # Get all messages for user (received)
            messages = Message.objects.filter(
                recipient=request.user
            ).order_by('-timestamp')

        # Limit results
        limit = request.query_params.get('limit', 50)
        messages = messages[:int(limit)]

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class SendMessageView(APIView):
    """
    Send a message
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MessageCreateSerializer(data=request.data)
        if serializer.is_valid():
            recipient_id = serializer.validated_data.get('recipient_id')

            # Check if recipient is blocked
            if recipient_id:
                recipient = get_object_or_404(User, pk=recipient_id)

                # Check if user is blocked by recipient
                if BlockedUser.objects.filter(
                    blocker=recipient,
                    blocked=request.user
                ).exists():
                    return Response({
                        'error': 'You are blocked by this user'
                    }, status=status.HTTP_403_FORBIDDEN)

                # Check if user has blocked recipient
                if BlockedUser.objects.filter(
                    blocker=request.user,
                    blocked=recipient
                ).exists():
                    return Response({
                        'error': 'You have blocked this user'
                    }, status=status.HTTP_403_FORBIDDEN)

            # Create message
            message = Message.objects.create(
                sender=request.user,
                recipient_id=recipient_id,
                content=serializer.validated_data['content'],
                message_type=serializer.validated_data.get('message_type', 'text'),
                game_invite_type=serializer.validated_data.get('game_invite_type'),
                game_room_code=serializer.validated_data.get('game_room_code')
            )

            return Response(
                MessageSerializer(message).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarkMessageReadView(APIView):
    """
    Mark message as read
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        message = get_object_or_404(Message, pk=pk)

        # Only recipient can mark as read
        if message.recipient != request.user:
            return Response({
                'error': 'Not authorized'
            }, status=status.HTTP_403_FORBIDDEN)

        message.mark_as_read()

        return Response(MessageSerializer(message).data)


class UnreadMessagesView(APIView):
    """
    Get count of unread messages
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = Message.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()

        return Response({
            'unread_count': unread_count
        })


class ConversationListView(APIView):
    """
    Get list of conversations (users with whom current user has exchanged messages)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all users with whom current user has exchanged messages
        sent_to = Message.objects.filter(
            sender=request.user
        ).values_list('recipient_id', flat=True).distinct()

        received_from = Message.objects.filter(
            recipient=request.user
        ).values_list('sender_id', flat=True).distinct()

        # Combine and get unique user IDs
        user_ids = set(list(sent_to) + list(received_from))
        user_ids.discard(None)  # Remove None values

        # Get user data with last message info
        conversations = []
        for user_id in user_ids:
            other_user = User.objects.get(pk=user_id)

            # Get last message
            last_message = Message.objects.filter(
                Q(sender=request.user, recipient=other_user) |
                Q(sender=other_user, recipient=request.user)
            ).order_by('-timestamp').first()

            # Get unread count
            unread_count = Message.objects.filter(
                sender=other_user,
                recipient=request.user,
                is_read=False
            ).count()

            from backend.apps.users.serializers import UserSerializer
            conversations.append({
                'user': UserSerializer(other_user).data,
                'last_message': MessageSerializer(last_message).data if last_message else None,
                'unread_count': unread_count
            })

        # Sort by last message timestamp
        conversations.sort(
            key=lambda x: x['last_message']['timestamp'] if x['last_message'] else '',
            reverse=True
        )

        return Response(conversations)


class ChatRoomListView(APIView):
    """
    Get list of chat rooms
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rooms = ChatRoom.objects.filter(
            members=request.user,
            is_active=True
        )
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)


class ChatRoomCreateView(APIView):
    """
    Create a chat room
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatRoomCreateSerializer(data=request.data)
        if serializer.is_valid():
            room = ChatRoom.objects.create(
                name=serializer.validated_data['name'],
                creator=request.user
            )

            # Add creator as member
            room.members.add(request.user)

            # Add other members
            member_ids = serializer.validated_data.get('member_ids', [])
            for member_id in member_ids:
                user = get_object_or_404(User, pk=member_id)
                room.members.add(user)

            return Response(
                ChatRoomSerializer(room).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatRoomDetailView(APIView):
    """
    Get chat room details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        room = get_object_or_404(ChatRoom, pk=pk)

        # Check if user is member
        if request.user not in room.members.all():
            return Response({
                'error': 'Not a member of this room'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ChatRoomSerializer(room)
        return Response(serializer.data)


class NotificationListView(APIView):
    """
    Get list of notifications for current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-created_at')

        # Filter by read status
        is_read = request.query_params.get('read')
        if is_read is not None:
            notifications = notifications.filter(is_read=is_read.lower() == 'true')

        # Limit results
        limit = request.query_params.get('limit', 20)
        notifications = notifications[:int(limit)]

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class NotificationCreateView(APIView):
    """
    Create a notification (admin/system use)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Get target user
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                'error': 'user_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, pk=user_id)

        serializer = NotificationCreateSerializer(data=request.data)
        if serializer.is_valid():
            notification = Notification.objects.create(
                user=user,
                **serializer.validated_data
            )

            return Response(
                NotificationSerializer(notification).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarkNotificationReadView(APIView):
    """
    Mark notification as read
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk)

        # Only owner can mark as read
        if notification.user != request.user:
            return Response({
                'error': 'Not authorized'
            }, status=status.HTTP_403_FORBIDDEN)

        notification.is_read = True
        notification.save()

        return Response(NotificationSerializer(notification).data)


class MarkAllNotificationsReadView(APIView):
    """
    Mark all notifications as read for current user
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)

        return Response({
            'message': f'Marked {count} notifications as read'
        })
