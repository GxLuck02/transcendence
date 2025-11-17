"""
ASGI config for ft_transcendence project.
Support for WebSockets via Django Channels
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing after Django is initialized
from backend.apps.pong.routing import websocket_urlpatterns as pong_ws
from backend.apps.chat.routing import websocket_urlpatterns as chat_ws

# Combine all WebSocket URL patterns
websocket_urlpatterns = pong_ws + chat_ws

application = ProtocolTypeRouter({
    # HTTP traffic
    "http": django_asgi_app,

    # WebSocket traffic
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
