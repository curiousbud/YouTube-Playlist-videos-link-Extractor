# YouTube Playlist Video Extractor

This Django project allows users to input a YouTube playlist URL and extract individual video links along with their titles and thumbnails. The app supports concurrent video fetching for speed and includes caching and pagination for better performance.

## Features

- Extracts all video links from a given YouTube playlist.
- Displays each video's title, thumbnail, and clickable link.
- Optimized for performance using multi-threading for faster video data fetching.
- Caches playlist data to avoid redundant YouTube requests.
- Implements pagination to handle large playlists efficiently.
  
## Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/yt-playlist-extractor.git
cd yt-playlist-extractor
```

### 2. Set up a virtual environment
It's recommended to use a virtual environment to manage dependencies.

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

### 3. Install dependencies
Install the necessary Python libraries from the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

If you don't have a `requirements.txt`, create one and add the following dependencies:

```
Django==3.2
pytube==12.0.0
requests==2.25.1
```

### 4. Set up Django
Before running the app, you'll need to perform the initial Django setup.

- **Migrate the database**:

```bash
python manage.py migrate
```

- **Create a superuser (optional)** if you want to access the Django admin panel:

```bash
python manage.py createsuperuser
```

### 5. Run the Django development server
Once the setup is complete, run the Django development server:

```bash
python manage.py runserver
```

Open your browser and go to `http://127.0.0.1:8000/`.

## Usage

1. Enter a valid YouTube playlist URL into the input form on the homepage.
2. Click the **Submit** button.
3. The app will display all the videos in the playlist, including:
   - Video Thumbnail
   - Video Title (as a clickable link to the YouTube video)

### Example

- Input: A valid YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID`)
- Output: A list of video thumbnails, titles, and links for each video in the playlist.

## Performance Optimization

- **Threading for Video Fetching**: Video details are fetched concurrently using Python's `concurrent.futures.ThreadPoolExecutor`, which speeds up the process when dealing with playlists with many videos.
  
- **Caching**: Playlist data is cached for 1 hour using Django's caching framework to prevent multiple requests to YouTube for the same playlist.

- **Pagination**: The app displays 10 videos per page, improving the user experience and preventing long load times for large playlists.

## Customization

### Pagination

If you want to adjust the number of videos displayed per page, modify the pagination in `views.py`:

```python
paginator = Paginator(video_data, 10)  # Change 10 to the number of videos you want per page
```

### Cache Timeout

You can change the cache timeout (in seconds) by modifying the `cache.set()` call in `views.py`:

```python
cache.set(cache_key, video_data, timeout=3600)  # Cache timeout in seconds (currently set to 1 hour)
```

## Dependencies

- **Django**: Web framework used to build the application.
- **Pytube**: A Python library to extract video details from YouTube playlists.
- **Requests**: For validating YouTube URLs.

## Troubleshooting

### 1. **Error: `ModuleNotFoundError: No module named 'requests'`**
   - Make sure you've installed the `requests` library:
   ```bash
   pip install requests
   ```

### 2. **Error: YouTube Playlist Data Not Loading**
   - Double-check that the playlist URL is valid.
   - Ensure you have an active internet connection for accessing YouTube.

### 3. **Slow Performance**
   - For large playlists, pagination is essential to prevent slow page loading. Make sure the app is not trying to load too many videos at once.
   - Check the `ThreadPoolExecutor` for the `max_workers` parameter; reducing it may help manage the load more efficiently.

## Future Enhancements

- **YouTube Data API Integration**: For larger projects, you may want to integrate the YouTube Data API to handle more comprehensive playlist data extraction.
- **UI Improvements**: Add more styling to make the UI more visually appealing.
- **Playlist Download Option**: Provide users with the option to download the extracted playlist information as a CSV or JSON file.

## License

This project is licensed under the MIT License. Feel free to use and modify it as needed.
