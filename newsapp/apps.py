"""
Django application configuration for the newsapp package.

The ``ready()`` hook imports the signals module so that all signal
handlers are registered as soon as the application is loaded.  Without
this import the ``post_migrate`` and ``post_save`` handlers defined in
``signals.py`` would never be connected.
"""

from django.apps import AppConfig


class NewsappConfig(AppConfig):
    """Configuration class for the *newsapp* Django application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "newsapp"

    def ready(self) -> None:
        """Connect signal handlers by importing the signals module."""
        import newsapp.signals  # noqa: F401
