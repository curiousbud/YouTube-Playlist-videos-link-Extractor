from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import yt_dlp
from .forms import LinkForm
import concurrent.futures
import re
from django.core.cache import cache
import json
import logging

# Set up logging for production
logger = logging.getLogger(__name__)

def fetch_video_details_fast(video_id):
    """ Optimized helper function to fetch video details using video ID. """
    # Create cache key
    cache_key = f"video_{video_id}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    try:
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
            'simulate': True,  # Simulation mode - never download
            'no_color': True,  # No color output
            # Only extract essential info for speed
            'writeinfojson': False,
            'writesubtitles': False,
            'writeautomaticsub': False,
            'writethumbnail': False,
            'writeall': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            video_data = {
                'url': video_url,
                'title': info.get('title', 'Unknown Title'),
                'thumbnail': info.get('thumbnail', ''),
                'duration': info.get('duration', 0),
                'view_count': info.get('view_count', 0),
                'upload_date': info.get('upload_date', ''),
            }
            
            # Cache for 1 hour
            cache.set(cache_key, video_data, 3600)
            return video_data
            
    except Exception as e:
        logger.error(f"Error fetching video details for {video_id}: {e}")
        error_data = {
            'url': f"https://www.youtube.com/watch?v={video_id}",
            'title': 'Error loading video',
            'thumbnail': '',
            'duration': 0,
            'view_count': 0,
            'upload_date': '',
        }
        return error_data

