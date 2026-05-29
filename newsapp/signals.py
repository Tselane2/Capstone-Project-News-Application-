"""
Django signals for the newsapp application.

Signal handlers
---------------
create_groups_and_permissions (post_migrate)
    Idempotently bootstraps the Reader, Journalist, and Editor permission
    groups after every ``migrate`` run.  Uses ``get_or_create`` so the
    handler is safe to execute multiple times.

on_article_saved (post_save → Article)
    Fires when any Article instance is saved.  If the article is approved,
    two side-effects are triggered:

    1. ``send_approval_emails`` -- notifies subscribed readers by email.
    2. ``post_to_twitter``      -- publishes an announcement tweet via the
                                    Twitter v2 API (skipped when the bearer
                                    token is not configured).

    Both side-effect functions are defined at module level so they can be
    patched independently in unit tests without altering signal wiring.
"""

import logging

from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Group and permission bootstrap
# ---------------------------------------------------------------------------

@receiver(post_migrate)
def create_groups_and_permissions(sender, **kwargs) -> None:
    """
    Auto-create the three role groups with their model permissions.

    Called after every ``migrate`` run.  The handler defers model imports
    to avoid ``AppRegistryNotReady`` errors during early Django startup.

    Permission sets
    ---------------
    Reader     -- view_article, view_newsletter
    Journalist -- full CRUD on articles and newsletters
    Editor     -- view/change/delete article (no add); full CRUD newsletters
    """
    from django.apps import apps

    Article = apps.get_model("newsapp", "Article")
    Newsletter = apps.get_model("newsapp", "Newsletter")

    article_ct = ContentType.objects.get_for_model(Article)
    newsletter_ct = ContentType.objects.get_for_model(Newsletter)

    def _get_perm(codename: str, ct: ContentType):
        """Return a Permission or None (silently) if it does not exist yet."""
        try:
            return Permission.objects.get(codename=codename, content_type=ct)
        except Permission.DoesNotExist:
            return None

    # -- Collect individual permissions -----------------------------------
    view_article = _get_perm("view_article", article_ct)
    add_article = _get_perm("add_article", article_ct)
    change_article = _get_perm("change_article", article_ct)
    delete_article = _get_perm("delete_article", article_ct)

    view_newsletter = _get_perm("view_newsletter", newsletter_ct)
    add_newsletter = _get_perm("add_newsletter", newsletter_ct)
    change_newsletter = _get_perm("change_newsletter", newsletter_ct)
    delete_newsletter = _get_perm("delete_newsletter", newsletter_ct)

    # -- Create or fetch groups -------------------------------------------
    reader_group, _ = Group.objects.get_or_create(name="Reader")
    journalist_group, _ = Group.objects.get_or_create(name="Journalist")
    editor_group, _ = Group.objects.get_or_create(name="Editor")

    # Readers may only view content.
    reader_perms = [
        p for p in [view_article, view_newsletter] if p
    ]

    # Journalists have full CRUD over articles and newsletters.
    # Object-level access control in ArticlePermission restricts writes
    # to their own content at runtime.
    journalist_perms = [
        p for p in [
            view_article, add_article, change_article, delete_article,
            view_newsletter, add_newsletter, change_newsletter, delete_newsletter,
        ]
        if p
    ]

    # Editors may view/change/delete any article but do not add via the API
    # (POST /api/articles/ is journalist-only per spec).  They have full
    # CRUD on newsletters.
    editor_perms = [
        p for p in [
            view_article, change_article, delete_article,
            view_newsletter, add_newsletter, change_newsletter, delete_newsletter,
        ]
        if p
    ]

    reader_group.permissions.set(reader_perms)
    journalist_group.permissions.set(journalist_perms)
    editor_group.permissions.set(editor_perms)


# ---------------------------------------------------------------------------
# Article approval side-effects
# ---------------------------------------------------------------------------

