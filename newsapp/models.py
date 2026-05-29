"""
Database models for the newsapp application.

Model hierarchy
---------------
Publisher  -- news organisation that employs journalists and editors.
User       -- custom user extending AbstractUser with a ``role`` field
              and reader-specific subscription many-to-many relations.
Article    -- piece of content written by a journalist or editor and
              subject to an editorial approval workflow.
Newsletter -- curated collection of articles published by a journalist
              or editor.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class Publisher(models.Model):
    """
    A news publishing organisation.

    Maintains separate many-to-many sets for the editors and journalists
    affiliated with it.  ``limit_choices_to`` on each relation keeps the
    admin drop-downs tidy by filtering to the correct role.
    """

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="Display name of the publishing organisation.",
    )
    editors = models.ManyToManyField(
        "User",
        related_name="publishing_as_editor",
        blank=True,
        limit_choices_to={"role": "editor"},
        help_text="Editors affiliated with this publisher.",
    )
    journalists = models.ManyToManyField(
        "User",
        related_name="publishing_as_journalist",
        blank=True,
        limit_choices_to={"role": "journalist"},
        help_text="Journalists affiliated with this publisher.",
    )

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """
    Custom user model that extends Django's ``AbstractUser`` with a
    ``role`` field and reader-specific subscription relations.

    Roles
    -----
    reader     -- can view approved content and subscribe to publishers /
                  journalists.
    journalist -- can create, edit, and delete their own articles and
                  newsletters; cannot approve content.
    editor     -- can view, edit, delete, and approve any article; can
                  create and manage any newsletter.

    Subscription fields (``subscribed_publishers``,
    ``subscribed_journalists``) are meaningful only for readers and are
    automatically cleared when a user's role changes to journalist.
    """

    ROLE_CHOICES = [
        ("reader", "Reader"),
        ("journalist", "Journalist"),
        ("editor", "Editor"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="reader",
        help_text="Determines site-wide permissions for this user.",
    )

    # -- Reader subscription relations -----------------------------------
    subscribed_publishers = models.ManyToManyField(
        Publisher,
        related_name="subscribers",
        blank=True,
        help_text="Publishers this reader follows.",
    )
    subscribed_journalists = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="journalist_subscribers",
        blank=True,
        help_text="Journalists this reader follows.",
    )

    def save(self, *args, **kwargs) -> None:
        """
        Persist the user and, if the role is journalist, clear any
        reader-only subscription data that would be semantically
        meaningless for the new role.
        """
        super().save(*args, **kwargs)
        if self.role == "journalist":
            self.subscribed_publishers.clear()
            self.subscribed_journalists.clear()

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"

    # -- Role convenience properties ------------------------------------

    @property
    def is_reader(self) -> bool:
        """Return ``True`` if the user's role is *reader*."""
        return self.role == "reader"

    @property
    def is_journalist(self) -> bool:
        """Return ``True`` if the user's role is *journalist*."""
        return self.role == "journalist"

    @property
    def is_editor(self) -> bool:
        """Return ``True`` if the user's role is *editor*."""
        return self.role == "editor"


class Article(models.Model):
    """
    A news article authored by a journalist or editor.

    Articles start unapproved (``approved=False``) and enter the public
    feed only after an editor sets ``approved=True``.  Approval records
    the approving editor and timestamp.  The ``post_save`` signal in
    ``signals.py`` fires email/Twitter notifications on approval.
    """

    title = models.CharField(
        max_length=500,
        help_text="Headline of the article.",
    )
    content = models.TextField(
        help_text="Full body text of the article.",
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="articles",
        limit_choices_to={"role__in": ["journalist", "editor"]},
        help_text="Journalist or editor who wrote the article.",
    )
    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
        help_text="Affiliated publisher, or null for an independent article.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # -- Approval workflow fields ----------------------------------------
    approved = models.BooleanField(
        default=False,
        help_text="Whether an editor has approved this article for publication.",
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_articles",
        limit_choices_to={"role": "editor"},
        help_text="Editor who approved the article.",
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of editorial approval.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    @property
    def is_independent(self) -> bool:
        """Return ``True`` when the article has no affiliated publisher."""
        return self.publisher is None


class Newsletter(models.Model):
    """
    A curated collection of approved articles.

    Newsletters can be created by journalists (own content) or editors
    (any content).  Readers can view all newsletters regardless of their
    subscription settings.
    """

    title = models.CharField(
        max_length=500,
        help_text="Name of the newsletter edition.",
    )
    description = models.TextField(
        help_text="Short summary shown in newsletter listings.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="newsletters",
        limit_choices_to={"role__in": ["journalist", "editor"]},
        help_text="Journalist or editor responsible for this newsletter.",
    )
    articles = models.ManyToManyField(
        Article,
        related_name="newsletters",
        blank=True,
        help_text="Articles included in this newsletter edition.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title
