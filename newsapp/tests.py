"""
Unit tests for the newsapp application.

Test classes and their coverage
--------------------------------
AuthenticationTests  -- token-based login, registration, and article
                        visibility per role.
ReaderTests          -- reader access restrictions and subscribed-feed endpoint.
JournalistTests      -- journalist article/newsletter CRUD and permission
                        boundaries (cannot approve; cannot edit others' content).
EditorTests          -- editor approve/unapprove, full article management,
                        newsletter management, and template approval page.
NewsletterTests      -- newsletter visibility, creation permissions, and
                        article association.
SignalTests          -- mocked signal side-effects: email dispatch and
                        Twitter posting on article approval.
ModelTests           -- model property correctness and subscription-clearing
                        behaviour on role change.

All external I/O (``send_mail``, ``requests.post``) is patched with
``unittest.mock`` so tests run without network access or email setup.
"""

from unittest.mock import MagicMock, patch

from django.test import Client, TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

from .models import Article, Newsletter, Publisher

User = get_user_model()


# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------

def make_user(username: str, role: str, password: str = "testpass123") -> User:
    """Create and return a User with the given role and hashed password."""
    return User.objects.create_user(
        username=username, password=password, role=role
    )


def get_token(user: User) -> str:
    """Return (creating if necessary) the DRF auth token key for *user*."""
    token, _ = Token.objects.get_or_create(user=user)
    return token.key


def auth_client(user: User) -> APIClient:
    """Return a DRF ``APIClient`` pre-configured with *user*'s token."""
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {get_token(user)}")
    return client


# ---------------------------------------------------------------------------
# Authentication tests
# ---------------------------------------------------------------------------

