"""
Views for the newsapp application.

This module is divided into two sections:

REST API views (DRF)
--------------------
RegisterView          -- POST /api/auth/register/
LoginView             -- POST /api/auth/login/
LogoutView            -- POST /api/auth/logout/
UserViewSet           -- /api/users/
PublisherViewSet      -- /api/publishers/
ArticleViewSet        -- /api/articles/  (+ subscribed, approve, unapprove actions)
NewsletterViewSet     -- /api/newsletters/

Template / HTML views
---------------------
signup                -- account creation with role selection
home                  -- landing page showing latest approved articles
article_list          -- full paginated article listing
article_detail        -- single article with approve/edit/delete controls
article_approval      -- editorial approval dashboard (editor only)
approve_article_view  -- POST handler: approve a single article
unapprove_article_view-- POST handler: unapprove a single article
newsletter_list       -- newsletter index
my_feed               -- reader's personalised feed with subscription sidebar
subscribe_publisher   -- POST: toggle reader subscription to a publisher
subscribe_journalist  -- POST: toggle reader subscription to a journalist
my_articles           -- journalist's own articles; editor's full article table
article_create        -- create article form (journalist or editor)
article_edit          -- edit article form (article owner or editor)
article_delete        -- POST handler: delete an article
"""

import logging

# Django — authentication & decorators
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login as auth_login
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

