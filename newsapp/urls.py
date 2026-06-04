"""
REST API URL configuration for the newsapp application.

All routes are mounted under the ``/api/`` prefix defined in the project
root ``urls.py``.  DRF's ``DefaultRouter`` auto-generates the standard
collection and detail routes for each registered ViewSet.

Registered ViewSets
-------------------
/api/users/          -- UserViewSet
/api/publishers/     -- PublisherViewSet
/api/articles/       -- ArticleViewSet  (includes /subscribed/, /approve/, /unapprove/)
/api/newsletters/    -- NewsletterViewSet

Auth endpoints (manual)
-----------------------
POST /api/auth/register/  -- create account and receive token
POST /api/auth/login/     -- authenticate and receive token
POST /api/auth/logout/    -- invalidate the current token
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"publishers", views.PublisherViewSet, basename="publisher")
router.register(r"articles", views.ArticleViewSet, basename="article")
router.register(r"newsletters", views.NewsletterViewSet, basename="newsletter")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", views.RegisterView.as_view(), name="api-register"),
    path("auth/login/", views.LoginView.as_view(), name="api-login"),
    path("auth/logout/", views.LogoutView.as_view(), name="api-logout"),
]
