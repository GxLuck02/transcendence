"""
RPS app configuration
"""
from django.apps import AppConfig


class RpsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.rps'
    verbose_name = 'Rock Paper Scissors'
