# YouTube Playlist Video Extractor

A modern Django web application for extracting video links and metadata from YouTube playlists with advanced features like real-time loading, dual view modes, and comprehensive export options.

![Django](https://img.shields.io/badge/Django-4.2.14-green.svg)
![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

### Core Functionality
- **Playlist Extraction**: Extract all video URLs, titles, thumbnails, and metadata from YouTube playlists
- **Single Video Support**: Also works with individual YouTube video URLs
- **Bulk Operations**: Copy all links, titles, or combined data with one click
- **CSV Export**: Export playlist data to CSV format for external use

### User Experience
- **Real-time Loading**: Progressive video loading with live progress indicators and smooth animations
- **Dual View Modes**: 
  - **Paginated View**: Navigate through videos page by page (5, 10, 15, 20, 30, 50 videos per page)
  - **Real-time Stream**: Load all videos progressively in one continuous view
- **Responsive Design**: Modern Bootstrap 5 interface optimized for desktop and mobile devices
- **Interactive UI**: Toast notifications, loading spinners, and visual feedback

### Performance & Reliability
- **Concurrent Processing**: Multi-threaded video fetching using ThreadPoolExecutor
- **Smart Caching**: 1-hour cache for video metadata to reduce API calls and improve speed
- **Error Handling**: Graceful handling of private, deleted, or unavailable videos
- **Session Management**: Maintains state across page reloads and navigation

## 🛠️ Technology Stack

- **Backend**: Django 4.2.14 with Python 3.8+
- **Frontend**: Bootstrap 5.3, JavaScript ES6+, Bootstrap Icons
- **YouTube Integration**: yt-dlp library for reliable video extraction
- **Forms**: Django Crispy Forms with Bootstrap 5 styling
- **Caching**: Django's built-in caching framework
- **Database**: SQLite (development) / PostgreSQL (production ready)

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Git

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor.git
   cd YouTube-Playlist-videos-link-Extractor
   ```

2. **Create Virtual Environment** (Recommended)
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Database Migrations**
   ```bash
   python manage.py migrate
   ```

5. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

6. **Access Application**
   Open your browser and navigate to `http://127.0.0.1:8000/`

## 📖 Usage Guide

### Basic Usage

1. **Enter Playlist URL**
   - Paste a YouTube playlist URL in the input field
   - Supported formats:
     - `https://www.youtube.com/playlist?list=PLxxxxxx`
     - `https://www.youtube.com/watch?v=xxxxx&list=PLxxxxxx`
   - Single video URLs also supported

2. **Configure Display Settings**
   - **View Mode**: Choose between "Paginated View" or "Load All (Real-time Stream)"
   - **Videos per Page**: Select 5, 10, 15, 20, 30, or 50 videos per page (for paginated view)

3. **Extract Videos**
   - Click "Extract Videos" to start processing
   - Watch real-time progress indicator for large playlists
   - Videos load progressively for immediate access

4. **Export and Copy Options**
   - **Individual Actions**: Copy video link, title, or both for each video
   - **Bulk Actions**: Copy all links, all titles, or all data at once
   - **CSV Export**: Download complete playlist data as CSV file

### Advanced Features

#### View Modes
- **Paginated View**: Traditional page-by-page navigation with customizable page sizes
- **Real-time Stream**: Continuous loading of all videos with progress tracking

#### Copy Functions
- **Copy Video Link**: Individual video URL
- **Copy Video Title**: Video title text
- **Copy Title + Link**: Combined format for easy sharing
- **Copy All Links**: All video URLs (newline separated)
- **Copy All Titles**: All video titles (newline separated)
- **Copy All Data**: Formatted list with numbers, titles, and URLs

## 🏗️ Project Structure

```
YouTube-Playlist-videos-link-Extractor/
├── linkgen/                    # Main Django app
│   ├── views.py               # Core business logic and API endpoints
│   ├── models.py              # Database models
│   ├── forms.py               # Django forms for URL input
│   ├── urls.py                # URL routing configuration
│   └── templates/             # HTML templates
│       └── linkgen/
│           └── index.html     # Main application interface
├── ytlinkEX/                  # Django project configuration
│   ├── settings.py            # Development settings
│   ├── settings_production.py # Production-ready settings
│   ├── urls.py                # Main URL configuration
│   └── wsgi.py                # WSGI configuration
├── static/                    # Static files (CSS, JS, images)
├── requirements.txt           # Python dependencies
├── manage.py                  # Django management script
└── README.md                  # Project documentation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for environment-specific settings:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (for production)
DB_NAME=ytlinkex_prod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

### Production Deployment

For production deployment, use the included production settings:

```bash
python manage.py runserver --settings=ytlinkEX.settings_production
```

Or set environment variable:
```bash
export DJANGO_SETTINGS_MODULE=ytlinkEX.settings_production
```

## 🧪 API Endpoints

The application provides several AJAX endpoints for real-time functionality:

- `POST /process-video/<video_id>/` - Process individual video for metadata
- `POST /check-remaining-videos/` - Check for remaining videos in session
- `POST /get-paginated-videos/` - Retrieve specific page of videos

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Development Guidelines

- Follow PEP 8 coding standards
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation for new features

## 🐛 Troubleshooting

### Common Issues

**Issue**: "No videos found" for valid playlist
- **Solution**: Check if playlist is public and the URL format is correct

**Issue**: Slow loading for large playlists
- **Solution**: Use paginated view mode for better performance

**Issue**: Videos showing as "Error loading video"
- **Solution**: Some videos may be private, deleted, or geo-restricted

**Issue**: Application not starting
- **Solution**: Ensure all dependencies are installed and virtual environment is activated

### Debug Mode
Enable debug mode for detailed error information:
```python
# In settings.py
DEBUG = True
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Reliable YouTube video extraction
- [Django](https://www.djangoproject.com/) - Web framework
- [Bootstrap](https://getbootstrap.com/) - UI framework
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icon library

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor/issues) page
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

---

**Made with ❤️ for the YouTube community**
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
