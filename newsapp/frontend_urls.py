"""
Template (HTML) URL configuration for the newsapp application.

These routes serve server-rendered pages using Django's template engine.
They are mounted at the root (``/``) in the project ``urls.py``.

Route groups
------------
Public pages
    /                         -- homepage (latest approved articles)
    /signup/                  -- account creation with role selection

Article pages
    /articles/                -- full article listing
    /articles/new/            -- create article form (journalist / editor)
    /articles/<pk>/           -- article detail
    /articles/<pk>/edit/      -- edit article form (author or editor)
    /articles/<pk>/delete/    -- POST-only delete (author or editor)
    /articles/approval/       -- editorial approval dashboard (editor only)
    /articles/<pk>/approve/   -- POST-only approve action (editor only)
    /articles/<pk>/unapprove/ -- POST-only unapprove action (editor only)

Newsletter pages
    /newsletters/             -- newsletter listing

Reader feed and subscriptions
    /my-feed/                          -- personalised article feed
    /subscribe/publisher/<pk>/         -- toggle publisher subscription
    /subscribe/journalist/<pk>/        -- toggle journalist subscription

Journalist / editor dashboard
    /my-articles/             -- article management table
"""

from django.urls import path

from . import views

urlpatterns = [
    # -- Public ----------------------------------------------------------
    path("", views.home, name="home"),
    path("signup/", views.signup, name="signup"),

    # -- Articles --------------------------------------------------------
    path("articles/", views.article_list, name="article-list"),
    path("articles/new/", views.article_create, name="article-create"),
    path("articles/<int:pk>/", views.article_detail, name="article-detail"),
    path("articles/<int:pk>/edit/", views.article_edit, name="article-edit"),
    path(
        "articles/<int:pk>/delete/",
        views.article_delete,
        name="article-delete",
    ),
    path(
        "articles/approval/",
        views.article_approval,
        name="article-approval",
    ),
    path(
        "articles/<int:pk>/approve/",
        views.approve_article_view,
        name="approve-article",
    ),
    path(
        "articles/<int:pk>/unapprove/",
        views.unapprove_article_view,
        name="unapprove-article",
    ),

    # -- Newsletters -----------------------------------------------------
    path("newsletters/", views.newsletter_list, name="newsletter-list"),

    # -- Reader feed & subscriptions ------------------------------------
    path("my-feed/", views.my_feed, name="my-feed"),
    path(
        "subscribe/publisher/<int:pk>/",
        views.subscribe_publisher,
        name="subscribe-publisher",
    ),
    path(
        "subscribe/journalist/<int:pk>/",
        views.subscribe_journalist,
        name="subscribe-journalist",
    ),

    # -- Journalist / editor dashboard ----------------------------------
    path("my-articles/", views.my_articles, name="my-articles"),
]
