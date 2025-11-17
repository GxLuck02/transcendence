"""
Serializers for Chat app
"""
from rest_framework import serializers
from .models import Message, ChatRoom, Notification
from backend.apps.users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for Message model
    """
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'recipient', 'content', 'message_type',
            'game_invite_type', 'game_room_code', 'is_read',
            'read_at', 'timestamp'
        ]
        read_only_fields = ['sender', 'is_read', 'read_at', 'timestamp']


class MessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating messages
    """
    recipient_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Message
        fields = [
            'recipient_id', 'content', 'message_type',
            'game_invite_type', 'game_room_code'
        ]

    def validate(self, attrs):
        """Validate message creation"""
        message_type = attrs.get('message_type')

        # Game invite validation
        if message_type == 'game_invite':
            if not attrs.get('game_invite_type'):
                raise serializers.ValidationError({
                    "game_invite_type": "Game invite type is required for game invitations"
                })
            if not attrs.get('game_room_code'):
                raise serializers.ValidationError({
                    "game_room_code": "Room code is required for game invitations"
                })
            if not attrs.get('recipient_id'):
                raise serializers.ValidationError({
                    "recipient_id": "Recipient is required for game invitations"
                })

        return attrs


class ChatRoomSerializer(serializers.ModelSerializer):
    """
    Serializer for ChatRoom model
    """
    creator = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'name', 'creator', 'members', 'member_count',
            'is_active', 'created_at'
        ]
        read_only_fields = ['creator', 'created_at']

    def get_member_count(self, obj):
        """Count members in room"""
        return obj.members.count()


class ChatRoomCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating chat rooms
    """
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = ChatRoom
        fields = ['name', 'member_ids']

    def validate_name(self, value):
        """Validate room name"""
        if len(value) < 3:
            raise serializers.ValidationError("Room name must be at least 3 characters")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model
    """
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'content',
            'action_url', 'is_read', 'created_at'
        ]
        read_only_fields = ['created_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating notifications
    """
    class Meta:
        model = Notification
        fields = [
            'notification_type', 'title', 'content', 'action_url'
        ]


class DirectMessageHistorySerializer(serializers.Serializer):
    """
    Serializer for direct message conversation history
    """
    other_user = UserSerializer(read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.IntegerField(read_only=True)


class UnreadMessagesSerializer(serializers.Serializer):
    """
    Serializer for unread message count
    """
    total_unread = serializers.IntegerField()
    conversations = serializers.ListField(
        child=serializers.DictField()
    )
