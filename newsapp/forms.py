"""
Forms for the newsapp HTML interface.

Keeps form definitions separate from view logic so that each concern
lives in its own module (single-responsibility principle).

Classes:
    SignUpForm      -- registration form supporting all three user roles.
    ArticleForm     -- shared create/edit form for article content.
    NewsletterForm  -- shared create/edit form for newsletter content.
"""

from django import forms
from django.contrib.auth.forms import UserCreationForm

from .models import Article, Publisher, User


class SignUpForm(UserCreationForm):
    """
    Extended registration form that adds an email field and a role selector.

    Inherits all username/password validation from Django's built-in
    ``UserCreationForm``.  The role field exposes all three application
    roles so that any user type can self-register.
    """

    email = forms.EmailField(
        required=False,
        label="Email",
        help_text="Optional. Used for article-approval notifications.",
    )
    role = forms.ChoiceField(
        choices=[
            ("reader", "Reader"),
            ("journalist", "Journalist"),
            ("editor", "Editor"),
        ],
        label="Role",
        help_text="Determines what actions you can perform on the site.",
    )

    class Meta(UserCreationForm.Meta):
        """Use the custom User model and declare the field order."""

        model = User
        fields = ("username", "email", "role", "password1", "password2")


class ArticleForm(forms.Form):
    """
    Form for creating and editing articles via the HTML interface.

    Used by both ``article_create`` and ``article_edit`` views.  The
    publisher field is optional — leaving it blank marks the article as
    independent (no affiliated publisher).
    """

    title = forms.CharField(
        max_length=500,
        label="Title",
        widget=forms.TextInput(
            attrs={"placeholder": "Give your article a compelling title"}
        ),
    )
    content = forms.CharField(
        label="Content",
        widget=forms.Textarea(
            attrs={"rows": 14, "placeholder": "Write your article here…"}
        ),
    )
    publisher = forms.ModelChoiceField(
        queryset=Publisher.objects.all(),
        required=False,
        empty_label="Independent — no publisher",
        label="Publisher",
        help_text="Select a publisher or leave blank for an independent article.",
    )


class NewsletterForm(forms.Form):
    """
    Form for creating and editing newsletters via the HTML interface.

    Used by both ``newsletter_create`` and ``newsletter_edit`` views.
    The articles field is filtered to approved articles only so that
    unpublished drafts cannot be included in a newsletter.
    """

    title = forms.CharField(
        max_length=500,
        label="Title",
        widget=forms.TextInput(
            attrs={"placeholder": "Give your newsletter a descriptive title"}
        ),
    )
    description = forms.CharField(
        label="Description",
        widget=forms.Textarea(
            attrs={"rows": 4, "placeholder": "A short summary shown in the newsletter listing…"}
        ),
    )
    articles = forms.ModelMultipleChoiceField(
        queryset=Article.objects.filter(approved=True).select_related("author"),
        required=False,
        label="Articles",
        help_text="Select one or more approved articles to include in this newsletter.",
        widget=forms.CheckboxSelectMultiple,
    )
