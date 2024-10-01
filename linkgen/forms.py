from django import forms
from django.core.exceptions import ValidationError
import re

class LinkForm(forms.Form):
    link = forms.CharField(
        max_length=255,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter YouTube Playlist URL'}),
        help_text="Enter a valid YouTube playlist URL"
    )

    # Custom validation to check if the link is a valid YouTube URL
    def clean_link(self):
        link = self.cleaned_data.get('link')

        # Check if the link is a valid YouTube URL (basic validation)
        youtube_regex = re.compile(
            r'^(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/.+$')
        
        if not youtube_regex.match(link):
            raise ValidationError("Please enter a valid YouTube URL.")
        
        return link
