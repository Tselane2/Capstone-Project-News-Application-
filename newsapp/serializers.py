"""
DRF serializers for the newsapp application.

Each serializer maps one model to its JSON representation for the REST
API.  Read-only computed fields (e.g. ``author_username``) are included
for convenience so API consumers don't need extra look-up requests.

Classes
-------
UserSerializer          -- full user representation (create/update).
PublisherSerializer     -- full publisher with editor/journalist lists.
PublisherBriefSerializer -- lightweight publisher (id + name only).
ArticleSerializer       -- article with denormalised author/publisher names.
ArticleApproveSerializer -- minimal write serializer for approval actions.
NewsletterSerializer    -- newsletter with article count.
TokenRequestSerializer  -- login credential input validator.
"""

from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Article, Newsletter, Publisher

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Full serializer for the custom User model.

    Supports create and update operations.  The ``password`` field is
    write-only so it is never exposed in responses.  Subscription
    many-to-many fields are optional on write.
    """

    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "subscribed_publishers",
            "subscribed_journalists",
            "password",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "subscribed_publishers": {"required": False},
            "subscribed_journalists": {"required": False},
        }

    def create(self, validated_data: dict) -> User:
        """Hash the password (if supplied) before persisting the new user."""
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance: User, validated_data: dict) -> User:
        """Update user fields and re-hash the password when it changes."""
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class PublisherSerializer(serializers.ModelSerializer):
    """Full publisher serializer including editor and journalist ID lists."""

    class Meta:
        model = Publisher
        fields = ["id", "name", "editors", "journalists"]


class PublisherBriefSerializer(serializers.ModelSerializer):
    """Lightweight publisher serializer — ID and name only."""

    class Meta:
        model = Publisher
        fields = ["id", "name"]


class ArticleSerializer(serializers.ModelSerializer):
    """
    Article serializer with denormalised author and publisher fields.

    Read-only computed fields
    -------------------------
    author_username  -- username string, avoids a separate user look-up.
    author_role      -- role string for permission-aware consumers.
    publisher_name   -- publisher display name, nullable.

    Approval fields (``approved``, ``approved_by``, ``approved_at``) are
    read-only here; use the ``/approve/`` and ``/unapprove/`` actions to
    change approval state.
    """

    author_username = serializers.CharField(
        source="author.username", read_only=True
    )
    author_role = serializers.CharField(
        source="author.role", read_only=True
    )
    publisher_name = serializers.CharField(
        source="publisher.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "content",
            "author",
            "author_username",
            "author_role",
            "publisher",
            "publisher_name",
            "created_at",
            "approved",
            "approved_by",
            "approved_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "approved",
            "approved_by",
            "approved_at",
        ]

    def validate_author(self, value: User) -> User:
        """Ensure the author has a content-creation role."""
        if value.role not in ("journalist", "editor"):
            raise serializers.ValidationError(
                "Author must be a journalist or editor."
            )
        return value


class ArticleApproveSerializer(serializers.ModelSerializer):
    """
    Minimal serializer used by the approval/unapproval actions.

    Exposes only the approval state fields; ``approved_by`` and
    ``approved_at`` are read-only because the view sets them from the
    request context.
    """

    class Meta:
        model = Article
        fields = ["id", "approved", "approved_by", "approved_at"]
        read_only_fields = ["id", "approved_by", "approved_at"]


class NewsletterSerializer(serializers.ModelSerializer):
    """
    Newsletter serializer with a denormalised author username and an
    article count for list views.
    """

    author_username = serializers.CharField(
        source="author.username", read_only=True
    )
    article_count = serializers.IntegerField(
        source="articles.count", read_only=True
    )

    class Meta:
        model = Newsletter
        fields = [
            "id",
            "title",
            "description",
            "created_at",
            "author",
            "author_username",
            "articles",
            "article_count",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_author(self, value: User) -> User:
        """Ensure newsletters are attributed to journalists or editors only."""
        if value.role not in ("journalist", "editor"):
            raise serializers.ValidationError(
                "Newsletter author must be a journalist or editor."
            )
        return value


class TokenRequestSerializer(serializers.Serializer):
    """Input validator for the login endpoint (username + password)."""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
