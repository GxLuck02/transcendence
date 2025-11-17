"""
Pong app configuration
"""
from django.apps import AppConfig


class PongConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.pong'
    verbose_name = 'Pong Game'