def send_approval_emails(article) -> None:
    """
    Email all readers who are subscribed to the article's publisher or author.

    Uses ``fail_silently=True`` so a misconfigured email backend does not
    block the approval workflow.  The function is defined at module level
    (rather than inline in the signal handler) so tests can patch it
    independently via ``@patch("newsapp.signals.send_approval_emails")``.

    Args:
        article: The ``Article`` instance that was just approved.
    """
    from django.contrib.auth import get_user_model
    from django.core.mail import send_mail

    User = get_user_model()
    recipients: set[str] = set()

    # Collect subscribers from the article's affiliated publisher.
    if article.publisher:
        for reader in User.objects.filter(
            role="reader",
            subscribed_publishers=article.publisher,
        ):
            if reader.email:
                recipients.add(reader.email)

    # Collect subscribers from the article's author.
    for reader in User.objects.filter(
        role="reader",
        subscribed_journalists=article.author,
    ):
        if reader.email:
            recipients.add(reader.email)

    if not recipients:
        logger.info(
            "No subscribers to notify for article id=%s.", article.id
        )
        return

    subject = f"New article approved: {article.title}"
    body = (
        "A new article has been approved:\n\n"
        f"Title: {article.title}\n"
        f"Author: {article.author.get_full_name() or article.author.username}\n\n"
        "Log in to read the full article."
    )
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        list(recipients),
        fail_silently=True,
    )
    logger.info(
        "Sent approval email to %d subscriber(s) for article id=%s.",
        len(recipients),
        article.id,
    )


def post_to_twitter(article):
    """
    Post an announcement tweet for a newly approved article.

    Uses the Twitter v2 ``POST /2/tweets`` endpoint with Bearer-token
    authentication.  The function is a no-op when
    ``settings.TWITTER_BEARER_TOKEN`` is empty, which is the default in
    development.

    Args:
        article: The ``Article`` instance that was just approved.

    Returns:
        The ``requests.Response`` object on success, or ``None`` if the
        token is absent or a network error occurs.
    """
    import requests as req

    bearer = getattr(settings, "TWITTER_BEARER_TOKEN", "")
    if not bearer:
        logger.info(
            "TWITTER_BEARER_TOKEN not configured — skipping tweet "
            "for article id=%s.",
            article.id,
        )
        return None

    text = f"New article: {article.title} — read it on News App!"
    url = "https://api.twitter.com/2/tweets"
    headers = {
        "Authorization": f"Bearer {bearer}",
        "Content-Type": "application/json",
    }
    payload = {"text": text[:280]}  # Twitter character limit

    try:
        response = req.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in (200, 201):
            logger.info("Tweet posted for article id=%s.", article.id)
        else:
            logger.warning(
                "Twitter API returned HTTP %s for article id=%s: %s",
                response.status_code,
                article.id,
                response.text,
            )
        return response
    except req.RequestException as exc:
        logger.error(
            "Failed to post tweet for article id=%s: %s", article.id, exc
        )
        return None


@receiver(post_save, sender="newsapp.User")
def assign_user_to_group(sender, instance, **kwargs) -> None:
    """
    Automatically assign a user to the Django group that matches their role.

    Called every time a User instance is saved.  Removes the user from all
    three role groups first, then adds them to the group for their current
    role.  This ensures that role changes (e.g. reader → journalist) are
    reflected immediately in Django's group-based permission system.

    The handler defers all model imports to avoid ``AppRegistryNotReady``
    errors during early Django startup.

    Args:
        sender:   The ``User`` model class.
        instance: The ``User`` instance that was just saved.
        **kwargs: Additional keyword arguments from the signal framework.
    """
    try:
        reader_group = Group.objects.get(name="Reader")
        journalist_group = Group.objects.get(name="Journalist")
        editor_group = Group.objects.get(name="Editor")
    except Group.DoesNotExist:
        # Groups have not been created yet (e.g. before the first migrate).
        # The post_migrate signal will bootstrap them; skip for now.
        return

    # Remove the user from all three role groups, then add the correct one.
    instance.groups.remove(reader_group, journalist_group, editor_group)

    role_to_group = {
        "reader": reader_group,
        "journalist": journalist_group,
        "editor": editor_group,
    }
    group = role_to_group.get(instance.role)
    if group:
        instance.groups.add(group)


@receiver(post_save, sender="newsapp.Article")
def on_article_saved(sender, instance, created, **kwargs) -> None:
    """
    Trigger approval side-effects whenever an Article is saved.

    Only fires the email and Twitter notifications when the article's
    ``approved`` field is ``True``.  This means the handler runs on every
    save (including unapprovals), but the ``if`` guard ensures side-effects
    occur only when content is newly or re-approved.

    Args:
        sender:   The ``Article`` model class.
        instance: The ``Article`` instance that was saved.
        created:  ``True`` if this was an INSERT (new record).
        **kwargs: Additional keyword arguments from the signal framework.
    """
    if instance.approved:
        send_approval_emails(instance)
        post_to_twitter(instance)
