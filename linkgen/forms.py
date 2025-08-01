from django import forms
from django.core.exceptions import ValidationError
import re

class LinkForm(forms.Form):
    link = forms.CharField(
        max_length=500,
        widget=forms.TextInput(attrs={
            'class': 'form-control', 
            'placeholder': 'Enter YouTube Playlist or Video URL',
            'style': 'font-size: 14px;'
        }),
        help_text="Enter a YouTube playlist URL (with list= parameter) or individual video URL"
    )

    # Custom validation to check if the link is a valid YouTube URL
    def clean_link(self):
        link = self.cleaned_data.get('link')

        # Check if the link is a valid YouTube URL (basic validation)
        youtube_regex = re.compile(
            r'^(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/.+$')
        
        if not youtube_regex.match(link):
            raise ValidationError("Please enter a valid YouTube URL.")
        
        # Check if it looks like a playlist URL and warn if not
        is_playlist = ('list=' in link.lower() or 'playlist' in link.lower())
        if not is_playlist and ('?si=' in link or '&si=' in link):
            # This looks like a single video share URL
            pass  # Allow it but we'll handle it as single video
        
        return link
