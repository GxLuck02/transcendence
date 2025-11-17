"""
Serializers for User app
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Friendship, BlockedUser


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    win_rate = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'avatar',
            'wins', 'losses', 'pong_wins', 'pong_losses',
            'rps_wins', 'rps_losses', 'win_rate', 'is_online',
            'last_seen', 'created_at'
        ]
        read_only_fields = [
            'wins', 'losses', 'pong_wins', 'pong_losses',
            'rps_wins', 'rps_losses', 'is_online', 'last_seen',
            'created_at'
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'display_name']

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create new user with hashed password"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            display_name=validated_data['display_name'],
            password=validated_data['password']
        )
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    class Meta:
        model = User
        fields = ['display_name', 'avatar', 'email']

    def validate_display_name(self, value):
        """Ensure display_name is unique"""
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(display_name=value).exists():
            raise serializers.ValidationError("This display name is already taken.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        """Validate passwords match"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Password fields didn't match."
            })
        return attrs

    def validate_old_password(self, value):
        """Validate old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class FriendshipSerializer(serializers.ModelSerializer):
    """
    Serializer for Friendship model
    """
    friend = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'created_at']
        read_only_fields = ['created_at']


class BlockedUserSerializer(serializers.ModelSerializer):
    """
    Serializer for BlockedUser model
    """
    blocked = UserSerializer(read_only=True)

    class Meta:
        model = BlockedUser
        fields = ['id', 'blocked', 'created_at']
        read_only_fields = ['created_at']


class UserStatsSerializer(serializers.ModelSerializer):
    """
    Serializer for user statistics
    """
    win_rate = serializers.ReadOnlyField()
    pong_win_rate = serializers.SerializerMethodField()
    rps_win_rate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username', 'display_name', 'avatar',
            'wins', 'losses', 'win_rate',
            'pong_wins', 'pong_losses', 'pong_win_rate',
            'rps_wins', 'rps_losses', 'rps_win_rate'
        ]

    def get_pong_win_rate(self, obj):
        """Calculate Pong win rate"""
        total = obj.pong_wins + obj.pong_losses
        if total == 0:
            return 0
        return round((obj.pong_wins / total) * 100, 2)

    def get_rps_win_rate(self, obj):
        """Calculate RPS win rate"""
        total = obj.rps_wins + obj.rps_losses
        if total == 0:
            return 0
        return round((obj.rps_wins / total) * 100, 2)
