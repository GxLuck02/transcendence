"""
WebSocket routing for Pong app
"""
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/pong/<str:room_code>/', consumers.PongConsumer.as_asgi()),
]