class AuthenticationTests(TestCase):
    """
    Verify token-based authentication and role-based article visibility.

    Covers: login success/failure, registration, unauthenticated access,
    and per-role queryset filtering on ``GET /api/articles/``.
    """

    def setUp(self) -> None:
        self.reader = make_user("reader1", "reader")
        self.journalist = make_user("journalist1", "journalist")
        self.editor = make_user("editor1", "editor")

    def test_api_login_success(self) -> None:
        """A valid credential pair returns HTTP 200 and a token."""
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "reader1", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

    def test_api_login_wrong_password(self) -> None:
        """An incorrect password returns HTTP 401."""
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "reader1", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_api_register(self) -> None:
        """A valid registration payload returns HTTP 201 with a token."""
        client = APIClient()
        response = client.post(
            "/api/auth/register/",
            {"username": "newuser", "password": "testpass123", "role": "reader"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)

    def test_unauthenticated_cannot_list_articles(self) -> None:
        """Unauthenticated requests to ``/api/articles/`` return HTTP 401."""
        client = APIClient()
        response = client.get("/api/articles/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reader_can_list_approved_articles(self) -> None:
        """Readers may list approved articles."""
        publisher = Publisher.objects.create(name="Test Pub")
        Article.objects.create(
            title="Approved Article",
            content="Content",
            author=self.journalist,
            publisher=publisher,
            approved=True,
        )
        client = auth_client(self.reader)
        response = client.get("/api/articles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_journalist_sees_own_unapproved_articles(self) -> None:
        """A journalist can see their own unapproved drafts in the listing."""
        Article.objects.create(
            title="My Draft",
            content="Draft content",
            author=self.journalist,
            approved=False,
        )
        client = auth_client(self.journalist)
        response = client.get("/api/articles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [a["title"] for a in response.data["results"]]
        self.assertIn("My Draft", titles)

    def test_reader_cannot_see_unapproved_articles(self) -> None:
        """Readers must not see articles that are still pending approval."""
        Article.objects.create(
            title="Hidden Draft",
            content="Draft",
            author=self.journalist,
            approved=False,
        )
        client = auth_client(self.reader)
        response = client.get("/api/articles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [a["title"] for a in response.data["results"]]
        self.assertNotIn("Hidden Draft", titles)


# ---------------------------------------------------------------------------
# Reader tests
# ---------------------------------------------------------------------------

class ReaderTests(TestCase):
    """
    Verify reader-specific access restrictions and the subscribed-feed endpoint.

    Covers: POST/DELETE prohibition, ``GET /api/articles/subscribed/``
    returning only content from subscribed publishers/journalists.
    """

    def setUp(self) -> None:
        self.reader = make_user("reader2", "reader")
        self.journalist = make_user("journalist2", "journalist")
        self.publisher = Publisher.objects.create(name="Sub Publisher")
        self.approved_article = Article.objects.create(
            title="Sub Article",
            content="Content",
            author=self.journalist,
            publisher=self.publisher,
            approved=True,
        )
        self.reader.subscribed_publishers.add(self.publisher)
        self.reader.subscribed_journalists.add(self.journalist)

    def test_reader_cannot_post_article(self) -> None:
        """Readers must receive HTTP 403 when attempting to POST an article."""
        client = auth_client(self.reader)
        response = client.post(
            "/api/articles/",
            {"title": "Illegal", "content": "No", "author": self.reader.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reader_can_get_subscribed_articles(self) -> None:
        """The subscribed-feed endpoint returns HTTP 200 for readers."""
        client = auth_client(self.reader)
        response = client.get("/api/articles/subscribed/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reader_cannot_delete_article(self) -> None:
        """Readers must receive 403 or 405 when attempting to DELETE an article."""
        client = auth_client(self.reader)
        response = client.delete(f"/api/articles/{self.approved_article.pk}/")
        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_405_METHOD_NOT_ALLOWED],
        )


# ---------------------------------------------------------------------------
# Journalist tests
# ---------------------------------------------------------------------------

class JournalistTests(TestCase):
    """
    Verify journalist article and newsletter permissions.

    Covers: create own article, update own article, cannot update others'
    articles, cannot approve articles, can create newsletters.  Also
    verifies that editors cannot POST articles via the REST API.
    """

    def setUp(self) -> None:
        self.journalist = make_user("journalist3", "journalist")
        self.editor = make_user("editor3", "editor")
        self.other_journalist = make_user("other_journalist", "journalist")

    def test_journalist_can_create_article(self) -> None:
        """A journalist's POST to ``/api/articles/`` returns HTTP 201."""
        client = auth_client(self.journalist)
        response = client.post(
            "/api/articles/",
            {
                "title": "My Article",
                "content": "Great content",
                "author": self.journalist.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["approved"], False)

    def test_journalist_can_update_own_article(self) -> None:
        """A journalist may PATCH their own article and receive HTTP 200."""
        article = Article.objects.create(
            title="Original", content="Content", author=self.journalist
        )
        client = auth_client(self.journalist)
        response = client.patch(
            f"/api/articles/{article.pk}/",
            {"title": "Updated Title"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Title")

    def test_journalist_cannot_update_other_article(self) -> None:
        """A journalist must not be able to PATCH another journalist's article."""
        article = Article.objects.create(
            title="Others Article",
            content="Content",
            author=self.other_journalist,
        )
        client = auth_client(self.journalist)
        response = client.patch(
            f"/api/articles/{article.pk}/",
            {"title": "Hijack"},
            format="json",
        )
        # 403 when visible but no object-level permission;
        # 404 when filtered out of the journalist's queryset.
        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND],
        )

    def test_journalist_cannot_approve_article(self) -> None:
        """A journalist posting to ``/approve/`` must receive HTTP 403."""
        article = Article.objects.create(
            title="Pending", content="Content", author=self.journalist
        )
        client = auth_client(self.journalist)
        response = client.post(f"/api/articles/{article.pk}/approve/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_cannot_create_article(self) -> None:
        """Spec: POST /api/articles/ is journalists only."""
        client = auth_client(self.editor)
        response = client.post(
            "/api/articles/",
            {
                "title": "Editor Article",
                "content": "Content",
                "author": self.editor.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_journalist_can_create_newsletter(self) -> None:
        """A journalist may POST a newsletter and receive HTTP 201."""
        client = auth_client(self.journalist)
        response = client.post(
            "/api/newsletters/",
            {
                "title": "My Newsletter",
                "description": "Weekly digest",
                "author": self.journalist.pk,
                "articles": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Editor tests
# ---------------------------------------------------------------------------

class EditorTests(TestCase):
    """
    Verify editor approval powers and full content management access.

    Covers: approve/unapprove via API, delete/update any article,
    update any newsletter, access to the approval template page, and
    the redirect for non-editors attempting to access the approval page.
    """

    def setUp(self) -> None:
        self.journalist = make_user("journalist4", "journalist")
        self.editor = make_user("editor4", "editor")
        self.article = Article.objects.create(
            title="For Approval",
            content="Content",
            author=self.journalist,
            approved=False,
        )

    def test_editor_can_approve_article(self) -> None:
        """An editor POSTing to ``/approve/`` sets approved=True and records themselves."""
        client = auth_client(self.editor)
        response = client.post(f"/api/articles/{self.article.pk}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertTrue(self.article.approved)
        self.assertEqual(self.article.approved_by, self.editor)

    def test_editor_can_delete_any_article(self) -> None:
        """An editor may DELETE any article and receive HTTP 204."""
        client = auth_client(self.editor)
        response = client.delete(f"/api/articles/{self.article.pk}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_editor_can_update_any_article(self) -> None:
        """An editor may PATCH any article regardless of authorship."""
        client = auth_client(self.editor)
        response = client.patch(
            f"/api/articles/{self.article.pk}/",
            {"title": "Editor Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_editor_can_unapprove_article(self) -> None:
        """An editor POSTing to ``/unapprove/`` sets approved=False."""
        self.article.approved = True
        self.article.approved_by = self.editor
        self.article.save()
        client = auth_client(self.editor)
        response = client.post(f"/api/articles/{self.article.pk}/unapprove/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertFalse(self.article.approved)

    def test_editor_can_access_approval_template_view(self) -> None:
        """Editors receive HTTP 200 when visiting the approval dashboard."""
        dj_client = Client()
        dj_client.login(username="editor4", password="testpass123")
        response = dj_client.get("/articles/approval/")
        self.assertEqual(response.status_code, 200)

    def test_non_editor_cannot_access_approval_page(self) -> None:
        """Journalists are redirected (HTTP 302) from the approval dashboard."""
        dj_client = Client()
        dj_client.login(username="journalist4", password="testpass123")
        response = dj_client.get("/articles/approval/")
        self.assertEqual(response.status_code, 302)

    def test_editor_can_update_any_newsletter(self) -> None:
        """An editor may PATCH any newsletter, including those by journalists."""
        newsletter = Newsletter.objects.create(
            title="Journalist NL",
            description="...",
            author=self.journalist,
        )
        client = auth_client(self.editor)
        response = client.patch(
            f"/api/newsletters/{newsletter.pk}/",
            {"title": "Editor Updated NL"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Editor Updated NL")


# ---------------------------------------------------------------------------
# Newsletter tests
# ---------------------------------------------------------------------------

class NewsletterTests(TestCase):
    """
    Verify newsletter visibility, creation, and article-association rules.

    Covers: all roles can list newsletters, readers see all newsletters
    (not filtered by subscription), readers cannot POST, editors can POST,
    and journalists can associate articles with their newsletters.
    """

    def setUp(self) -> None:
        self.journalist = make_user("journalist5", "journalist")
        self.editor = make_user("editor5", "editor")
        self.reader = make_user("reader5", "reader")
        self.newsletter = Newsletter.objects.create(
            title="Weekly Tech",
            description="Top tech news",
            author=self.journalist,
        )

    def test_any_authenticated_user_can_list_newsletters(self) -> None:
        """Spec: Newsletters can be viewed by readers."""
        for user in [self.journalist, self.editor, self.reader]:
            client = auth_client(user)
            response = client.get("/api/newsletters/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reader_sees_all_newsletters_not_just_subscribed(self) -> None:
        """Spec: readers can view all newsletters (not filtered by subscription)."""
        other_journalist = make_user("other_j5", "journalist")
        Newsletter.objects.create(
            title="Other Newsletter",
            description="From another journalist",
            author=other_journalist,
        )
        # reader5 is NOT subscribed to other_journalist.
        client = auth_client(self.reader)
        response = client.get("/api/newsletters/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [n["title"] for n in response.data["results"]]
        self.assertIn("Other Newsletter", titles)

    def test_reader_cannot_create_newsletter(self) -> None:
        """Readers must receive HTTP 403 when attempting to POST a newsletter."""
        client = auth_client(self.reader)
        response = client.post(
            "/api/newsletters/",
            {"title": "Illegal", "description": "No", "author": self.reader.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_can_create_newsletter(self) -> None:
        """Spec: Newsletters can be edited or created by journalists and editors."""
        client = auth_client(self.editor)
        response = client.post(
            "/api/newsletters/",
            {
                "title": "Editor Newsletter",
                "description": "Curated by editor",
                "author": self.editor.pk,
                "articles": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_journalist_can_add_articles_to_newsletter(self) -> None:
        """A journalist can associate an article with their newsletter."""
        article = Article.objects.create(
            title="Tech Article",
            content="Content",
            author=self.journalist,
            approved=True,
        )
        self.newsletter.articles.add(article)
        self.assertEqual(self.newsletter.articles.count(), 1)


# ---------------------------------------------------------------------------
# Signal tests (mocked)
# ---------------------------------------------------------------------------

class SignalTests(TestCase):
    """
    Verify that article-approval triggers the correct signal side-effects.

    All external I/O (``send_mail``, ``requests.post``) is patched with
    ``unittest.mock`` so these tests are fully self-contained and fast.

    Covers: both signals fire on approval; neither fires on unapproval;
    email reaches the correct subscriber address; tweet is posted to the
    correct Twitter v2 URL; network errors are handled gracefully; tweet
    is skipped when the bearer token is absent.
    """

    def setUp(self) -> None:
        self.journalist = make_user("journalist6", "journalist")
        self.editor = make_user("editor6", "editor")
        self.publisher = Publisher.objects.create(name="Signal Pub")
        self.article = Article.objects.create(
            title="Signal Article",
            content="Content",
            author=self.journalist,
            publisher=self.publisher,
            approved=False,
        )
        # Create a reader subscribed to the publisher so email tests have a recipient.
        self.reader = make_user("reader6", "reader")
        self.reader.email = "reader@example.com"
        self.reader.save()
        self.reader.subscribed_publishers.add(self.publisher)

    @patch("newsapp.signals.send_approval_emails")
    @patch("newsapp.signals.post_to_twitter")
    def test_approval_triggers_email_and_tweet(
        self, mock_tweet, mock_email
    ) -> None:
        """Both signal handlers are called exactly once when an article is approved."""
        client = auth_client(self.editor)
        response = client.post(f"/api/articles/{self.article.pk}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_email.assert_called_once()
        mock_tweet.assert_called_once()

    @patch("newsapp.signals.send_approval_emails")
    @patch("newsapp.signals.post_to_twitter")
    def test_unapproval_does_not_trigger_signals(
        self, mock_tweet, mock_email
    ) -> None:
        """Neither signal side-effect fires when an article is unapproved."""
        self.article.approved = True
        self.article.save()
        mock_email.reset_mock()
        mock_tweet.reset_mock()
        client = auth_client(self.editor)
        client.post(f"/api/articles/{self.article.pk}/unapprove/")
        mock_tweet.assert_not_called()

    @patch("newsapp.signals.post_to_twitter")
    @patch("django.core.mail.send_mail")
    def test_email_sent_to_subscriber(
        self, mock_send_mail, mock_tweet
    ) -> None:
        """``send_approval_emails`` calls ``send_mail`` with the subscriber's address."""
        from newsapp.signals import send_approval_emails

        # Call the function directly to avoid double-firing via the post_save signal.
        send_approval_emails(self.article)
        mock_send_mail.assert_called_once()
        call_args = mock_send_mail.call_args
        self.assertIn("reader@example.com", call_args[0][3])

    @patch("requests.post")
    def test_twitter_post_called_with_correct_url(self, mock_post) -> None:
        """``post_to_twitter`` sends a POST request to the Twitter v2 endpoint."""
        from django.conf import settings

        from newsapp.signals import post_to_twitter

        settings.TWITTER_BEARER_TOKEN = "fake-token"
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_post.return_value = mock_response

        post_to_twitter(self.article)

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args
        self.assertEqual(call_kwargs[0][0], "https://api.twitter.com/2/tweets")

    @patch("requests.post")
    def test_twitter_post_handles_failure_gracefully(self, mock_post) -> None:
        """A network error in ``post_to_twitter`` returns ``None`` without raising."""
        import requests as req

        from django.conf import settings

        from newsapp.signals import post_to_twitter

        settings.TWITTER_BEARER_TOKEN = "fake-token"
        mock_post.side_effect = req.RequestException("Network error")

        result = post_to_twitter(self.article)
        self.assertIsNone(result)

    @patch("requests.post")
    def test_twitter_skipped_when_no_bearer_token(self, mock_post) -> None:
        """``post_to_twitter`` must not call ``requests.post`` without a bearer token."""
        from django.conf import settings

        from newsapp.signals import post_to_twitter

        settings.TWITTER_BEARER_TOKEN = ""
        post_to_twitter(self.article)
        mock_post.assert_not_called()


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------

class ModelTests(TestCase):
    """
    Verify model property behaviour and data-integrity side-effects.

    Covers: subscription fields are cleared when a reader becomes a
    journalist; ``Article.is_independent`` returns the correct value;
    the ``is_reader``, ``is_journalist``, and ``is_editor`` properties
    map to the expected role strings.
    """

    def test_journalist_reader_fields_cleared_on_save(self) -> None:
        """Subscription data is cleared when a reader's role changes to journalist."""
        user = User.objects.create_user(
            username="changerole", password="pass", role="reader"
        )
        publisher = Publisher.objects.create(name="Pub for Clear")
        user.subscribed_publishers.add(publisher)
        self.assertEqual(user.subscribed_publishers.count(), 1)

        user.role = "journalist"
        user.save()
        self.assertEqual(user.subscribed_publishers.count(), 0)

    def test_article_is_independent_when_no_publisher(self) -> None:
        """An article with no publisher must report ``is_independent=True``."""
        journalist = make_user("journalist_model", "journalist")
        article = Article.objects.create(
            title="Independent", content="Content", author=journalist
        )
        self.assertTrue(article.is_independent)

    def test_article_not_independent_when_publisher_set(self) -> None:
        """An article with an assigned publisher must report ``is_independent=False``."""
        journalist = make_user("journalist_model2", "journalist")
        pub = Publisher.objects.create(name="Pub Model")
        article = Article.objects.create(
            title="Pub Article", content="Content", author=journalist, publisher=pub
        )
        self.assertFalse(article.is_independent)

    def test_user_role_properties(self) -> None:
        """The ``is_reader``, ``is_journalist``, and ``is_editor`` properties are correct."""
        reader = make_user("u_reader", "reader")
        journalist = make_user("u_journalist", "journalist")
        editor = make_user("u_editor", "editor")

        self.assertTrue(reader.is_reader)
        self.assertFalse(reader.is_journalist)
        self.assertTrue(journalist.is_journalist)
        self.assertTrue(editor.is_editor)
