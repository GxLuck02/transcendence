"""
WebSocket consumers for Pong game
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache


class PongConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time Pong multiplayer game

    Game State Management:
    - Player 1 is the host and controls ball physics
    - Player 2 receives ball state updates from host
    - Both players send their paddle positions
    - Maximum 2 players per room
    """

    # Class-level storage for room state (in production, use Redis)
    rooms = {}

    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'pong_{self.room_code}'
        self.user = self.scope.get('user')
        self.player_number = None

        # Check if user is authenticated
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Initialize room if it doesn't exist
        if self.room_code not in self.rooms:
            self.rooms[self.room_code] = {
                'players': {},
                'player_count': 0,
                'game_started': False
            }

        room = self.rooms[self.room_code]

        # Check if room is full
        if room['player_count'] >= 2 and self.user.id not in room['players']:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Room is full'
            }))
            await self.close()
            return

        # Assign player number
        if self.user.id not in room['players']:
            room['player_count'] += 1
            self.player_number = room['player_count']
            room['players'][self.user.id] = {
                'player_number': self.player_number,
                'channel_name': self.channel_name,
                'username': self.user.username,
                'display_name': self.user.display_name
            }
        else:
            # Reconnection
            self.player_number = room['players'][self.user.id]['player_number']
            room['players'][self.user.id]['channel_name'] = self.channel_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send player assignment
        await self.send(text_data=json.dumps({
            'type': 'player_assigned',
            'player_number': self.player_number,
            'room_code': self.room_code,
            'is_host': self.player_number == 1
        }))

        # Notify room about player join
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_joined',
                'player_number': self.player_number,
                'username': self.user.username,
                'display_name': self.user.display_name,
                'player_count': room['player_count']
            }
        )

        # If both players are connected, start game
        if room['player_count'] == 2 and not room['game_started']:
            room['game_started'] = True
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_start',
                    'message': 'Both players connected. Game starting!'
                }
            )

    async def disconnect(self, close_code):
        # Notify room about player disconnect
        if self.room_code in self.rooms:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_disconnected',
                    'player_number': self.player_number
                }
            )

            # Clean up room if empty
            room = self.rooms[self.room_code]
            if self.user and self.user.id in room['players']:
                del room['players'][self.user.id]
                room['player_count'] -= 1

            if room['player_count'] == 0:
                del self.rooms[self.room_code]

        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Receive message from WebSocket

        Message types:
        - paddle_move: Update paddle position
        - ball_state: Update ball state (host only)
        - score_update: Update scores (host only)
        - game_over: Game ended
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            # Add player number to data
            data['player_number'] = self.player_number

            # Validate message types
            if message_type == 'paddle_move':
                # Broadcast paddle movement to other players
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_message',
                        'data': data
                    }
                )

            elif message_type == 'ball_state':
                # Only host (player 1) can send ball state
                if self.player_number == 1:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_message',
                            'data': data
                        }
                    )

            elif message_type == 'score_update':
                # Only host can update scores
                if self.player_number == 1:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_message',
                            'data': data
                        }
                    )

            elif message_type == 'game_over':
                # Only host can end game
                if self.player_number == 1:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_message',
                            'data': data
                        }
                    )
                    # Mark game as finished
                    if self.room_code in self.rooms:
                        self.rooms[self.room_code]['game_started'] = False

            else:
                # Generic message broadcast
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_message',
                        'data': data
                    }
                )

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def game_message(self, event):
        """
        Receive message from room group and send to WebSocket
        """
        await self.send(text_data=json.dumps(event['data']))

    async def player_joined(self, event):
        """
        Handle player joined event
        """
        await self.send(text_data=json.dumps({
            'type': 'player_joined',
            'player_number': event['player_number'],
            'username': event['username'],
            'display_name': event['display_name'],
            'player_count': event['player_count']
        }))

    async def player_disconnected(self, event):
        """
        Handle player disconnected event
        """
        await self.send(text_data=json.dumps({
            'type': 'player_disconnected',
            'player_number': event['player_number']
        }))

    async def game_start(self, event):
        """
        Handle game start event
        """
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'message': event['message']
        }))