def ytlink(request):
    form = LinkForm(request.POST or None)
    video_data = []
    playlist_info = {}
    videos_per_page = int(request.POST.get('videos_per_page', 10))  # Default 10 per page
    
    # Store pagination preference in session
    request.session['videos_per_page'] = videos_per_page

    if request.method == 'POST' and form.is_valid():
        link = form.cleaned_data['link']
        
        try:
            # Check if it's a playlist or single video - improved detection
            is_playlist = ('playlist' in link.lower() or 
                          'list=' in link.lower() or 
                          '&list=' in link.lower() or 
                          '?list=' in link.lower())
            
            if is_playlist:
                # Extract playlist info with minimal data - NO DOWNLOADING
                ydl_opts = {
                    'quiet': True,  # Reduce verbose output
                    'no_warnings': True,  # Hide warnings
                    'extract_flat': True,  # Fast playlist extraction - only get basic info
                    'skip_download': True,  # Never download
                    'ignoreerrors': True,  # Continue on errors
                    'no_color': True,  # No color output
                    'simulate': True,  # Simulation mode - never download anything
                    'listformats': False,  # Don't list formats
                    'writeinfojson': False,  # Don't write info files
                    'writesubtitles': False,  # Don't write subtitles
                    'writeautomaticsub': False,  # Don't write auto subtitles
                    'writethumbnail': False,  # Don't write thumbnails
                    'writeall': False,  # Don't write anything
                }
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    playlist_data = ydl.extract_info(link, download=False)
                    
                    if playlist_data and 'entries' in playlist_data:
                        entries = playlist_data['entries']
                        
                        # Filter out None entries and count valid ones
                        valid_entries = [entry for entry in entries if entry is not None]
                        
                        if valid_entries:
                            # Store playlist information
                            playlist_info = {
                                'title': playlist_data.get('title', 'Unknown Playlist'),
                                'uploader': playlist_data.get('uploader', 'Unknown'),
                                'video_count': len(valid_entries),
                            }
                            
                            # Extract video IDs directly - filter out None entries
                            video_ids = []
                            for entry in valid_entries:
                                if entry and entry.get('id'):
                                    video_ids.append(entry['id'])
                            
                            if video_ids:
                                # For real-time loading with pagination
                                total_videos = len(video_ids)
                                
                                # Use pagination settings
                                if videos_per_page == -1:  # "All" option
                                    videos_to_show = total_videos
                                else:
                                    videos_to_show = min(videos_per_page, total_videos)
                                
                                # Always use real-time loading for playlists > 5 videos or when pagination is used
                                if total_videos > 5 or videos_per_page != -1:
                                    # Return minimal data for real-time processing
                                    video_data = []
                                    initial_batch = min(3, videos_to_show)  # Show first 3 immediately
                                    
                                    for vid_id in video_ids[:initial_batch]:
                                        video_data.append(fetch_video_details_fast(vid_id))
                                    
                                    # Store remaining video IDs for client-side processing
                                    remaining_ids = video_ids[initial_batch:videos_to_show]
                                    request.session['remaining_video_ids'] = remaining_ids
                                    request.session['current_video_count'] = len(video_data)
                                    request.session['total_video_count'] = videos_to_show
                                    request.session['playlist_title'] = playlist_info.get('title', 'Unknown')
                                else:
                                    # Use original concurrent processing for small playlists
                                    max_workers = min(15, len(video_ids))
                                    
                                    # Fetch video details concurrently
                                    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                                        # Submit all tasks
                                        future_to_id = {executor.submit(fetch_video_details_fast, vid_id): vid_id 
                                                      for vid_id in video_ids}
                                        
                                        # Collect results as they complete
                                        temp_video_data = []
                                        for future in concurrent.futures.as_completed(future_to_id):
                                            try:
                                                result = future.result(timeout=20)  # Increased timeout
                                                temp_video_data.append(result)
                                            except concurrent.futures.TimeoutError:
                                                vid_id = future_to_id[future]
                                                temp_video_data.append({
                                                    'url': f"https://www.youtube.com/watch?v={vid_id}",
                                                    'title': 'Timeout loading video',
                                                    'thumbnail': '',
                                                    'duration': 0,
                                                    'view_count': 0,
                                                    'upload_date': '',
                                                })
                                            except Exception as e:
                                                vid_id = future_to_id[future]
                                                temp_video_data.append({
                                                    'url': f"https://www.youtube.com/watch?v={vid_id}",
                                                    'title': 'Error loading video',
                                                    'thumbnail': '',
                                                    'duration': 0,
                                                    'view_count': 0,
                                                    'upload_date': '',
                                                })
                                        
                                        # Create mapping to maintain order
                                        id_to_data = {}
                                        for data in temp_video_data:
                                            if data and data.get('url'):
                                                try:
                                                    vid_id = data['url'].split('v=')[1].split('&')[0]
                                                    id_to_data[vid_id] = data
                                                except (IndexError, AttributeError):
                                                    pass
                                        
                                        # Maintain original playlist order
                                        video_data = []
                                        for vid_id in video_ids:
                                            if vid_id in id_to_data:
                                                video_data.append(id_to_data[vid_id])
                                            else:
                                                # Add placeholder for missing videos
                                                video_data.append({
                                                    'url': f"https://www.youtube.com/watch?v={vid_id}",
                                                    'title': 'Video not found or private',
                                                    'thumbnail': '',
                                                    'duration': 0,
                                                    'view_count': 0,
                                                    'upload_date': '',
                                                })
                            else:
                                pass  # No valid video IDs found in playlist
                        else:
                            pass  # No valid entries found in playlist
                    else:
                        # Try treating as single video
                        video_id_match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11})', link)
                        if video_id_match:
                            video_id = video_id_match.group(1)
                            video_data = [fetch_video_details_fast(video_id)]
                        
            else:
                # Single video - extract video ID and process
                video_id_match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11})', link)
                if video_id_match:
                    video_id = video_id_match.group(1)
                    video_data = [fetch_video_details_fast(video_id)]
                    
        except Exception as e:
            logger.error(f"An error occurred processing link: {e}")

    return render(request, 'linkgen/index.html', {
        'form': form, 
        'video_data': video_data, 
        'playlist_info': playlist_info,
        'videos_per_page': videos_per_page,
        'total_videos': request.session.get('total_video_count', len(video_data)),
        'current_count': request.session.get('current_video_count', len(video_data)),
    })

@csrf_exempt
def process_single_video(request, video_id):
    """AJAX endpoint to process a single video and return its data"""
    if request.method == 'POST':
        try:
            video_data = fetch_video_details_fast(video_id)
            return JsonResponse({
                'success': True,
                'video': video_data
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def check_remaining_videos(request):
    """Check if there are remaining videos to process"""
    if request.method == 'POST':
        remaining_ids = request.session.get('remaining_video_ids', [])
        current_count = request.session.get('current_video_count', 0)
        
        if remaining_ids:
            # Clear the session data after retrieving it
            del request.session['remaining_video_ids']
            return JsonResponse({
                'has_remaining': True,
                'video_ids': remaining_ids,
                'current_count': current_count
            })
        
        return JsonResponse({'has_remaining': False})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})
