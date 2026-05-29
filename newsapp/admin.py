"""
Django admin configuration for the newsapp application.

Registers all four models (User, Publisher, Article, Newsletter) with
customised list displays, filters, search fields, and — for Article —
bulk approve/unapprove actions.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone

from .models import Article, Newsletter, Publisher, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin configuration for the custom User model.

    Extends Django's built-in ``UserAdmin`` with an additional fieldset
    that exposes the ``role`` field and the reader subscription relations.
    """

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "News App Role & Subscriptions",
            {
                "fields": (
                    "role",
                    "subscribed_publishers",
                    "subscribed_journalists",
                )
            },
        ),
    )
    list_display = ["username", "email", "role", "is_staff", "is_active"]
    list_filter = ["role", "is_staff", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    """Admin configuration for the Publisher model."""

    list_display = ["name"]
    filter_horizontal = ["editors", "journalists"]
    search_fields = ["name"]


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Article model.

    Includes bulk actions to approve or unapprove selected articles
    directly from the change list, mirroring the editorial workflow
    available in the frontend template views.
    """

    list_display = ["title", "author", "publisher", "approved", "created_at"]
    list_filter = ["approved", "publisher"]
    search_fields = ["title", "content", "author__username"]
    readonly_fields = ["created_at", "approved_at"]
    actions = ["approve_articles", "unapprove_articles"]

    @admin.action(description="Approve selected articles")
    def approve_articles(self, request, queryset) -> None:
        """Bulk-approve the selected articles and record the approving editor."""
        queryset.update(
            approved=True,
            approved_by=request.user,
            approved_at=timezone.now(),
        )
        self.message_user(
            request, f"{queryset.count()} article(s) approved."
        )

    @admin.action(description="Unapprove selected articles")
    def unapprove_articles(self, request, queryset) -> None:
        """Bulk-unapprove the selected articles and clear approval metadata."""
        queryset.update(approved=False, approved_by=None, approved_at=None)
        self.message_user(
            request, f"{queryset.count()} article(s) unapproved."
        )


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    """Admin configuration for the Newsletter model."""

    list_display = ["title", "author", "created_at"]
    filter_horizontal = ["articles"]
    search_fields = ["title", "description", "author__username"]
    readonly_fields = ["created_at"]
