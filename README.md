# YouTube Playlist Video Extractor

A modern Django web application that extracts video links and metadata from YouTube playlists with real-time loading and pagination features.

## ✨ Features

- **Playlist Extraction**: Extract all video links from YouTube playlists
- **Real-time Loading**: Progressive loading for large playlists with live progress indicators
- **Flexible Pagination**: Choose to display 5, 10, 15, 20, 50, or all videos per page
- **Multiple Copy Options**: Copy individual links, titles, or combined data
- **Smart Caching**: 1-hour cache for video metadata to improve performance
- **Responsive Design**: Modern Bootstrap 5 interface that works on all devices
- **Concurrent Processing**: Multi-threaded video fetching for optimal speed

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor.git
cd YouTube-Playlist-videos-link-Extractor
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations
```bash
python manage.py migrate
```

### 4. Start the Development Server
```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` in your browser.

## 📋 Usage

1. **Enter Playlist URL**: Paste a YouTube playlist URL in the input field
   - Format: `https://www.youtube.com/playlist?list=PLxxxxxx`
   - Or: `https://www.youtube.com/watch?v=xxxxx&list=PLxxxxxx`

2. **Select Pagination**: Choose how many videos to display per page (5-50 or all)

3. **Extract Videos**: Click "Extract Videos" to start processing

4. **Copy Options**: Use the copy buttons to grab:
   - Individual video links
   - Video titles
   - Combined title + link data
   - All links at once
   - All titles at once
   - All data combined

## 🛠️ Technical Details

### Modern Stack
- **Django 5.1.7**: Latest LTS version
- **yt-dlp 2025.x**: Reliable YouTube data extraction (replaces deprecated pytube)
- **Bootstrap 5.3**: Modern responsive UI
- **Concurrent Processing**: ThreadPoolExecutor for parallel video fetching

### Performance Features
- **Smart Caching**: Redis-compatible caching system
- **Real-time Loading**: AJAX-powered progressive loading
- **Error Handling**: Graceful handling of private/deleted videos
- **Session Management**: Maintains state across page interactions

## 🔧 Configuration

### Pagination Settings
Default pagination is 10 videos per page. Users can select from the dropdown:
- 5, 10, 15, 20, 50 videos per page
- "All videos" option for complete playlists

### Cache Configuration
Videos are cached for 1 hour by default. Modify in `settings.py`:
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'TIMEOUT': 3600,  # 1 hour
    }
}
```

## 📦 Dependencies

Core packages (see `requirements.txt` for versions):
- Django (5.1.7+)
- yt-dlp (2024.12.13+)
- django-crispy-forms
- crispy-bootstrap5

## 🔍 Troubleshooting

### Common Issues

**Videos not loading**: 
- Verify the playlist URL contains `list=` parameter
- Check internet connection
- Some videos may be private or region-restricted

**Slow performance**: 
- Use pagination for large playlists (>50 videos)
- Clear browser cache if needed
- Check console for JavaScript errors

**Form resubmission dialog**: 
- Fixed in latest version with proper state management
- Browser history is automatically managed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Django and modern web technologies
- Uses yt-dlp for reliable YouTube data extraction
- Bootstrap 5 for responsive design