# Django REST Framework
from rest_framework import filters, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Local — models, serializers, permissions, forms
from .forms import ArticleForm, SignUpForm
from .models import Article, Newsletter, Publisher
from .permissions import (
    ApproveArticlePermission,
    ArticlePermission,
    NewsletterPermission,
)
from .serializers import (
    ArticleSerializer,
    NewsletterSerializer,
    PublisherSerializer,
    TokenRequestSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


# ===========================================================================
# REST API — Authentication
# ===========================================================================

class RegisterView(APIView):
    """
    Create a new user account and return an auth token.

    POST /api/auth/register/
        Body: { username, password, role, email (optional) }
        Returns: { token, user }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate input, create the user, and issue a token."""
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {"token": token.key, "user": UserSerializer(user).data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Authenticate an existing user and return an auth token.

    POST /api/auth/login/
        Body: { username, password }
        Returns: { token, user }
        Errors: 401 on invalid credentials.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate credentials and return the user's token."""
        serializer = TokenRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class LogoutView(APIView):
    """
    Invalidate the current auth token.

    POST /api/auth/logout/
        Returns: { detail: "Logged out." }
    """

    def post(self, request):
        """Delete the requesting user's token."""
        request.user.auth_token.delete()
        return Response({"detail": "Logged out."})


# ===========================================================================
# REST API — ViewSets
# ===========================================================================

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for User resources.

    GET /api/users/         -- editors and journalists see all users;
                               readers see only their own record.
    Other methods follow standard DRF ModelViewSet behaviour.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Scope the queryset based on the requesting user's role."""
        user = self.request.user
        if user.is_editor or user.is_journalist:
            return User.objects.all()
        return User.objects.filter(pk=user.pk)


class PublisherViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Publisher resources.

    Accessible to any authenticated user.
    """

    queryset = Publisher.objects.all()
    serializer_class = PublisherSerializer
    permission_classes = [IsAuthenticated]


class ArticleViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Article resources.

    Permissions (see ``ArticlePermission`` for full matrix)
    -------------------------------------------------------
    GET     -- any authenticated user (readers see approved only)
    POST    -- journalists only
    PUT / PATCH / DELETE -- editor (any) or journalist (own article)

    Custom actions
    --------------
    GET  /api/articles/subscribed/     -- reader's personalised feed
    POST /api/articles/<id>/approve/   -- editor only
    POST /api/articles/<id>/unapprove/ -- editor only

    Search / ordering
    -----------------
    ?search=<term>  -- matches title, content, author username
    ?ordering=<field> -- created_at | title
    """

    queryset = Article.objects.select_related("author", "publisher").all()
    serializer_class = ArticleSerializer
    permission_classes = [ArticlePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "author__username"]
    ordering_fields = ["created_at", "title"]

    def get_queryset(self):
        """
        Return a role-scoped queryset.

        - Readers: approved articles only.
        - Journalists: their own articles plus all approved articles.
        - Editors: all articles regardless of approval state.
        """
        qs = Article.objects.select_related("author", "publisher")
        user = self.request.user
        if user.is_reader:
            return qs.filter(approved=True)
        if user.is_journalist:
            return qs.filter(author=user) | qs.filter(approved=True)
        return qs  # editors see everything

    def perform_create(self, serializer):
        """Automatically set the author to the authenticated journalist."""
        serializer.save(author=self.request.user)

    @action(detail=False, methods=["get"], url_path="subscribed")
    def subscribed(self, request):
        """
        Return approved articles from the reader's subscriptions.

        GET /api/articles/subscribed/

        Combines articles from subscribed publishers and subscribed
        journalists into a single de-duplicated queryset.  Returns 403
        for non-reader roles.
        """
        user = request.user
        if not user.is_reader:
            return Response(
                {"detail": "Only readers can access subscribed articles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            Article.objects.filter(approved=True)
            .filter(
                Q(publisher__in=user.subscribed_publishers.all())
                | Q(author__in=user.subscribed_journalists.all())
            )
            .distinct()
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
        permission_classes=[ApproveArticlePermission],
    )
    def approve(self, request, pk=None):
        """
        Approve an article and record the approving editor.

        POST /api/articles/<id>/approve/  (editors only)

        Returns the updated article representation.  Returns 200 with a
        note if the article is already approved.
        """
        article = self.get_object()
        if article.approved:
            return Response({"detail": "Article already approved."})
        article.approved = True
        article.approved_by = request.user
        article.approved_at = timezone.now()
        article.save()
        serializer = self.get_serializer(article)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="unapprove",
        permission_classes=[ApproveArticlePermission],
    )
    def unapprove(self, request, pk=None):
        """
        Retract approval for an article and clear its approval metadata.

        POST /api/articles/<id>/unapprove/  (editors only)

        Returns the updated article representation.
        """
        article = self.get_object()
        article.approved = False
        article.approved_by = None
        article.approved_at = None
        article.save()
        serializer = self.get_serializer(article)
        return Response(serializer.data)


class NewsletterViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Newsletter resources.

    Permissions (see ``NewsletterPermission`` for full matrix)
    ----------------------------------------------------------
    GET  -- any authenticated user (readers may browse all newsletters)
    POST -- journalists or editors
    PUT / PATCH / DELETE -- editor (any) or journalist (own newsletter)
    """

    queryset = (
        Newsletter.objects.select_related("author")
        .prefetch_related("articles")
        .all()
    )
    serializer_class = NewsletterSerializer
    permission_classes = [NewsletterPermission]

    def get_queryset(self):
        """Return all newsletters; readers have no subscription-based filter."""
        return (
            Newsletter.objects.select_related("author")
            .prefetch_related("articles")
            .all()
        )

    def perform_create(self, serializer):
        """Automatically set the newsletter author to the requesting user."""
        serializer.save(author=self.request.user)


# ===========================================================================
# Template / HTML views — public
# ===========================================================================

def signup(request):
    """
    Render the account-creation page and process sign-up submissions.

    GET  /signup/ -- display the sign-up form with role selection.
    POST /signup/ -- validate, create the user, log them in, and redirect
                     to the homepage.

    Uses ``SignUpForm`` from ``forms.py``, which extends Django's built-in
    ``UserCreationForm`` with an email field and a role choice.
    """
    if request.method == "POST":
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.role = form.cleaned_data["role"]
            user.email = form.cleaned_data.get("email", "")
            user.save()
            auth_login(request, user)
            messages.success(
                request,
                f"Welcome, {user.username}! Your account has been created.",
            )
            return redirect("home")
    else:
        form = SignUpForm()

    return render(request, "newsapp/signup.html", {"form": form})


def home(request):
    """
    Render the site homepage showing the latest approved articles.

    GET /

    Displays up to 20 approved articles — the first as a featured hero and
    the rest in a responsive card grid.  Unauthenticated visitors see a
    welcome banner with links to sign up or sign in.
    """
    articles = (
        Article.objects.filter(approved=True)
        .select_related("author", "publisher")[:20]
    )
    return render(request, "newsapp/home.html", {"articles": articles})


# ===========================================================================
# Template / HTML views — articles
# ===========================================================================

def article_list(request):
    """
    Render the full approved article listing.

    GET /articles/

    Authenticated journalists and editors also see an inline Edit shortcut
    and a "Write article" call-to-action rendered by the template.
    """
    articles = (
        Article.objects.filter(approved=True)
        .select_related("author", "publisher")
    )
    return render(request, "newsapp/article_list.html", {"articles": articles})


def article_detail(request, pk: int):
    """
    Render the detail page for a single article.

    GET /articles/<pk>/

    Unapproved articles are visible only to their author and to editors.
    All other visitors receive a 404.
    """
    article = get_object_or_404(Article, pk=pk)
    is_privileged = request.user.is_authenticated and (
        request.user.is_editor or article.author == request.user
    )
    if not article.approved and not is_privileged:
        raise Http404
    return render(request, "newsapp/article_detail.html", {"article": article})


@login_required
def article_approval(request):
    """
    Render the editorial approval dashboard (editor only).

    GET /articles/approval/

    Splits articles into pending and approved groups and passes both to
    the template.  Non-editors are redirected to the homepage with an
    error message.
    """
    if not request.user.is_editor:
        messages.error(request, "Only editors can access the approval page.")
        return redirect("/")

    pending = (
        Article.objects.filter(approved=False)
        .select_related("author", "publisher")
    )
    approved = (
        Article.objects.filter(approved=True)
        .select_related("author", "publisher")
    )
    return render(
        request,
        "newsapp/article_approval.html",
        {"pending": pending, "approved": approved},
    )


@login_required
@require_POST
def approve_article_view(request, pk: int):
    """
    Approve a single article via an HTML form POST (editor only).

    POST /articles/<pk>/approve/

    Sets ``approved=True``, records the approving editor and timestamp,
    saves the article (triggering the approval signal), and redirects to
    the approval dashboard.
    """
    if not request.user.is_editor:
        messages.error(request, "Only editors can approve articles.")
        return redirect("/")

    article = get_object_or_404(Article, pk=pk)
    article.approved = True
    article.approved_by = request.user
    article.approved_at = timezone.now()
    article.save()
    messages.success(request, f'Article "{article.title}" approved.')
    return redirect("article-approval")


@login_required
@require_POST
def unapprove_article_view(request, pk: int):
    """
    Retract approval for a single article via an HTML form POST (editor only).

    POST /articles/<pk>/unapprove/

    Clears ``approved``, ``approved_by``, and ``approved_at``, then
    redirects to the approval dashboard.
    """
    if not request.user.is_editor:
        messages.error(request, "Only editors can unapprove articles.")
        return redirect("/")

    article = get_object_or_404(Article, pk=pk)
    article.approved = False
    article.approved_by = None
    article.approved_at = None
    article.save()
    messages.success(request, f'Article "{article.title}" unapproved.')
    return redirect("article-approval")


@login_required
def article_create(request):
    """
    Render the article creation form and process submissions.

    GET  /articles/new/ -- display a blank ``ArticleForm``.
    POST /articles/new/ -- validate and save the new article (unapproved
                           by default), then redirect to My Articles.

    Accessible to journalists and editors only.  Readers are redirected
    to the homepage with an error message.
    """
    if request.user.is_reader:
        messages.error(request, "Readers cannot create articles.")
        return redirect("home")

    if request.method == "POST":
        form = ArticleForm(request.POST)
        if form.is_valid():
            article = Article.objects.create(
                title=form.cleaned_data["title"],
                content=form.cleaned_data["content"],
                author=request.user,
                publisher=form.cleaned_data.get("publisher"),
                approved=False,
            )
            messages.success(
                request,
                f'"{article.title}" submitted — awaiting editorial approval.',
            )
            return redirect("my-articles")
    else:
        form = ArticleForm()

    return render(
        request,
        "newsapp/article_form.html",
        {"form": form, "action": "Create", "article": None},
    )


@login_required
def article_edit(request, pk: int):
    """
    Render the article edit form and process updates.

    GET  /articles/<pk>/edit/ -- display the form pre-filled with
                                  the current article data.
    POST /articles/<pk>/edit/ -- validate and save the changes, then
                                  redirect to the article detail page.

    Access: the article's own journalist or any editor.
    """
    article = get_object_or_404(Article, pk=pk)
    if not (request.user.is_editor or article.author == request.user):
        messages.error(request, "You do not have permission to edit this article.")
        return redirect("article-list")

    if request.method == "POST":
        form = ArticleForm(request.POST)
        if form.is_valid():
            article.title = form.cleaned_data["title"]
            article.content = form.cleaned_data["content"]
            article.publisher = form.cleaned_data.get("publisher")
            article.save()
            messages.success(request, f'"{article.title}" updated.')
            return redirect("article-detail", pk=article.pk)
    else:
        form = ArticleForm(
            initial={
                "title": article.title,
                "content": article.content,
                "publisher": article.publisher,
            }
        )

    return render(
        request,
        "newsapp/article_form.html",
        {"form": form, "action": "Edit", "article": article},
    )


@login_required
@require_POST
def article_delete(request, pk: int):
    """
    Delete an article via an HTML form POST.

    POST /articles/<pk>/delete/

    Access: the article's own journalist or any editor.  After deletion
    the user is redirected to My Articles with a success message.
    """
    article = get_object_or_404(Article, pk=pk)
    if not (request.user.is_editor or article.author == request.user):
        messages.error(
            request, "You do not have permission to delete this article."
        )
        return redirect("article-list")

    title = article.title
    article.delete()
    messages.success(request, f'"{title}" deleted.')
    return redirect("my-articles")


# ===========================================================================
# Template / HTML views — newsletters
# ===========================================================================

def newsletter_list(request):
    """
    Render the newsletter listing page.

    GET /newsletters/

    All authenticated users may view all newsletters.
    """
    newsletters = Newsletter.objects.select_related("author").all()
    return render(
        request, "newsapp/newsletter_list.html", {"newsletters": newsletters}
    )


# ===========================================================================
# Template / HTML views — reader feed and subscriptions
# ===========================================================================

@login_required
def my_feed(request):
    """
    Render the reader's personalised article feed.

    GET /my-feed/

    Combines approved articles from the reader's subscribed publishers and
    subscribed journalists into a single de-duplicated queryset.  The
    sidebar lists all publishers and journalists with subscribe/unsubscribe
    toggle buttons.

    Non-readers are redirected to the homepage.
    """
    if not request.user.is_reader:
        messages.error(request, "My Feed is only available to Readers.")
        return redirect("home")

    subscribed_articles = (
        Article.objects.filter(approved=True)
        .filter(
            Q(publisher__in=request.user.subscribed_publishers.all())
            | Q(author__in=request.user.subscribed_journalists.all())
        )
        .select_related("author", "publisher")
        .distinct()
    )
    all_publishers = Publisher.objects.all()
    all_journalists = User.objects.filter(role="journalist").order_by("username")

    return render(
        request,
        "newsapp/my_feed.html",
        {
            "articles": subscribed_articles,
            "all_publishers": all_publishers,
            "all_journalists": all_journalists,
        },
    )


@login_required
@require_POST
def subscribe_publisher(request, pk: int):
    """
    Toggle the requesting reader's subscription to a publisher.

    POST /subscribe/publisher/<pk>/

    If already subscribed, the subscription is removed; otherwise it is
    added.  Redirects back to My Feed after the operation.
    """
    if not request.user.is_reader:
        return redirect("home")

    publisher = get_object_or_404(Publisher, pk=pk)
    if publisher in request.user.subscribed_publishers.all():
        request.user.subscribed_publishers.remove(publisher)
        messages.success(request, f"Unsubscribed from {publisher.name}.")
    else:
        request.user.subscribed_publishers.add(publisher)
        messages.success(request, f"Subscribed to {publisher.name}.")

    return redirect("my-feed")


@login_required
@require_POST
def subscribe_journalist(request, pk: int):
    """
    Toggle the requesting reader's subscription to a journalist.

    POST /subscribe/journalist/<pk>/

    If already subscribed, the subscription is removed; otherwise it is
    added.  Redirects back to My Feed after the operation.
    """
    if not request.user.is_reader:
        return redirect("home")

    journalist = get_object_or_404(User, pk=pk, role="journalist")
    if journalist in request.user.subscribed_journalists.all():
        request.user.subscribed_journalists.remove(journalist)
        messages.success(request, f"Unsubscribed from @{journalist.username}.")
    else:
        request.user.subscribed_journalists.add(journalist)
        messages.success(request, f"Subscribed to @{journalist.username}.")

    return redirect("my-feed")


# ===========================================================================
# Template / HTML views — journalist / editor dashboard
# ===========================================================================

@login_required
def my_articles(request):
    """
    Render the article management dashboard.

    GET /my-articles/

    - Journalists see only their own articles (approved and pending).
    - Editors see every article in the system.

    The template provides inline edit, approve/unapprove, and delete
    controls appropriate to the requesting user's role.
    """
    if request.user.is_reader:
        messages.error(request, "This section is for Journalists and Editors.")
        return redirect("home")

    if request.user.is_editor:
        articles = Article.objects.all().select_related("author", "publisher")
    else:
        articles = (
            Article.objects.filter(author=request.user)
            .select_related("author", "publisher")
        )

    return render(request, "newsapp/my_articles.html", {"articles": articles})
