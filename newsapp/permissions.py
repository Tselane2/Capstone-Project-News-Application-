"""
Custom DRF permission classes for the newsapp application.

Permission matrix
-----------------
                        GET     POST    PUT/PATCH   DELETE  APPROVE
Reader                  yes     no      no          no      no
Journalist (own)        yes     yes     yes         yes     no
Editor (any)            yes     no      yes         yes     yes

Classes
-------
IsReader                -- passes only for users with role ``reader``.
IsJournalist            -- passes only for users with role ``journalist``.
IsEditor                -- passes only for users with role ``editor``.
IsJournalistOrEditor    -- passes for journalists and editors.
ArticlePermission       -- full article CRUD rule set (see matrix above).
ApproveArticlePermission -- editor-only guard for approval actions.
NewsletterPermission    -- newsletter CRUD rule set.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsReader(BasePermission):
    """Allow access only to authenticated users whose role is *reader*."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_reader
        )


class IsJournalist(BasePermission):
    """Allow access only to authenticated users whose role is *journalist*."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_journalist
        )


class IsEditor(BasePermission):
    """Allow access only to authenticated users whose role is *editor*."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_editor
        )


class IsJournalistOrEditor(BasePermission):
    """Allow access to authenticated journalists and editors."""

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_journalist or request.user.is_editor


class ArticlePermission(BasePermission):
    """
    Role-based permission for article endpoints.

    View-level (``has_permission``)
    --------------------------------
    - Safe methods (GET, HEAD, OPTIONS): any authenticated user.
    - POST: journalists only (editors curate; they do not create via API).
    - PUT / PATCH / DELETE: journalists or editors (object-level check
      further restricts journalists to their own articles).

    Object-level (``has_object_permission``)
    -----------------------------------------
    - Safe methods: always allowed.
    - Editors: full access to any article.
    - Journalists: only their own article.
    """

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            # Only journalists may create articles via the REST API.
            return request.user.is_journalist
        # PUT / PATCH / DELETE — narrowed further at object level.
        return request.user.is_journalist or request.user.is_editor

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_editor:
            return True
        if request.user.is_journalist:
            return obj.author == request.user
        return False


class ApproveArticlePermission(BasePermission):
    """
    Guard for the ``/approve/`` and ``/unapprove/`` article actions.

    Only editors may change the approval state of an article.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_editor
        )


class NewsletterPermission(BasePermission):
    """
    Role-based permission for newsletter endpoints.

    View-level (``has_permission``)
    --------------------------------
    - Safe methods: any authenticated user (readers may browse all newsletters).
    - POST / PUT / PATCH / DELETE: journalists or editors.

    Object-level (``has_object_permission``)
    -----------------------------------------
    - Safe methods: always allowed.
    - Editors: full access to any newsletter.
    - Journalists: only their own newsletter.
    """

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_journalist or request.user.is_editor

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_editor:
            return True
        if request.user.is_journalist:
            return obj.author == request.user
        return False
