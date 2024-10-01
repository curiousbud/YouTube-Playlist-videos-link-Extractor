from django.shortcuts import render
from pytube import Playlist
from .forms import LinkForm
import concurrent.futures

def fetch_video_details(video):
    """ Helper function to fetch video details (URL, title, and thumbnail). """
    return {
        'url': video.watch_url,
        'title': video.title,
        'thumbnail': video.thumbnail_url,
    }

def ytlink(request):
    form = LinkForm(request.POST or None)
    video_data = []

    if request.method == 'POST' and form.is_valid():
        link = form.cleaned_data['link']
        try:
            playlist = Playlist(link)

            # Use ThreadPoolExecutor to fetch video details concurrently
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                # Fetch video details concurrently
                video_data = list(executor.map(fetch_video_details, playlist.videos))
        except Exception as e:
            print(f"An error occurred: {e}")

    return render(request, 'linkgen/index.html', {'form': form, 'video_data': video_data})
