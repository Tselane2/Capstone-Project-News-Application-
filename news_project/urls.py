"""
Root URL configuration for the news_project Django project.

Route layout
------------
/admin/    -- Django admin site
/api/      -- REST API endpoints (newsapp.urls via DRF router)
/          -- Template-based HTML frontend (newsapp.frontend_urls)
/login/    -- Django's built-in session login view
/logout/   -- Django's built-in session logout view (redirects to /)
"""

from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # REST API — all DRF endpoints live under /api/
    path("api/", include("newsapp.urls")),

    # HTML frontend — mounted at the root so pages have clean URLs
    path("", include("newsapp.frontend_urls")),

    # Session authentication for the HTML interface
    path(
        "login/",
        auth_views.LoginView.as_view(template_name="newsapp/login.html"),
        name="login",
    ),
    path(
        "logout/",
        auth_views.LogoutView.as_view(next_page="/"),
        name="logout",
    ),
]
