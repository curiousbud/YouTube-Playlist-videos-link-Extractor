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
    view_mode = request.POST.get('view_mode', 'paginated')  # 'all' or 'paginated'
    
    # Store pagination preference in session
    request.session['videos_per_page'] = videos_per_page
    request.session['view_mode'] = view_mode

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
                                # For real-time loading system
                                total_videos = len(video_ids)
                                
                                # Store all video IDs for real-time processing
                                request.session['all_video_ids'] = video_ids
                                request.session['total_video_count'] = total_videos
                                request.session['playlist_title'] = playlist_info.get('title', 'Unknown')
                                request.session['playlist_uploader'] = playlist_info.get('uploader', 'Unknown')
                                
                                # Load initial batch immediately (first 3-5 videos)
                                initial_batch_size = min(5, total_videos)
                                initial_video_ids = video_ids[:initial_batch_size]
                                
                                # Fetch initial videos concurrently for immediate display
                                max_workers = min(5, len(initial_video_ids))
                                with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                                    future_to_id = {executor.submit(fetch_video_details_fast, vid_id): vid_id 
                                                  for vid_id in initial_video_ids}
                                    
                                    temp_video_data = []
                                    for future in concurrent.futures.as_completed(future_to_id):
                                        try:
                                            result = future.result(timeout=15)
                                            temp_video_data.append(result)
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
                                    
                                    # Maintain order for initial batch
                                    id_to_data = {}
                                    for data in temp_video_data:
                                        if data and data.get('url'):
                                            try:
                                                vid_id = data['url'].split('v=')[1].split('&')[0]
                                                id_to_data[vid_id] = data
                                            except (IndexError, AttributeError):
                                                pass
                                    
                                    video_data = []
                                    for vid_id in initial_video_ids:
                                        if vid_id in id_to_data:
                                            video_data.append(id_to_data[vid_id])
                                        else:
                                            video_data.append({
                                                'url': f"https://www.youtube.com/watch?v={vid_id}",
                                                'title': 'Video not found or private',
                                                'thumbnail': '',
                                                'duration': 0,
                                                'view_count': 0,
                                                'upload_date': '',
                                            })
                                
                                # Store remaining video IDs for client-side loading
                                remaining_ids = video_ids[initial_batch_size:]
                                request.session['remaining_video_ids'] = remaining_ids
                                request.session['current_video_count'] = len(video_data)
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
        'view_mode': view_mode,
        'total_videos': request.session.get('total_video_count', len(video_data)),
        'current_count': request.session.get('current_video_count', len(video_data)),
        'has_remaining': len(request.session.get('remaining_video_ids', [])) > 0,
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
            # Don't clear the session data yet - let client control the flow
            return JsonResponse({
                'has_remaining': True,
                'video_ids': remaining_ids,
                'current_count': current_count,
                'total_count': request.session.get('total_video_count', 0)
            })
        
        return JsonResponse({'has_remaining': False})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def get_paginated_videos(request):
    """Get a specific page of videos from the stored video IDs"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            page = int(data.get('page', 1))
            per_page = int(data.get('per_page', 10))
            
            all_video_ids = request.session.get('all_video_ids', [])
            if not all_video_ids:
                return JsonResponse({'success': False, 'error': 'No video data available'})
            
            # Calculate pagination
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            page_video_ids = all_video_ids[start_idx:end_idx]
            
            if not page_video_ids:
                return JsonResponse({'success': False, 'error': 'Invalid page'})
            
            # Fetch video details for this page
            video_data = []
            max_workers = min(10, len(page_video_ids))
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_id = {executor.submit(fetch_video_details_fast, vid_id): vid_id 
                              for vid_id in page_video_ids}
                
                temp_video_data = []
                for future in concurrent.futures.as_completed(future_to_id):
                    try:
                        result = future.result(timeout=15)
                        temp_video_data.append(result)
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
                
                # Maintain order
                id_to_data = {}
                for data in temp_video_data:
                    if data and data.get('url'):
                        try:
                            vid_id = data['url'].split('v=')[1].split('&')[0]
                            id_to_data[vid_id] = data
                        except (IndexError, AttributeError):
                            pass
                
                for vid_id in page_video_ids:
                    if vid_id in id_to_data:
                        video_data.append(id_to_data[vid_id])
                    else:
                        video_data.append({
                            'url': f"https://www.youtube.com/watch?v={vid_id}",
                            'title': 'Video not found or private',
                            'thumbnail': '',
                            'duration': 0,
                            'view_count': 0,
                            'upload_date': '',
                        })
            
            total_videos = len(all_video_ids)
            total_pages = (total_videos + per_page - 1) // per_page
            
            return JsonResponse({
                'success': True,
                'videos': video_data,
                'page': page,
                'per_page': per_page,
                'total_videos': total_videos,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            })
            
        except Exception as e:
            logger.error(f"Error in get_paginated_videos: {e}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})
